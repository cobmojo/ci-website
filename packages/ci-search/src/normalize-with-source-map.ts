/**
 * Normalisation that can be undone.
 *
 * Search has to compare a reader's query against text that has been
 * lowercased, NFKD-decomposed, quote- and dash-folded and whitespace-collapsed.
 * It then has to show the reader the *original* text with the match marked.
 * Those two jobs need different strings, and an index into one is not an index
 * into the other: NFKD expands `ﬁ` into two characters, lowercasing `İ` into
 * two, whitespace collapsing turns three characters into one, and folding a
 * curly apostrophe changes which character sits at that offset.
 *
 * So normalisation here returns both the normalised string and a map from
 * normalised ranges back to exact source ranges. Every source boundary the map
 * can return sits on a grapheme cluster boundary, so a highlight can never cut
 * a surrogate pair, a combining sequence or an emoji sequence in half.
 *
 * `normalize()` is the hot path used by the ranker and stays a plain
 * whole-string pipeline. `normalizeWithSourceMap()` is the mapped path used for
 * excerpts and highlighting. The two are independent implementations of the
 * same transformation, and the test suite pins them to each other across a
 * Unicode sample and across every field of the real content index.
 */

/** A half-open range of UTF-16 offsets, as used by `String.prototype.slice`. */
export interface TextRange {
  readonly start: number
  readonly end: number
}

/**
 * One piece of the normalised-to-source correspondence.
 *
 * `oneToOne` chunks are runs of single-unit graphemes that normalised one
 * character for one character, so any interior offset is itself a grapheme
 * boundary and maps by simple arithmetic. For every other chunk only the edges
 * are addressable: an offset inside it maps outwards to the whole chunk, which
 * is what keeps a collapsed whitespace run or an expanded ligature intact.
 */
export interface NormalizedChunk {
  readonly normalizedStart: number
  readonly normalizedEnd: number
  readonly sourceStart: number
  readonly sourceEnd: number
  readonly oneToOne: boolean
}

export interface NormalizedText {
  readonly normalized: string
  readonly source: string
  readonly chunks: readonly NormalizedChunk[]
}

const CURLY_SINGLE_QUOTES = /[‘’‛]/g
const CURLY_DOUBLE_QUOTES = /[“”]/g
/** U+2010–U+2015 plus U+2212, matching the class the ranker has always used. */
const DASH_VARIANTS = /[‐-―−]/g

/**
 * The normalised form of a string.
 *
 * This is the string the field weights, the phrase bonus and the exact-title
 * and section-id boosts are all defined against, so its output is a fixed
 * point of this package: changing it changes ranking.
 */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(CURLY_SINGLE_QUOTES, "'")
    .replace(CURLY_DOUBLE_QUOTES, '"')
    .replace(DASH_VARIANTS, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function foldPunctuation(value: string): string {
  return value
    .replace(CURLY_SINGLE_QUOTES, "'")
    .replace(CURLY_DOUBLE_QUOTES, '"')
    .replace(DASH_VARIANTS, '-')
}

/* ------------------------------------------------------------------ *
 * Grapheme segmentation
 * ------------------------------------------------------------------ */

let graphemeSegmenter: Intl.Segmenter | null | undefined

/**
 * The shared grapheme segmenter, or `null` where `Intl.Segmenter` is missing.
 *
 * The locale is left undefined deliberately. Grapheme clustering is
 * locale-independent in practice, and it is also exactly what Pretext's own
 * cursor segmentation uses, so the two agree on where a grapheme starts.
 */
function segmenter(): Intl.Segmenter | null {
  if (graphemeSegmenter === undefined) {
    graphemeSegmenter =
      typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null
  }
  return graphemeSegmenter
}

/**
 * Approximate grapheme clusters without `Intl.Segmenter`.
 *
 * A base character with its combining marks, a regional-indicator pair, a
 * zero-width-joiner sequence and a variation selector all stay together. This
 * is not the full UAX #29 algorithm, but it never splits a surrogate pair, so
 * search stays correct on a runtime that lacks the segmenter even though the
 * Pretext enhancement will decline to run there.
 */
const FALLBACK_CLUSTER =
  /(?:\p{RI}\p{RI}|\P{M})\p{M}*(?:\p{Join_Control}(?:\p{RI}\p{RI}|\P{M})\p{M}*)*|\p{M}+/gu

interface Cluster {
  readonly text: string
  readonly start: number
  readonly end: number
}

function* graphemeClusters(source: string): Generator<Cluster> {
  const shared = segmenter()
  if (shared) {
    for (const entry of shared.segment(source)) {
      yield { text: entry.segment, start: entry.index, end: entry.index + entry.segment.length }
    }
    return
  }
  FALLBACK_CLUSTER.lastIndex = 0
  let match = FALLBACK_CLUSTER.exec(source)
  while (match !== null) {
    yield { text: match[0], start: match.index, end: match.index + match[0].length }
    if (match[0].length === 0) FALLBACK_CLUSTER.lastIndex += 1
    match = FALLBACK_CLUSTER.exec(source)
  }
}

/**
 * Split a string into grapheme clusters.
 *
 * Exported because the excerpt builder needs the same boundaries the source map
 * uses when it trims a window to a whole grapheme.
 */
export function toGraphemes(value: string): readonly string[] {
  const out: string[] = []
  for (const cluster of graphemeClusters(value)) out.push(cluster.text)
  return out
}

/* ------------------------------------------------------------------ *
 * Case folding
 * ------------------------------------------------------------------ */

const CAPITAL_SIGMA = 'Σ'
const SMALL_SIGMA = 'σ'
const SMALL_FINAL_SIGMA = 'ς'
const CASED = /\p{Cased}/u
const CASE_IGNORABLE = /\p{Case_Ignorable}/u

function codePointBefore(text: string, index: number): string | null {
  if (index <= 0) return null
  const low = text.charCodeAt(index - 1)
  if (low >= 0xdc00 && low <= 0xdfff && index >= 2) {
    const high = text.charCodeAt(index - 2)
    if (high >= 0xd800 && high <= 0xdbff) return text.slice(index - 2, index)
  }
  return text[index - 1] ?? null
}

function codePointAt(text: string, index: number): string | null {
  if (index >= text.length) return null
  const code = text.codePointAt(index)
  return code === undefined ? null : String.fromCodePoint(code)
}

/**
 * The one context-sensitive rule in language-independent lowercasing.
 *
 * `Σ` lowercases to `ς` when it ends a word and to `σ` otherwise, which is why
 * `'ΑΣ'.toLowerCase()` and `'Σ'.toLowerCase()` disagree. Folding cluster by
 * cluster would lose that context, so the rule is evaluated here against the
 * whole string exactly as Unicode defines it: a cased character before, ignoring
 * case-ignorable characters, and no cased character after.
 */
function isFinalSigma(source: string, sigmaIndex: number): boolean {
  let precededByCased = false
  for (let i = sigmaIndex; i > 0; ) {
    const previous = codePointBefore(source, i)
    if (previous === null) break
    i -= previous.length
    if (CASE_IGNORABLE.test(previous)) continue
    precededByCased = CASED.test(previous)
    break
  }
  if (!precededByCased) return false

  for (let i = sigmaIndex + CAPITAL_SIGMA.length; ; ) {
    const next = codePointAt(source, i)
    if (next === null) return true
    i += next.length
    if (CASE_IGNORABLE.test(next)) continue
    return !CASED.test(next)
  }
}

function lowercaseCluster(source: string, clusterStart: number, cluster: string): string {
  if (!cluster.includes(CAPITAL_SIGMA)) return cluster.toLowerCase()

  let out = ''
  let index = 0
  while (index < cluster.length) {
    if (cluster[index] === CAPITAL_SIGMA) {
      out += isFinalSigma(source, clusterStart + index) ? SMALL_FINAL_SIGMA : SMALL_SIGMA
      index += 1
      continue
    }
    let end = index
    while (end < cluster.length && cluster[end] !== CAPITAL_SIGMA) end += 1
    out += cluster.slice(index, end).toLowerCase()
    index = end
  }
  return out
}

/* ------------------------------------------------------------------ *
 * The mapped pipeline
 * ------------------------------------------------------------------ */

interface MutableChunk {
  normalizedStart: number
  normalizedEnd: number
  sourceStart: number
  sourceEnd: number
  oneToOne: boolean
}

const WHITESPACE = /\s/

/**
 * Normalise a string and keep the correspondence back to it.
 *
 * The transformation runs grapheme cluster by grapheme cluster so every source
 * boundary the map hands back is a cluster boundary. Whitespace is the one part
 * that cannot be decided cluster-locally: a run of collapsible whitespace
 * becomes a single space that maps back to the whole run, and a run at either
 * end of the string disappears without contributing a chunk at all, which is
 * what makes trimming unable to shift any later offset.
 */
export function normalizeWithSourceMap(source: string): NormalizedText {
  const chunks: MutableChunk[] = []
  let normalized = ''
  let pendingSpaceStart = -1
  let pendingSpaceEnd = -1

  const push = (sourceStart: number, sourceEnd: number, text: string, oneToOne: boolean): void => {
    const last = chunks[chunks.length - 1]
    if (
      oneToOne &&
      last?.oneToOne &&
      last.normalizedEnd === normalized.length &&
      last.sourceEnd === sourceStart
    ) {
      last.normalizedEnd += text.length
      last.sourceEnd = sourceEnd
    } else {
      chunks.push({
        normalizedStart: normalized.length,
        normalizedEnd: normalized.length + text.length,
        sourceStart,
        sourceEnd,
        oneToOne,
      })
    }
    normalized += text
  }

  for (const cluster of graphemeClusters(source)) {
    const piece = foldPunctuation(
      lowercaseCluster(source, cluster.start, cluster.text).normalize('NFKD'),
    )
    // A cluster that is one unit in and one unit out can be merged into a run
    // whose interior offsets are all grapheme boundaries.
    const oneToOne = cluster.text.length === 1 && piece.length === 1

    let index = 0
    while (index < piece.length) {
      if (WHITESPACE.test(piece[index] ?? '')) {
        if (pendingSpaceStart === -1) pendingSpaceStart = cluster.start
        pendingSpaceEnd = cluster.end
        index += 1
        continue
      }

      if (pendingSpaceStart !== -1) {
        // Leading whitespace is dropped rather than emitted, which is the trim.
        if (normalized.length > 0) push(pendingSpaceStart, pendingSpaceEnd, ' ', false)
        pendingSpaceStart = -1
        pendingSpaceEnd = -1
      }

      let end = index
      while (end < piece.length && !WHITESPACE.test(piece[end] ?? '')) end += 1
      push(cluster.start, cluster.end, piece.slice(index, end), oneToOne)
      index = end
    }
  }

  return { normalized, source, chunks }
}

function chunkIndexAt(chunks: readonly NormalizedChunk[], offset: number): number {
  let low = 0
  let high = chunks.length - 1
  while (low <= high) {
    const middle = (low + high) >> 1
    const chunk = chunks[middle]
    if (chunk === undefined) return -1
    if (offset < chunk.normalizedStart) high = middle - 1
    else if (offset >= chunk.normalizedEnd) low = middle + 1
    else return middle
  }
  return -1
}

/**
 * Translate a range of the normalised string into a range of the source.
 *
 * The result always expands outwards to whole graphemes, so slicing the source
 * with it can never produce a lone surrogate or a combining mark without its
 * base. Returns `null` for an empty range or one that falls outside the map.
 */
export function mapNormalizedRange(text: NormalizedText, range: TextRange): TextRange | null {
  if (range.end <= range.start) return null

  const startIndex = chunkIndexAt(text.chunks, range.start)
  const endIndex = chunkIndexAt(text.chunks, range.end - 1)
  if (startIndex === -1 || endIndex === -1) return null

  const startChunk = text.chunks[startIndex]
  const endChunk = text.chunks[endIndex]
  if (startChunk === undefined || endChunk === undefined) return null

  const start = startChunk.oneToOne
    ? startChunk.sourceStart + (range.start - startChunk.normalizedStart)
    : startChunk.sourceStart
  const end = endChunk.oneToOne
    ? endChunk.sourceStart + (range.end - endChunk.normalizedStart)
    : endChunk.sourceEnd

  return end > start ? { start, end } : null
}
