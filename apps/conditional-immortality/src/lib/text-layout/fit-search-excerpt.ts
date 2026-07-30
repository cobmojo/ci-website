import { mergeRanges, type TextRange, toGraphemes } from '@ci/search'
import { buildCursorSourceMap } from './cursor-source-map'
import type { LineCursorRange, PreparedText, TextLayoutEngine } from './engine'
import type { FontContract } from './font-contract'

/**
 * Choosing the window of a candidate that lands exactly on the line budget.
 *
 * The input is a larger excerpt candidate from `@ci/search`, which already
 * knows where its matches are as exact source offsets. The output is a shorter
 * substring of that candidate, plus the same matches re-expressed as offsets
 * into the shorter text. Nothing is re-searched: ranges are carried through
 * every slice and every ellipsis, because searching the final text again is how
 * an ellipsis ends up inside a `<mark>`.
 *
 * Everything here is deterministic and engine-agnostic. Pretext supplies wrap
 * positions through the `TextLayoutEngine` interface; the decisions are ours.
 */

/** The candidate as `@ci/search` produced it. */
export interface FitCandidate {
  /** Single-spaced, trimmed, with no ellipsis of its own. */
  readonly text: string
  /** At least one exact match, as offsets into `text`. */
  readonly matchRanges: readonly TextRange[]
  /** Whether the candidate itself already dropped source text on that side. */
  readonly omittedBefore: boolean
  readonly omittedAfter: boolean
}

export interface FittedExcerpt {
  readonly text: string
  readonly matchRanges: readonly TextRange[]
  readonly lineCount: number
}

const ELLIPSIS = '…'

/**
 * Below this the container is mid-mount or collapsed, not narrow.
 *
 * A fit computed against a two-pixel width would be cached and shown, so the
 * guard is a correctness measure, not a performance one.
 */
const MIN_PLAUSIBLE_WIDTH = 40

/** A hard stop on the trimming search, so it can never spin. */
const MAX_TRIM_PROBES = 24

/**
 * The column is treated as one pixel narrower than it is.
 *
 * Pretext sums separately measured segment advances; a browser lays the whole
 * line out at once. The two agree to a few hundredths of a pixel, which is
 * exact enough for every purpose except a line that ends within a hair of the
 * limit — there, the accumulated difference decides the break.
 *
 * Both outcomes are not equally bad. Predicting one line too many costs the
 * reader a word of context. Predicting one too few produces an excerpt that
 * overflows its reserved block and gets clipped. So the fitter asks for
 * slightly less room than it has, which makes every prediction land on the
 * safe side of that boundary. The geometry suite measures the size of the
 * disagreement and proves this margin covers it.
 */
export const MEASUREMENT_SAFETY_MARGIN = 1

interface LineSpan {
  readonly start: number
  readonly end: number
}

/**
 * Fit a candidate into its line budget around a match.
 *
 * Returns `null` for every condition that means "keep the fallback": a width
 * that is not plausible, an engine that declined, a segment stream that does
 * not reassemble, a match that cannot be kept, or text that will not fit no
 * matter how much context is dropped.
 */
export function fitSearchExcerpt(
  candidate: FitCandidate,
  contract: FontContract,
  width: number,
  engine: TextLayoutEngine,
): FittedExcerpt | null {
  if (!candidate.text) return null
  if (candidate.matchRanges.length === 0) return null
  if (!Number.isFinite(width) || width < MIN_PLAUSIBLE_WIDTH) return null

  const budget = contract.lineBudget
  if (!Number.isInteger(budget) || budget < 1) return null

  const prepared = engine.prepare(candidate.text, contract)
  if (!prepared) return null

  const layoutWidth = width - MEASUREMENT_SAFETY_MARGIN
  const spans = lineSpans(prepared, candidate.text, layoutWidth)
  if (spans === null) return null

  const anchor = strongest(candidate.matchRanges)
  if (anchor === null) return null

  const boundaries = graphemeBoundaries(candidate.text)
  const window = chooseWindow(spans, anchor, budget, candidate.text)
  if (window === null) return null

  return finalise(candidate, window, contract, layoutWidth, engine, boundaries, budget)
}

/* ------------------------------------------------------------------ *
 * Wrapped lines, as offsets into the candidate
 * ------------------------------------------------------------------ */

/**
 * Translate Pretext's line cursors into candidate offsets.
 *
 * Returns `null` if the segment stream does not reassemble the candidate, or if
 * any cursor fails to map. Both mean the fitted text could stop being a slice
 * of the source, which is the one thing this must never produce.
 */
function lineSpans(
  prepared: PreparedText,
  text: string,
  width: number,
): readonly LineSpan[] | null {
  const map = buildCursorSourceMap(prepared.segments, text)
  if (!map) return null

  const lines: readonly LineCursorRange[] = prepared.linesAt(width)
  if (lines.length === 0) return null

  const spans: LineSpan[] = []
  for (const line of lines) {
    const start = map.offsetAt(line.start)
    const end = map.offsetAt(line.end)
    if (start === null || end === null || end < start) return null
    spans.push({ start, end })
  }
  return spans
}

function strongest(ranges: readonly TextRange[]): TextRange | null {
  let best: TextRange | null = null
  for (const range of ranges) {
    if (best === null || range.end - range.start > best.end - best.start) best = range
  }
  return best
}

function graphemeBoundaries(text: string): Set<number> {
  const boundaries = new Set<number>([0])
  let offset = 0
  for (const grapheme of toGraphemes(text)) {
    offset += grapheme.length
    boundaries.add(offset)
  }
  return boundaries
}

/* ------------------------------------------------------------------ *
 * Window selection
 * ------------------------------------------------------------------ */

interface Window {
  readonly start: number
  readonly end: number
  readonly omittedBefore: boolean
  readonly omittedAfter: boolean
}

/**
 * Pick the run of `budget` consecutive lines to show.
 *
 * The match has to be inside the window, and it has to be visible early: on the
 * first line of a two-line result, and on the first or second line of a
 * three-line one. Beyond that the window takes as much context as the budget
 * allows on both sides, and slides rather than shrinks when it runs into either
 * end of the candidate.
 *
 * Returns `null` when the match itself spans more lines than the budget, since
 * any window would then have to cut through it.
 */
function chooseWindow(
  spans: readonly LineSpan[],
  anchor: TextRange,
  budget: number,
  text: string,
): Window | null {
  const firstLine = lineContaining(spans, anchor.start)
  const lastLine = lineContaining(spans, Math.max(anchor.start, anchor.end - 1))
  if (firstLine === -1 || lastLine === -1) return null
  if (lastLine - firstLine + 1 > budget) return null

  // One line of lead-in when the budget can afford it, so the match is on the
  // second line of a three-line window rather than stranded at the top.
  const lead = budget >= 3 ? 1 : 0
  let start = firstLine - lead

  const maxStart = Math.max(0, spans.length - budget)
  start = Math.min(Math.max(0, start), maxStart)
  // Never slide past the match in either direction.
  start = Math.min(start, firstLine)
  if (start + budget - 1 < lastLine) start = lastLine - budget + 1
  start = Math.max(0, start)

  const end = Math.min(spans.length - 1, start + budget - 1)
  const first = spans[start]
  const last = spans[end]
  if (!first || !last) return null

  let from = first.start
  let to = last.end
  // A wrap leaves the space that caused it at the end of the line.
  while (to > anchor.end && to > from && text[to - 1] === ' ') to -= 1
  while (from < anchor.start && text[from] === ' ') from += 1

  return {
    start: from,
    end: to,
    omittedBefore: start > 0,
    omittedAfter: end < spans.length - 1,
  }
}

function lineContaining(spans: readonly LineSpan[], offset: number): number {
  for (let index = 0; index < spans.length; index += 1) {
    const span = spans[index]
    if (span === undefined) continue
    if (offset >= span.start && offset < span.end) return index
    // An offset in the whitespace a wrap consumed belongs to the line before it.
    if (offset < span.start) return index
  }
  return spans.length > 0 ? spans.length - 1 : -1
}

/* ------------------------------------------------------------------ *
 * Ellipses, remeasurement and trimming
 * ------------------------------------------------------------------ */

interface Composed {
  readonly text: string
  readonly matchRanges: readonly TextRange[]
}

interface Measured {
  readonly fits: boolean
  readonly lineCount: number
  readonly composed: Composed
}

/** Build the display text for a slice, with ellipses and shifted ranges. */
function compose(
  candidate: FitCandidate,
  start: number,
  end: number,
  omittedBefore: boolean,
  omittedAfter: boolean,
): Composed | null {
  const lead = omittedBefore ? ELLIPSIS : ''
  const tail = omittedAfter ? ELLIPSIS : ''
  const body = candidate.text.slice(start, end)
  if (!body) return null

  const shifted: TextRange[] = []
  for (const range of candidate.matchRanges) {
    if (range.start < start || range.end > end) continue
    shifted.push({ start: range.start - start + lead.length, end: range.end - start + lead.length })
  }
  if (shifted.length === 0) return null

  return { text: `${lead}${body}${tail}`, matchRanges: mergeRanges(shifted) }
}

/**
 * Add the ellipses, measure what that produced, and trim if it overflowed.
 *
 * An ellipsis is a character like any other: adding one can push the last word
 * onto a fourth line. So the composed text — ellipses included — is what gets
 * measured, and if it does not fit, whole words come off the side that matters
 * least. The match is never among them.
 */
function finalise(
  candidate: FitCandidate,
  window: Window,
  contract: FontContract,
  width: number,
  engine: TextLayoutEngine,
  boundaries: Set<number>,
  budget: number,
): FittedExcerpt | null {
  const omittedBefore = candidate.omittedBefore || window.omittedBefore
  const omittedAfter = candidate.omittedAfter || window.omittedAfter

  const measure = (start: number, end: number): Measured | null => {
    const composed = compose(
      candidate,
      start,
      end,
      omittedBefore || start > window.start,
      omittedAfter || end < window.end,
    )
    if (!composed) return null
    const prepared = engine.prepare(composed.text, contract)
    if (!prepared) return null
    const lineCount = prepared.lineCountAt(width)
    return { fits: lineCount <= budget, lineCount, composed }
  }

  const initial = measure(window.start, window.end)
  if (!initial) return null
  if (initial.fits) return toFitted(initial)

  const anchor = strongest(candidate.matchRanges)
  if (!anchor) return null

  // Trim the trailing side first: the match stays early, which is what a reader
  // scanning a result list needs. Cut points are whole words, snapped to
  // grapheme boundaries, and never inside the match.
  const trailing = searchCuts(
    wordCuts(candidate.text, anchor.end, window.end, boundaries, 'forward'),
    cut => measure(window.start, cut),
  )
  if (trailing) return toFitted(trailing)

  // Still too tall: give up context before the match instead.
  const leading = searchCuts(
    wordCuts(candidate.text, window.start, anchor.start, boundaries, 'backward'),
    cut => measure(cut, window.end),
  )
  if (leading) return toFitted(leading)

  // Nothing that keeps the match fits. The fallback excerpt is the right answer.
  return null
}

function toFitted(measured: Measured): FittedExcerpt {
  return {
    text: measured.composed.text,
    matchRanges: measured.composed.matchRanges,
    lineCount: measured.lineCount,
  }
}

/**
 * Whole-word cut points between two offsets, most generous first.
 *
 * `forward` walks back from the far edge toward the match, so the first entry
 * keeps the most text. `backward` walks forward from the near edge toward the
 * match, likewise keeping the most text first. Either way, a binary search over
 * the list finds the largest window that fits.
 */
function wordCuts(
  text: string,
  from: number,
  to: number,
  boundaries: Set<number>,
  direction: 'forward' | 'backward',
): readonly number[] {
  const cuts: number[] = []
  if (direction === 'forward') {
    for (let at = to; at > from; at -= 1) {
      if (text[at] === ' ' && boundaries.has(at)) cuts.push(at)
    }
  } else {
    for (let at = from; at < to; at += 1) {
      if (text[at] === ' ' && boundaries.has(at + 1)) cuts.push(at + 1)
    }
  }
  return cuts
}

/**
 * Find the most generous cut that fits, by binary search.
 *
 * The cut list is ordered most-generous first and fitting is monotonic in it —
 * dropping more text never makes the block taller — so a binary search is
 * sound. It is also what keeps this bounded: at most `MAX_TRIM_PROBES`
 * measurements regardless of how many words are on the chopping block.
 */
function searchCuts(
  cuts: readonly number[],
  measure: (cut: number) => Measured | null,
): Measured | null {
  let low = 0
  let high = cuts.length - 1
  let best: Measured | null = null
  let probes = 0

  while (low <= high && probes < MAX_TRIM_PROBES) {
    const middle = (low + high) >> 1
    const cut = cuts[middle]
    probes += 1
    if (cut === undefined) break
    const result = measure(cut)
    if (result?.fits) {
      best = result
      high = middle - 1
    } else {
      low = middle + 1
    }
  }

  return best
}
