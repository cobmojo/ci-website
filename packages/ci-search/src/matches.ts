import {
  mapNormalizedRange,
  type NormalizedText,
  normalize,
  normalizeWithSourceMap,
  type TextRange,
} from './normalize-with-source-map'

/**
 * Where a query's terms actually sit in text a reader will see.
 *
 * Matching happens in normalised space, because that is the only place a curly
 * apostrophe equals a straight one and `Mañana` equals `manana`. Rendering
 * happens in source space, because that is what the reader wrote. This module
 * owns the crossing between the two, so no caller ever holds a normalised index
 * and a source string at the same time.
 */

export interface HighlightSegment {
  readonly text: string
  readonly matched: boolean
  /** Offset into the text that was passed in, so a React key can be positional. */
  readonly start: number
  readonly end: number
}

/** Terms shorter than this match too much to be worth marking. */
const MIN_TERM_LENGTH = 2

/**
 * Terms in normalised form, longest first.
 *
 * The ranker already hands over normalised terms, and normalisation is
 * idempotent, so normalising again costs nothing and removes the footgun of a
 * caller passing the reader's raw wording and silently matching nothing.
 * Longest first is what lets `unquenchable fire` claim its span before the bare
 * `fire` inside it does.
 */
export function usableTerms(terms: readonly string[]): readonly string[] {
  return [...new Set(terms.map(normalize))]
    .filter(term => term.length >= MIN_TERM_LENGTH)
    .sort((a, b) => b.length - a.length)
}

/** Merge overlapping and touching ranges, leaving them sorted and disjoint. */
export function mergeRanges(ranges: readonly TextRange[]): readonly TextRange[] {
  if (ranges.length === 0) return []
  const sorted = [...ranges]
    .filter(range => range.end > range.start)
    .sort((a, b) => a.start - b.start || a.end - b.end)
  const merged: TextRange[] = []
  for (const range of sorted) {
    const last = merged[merged.length - 1]
    if (last !== undefined && range.start <= last.end) {
      if (range.end > last.end) merged[merged.length - 1] = { start: last.start, end: range.end }
    } else {
      merged.push(range)
    }
  }
  return merged
}

/**
 * Find every occurrence of every term, as ranges of the already-mapped text.
 *
 * Longer terms are searched first, so `unquenchable fire` claims its span
 * before the bare `fire` inside it does. The ranges are then merged, which is
 * what makes the two produce one mark rather than three.
 */
export function findTermRangesIn(
  mapped: NormalizedText,
  terms: readonly string[],
): readonly TextRange[] {
  const found: TextRange[] = []
  for (const term of usableTerms(terms)) {
    let at = mapped.normalized.indexOf(term)
    while (at !== -1) {
      const range = mapNormalizedRange(mapped, { start: at, end: at + term.length })
      if (range !== null) found.push(range)
      at = mapped.normalized.indexOf(term, at + term.length)
    }
  }
  return mergeRanges(found)
}

/** Find every occurrence of every term, as ranges of `text`. */
export function findTermRanges(text: string, terms: readonly string[]): readonly TextRange[] {
  if (!text || terms.length === 0) return []
  return findTermRangesIn(normalizeWithSourceMap(text), terms)
}

/**
 * Split text into plain and matched runs at the given ranges.
 *
 * Ranges are clamped, sorted and merged first, so a caller that carries ranges
 * forward through slicing cannot produce overlapping marks. Every segment
 * satisfies `text.slice(segment.start, segment.end) === segment.text`, and the
 * segments concatenate back to exactly the text that came in.
 */
export function segmentByRanges(
  text: string,
  ranges: readonly TextRange[],
): readonly HighlightSegment[] {
  if (!text) return []

  const clamped = mergeRanges(
    ranges.map(range => ({
      start: Math.max(0, Math.min(range.start, text.length)),
      end: Math.max(0, Math.min(range.end, text.length)),
    })),
  )
  if (clamped.length === 0) return [{ text, matched: false, start: 0, end: text.length }]

  const segments: HighlightSegment[] = []
  let cursor = 0
  for (const range of clamped) {
    if (range.start > cursor) {
      segments.push({
        text: text.slice(cursor, range.start),
        matched: false,
        start: cursor,
        end: range.start,
      })
    }
    segments.push({
      text: text.slice(range.start, range.end),
      matched: true,
      start: range.start,
      end: range.end,
    })
    cursor = range.end
  }
  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      matched: false,
      start: cursor,
      end: text.length,
    })
  }
  return segments
}

/**
 * Split text into plain and matched runs so the renderer can wrap hits in
 * `<mark>` without ever injecting HTML from content.
 */
export function highlightSegments(
  text: string,
  terms: readonly string[],
): readonly HighlightSegment[] {
  return segmentByRanges(text, findTermRanges(text, terms))
}
