import { describe, expect, it } from 'vitest'
import { byteCapacity, encodeQr, formatInformationBits, qrSvg } from '../qr'

/**
 * The printed handout's QR code, verified by reading it back.
 *
 * `qr.ts` opens with five correctness checks it says were performed, including
 * a round trip through "an independently written decoder". None of them was in
 * the repository, so none was reproducible and none would notice a regression:
 * 666 lines of Reed-Solomon, masking and bit placement with no test at all, on
 * the one artefact whose failure a reader discovers by pointing a phone at a
 * piece of paper and getting nothing.
 *
 * The decoder below is that independent implementation, written from the
 * standard rather than from `qr.ts`: it reads the format bits, unmasks, walks
 * the zigzag in the opposite direction to the encoder, de-interleaves the
 * blocks, checks each block's Reed-Solomon syndromes against a separately
 * written GF(256), and parses the mode, length and payload back to text.
 */

/* ------------------------------------------------------------------ *
 * An independent GF(256), from the QR primitive polynomial 0x11D.
 * ------------------------------------------------------------------ */

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
{
  let x = 1
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x
    LOG[x] = i
    x <<= 1
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255] as number
}

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[(LOG[a] as number) + (LOG[b] as number)] as number
}

/* ------------------------------------------------------------------ *
 * The decoder.
 * ------------------------------------------------------------------ */

const ECC_PER_BLOCK: readonly number[] = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]
const BLOCK_COUNT: readonly number[] = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]

/** Alignment pattern centres, from the standard's table, for versions 2 to 10. */
const ALIGNMENT_CENTRES: readonly (readonly number[])[] = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
]

function totalCodewords(version: number): number {
  const size = version * 4 + 17
  let modules = size * size
  modules -= 3 * 8 * 8 // three finder patterns with their separators
  modules -= 2 * (size - 16) // the two timing lines
  const centres = ALIGNMENT_CENTRES[version] as readonly number[]
  if (centres.length > 0) {
    const count = centres.length
    modules -= (count * count - 3) * 25
    modules += (count - 2) * 2 * 5 // overlaps with the timing lines
  }
  modules -= 31 // format information plus the dark module
  if (version >= 7) modules -= 36 // version information
  return Math.floor(modules / 8)
}

/** True where a module belongs to a function pattern rather than to data. */
function functionMask(version: number, size: number): boolean[][] {
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))
  const mark = (x: number, y: number) => {
    if (x >= 0 && x < size && y >= 0 && y < size) (reserved[y] as boolean[])[x] = true
  }

  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) mark(cx + dx, cy + dy)
    }
  }

  for (let i = 0; i < size; i += 1) {
    mark(6, i)
    mark(i, 6)
  }

  const centres = ALIGNMENT_CENTRES[version] as readonly number[]
  for (const cy of centres) {
    for (const cx of centres) {
      const nearFinder =
        (cx === 6 && cy === 6) || (cx === 6 && cy === size - 7) || (cx === size - 7 && cy === 6)
      if (nearFinder) continue
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) mark(cx + dx, cy + dy)
      }
    }
  }

  for (let i = 0; i < 9; i += 1) {
    mark(8, i)
    mark(i, 8)
  }
  for (let i = 0; i < 8; i += 1) {
    mark(size - 1 - i, 8)
    mark(8, size - 1 - i)
  }

  if (version >= 7) {
    for (let i = 0; i < 6; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        mark(size - 11 + j, i)
        mark(i, size - 11 + j)
      }
    }
  }

  return reserved
}

function maskBit(mask: number, x: number, y: number): boolean {
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
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0
  }
}

/** Read the fifteen format bits from the copy beside the top-left finder. */
function readFormat(modules: readonly (readonly boolean[])[]): { ecc: number; mask: number } {
  const bit = (x: number, y: number) => (modules[y]?.[x] ? 1 : 0)
  let raw = 0
  for (let i = 0; i <= 5; i += 1) raw |= bit(8, i) << i
  raw |= bit(8, 7) << 6
  raw |= bit(8, 8) << 7
  raw |= bit(7, 8) << 8
  for (let i = 9; i < 15; i += 1) raw |= bit(14 - i, 8) << i

  const unmasked = raw ^ 0x5412
  return { ecc: (unmasked >>> 13) & 0b11, mask: (unmasked >>> 10) & 0b111 }
}

/** Walk the zigzag in reading order and collect the unmasked codewords. */
function readCodewords(
  modules: readonly (readonly boolean[])[],
  version: number,
  mask: number,
): number[] {
  const size = modules.length
  const reserved = functionMask(version, size)
  const bits: number[] = []

  for (let right = size - 1; right >= 1; right -= 2) {
    // The vertical timing line owns column 6, so the pairs to its left are
    // (5,4), (3,2), (1,0). `right` itself has to move, not a copy of it:
    // stepping from 6 to 4 would read column 4 twice and never read column 0,
    // which corrupts the tail of the stream — and the tail is the error
    // correction, so the data still decodes and only the ECC comes out wrong.
    if (right === 6) right = 5
    for (let step = 0; step < size; step += 1) {
      const upward = ((right + 1) & 2) === 0
      const y = upward ? size - 1 - step : step
      for (const x of [right, right - 1]) {
        if ((reserved[y] as boolean[])[x]) continue
        const raw = (modules[y] as readonly boolean[])[x] as boolean
        bits.push(raw === maskBit(mask, x, y) ? 0 : 1)
      }
    }
  }

  const codewords: number[] = []
  for (let i = 0; i + 7 < bits.length; i += 8) {
    let byte = 0
    for (let b = 0; b < 8; b += 1) byte = (byte << 1) | (bits[i + b] as number)
    codewords.push(byte)
  }
  return codewords
}

/** Undo the block interleave and return one array of codewords per block. */
function deinterleave(codewords: readonly number[], version: number): number[][] {
  const blocks = BLOCK_COUNT[version] as number
  const eccPer = ECC_PER_BLOCK[version] as number
  const total = totalCodewords(version)
  const totalData = total - eccPer * blocks
  const shortLength = Math.floor(totalData / blocks)
  const longBlocks = totalData % blocks

  const data: number[][] = Array.from(
    { length: blocks },
    (_unused, index) => new Array<number>(shortLength + (index >= blocks - longBlocks ? 1 : 0)),
  )

  let at = 0
  for (let column = 0; column <= shortLength; column += 1) {
    for (let block = 0; block < blocks; block += 1) {
      if (column < (data[block] as number[]).length) {
        ;(data[block] as number[])[column] = codewords[at++] as number
      }
    }
  }

  const ecc: number[][] = Array.from({ length: blocks }, () => new Array<number>(eccPer))
  for (let column = 0; column < eccPer; column += 1) {
    for (let block = 0; block < blocks; block += 1) {
      ;(ecc[block] as number[])[column] = codewords[at++] as number
    }
  }

  return data.map((block, index) => [...block, ...(ecc[index] as number[])])
}

/**
 * A Reed-Solomon codeword evaluates to zero at every generator root.
 *
 * This is the defining property, and checking it here — with a GF(256) written
 * from the polynomial rather than imported from `qr.ts` — is an independent
 * verification of the encoder's error correction.
 */
function syndromes(block: readonly number[], eccCount: number): number[] {
  const result: number[] = []
  for (let root = 0; root < eccCount; root += 1) {
    let value = 0
    for (const coefficient of block) {
      value = gfMultiply(value, EXP[root] as number) ^ coefficient
    }
    result.push(value)
  }
  return result
}

function decode(matrix: NonNullable<ReturnType<typeof encodeQr>>): {
  text: string
  ecc: number
  blocks: number[][]
} {
  const { ecc, mask } = readFormat(matrix.modules)
  expect(mask, 'the format bits must record the mask that was applied').toBe(matrix.mask)

  const codewords = readCodewords(matrix.modules, matrix.version, mask)
  const blocks = deinterleave(codewords, matrix.version)

  const data = blocks.flatMap(block =>
    block.slice(0, block.length - (ECC_PER_BLOCK[matrix.version] as number)),
  )

  // Mode, character count, payload.
  let bitAt = 0
  const nextBits = (count: number) => {
    let value = 0
    for (let i = 0; i < count; i += 1) {
      const byte = data[bitAt >> 3] as number
      value = (value << 1) | ((byte >>> (7 - (bitAt & 7))) & 1)
      bitAt += 1
    }
    return value
  }

  const mode = nextBits(4)
  expect(mode, 'byte mode').toBe(0b0100)
  const length = nextBits(matrix.version < 10 ? 8 : 16)
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i += 1) bytes[i] = nextBits(8)

  return { text: new TextDecoder().decode(bytes), ecc, blocks }
}

/* ------------------------------------------------------------------ *
 * The tests.
 * ------------------------------------------------------------------ */

describe('capacity, against the published table', () => {
  it('matches the byte capacities for versions 1 to 10 at level M', () => {
    const measured = Array.from({ length: 10 }, (_unused, i) => byteCapacity(i + 1))
    expect(measured).toEqual([14, 26, 42, 62, 84, 106, 122, 152, 180, 213])
  })
})

describe('format information, against the published table', () => {
  it('encodes level M mask 0 as 101010000010010', () => {
    expect(formatInformationBits(0).toString(2).padStart(15, '0')).toBe('101010000010010')
  })

  it('encodes level M mask 1 as 101000100100101', () => {
    expect(formatInformationBits(1).toString(2).padStart(15, '0')).toBe('101000100100101')
  })

  it('produces fifteen bits for every mask', () => {
    for (let mask = 0; mask < 8; mask += 1) {
      expect(formatInformationBits(mask)).toBeLessThan(1 << 15)
    }
  })
})

describe('a code reads back as the text it was made from', () => {
  const CASES = [
    'https://example.org/',
    'HELLO WORLD',
    'https://conditional-immortality.example/',
    // Long enough to need several versions up, and each block boundary.
    `https://example.org/${'a'.repeat(20)}`,
    `https://example.org/${'b'.repeat(60)}`,
    `https://example.org/${'c'.repeat(100)}`,
    `https://example.org/${'d'.repeat(160)}`,
    // Multi-byte, because the length field counts bytes and not characters.
    'https://example.org/?q=τὸ πῦρ τὸ αἰώνιον',
  ] as const

  for (const text of CASES) {
    it(`round-trips ${text.length > 40 ? `${text.slice(0, 34)}… (${text.length})` : text}`, () => {
      const matrix = encodeQr(text)
      expect(matrix).not.toBeNull()
      expect(decode(matrix as NonNullable<typeof matrix>).text).toBe(text)
    })
  }
})

describe('the error correction is a valid Reed-Solomon codeword', () => {
  it('evaluates to zero at every generator root, in every block, at every version', () => {
    for (let version = 1; version <= 10; version += 1) {
      // Exactly fills the version, so every block is at its full length.
      const text = 'x'.repeat(byteCapacity(version))
      const matrix = encodeQr(text)
      expect(matrix?.version, `version ${version}`).toBe(version)

      const { blocks } = decode(matrix as NonNullable<typeof matrix>)
      const eccCount = ECC_PER_BLOCK[version] as number
      for (const [index, block] of blocks.entries()) {
        expect(
          syndromes(block, eccCount),
          `version ${version}, block ${index} is not a valid codeword`,
        ).toEqual(new Array(eccCount).fill(0))
      }
    }
  })

  it('notices when a codeword is corrupted, so the check above is not vacuous', () => {
    const matrix = encodeQr('https://example.org/') as NonNullable<ReturnType<typeof encodeQr>>
    const { blocks } = decode(matrix)
    const corrupted = [...(blocks[0] as number[])]
    corrupted[0] = ((corrupted[0] as number) ^ 0x5a) & 0xff
    expect(syndromes(corrupted, ECC_PER_BLOCK[matrix.version] as number)).not.toEqual(
      new Array(ECC_PER_BLOCK[matrix.version] as number).fill(0),
    )
  })
})

describe('the matrix is structurally a QR code', () => {
  const matrix = encodeQr('https://example.org/') as NonNullable<ReturnType<typeof encodeQr>>

  it('is 4 × version + 17 modules square', () => {
    expect(matrix.size).toBe(matrix.version * 4 + 17)
    expect(matrix.modules).toHaveLength(matrix.size)
    for (const row of matrix.modules) expect(row).toHaveLength(matrix.size)
  })

  it('carries three finder patterns with the right ring structure', () => {
    const corners = [
      [0, 0],
      [matrix.size - 7, 0],
      [0, matrix.size - 7],
    ] as const
    for (const [ox, oy] of corners) {
      for (let dy = 0; dy < 7; dy += 1) {
        for (let dx = 0; dx < 7; dx += 1) {
          const onRing = dx === 0 || dx === 6 || dy === 0 || dy === 6
          const inCore = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4
          expect(matrix.modules[oy + dy]?.[ox + dx], `finder at ${ox},${oy} + ${dx},${dy}`).toBe(
            onRing || inCore,
          )
        }
      }
    }
  })

  it('alternates along both timing lines', () => {
    for (let i = 8; i < matrix.size - 8; i += 1) {
      expect(matrix.modules[6]?.[i], `horizontal timing at ${i}`).toBe(i % 2 === 0)
      expect(matrix.modules[i]?.[6], `vertical timing at ${i}`).toBe(i % 2 === 0)
    }
  })

  it('sets the dark module the standard requires', () => {
    expect(matrix.modules[4 * matrix.version + 9]?.[8]).toBe(true)
  })
})

describe('what it refuses', () => {
  it('returns null past the version 10 capacity rather than an unscannable code', () => {
    expect(encodeQr('x'.repeat(213))).not.toBeNull()
    expect(encodeQr('x'.repeat(214))).toBeNull()
  })

  it('counts bytes, not characters, so a multi-byte string fills earlier', () => {
    // Each of these is two UTF-8 bytes.
    expect(encodeQr('é'.repeat(106))).not.toBeNull()
    expect(encodeQr('é'.repeat(107))).toBeNull()
  })

  it('encodes the empty string rather than throwing', () => {
    const matrix = encodeQr('')
    expect(matrix).not.toBeNull()
    expect(decode(matrix as NonNullable<typeof matrix>).text).toBe('')
  })
})

describe('the SVG a reader actually prints', () => {
  const matrix = encodeQr('https://example.org/') as NonNullable<ReturnType<typeof encodeQr>>

  it('keeps the quiet zone the standard requires', () => {
    const svg = qrSvg(matrix, { moduleSize: 4, quietZone: 4, title: 'Link to the site' })
    const side = (matrix.size + 8) * 4
    expect(svg).toContain(`viewBox="0 0 ${side} ${side}"`)
  })

  it('contains no script, no remote reference and no raster fallback', () => {
    const svg = qrSvg(matrix, { moduleSize: 4, quietZone: 4, title: 'Link to the site' })
    expect(svg).not.toMatch(/<script|href=|xlink:href|<image/i)
  })
})
