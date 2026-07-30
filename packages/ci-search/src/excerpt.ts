import { findTermRangesIn, mergeRanges, usableTerms } from './matches'
import {
  normalize,
  normalizeWithSourceMap,
  type TextRange,
  toGraphemes,
} from './normalize-with-source-map'
import type { MatchField, SearchDoc, SearchExcerptCandidate } from './types'

/**
 * Excerpts, built from the source the reader will actually see.
 *
 * Two shapes come out of here. The fallback excerpt is what the server-rendered
 * search page shows and what the quick dialog paints first: roughly two lines
 * of context with real ellipses. The candidate is a larger window with no
 * ellipses, handed to the browser-side fitter so Pretext can choose a window
 * that lands exactly on the responsive line budget.
 *
 * Both come from the same field selection and the same windowing routine, so a
 * fitted excerpt is always a refinement of the fallback it replaces rather than
 * a jump to different text.
 */

/** Context kept either side of the match in the fallback excerpt. */
const FALLBACK_RADIUS = 110
/**
 * Lead-in for a fallback that will be shown in a fixed two- or three-line box.
 *
 * The quick dialog reserves an exact block so a fitted excerpt can replace a
 * fallback without moving the rows below it. A fallback carrying the usual
 * hundred and ten characters of lead-in puts its match on the fourth line at a
 * phone width, where the box has two — so the one thing the row exists to show
 * is the one thing clipped away. Keeping the lead-in under a line means the
 * match is visible whether or not fitting ever arrives.
 */
const COMPACT_LEAD_IN = 24
/** Context kept either side of the match in the fitting candidate. */
const CANDIDATE_RADIUS = 250

/** The documented display-length band a candidate lands in for ordinary prose. */
export const CANDIDATE_MIN_LENGTH = 350
export const CANDIDATE_MAX_LENGTH = 600

/** How far from a cut point a sentence boundary may be and still be preferred. */
const SENTENCE_SEARCH_WINDOW = 90

/**
 * How far from a cut point a word boundary may be and still be preferred.
 *
 * The sentence cut is bounded; the word cut has to be too. `indexOf` and
 * `lastIndexOf` will happily walk to the far end of the text when the window
 * holds no space at all, and in the no-match head path — where the anchor is
 * the empty range at offset zero — an unbounded backwards walk collapses the
 * window to nothing and leaves an excerpt of one ellipsis.
 */
const WORD_SEARCH_WINDOW = 30

const ELLIPSIS = '…'

export interface ExcerptSource {
  readonly field: MatchField
  readonly text: string
}

export interface SearchExcerpt {
  /** Display text, including any ellipsis this builder added. */
  readonly text: string
  /** Match ranges as offsets into `text`, with any ellipsis already accounted for. */
  readonly matchRanges: readonly TextRange[]
  readonly omittedBefore: boolean
  readonly omittedAfter: boolean
  /** The field the text came from, or `null` when the document had no text. */
  readonly sourceField: MatchField | null
}

/**
 * The whitespace `white-space: normal` actually collapses.
 *
 * Space, tab, and the segment breaks. Deliberately *not* U+00A0: CSS leaves a
 * no-break space alone, and it stays unbreakable. JavaScript's `\s` includes
 * it, so collapsing with `\s` would rewrite a reference written with a
 * no-break space into one a browser is free to split across two lines —
 * changing both the quoted text and the way it lays out. The other fixed-width
 * spaces in U+2000–U+200A are left alone for the same reason.
 *
 * Written as code points rather than a character class so the set is legible
 * and cannot be misread as `\s`.
 */
const COLLAPSIBLE_CODES = new Set([
  0x20, // space
  0x09, // tab
  0x0a, // line feed
  0x0b, // line tabulation
  0x0c, // form feed
  0x0d, // carriage return
  0x2028, // line separator
  0x2029, // paragraph separator
])

function isCollapsible(character: string): boolean {
  const code = character.codePointAt(0)
  return code !== undefined && COLLAPSIBLE_CODES.has(code)
}

/** True when the whole cluster is collapsible whitespace. */
function isCollapsibleCluster(cluster: string): boolean {
  for (const character of cluster) {
    if (!isCollapsible(character)) return false
  }
  return cluster.length > 0
}

/**
 * The cluster with any leading collapsible run removed.
 *
 * A space followed by a combining mark is one grapheme cluster, so it is not
 * wholly collapsible and cannot simply be dropped. CSS still collapses the
 * space; it just keeps the mark on whichever space survives. Splitting the
 * cluster here lets the leading run go through the same pending-space logic as
 * any other whitespace, and only the remainder is emitted.
 */
function withoutLeadingCollapsible(cluster: string): string {
  let at = 0
  for (const character of cluster) {
    if (!isCollapsible(character)) break
    at += character.length
  }
  return at === 0 ? cluster : cluster.slice(at)
}

/**
 * A collapsible space immediately followed by a combining mark: the only shape
 * for which collapsing by cluster differs from collapsing by character.
 */
const SPACE_THEN_MARK = /\p{M}/u

/**
 * Collapse whitespace the way `white-space: normal` renders it.
 *
 * A run of collapsible whitespace becomes one space, and a run at either end
 * disappears. Anything CSS would have left alone is left alone.
 */
export function collapseWhitespace(text: string): string {
  if (!text) return ''

  // The cluster walk exists only to protect a combining mark that follows a
  // space from being orphaned. When there is no mark anywhere — which is
  // almost every document in this corpus — the character walk is identical and
  // far cheaper than segmenting fifteen thousand characters.
  const units = SPACE_THEN_MARK.test(text) ? toGraphemes(text) : [...text]

  let out = ''
  let pendingSpace = false
  for (const unit of units) {
    if (isCollapsibleCluster(unit)) {
      pendingSpace = true
      continue
    }
    // A cluster can *begin* with collapsible whitespace and still carry a
    // combining mark, which is what keeps it out of the branch above. The
    // leading run collapses like any other; only the rest is text.
    const rest = withoutLeadingCollapsible(unit)
    if (rest !== unit) pendingSpace = true
    if (pendingSpace && out.length > 0) out += ' '
    pendingSpace = false
    out += rest
  }
  return out
}

/* ------------------------------------------------------------------ *
 * Windowing
 * ------------------------------------------------------------------ */

interface Window {
  readonly start: number
  readonly end: number
}

/** Offsets in `text` that a slice may land on without cutting a grapheme. */
function graphemeBoundaries(text: string): Set<number> {
  const boundaries = new Set<number>([0])
  let offset = 0
  for (const grapheme of toGraphemes(text)) {
    offset += grapheme.length
    boundaries.add(offset)
  }
  return boundaries
}

function snapBack(offset: number, boundaries: Set<number>): number {
  let at = Math.max(0, offset)
  while (at > 0 && !boundaries.has(at)) at -= 1
  return at
}

function snapForward(offset: number, boundaries: Set<number>, length: number): number {
  let at = Math.min(length, offset)
  while (at < length && !boundaries.has(at)) at += 1
  return at
}

/** Sentence-ending punctuation, allowing a closing quote or bracket after it. */
const SENTENCE_END = /[.!?]["'’”)\]]*(?=\s|$)/g

/** The offset just after the first sentence break in `[from, to)`, or -1. */
function sentenceStartWithin(text: string, from: number, to: number): number {
  SENTENCE_END.lastIndex = Math.max(0, from)
  let match = SENTENCE_END.exec(text)
  while (match !== null) {
    // Step past the punctuation and the single space that follows it.
    const at = match.index + match[0].length + 1
    if (at >= to) return -1
    if (at > from) return at
    match = SENTENCE_END.exec(text)
  }
  return -1
}

/** The offset just after the last sentence end in `[from, to]`, or -1. */
function sentenceEndWithin(text: string, from: number, to: number): number {
  SENTENCE_END.lastIndex = Math.max(0, from)
  let best = -1
  let match = SENTENCE_END.exec(text)
  while (match !== null) {
    const at = match.index + match[0].length
    if (at > to) break
    if (at >= from) best = at
    match = SENTENCE_END.exec(text)
  }
  return best
}

/**
 * Choose the window of `text` to show around `anchor`.
 *
 * A sentence boundary is preferred at each cut when one sits close enough to
 * the radius to be worth taking; otherwise the cut moves to a whole-word
 * boundary; and either way it finally snaps to a grapheme boundary, so slicing
 * cannot produce a lone surrogate or an orphaned combining mark. The anchor is
 * never crossed, so the match survives every adjustment.
 */
function chooseWindow(
  text: string,
  anchor: TextRange,
  radius: number,
  leadingRadius: number = radius,
): Window {
  const boundaries = graphemeBoundaries(text)
  let start = Math.max(0, anchor.start - leadingRadius)
  let end = Math.min(text.length, anchor.end + radius)

  if (start > 0) {
    const sentence = sentenceStartWithin(
      text,
      start,
      Math.min(anchor.start, start + SENTENCE_SEARCH_WINDOW),
    )
    if (sentence !== -1) {
      start = sentence
    } else {
      const space = text.indexOf(' ', start)
      if (space !== -1 && space + 1 <= anchor.start && space - start <= WORD_SEARCH_WINDOW) {
        start = space + 1
      }
    }
  }

  if (end < text.length) {
    const sentence = sentenceEndWithin(
      text,
      Math.max(anchor.end, end - SENTENCE_SEARCH_WINDOW),
      end,
    )
    if (sentence !== -1) {
      end = sentence
    } else {
      const space = text.lastIndexOf(' ', end)
      if (space !== -1 && space >= anchor.end && end - space <= WORD_SEARCH_WINDOW) end = space
    }
  }

  start = snapBack(start, boundaries)
  end = snapForward(end, boundaries, text.length)

  // Trim spaces the cut left dangling, without ever crossing the anchor and
  // without stepping off a grapheme boundary: a space that carries a combining
  // mark is one cluster, and moving into it would strand the mark on the
  // ellipsis. The snap above is only sound if what follows it respects it too.
  while (start < anchor.start && text[start] === ' ' && boundaries.has(start + 1)) start += 1
  while (end > anchor.end && text[end - 1] === ' ' && boundaries.has(end - 1)) end -= 1

  return { start, end }
}

/** The match a window is built around: the longest run, earliest on a tie. */
function strongestRange(ranges: readonly TextRange[]): TextRange | null {
  let best: TextRange | null = null
  for (const range of ranges) {
    if (best === null || range.end - range.start > best.end - best.start) best = range
  }
  return best
}

/**
 * A bounded slice of one field, mapped precisely, with its matches located.
 *
 * `region` is the only text that ever gets grapheme-level normalisation. The
 * whole field can be fifteen thousand characters; the excerpt drawn from it is
 * six hundred. Mapping the whole thing to produce the window would be the
 * "preprocessing entire articles for every result" this is meant to avoid.
 */
interface FieldWindow {
  readonly field: MatchField
  readonly region: string
  /** Where `region` starts inside the field's full display text. */
  readonly regionStart: number
  /** Length of that full display text, for the omission flags. */
  readonly displayLength: number
  /** Matches, as offsets into `region`. */
  readonly ranges: readonly TextRange[]
}

/**
 * How much context either side of a located match is mapped precisely.
 *
 * Comfortably more than the widest window any caller asks for, so the window
 * chosen inside the region is never clipped by the region's own edges.
 */
const MAP_PAD = 700

/** Enough of an unmatched field to cut a head excerpt from. */
const HEAD_LIMIT = FALLBACK_RADIUS * 2 + 200

/**
 * Characters that continue a grapheme rather than starting one.
 *
 * Combining marks and variation selectors are `M`; the zero-width joiner and
 * the other invisible formatting characters are `Cf`. A slice must never begin
 * on one of these.
 */
const CONTINUATION = /[\p{M}\p{Cf}]/u

/**
 * Step back to a boundary that is safe to slice at.
 *
 * Not full grapheme segmentation — that is what the region exists to avoid —
 * but enough that the region never starts on a low surrogate or a combining
 * mark. The precise mapping inside the region does the rest.
 */
function safeSliceStart(text: string, index: number): number {
  let at = Math.max(0, Math.min(index, text.length))
  while (at > 0 && at < text.length) {
    const code = text.charCodeAt(at)
    if (code >= 0xdc00 && code <= 0xdfff) {
      at -= 1
      continue
    }
    const point = text.codePointAt(at)
    if (point !== undefined && CONTINUATION.test(String.fromCodePoint(point))) {
      at -= 1
      continue
    }
    break
  }
  return at
}

/**
 * Locate the strongest match in a field and map only its surroundings.
 *
 * The cheap whole-string `normalize()` says *whether* and roughly *where* a
 * field matches. Its offsets are normalised offsets, which are not source
 * offsets — but they bound them: after whitespace collapsing, normalisation
 * only ever expands, so a match at normalised offset `n` sits at a display
 * offset somewhere in `[n - expansion, n]`, where `expansion` is the length
 * difference across the whole field. That is a tight enough bracket to map a
 * small region precisely and get exact ranges out of it.
 */
function locateMatches(display: string, terms: readonly string[]): FieldWindow | null {
  const normalized = normalize(display)
  const usable = usableTerms(terms)

  let bestAt = -1
  let bestLength = 0
  for (const term of usable) {
    const at = normalized.indexOf(term)
    if (at !== -1 && term.length > bestLength) {
      bestAt = at
      bestLength = term.length
    }
  }
  if (bestAt === -1) return null

  const expansion = normalized.length - display.length
  // Normalisation shrank the field, which only an NFKD expansion that
  // introduced collapsible whitespace can do. The bracket no longer holds, so
  // map the whole field rather than guess.
  const from =
    expansion < 0 ? 0 : safeSliceStart(display, Math.max(0, bestAt - expansion - MAP_PAD))
  const to =
    expansion < 0
      ? display.length
      : safeSliceStart(display, Math.min(display.length, bestAt + bestLength + MAP_PAD))

  const region = display.slice(from, to)
  const ranges = findTermRangesIn(normalizeWithSourceMap(region), terms)
  if (ranges.length === 0) {
    // The bracket held but the match was not where it pointed. Rather than
    // report the field as unmatched, pay for the whole map once.
    const whole = findTermRangesIn(normalizeWithSourceMap(display), terms)
    if (whole.length === 0) return null
    return {
      field: 'body',
      region: display,
      regionStart: 0,
      displayLength: display.length,
      ranges: whole,
    }
  }

  return { field: 'body', region, regionStart: from, displayLength: display.length, ranges }
}

/**
 * The field an excerpt should come from.
 *
 * The first field carrying a real mapped match wins, in the order a reader
 * benefits from most: the curated thesis, then the prose, then the structural
 * fields. When nothing matches — a title-only or section-id-only result — the
 * first field with any text is still returned so the reader sees what the page
 * is about, with no ranges, and the title carries the visible highlight.
 *
 * Both the fallback and the candidate call this, so the two can never disagree
 * about which field they are quoting.
 */
function selectField(
  sources: readonly ExcerptSource[],
  terms: readonly string[],
): FieldWindow | null {
  let firstWithText: FieldWindow | null = null

  for (const source of sources) {
    const display = collapseWhitespace(source.text)
    if (!display) continue

    const located = terms.length ? locateMatches(display, terms) : null
    if (located) return { ...located, field: source.field }

    firstWithText ??= {
      field: source.field,
      region: display.slice(0, HEAD_LIMIT),
      regionStart: 0,
      displayLength: display.length,
      ranges: [],
    }
  }

  return firstWithText
}

/** Shift ranges into a window, dropping any the window cuts through. */
function rangesInWindow(
  ranges: readonly TextRange[],
  window: Window,
  offset: number,
): readonly TextRange[] {
  const shifted: TextRange[] = []
  for (const range of ranges) {
    if (range.start < window.start || range.end > window.end) continue
    shifted.push({
      start: range.start - window.start + offset,
      end: range.end - window.start + offset,
    })
  }
  return mergeRanges(shifted)
}

export interface ExcerptOptions {
  /** Also build the larger, ellipsis-free window for the browser-side fitter. */
  readonly candidate?: boolean
  /**
   * The excerpt will be shown in a small fixed box, so keep the match near the
   * start rather than centred.
   */
  readonly compact?: boolean
}

export interface BuiltExcerpts {
  readonly excerpt: SearchExcerpt
  readonly candidate: SearchExcerptCandidate | null
}

/**
 * Both excerpts for one result, from a single pass over its fields.
 *
 * Field selection is the expensive part — it normalises and maps real source
 * text — and the fallback and the candidate always want the same field and the
 * same matches. Doing it once is what keeps the candidate close to free, and
 * it is also what guarantees the two can never quote different text.
 */
export function buildExcerpts(
  sources: readonly ExcerptSource[],
  terms: readonly string[],
  options: ExcerptOptions = {},
): BuiltExcerpts {
  const selected = selectField(sources, terms)
  return {
    excerpt: excerptFrom(selected, options.compact === true),
    candidate: options.candidate === true ? candidateFrom(selected) : null,
  }
}

/**
 * The excerpt shown wherever no fitting happens: the server search page, and
 * the quick dialog's first paint.
 */
export function buildExcerpt(
  sources: readonly ExcerptSource[],
  terms: readonly string[],
  compact = false,
): SearchExcerpt {
  return excerptFrom(selectField(sources, terms), compact)
}

function excerptFrom(selected: FieldWindow | null, compact = false): SearchExcerpt {
  if (selected === null) {
    return {
      text: '',
      matchRanges: [],
      omittedBefore: false,
      omittedAfter: false,
      sourceField: null,
    }
  }

  const { region, regionStart, displayLength, ranges, field } = selected
  const anchor = strongestRange(ranges)

  if (anchor === null) {
    // Nothing matched in this field. Show its opening, cut at a whole word.
    const limit = FALLBACK_RADIUS * 2
    if (displayLength <= limit) {
      return {
        text: region,
        matchRanges: [],
        omittedBefore: false,
        omittedAfter: false,
        sourceField: field,
      }
    }
    const window = chooseWindow(region, { start: 0, end: 0 }, limit)
    return {
      text: `${region.slice(0, window.end)}${ELLIPSIS}`,
      matchRanges: [],
      omittedBefore: false,
      omittedAfter: true,
      sourceField: field,
    }
  }

  const window = chooseWindow(
    region,
    anchor,
    FALLBACK_RADIUS,
    compact ? COMPACT_LEAD_IN : FALLBACK_RADIUS,
  )
  const omittedBefore = regionStart + window.start > 0
  const omittedAfter = regionStart + window.end < displayLength
  const lead = omittedBefore ? ELLIPSIS : ''

  return {
    text: `${lead}${region.slice(window.start, window.end)}${omittedAfter ? ELLIPSIS : ''}`,
    matchRanges: rangesInWindow(ranges, window, lead.length),
    omittedBefore,
    omittedAfter,
    sourceField: field,
  }
}

/**
 * The larger, ellipsis-free window the browser-side fitter chooses from.
 *
 * Returns `null` when no field carries a mapped match, because a candidate
 * without a match is nothing Pretext could usefully fit: the reader is better
 * served by the ordinary fallback and a highlighted title.
 */
export function buildExcerptCandidate(
  sources: readonly ExcerptSource[],
  terms: readonly string[],
): SearchExcerptCandidate | null {
  return candidateFrom(selectField(sources, terms))
}

function candidateFrom(selected: FieldWindow | null): SearchExcerptCandidate | null {
  if (selected === null) return null

  const anchor = strongestRange(selected.ranges)
  if (anchor === null) return null

  const { region, regionStart, displayLength } = selected
  const window = chooseWindow(region, anchor, CANDIDATE_RADIUS)
  const matchRanges = rangesInWindow(selected.ranges, window, 0)
  if (matchRanges.length === 0) return null

  return {
    text: region.slice(window.start, window.end),
    matchRanges,
    omittedBefore: regionStart + window.start > 0,
    omittedAfter: regionStart + window.end < displayLength,
    sourceField: selected.field,
  }
}

/**
 * The fields an excerpt may be drawn from, composed exactly as the ranker
 * composes them, so a field the ranker scored is a field this can quote.
 */
export function excerptSources(doc: SearchDoc): readonly ExcerptSource[] {
  return [
    { field: 'summary', text: doc.summary },
    { field: doc.type === 'transcript' ? 'transcript' : 'body', text: doc.body },
    { field: 'heading', text: doc.headings.join(' · ') },
    { field: 'scripture', text: doc.scriptureRefs.join(' · ') },
    { field: 'notes', text: doc.notes },
  ]
}
