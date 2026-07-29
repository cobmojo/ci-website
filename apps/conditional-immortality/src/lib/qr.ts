/**
 * A self-contained QR Code encoder.
 *
 * Scope is deliberately narrow: byte mode, error correction level M, versions
 * 1 to 10. That covers any URL up to 213 bytes, which is far more than the
 * canonical site URL will ever need, and it keeps the tables small enough to
 * be checked by hand rather than copied on trust.
 *
 * Why this exists at all: the printable handout carries a QR code to the site,
 * and the site loads no third-party script, image or font. Generating the code
 * here keeps that promise and keeps the handout a single static file.
 *
 * Correctness checks that were actually performed:
 *
 * 1. `totalCodewords` is derived from the module-count formula rather than a
 *    table, and the resulting byte capacities for versions 1 to 10 at level M
 *    are 14, 26, 42, 62, 84, 106, 122, 152, 180, 213, which match the
 *    published capacity table. That cross-checks both tables below.
 * 2. The Reed-Solomon remainder reproduces the worked example in ISO/IEC
 *    18004 Annex I: the 16 data codewords of the 1-M example encode to the
 *    error correction codewords A5 24 D4 C1 ED 36 C7 87 2C 55.
 * 3. Every generated codeword polynomial evaluates to zero at the generator
 *    roots, which is the defining property of a valid Reed-Solomon codeword.
 * 4. The format information for level M, mask 0 is 101010000010010 and for
 *    mask 1 is 101000100100101, matching the published format table.
 * 5. Encoded matrices were read back by an independently written decoder
 *    (format bits, unmasking, zigzag scan, de-interleaving, mode and length
 *    parsing) and round-tripped to the original text for every version.
 *
 * Everything in this module is a pure function. Nothing here touches the DOM,
 * the network or the file system.
 */

/* ------------------------------------------------------------------ *
 * Tables
 *
 * Level M only. Index by version; index 0 is unused padding.
 * ------------------------------------------------------------------ */

const ECC_CODEWORDS_PER_BLOCK: readonly number[] = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]
const ECC_BLOCK_COUNT: readonly number[] = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]

const MIN_VERSION = 1
const MAX_VERSION = 10

/** Level M is `00` in the five format bits. */
const FORMAT_ECC_BITS = 0b00

/** Byte mode indicator. */
const MODE_BYTE = 0b0100

const PENALTY_N1 = 3
const PENALTY_N2 = 3
const PENALTY_N3 = 40
const PENALTY_N4 = 10

/* ------------------------------------------------------------------ *
 * Public types
 * ------------------------------------------------------------------ */

export interface QrMatrix {
  readonly version: number
  /** Modules per side, excluding the quiet zone. */
  readonly size: number
  /** The data mask pattern that was applied, 0 to 7. */
  readonly mask: number
  /** Row-major grid. `true` is a dark module. */
  readonly modules: readonly (readonly boolean[])[]
}

/* ------------------------------------------------------------------ *
 * Small checked accessors
 *
 * `noUncheckedIndexedAccess` is on, and a silent `?? 0` would hide a real
 * indexing bug behind a plausible-looking but unscannable code. These throw
 * instead, so a mistake fails the build rather than shipping.
 * ------------------------------------------------------------------ */

function num(values: readonly number[], index: number): number {
  const value = values[index]
  if (value === undefined) throw new Error(`QR: numeric index ${index} out of range`)
  return value
}

function row(grid: boolean[][], y: number): boolean[] {
  const value = grid[y]
  if (value === undefined) throw new Error(`QR: row ${y} out of range`)
  return value
}

function cell(grid: boolean[][], x: number, y: number): boolean {
  const value = row(grid, y)[x]
  if (value === undefined) throw new Error(`QR: column ${x} out of range`)
  return value
}

function bitOf(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0
}

/* ------------------------------------------------------------------ *
 * Capacity
 * ------------------------------------------------------------------ */

/** Modules available for data and error correction, before the 8-bit split. */
function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64
  if (version >= 2) {
    const alignCount = Math.floor(version / 7) + 2
    result -= (25 * alignCount - 10) * alignCount - 55
    if (version >= 7) result -= 36
  }
  return result
}

function totalCodewords(version: number): number {
  return Math.floor(rawDataModules(version) / 8)
}

function eccCodewordCount(version: number): number {
  return num(ECC_CODEWORDS_PER_BLOCK, version) * num(ECC_BLOCK_COUNT, version)
}

function dataCodewords(version: number): number {
  return totalCodewords(version) - eccCodewordCount(version)
}

/** Bits used by the character count field in byte mode. */
function characterCountBits(version: number): number {
  return version < 10 ? 8 : 16
}

/** Largest byte string this version can carry in byte mode at level M. */
export function byteCapacity(version: number): number {
  const bits = dataCodewords(version) * 8 - 4 - characterCountBits(version)
  return Math.floor(bits / 8)
}

function smallestVersionFor(byteLength: number): number | null {
  for (let version = MIN_VERSION; version <= MAX_VERSION; version += 1) {
    if (byteLength <= byteCapacity(version)) return version
  }
  return null
}

/* ------------------------------------------------------------------ *
 * Galois field arithmetic over GF(256) with the QR primitive polynomial
 * x^8 + x^4 + x^3 + x^2 + 1 (0x11D).
 * ------------------------------------------------------------------ */

function gfMultiply(x: number, y: number): number {
  let product = 0
  for (let i = 7; i >= 0; i -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d)
    product ^= ((y >>> i) & 1) * x
  }
  return product & 0xff
}

/** Coefficients of the generator polynomial of the given degree, high to low. */
function generatorPolynomial(degree: number): number[] {
  const result: number[] = new Array(degree).fill(0)
  result[degree - 1] = 1

  let root = 1
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      const scaled = gfMultiply(num(result, j), root)
      result[j] = j + 1 < result.length ? scaled ^ num(result, j + 1) : scaled
    }
    root = gfMultiply(root, 0x02)
  }
  return result
}

/** The Reed-Solomon remainder, which is the block's error correction data. */
function reedSolomonRemainder(data: readonly number[], generator: readonly number[]): number[] {
  const result: number[] = new Array(generator.length).fill(0)
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0)
    result.push(0)
    for (let i = 0; i < generator.length; i += 1) {
      result[i] = num(result, i) ^ gfMultiply(num(generator, i), factor)
    }
  }
  return result
}

/* ------------------------------------------------------------------ *
 * Data encoding
 * ------------------------------------------------------------------ */

function toDataCodewords(bytes: Uint8Array, version: number): number[] {
  const bits: number[] = []
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1)
  }

  push(MODE_BYTE, 4)
  push(bytes.length, characterCountBits(version))
  for (const byte of bytes) push(byte, 8)

  const capacityBits = dataCodewords(version) * 8

  // Terminator, then pad to a byte boundary.
  for (let i = 0; i < 4 && bits.length < capacityBits; i += 1) bits.push(0)
  while (bits.length % 8 !== 0) bits.push(0)

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j += 1) byte = (byte << 1) | num(bits, i + j)
    codewords.push(byte)
  }

  // The standard pad bytes, alternating.
  const padBytes = [0xec, 0x11]
  for (let i = 0; codewords.length < dataCodewords(version); i += 1) {
    codewords.push(num(padBytes, i % 2))
  }
  return codewords
}

/**
 * Split the data into blocks, append each block's error correction bytes and
 * interleave the result, which is the order the modules are written in.
 */
function interleaveBlocks(data: readonly number[], version: number): number[] {
  const blockCount = num(ECC_BLOCK_COUNT, version)
  const eccPerBlock = num(ECC_CODEWORDS_PER_BLOCK, version)
  const total = totalCodewords(version)
  const shortBlockCount = blockCount - (total % blockCount)
  const shortBlockLength = Math.floor(total / blockCount)
  const generator = generatorPolynomial(eccPerBlock)

  const blocks: number[][] = []
  let offset = 0
  for (let i = 0; i < blockCount; i += 1) {
    const length = shortBlockLength - eccPerBlock + (i < shortBlockCount ? 0 : 1)
    const block = data.slice(offset, offset + length)
    offset += length
    const ecc = reedSolomonRemainder(block, generator)
    // A short block gets a placeholder byte so every block has equal length
    // during interleaving. It is skipped when the codewords are read out.
    if (i < shortBlockCount) block.push(0)
    blocks.push([...block, ...ecc])
  }

  const result: number[] = []
  const blockLength = num(
    blocks.map(block => block.length),
    0,
  )
  for (let i = 0; i < blockLength; i += 1) {
    for (let j = 0; j < blocks.length; j += 1) {
      if (i !== shortBlockLength - eccPerBlock || j >= shortBlockCount) {
        const block = blocks[j]
        if (!block) throw new Error(`QR: block ${j} missing`)
        result.push(num(block, i))
      }
    }
  }
  return result
}

/* ------------------------------------------------------------------ *
 * Module placement
 * ------------------------------------------------------------------ */

interface Grid {
  readonly size: number
  readonly modules: boolean[][]
  /** Function patterns are never masked and never carry data. */
  readonly reserved: boolean[][]
}

function createGrid(version: number): Grid {
  const size = version * 4 + 17
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  return { size, modules, reserved }
}

function setFunctionModule(grid: Grid, x: number, y: number, dark: boolean): void {
  row(grid.modules, y)[x] = dark
  row(grid.reserved, y)[x] = true
}

function alignmentPatternPositions(version: number): number[] {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2
  const positions: number[] = [6]
  for (let pos = version * 4 + 17 - 7; positions.length < count; pos -= step) {
    positions.splice(1, 0, pos)
  }
  return positions
}

function drawFinderPattern(grid: Grid, centreX: number, centreY: number): void {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy))
      const x = centreX + dx
      const y = centreY + dy
      if (x >= 0 && x < grid.size && y >= 0 && y < grid.size) {
        setFunctionModule(grid, x, y, distance !== 2 && distance !== 4)
      }
    }
  }
}

function drawAlignmentPattern(grid: Grid, centreX: number, centreY: number): void {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunctionModule(
        grid,
        centreX + dx,
        centreY + dy,
        Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
      )
    }
  }
}

/** BCH(15, 5) format information, including the fixed 0x5412 mask. */
export function formatInformationBits(mask: number): number {
  const data = (FORMAT_ECC_BITS << 3) | mask
  let remainder = data
  for (let i = 0; i < 10; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537)
  }
  return (((data << 10) | remainder) ^ 0x5412) & 0x7fff
}

function drawFormatBits(grid: Grid, mask: number): void {
  const bits = formatInformationBits(mask)

  for (let i = 0; i <= 5; i += 1) setFunctionModule(grid, 8, i, bitOf(bits, i))
  setFunctionModule(grid, 8, 7, bitOf(bits, 6))
  setFunctionModule(grid, 8, 8, bitOf(bits, 7))
  setFunctionModule(grid, 7, 8, bitOf(bits, 8))
  for (let i = 9; i < 15; i += 1) setFunctionModule(grid, 14 - i, 8, bitOf(bits, i))

  for (let i = 0; i < 8; i += 1) {
    setFunctionModule(grid, grid.size - 1 - i, 8, bitOf(bits, i))
  }
  for (let i = 8; i < 15; i += 1) {
    setFunctionModule(grid, 8, grid.size - 15 + i, bitOf(bits, i))
  }
  // The module above the lower-left finder pattern is always dark.
  setFunctionModule(grid, 8, grid.size - 8, true)
}

/** BCH(18, 6) version information, present from version 7 upwards. */
function drawVersionBits(grid: Grid, version: number): void {
  if (version < 7) return
  let remainder = version
  for (let i = 0; i < 12; i += 1) {
    remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25)
  }
  const bits = (version << 12) | remainder

  for (let i = 0; i < 18; i += 1) {
    const dark = bitOf(bits, i)
    const a = grid.size - 11 + (i % 3)
    const b = Math.floor(i / 3)
    setFunctionModule(grid, a, b, dark)
    setFunctionModule(grid, b, a, dark)
  }
}

function drawFunctionPatterns(grid: Grid, version: number): void {
  // Timing patterns.
  for (let i = 0; i < grid.size; i += 1) {
    setFunctionModule(grid, 6, i, i % 2 === 0)
    setFunctionModule(grid, i, 6, i % 2 === 0)
  }

  drawFinderPattern(grid, 3, 3)
  drawFinderPattern(grid, grid.size - 4, 3)
  drawFinderPattern(grid, 3, grid.size - 4)

  const positions = alignmentPatternPositions(version)
  for (let i = 0; i < positions.length; i += 1) {
    for (let j = 0; j < positions.length; j += 1) {
      const onFinder =
        (i === 0 && j === 0) ||
        (i === 0 && j === positions.length - 1) ||
        (i === positions.length - 1 && j === 0)
      if (!onFinder) drawAlignmentPattern(grid, num(positions, i), num(positions, j))
    }
  }

  // Reserve the format and version areas; the real bits are written later.
  drawFormatBits(grid, 0)
  drawVersionBits(grid, version)
}

/** Write the interleaved codewords in the standard upward/downward zigzag. */
function drawCodewords(grid: Grid, codewords: readonly number[]): void {
  let bitIndex = 0
  const totalBits = codewords.length * 8

  // Column pairs run right to left. The vertical timing column is skipped
  // entirely, so the pairs after it shift by one rather than by two.
  let right = grid.size - 1
  while (right >= 1) {
    if (right === 6) right = 5
    for (let vertical = 0; vertical < grid.size; vertical += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j
        const upward = ((right + 1) & 2) === 0
        const y = upward ? grid.size - 1 - vertical : vertical
        if (!cell(grid.reserved, x, y) && bitIndex < totalBits) {
          row(grid.modules, y)[x] = bitOf(num(codewords, bitIndex >>> 3), 7 - (bitIndex & 7))
          bitIndex += 1
        }
      }
    }
    right -= 2
  }
}

function maskApplies(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0
    case 1:
      return y % 2 === 0
    case 2:
      return x % 3 === 0
    case 3:
      return (x + y) % 3 === 0
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    case 7:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
    default:
      throw new Error(`QR: unknown mask ${mask}`)
  }
}

function applyMask(grid: Grid, mask: number): void {
  for (let y = 0; y < grid.size; y += 1) {
    for (let x = 0; x < grid.size; x += 1) {
      if (!cell(grid.reserved, x, y) && maskApplies(mask, x, y)) {
        row(grid.modules, y)[x] = !cell(grid.modules, x, y)
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * Mask selection
 * ------------------------------------------------------------------ */

function addRunToHistory(runLength: number, history: number[], size: number): void {
  const adjusted = num(history, 0) === 0 ? runLength + size : runLength
  history.pop()
  history.unshift(adjusted)
}

/** Count finder-like 1:1:3:1:1 patterns recorded in a run history. */
function countFinderPatterns(history: readonly number[]): number {
  const n = num(history, 1)
  const core =
    n > 0 &&
    num(history, 2) === n &&
    num(history, 3) === n * 3 &&
    num(history, 4) === n &&
    num(history, 5) === n
  return (
    (core && num(history, 0) >= n * 4 && num(history, 6) >= n ? 1 : 0) +
    (core && num(history, 6) >= n * 4 && num(history, 0) >= n ? 1 : 0)
  )
}

function terminateRun(
  runDark: boolean,
  runLength: number,
  history: number[],
  size: number,
): number {
  let length = runLength
  if (runDark) {
    addRunToHistory(length, history, size)
    length = 0
  }
  length += size
  addRunToHistory(length, history, size)
  return countFinderPatterns(history)
}

function penaltyScore(grid: Grid): number {
  const size = grid.size
  let result = 0

  for (let y = 0; y < size; y += 1) {
    let runDark = false
    let runLength = 0
    const history = [0, 0, 0, 0, 0, 0, 0]
    for (let x = 0; x < size; x += 1) {
      if (cell(grid.modules, x, y) === runDark) {
        runLength += 1
        if (runLength === 5) result += PENALTY_N1
        else if (runLength > 5) result += 1
      } else {
        addRunToHistory(runLength, history, size)
        if (!runDark) result += countFinderPatterns(history) * PENALTY_N3
        runDark = cell(grid.modules, x, y)
        runLength = 1
      }
    }
    result += terminateRun(runDark, runLength, history, size) * PENALTY_N3
  }

  for (let x = 0; x < size; x += 1) {
    let runDark = false
    let runLength = 0
    const history = [0, 0, 0, 0, 0, 0, 0]
    for (let y = 0; y < size; y += 1) {
      if (cell(grid.modules, x, y) === runDark) {
        runLength += 1
        if (runLength === 5) result += PENALTY_N1
        else if (runLength > 5) result += 1
      } else {
        addRunToHistory(runLength, history, size)
        if (!runDark) result += countFinderPatterns(history) * PENALTY_N3
        runDark = cell(grid.modules, x, y)
        runLength = 1
      }
    }
    result += terminateRun(runDark, runLength, history, size) * PENALTY_N3
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const value = cell(grid.modules, x, y)
      if (
        value === cell(grid.modules, x + 1, y) &&
        value === cell(grid.modules, x, y + 1) &&
        value === cell(grid.modules, x + 1, y + 1)
      ) {
        result += PENALTY_N2
      }
    }
  }

  let dark = 0
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (cell(grid.modules, x, y)) dark += 1
    }
  }
  const total = size * size
  const deviation = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1
  return result + deviation * PENALTY_N4
}

/* ------------------------------------------------------------------ *
 * Encoder
 * ------------------------------------------------------------------ */

/**
 * Encode text as a QR Code matrix in byte mode at error correction level M.
 *
 * Returns `null` when the UTF-8 encoding of the text is longer than 213 bytes,
 * which is the version 10 limit. Callers are expected to handle that by
 * showing the text itself rather than an unreadable code.
 */
export function encodeQr(text: string): QrMatrix | null {
  const bytes = new TextEncoder().encode(text)
  const version = smallestVersionFor(bytes.length)
  if (version === null) return null

  const codewords = interleaveBlocks(toDataCodewords(bytes, version), version)

  let best: { grid: Grid; mask: number; penalty: number } | null = null
  for (let mask = 0; mask < 8; mask += 1) {
    const grid = createGrid(version)
    drawFunctionPatterns(grid, version)
    drawCodewords(grid, codewords)
    drawFormatBits(grid, mask)
    applyMask(grid, mask)
    const penalty = penaltyScore(grid)
    if (!best || penalty < best.penalty) best = { grid, mask, penalty }
  }
  if (!best) throw new Error('QR: no mask could be evaluated')

  return {
    version,
    size: best.grid.size,
    mask: best.mask,
    modules: best.grid.modules.map(line => [...line]),
  }
}

/* ------------------------------------------------------------------ *
 * SVG rendering
 * ------------------------------------------------------------------ */

export interface QrSvgOptions {
  /** Side of one module, in SVG user units. */
  readonly moduleSize?: number
  /** Quiet zone in modules. Four is the minimum the standard allows. */
  readonly quietZone?: number
  /** Accessible name for the code. */
  readonly title: string
  /** Dark module colour. Maximum contrast matters more than palette here. */
  readonly darkColor?: string
  readonly lightColor?: string
}

/**
 * Render a matrix as SVG markup.
 *
 * Horizontal runs of dark modules are merged into a single `<rect>`, which
 * cuts the element count by roughly two thirds without changing a pixel.
 */
export function qrSvg(matrix: QrMatrix, options: QrSvgOptions): string {
  const moduleSize = options.moduleSize ?? 4
  const quiet = options.quietZone ?? 4
  const dark = options.darkColor ?? '#000000'
  const light = options.lightColor ?? '#ffffff'
  const side = (matrix.size + quiet * 2) * moduleSize

  const rects: string[] = []
  for (let y = 0; y < matrix.size; y += 1) {
    const line = matrix.modules[y]
    if (!line) throw new Error(`QR: row ${y} missing`)
    let x = 0
    while (x < matrix.size) {
      if (line[x] !== true) {
        x += 1
        continue
      }
      let run = 1
      while (x + run < matrix.size && line[x + run] === true) run += 1
      const px = (x + quiet) * moduleSize
      const py = (y + quiet) * moduleSize
      rects.push(`<rect x="${px}" y="${py}" width="${run * moduleSize}" height="${moduleSize}"/>`)
      x += run
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}" role="img" aria-label="${escapeSvgText(options.title)}">`,
    `<title>${escapeSvgText(options.title)}</title>`,
    `<rect width="${side}" height="${side}" fill="${light}"/>`,
    `<g fill="${dark}" shape-rendering="crispEdges">${rects.join('')}</g>`,
    '</svg>',
  ].join('')
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
