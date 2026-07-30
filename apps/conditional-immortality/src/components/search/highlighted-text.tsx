import {
  type HighlightSegment,
  highlightSegments,
  segmentByRanges,
  type TextRange,
} from '@ci/search'

/**
 * Matched runs of text, marked.
 *
 * `<mark>` carries the emphasis semantically rather than by colour alone, and
 * every run is passed as a React child, never as HTML, so nothing from content
 * can inject markup. Keys come from the offsets the segment was sliced at, so
 * they stay stable when the surrounding text changes length.
 *
 * This is a Server Component by default and stays one: it has no state, no
 * effects and no measurement. The fitted variant in the quick-search dialog
 * feeds it different text, not different machinery.
 */
function render(segments: readonly HighlightSegment[], markClassName: string) {
  return segments.map(segment =>
    segment.matched ? (
      <mark key={`${segment.start}-${segment.end}`} className={markClassName}>
        {segment.text}
      </mark>
    ) : (
      <span key={`${segment.start}-${segment.end}`}>{segment.text}</span>
    ),
  )
}

/** The standard highlight treatment used outside the measured excerpt. */
const DEFAULT_MARK = 'rounded-sm bg-ochre-soft px-0.5 text-ink'

/**
 * Mark every occurrence of `terms` in `text`.
 *
 * Use where the text is a whole field — a title, a section id — and the match
 * has to be located. For text that came out of the excerpt builder, prefer
 * `MarkedText`: the builder already knows exactly where the matches are, and
 * searching again could sweep an ellipsis it added into a mark.
 */
export function HighlightedText({
  text,
  terms,
  markClassName = DEFAULT_MARK,
}: {
  text: string
  terms: readonly string[]
  markClassName?: string
}) {
  return <>{render(highlightSegments(text, terms), markClassName)}</>
}

/** Mark exactly the ranges the excerpt builder carried forward. */
export function MarkedText({
  text,
  ranges,
  markClassName = DEFAULT_MARK,
}: {
  text: string
  ranges: readonly TextRange[]
  markClassName?: string
}) {
  return <>{render(segmentByRanges(text, ranges), markClassName)}</>
}
