/**
 * Pretext cursors, translated into string offsets.
 *
 * A `LayoutCursor` is `{ segmentIndex, graphemeIndex }`: a position in the
 * prepared segment stream, not an index into the string that was prepared.
 * Treating one as the other is the single most tempting mistake in this
 * integration, because for pure ASCII the two happen to coincide — right up
 * until an accent, an emoji or a ligature arrives and they silently stop.
 *
 * This adapter uses only the public `segments` array and the same grapheme
 * segmentation Pretext itself uses (`Intl.Segmenter` with granularity
 * `grapheme` and no locale), so the two agree on where a grapheme starts.
 *
 * It refuses to build at all unless the segment stream reassembles the exact
 * candidate text. That is the fail-open guard: a soft hyphen, a hard break or
 * any future segmentation change would make the streams disagree, and a
 * disagreement means the fitted excerpt would stop being a slice of the source.
 */

/** Structurally identical to Pretext's `LayoutCursor`, without importing it. */
export interface LayoutCursorLike {
  readonly segmentIndex: number
  readonly graphemeIndex: number
}

export interface CursorSourceMap {
  /** The exact text the segments reassemble to. */
  readonly text: string
  /** The UTF-16 offset of a cursor, or `null` if the cursor is not valid. */
  offsetAt(cursor: LayoutCursorLike): number | null
  /** How many segments have needed grapheme segmentation. For tests. */
  segmentedCount(): number
}

let sharedSegmenter: Intl.Segmenter | null | undefined

function segmenter(): Intl.Segmenter | null {
  if (sharedSegmenter === undefined) {
    sharedSegmenter =
      typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        : null
  }
  return sharedSegmenter
}

/**
 * Build the cursor map for a prepared candidate.
 *
 * Returns `null` when the segments do not reassemble the candidate, or when
 * `Intl.Segmenter` is missing — both of which mean "keep the fallback".
 */
export function buildCursorSourceMap(
  segments: readonly string[],
  text: string,
): CursorSourceMap | null {
  if (segmenter() === null) return null

  // The round trip. Built incrementally so the segment starts come for free.
  const starts: number[] = []
  let offset = 0
  for (const segment of segments) {
    starts.push(offset)
    offset += segment.length
  }
  if (offset !== text.length) return null
  for (let i = 0; i < segments.length; i += 1) {
    const start = starts[i]
    const segment = segments[i]
    if (start === undefined || segment === undefined) return null
    if (text.slice(start, start + segment.length) !== segment) return null
  }

  const graphemeCache = new Map<number, readonly number[]>()

  /** Offsets, relative to the segment, at which each grapheme starts. */
  function graphemeStarts(segmentIndex: number): readonly number[] | null {
    const cached = graphemeCache.get(segmentIndex)
    if (cached) return cached

    const segment = segments[segmentIndex]
    const shared = segmenter()
    if (segment === undefined || shared === null) return null

    const boundaries: number[] = []
    let at = 0
    for (const entry of shared.segment(segment)) {
      boundaries.push(at)
      at += entry.segment.length
    }
    // The exclusive end, so `graphemeIndex === count` is addressable.
    boundaries.push(at)
    graphemeCache.set(segmentIndex, boundaries)
    return boundaries
  }

  return {
    text,

    offsetAt(cursor: LayoutCursorLike): number | null {
      const { segmentIndex, graphemeIndex } = cursor
      if (!Number.isInteger(segmentIndex) || !Number.isInteger(graphemeIndex)) return null
      if (segmentIndex < 0 || graphemeIndex < 0) return null

      // The exclusive end-of-text cursor sits one past the last segment.
      if (segmentIndex === segments.length) {
        return graphemeIndex === 0 ? text.length : null
      }
      if (segmentIndex > segments.length) return null

      const start = starts[segmentIndex]
      if (start === undefined) return null
      if (graphemeIndex === 0) return start

      const boundaries = graphemeStarts(segmentIndex)
      const within = boundaries?.[graphemeIndex]
      return within === undefined ? null : start + within
    },

    segmentedCount(): number {
      return graphemeCache.size
    },
  }
}
