/**
 * What the fitted excerpt is allowed to measure.
 *
 * Pretext predicts geometry accurately for the text setup it models. This
 * function is the deliberately conservative gate in front of it: ordinary
 * English and Latin prose rendered entirely by the self-hosted Source Serif 4
 * subsets, and nothing else yet.
 *
 * Everything it declines still renders. It renders as the ordinary fallback
 * excerpt, with real `<mark>` elements and normal browser line breaking. A
 * decline is not an error and never reaches the reader.
 *
 * Pure by construction: no DOM, no measurement, no Pretext import. It can be
 * unit tested exhaustively, and widened later by adding a range here and
 * proving it through the browser geometry contract.
 */

export type IneligibleReason =
  | 'empty'
  | 'hard-break'
  | 'control-character'
  | 'soft-hyphen'
  | 'bidi-control'
  | 'zero-width'
  | 'variation-selector'
  | 'emoji'
  | 'uncovered-script'
  | 'repeated-symbol-run'
  | 'long-token'

export interface EligibilityResult {
  readonly eligible: boolean
  readonly reason?: IneligibleReason
}

const ELIGIBLE: EligibilityResult = { eligible: true }

/**
 * The code points the self-hosted Source Serif 4 faces actually contain.
 *
 * Transcribed from the four `unicode-range` descriptors in `globals.css` — the
 * Latin and Latin Extended subsets, normal and italic. A code point outside
 * this union is drawn by whatever font the platform substitutes, which is not
 * the font that was measured, so its geometry is not ours to predict.
 *
 * Keep this in step with the `@font-face` rules. Widening it is a font change
 * first and a code change second.
 */
const COVERED_RANGES: readonly (readonly [number, number])[] = [
  // Latin subset.
  [0x0000, 0x00ff],
  [0x0131, 0x0131],
  [0x0152, 0x0153],
  [0x02bb, 0x02bc],
  [0x02c6, 0x02c6],
  [0x02da, 0x02da],
  [0x02dc, 0x02dc],
  [0x0304, 0x0304],
  [0x0308, 0x0308],
  [0x0329, 0x0329],
  [0x2000, 0x206f],
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
  [0x2191, 0x2191],
  [0x2193, 0x2193],
  [0x2212, 0x2212],
  [0x2215, 0x2215],
  [0xfeff, 0xfeff],
  [0xfffd, 0xfffd],
  // Latin Extended subset.
  [0x0100, 0x02ba],
  [0x02bd, 0x02c5],
  [0x02c7, 0x02cc],
  [0x02ce, 0x02d7],
  [0x02dd, 0x02ff],
  [0x1d00, 0x1dbf],
  [0x1e00, 0x1e9f],
  [0x1ef2, 0x1eff],
  [0x2020, 0x2020],
  [0x20a0, 0x20ab],
  [0x20ad, 0x20c0],
  [0x2113, 0x2113],
  [0x2c60, 0x2c7f],
  [0xa720, 0xa7ff],
]

/** Sorted and merged once, so membership is a binary search. */
const SORTED_RANGES: readonly (readonly [number, number])[] = (() => {
  const sorted = [...COVERED_RANGES].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1]
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  return merged
})()

function isCovered(codePoint: number): boolean {
  let low = 0
  let high = SORTED_RANGES.length - 1
  while (low <= high) {
    const middle = (low + high) >> 1
    const range = SORTED_RANGES[middle]
    if (range === undefined) return false
    if (codePoint < range[0]) high = middle - 1
    else if (codePoint > range[1]) low = middle + 1
    else return true
  }
  return false
}

/*
 * Characters inside a covered range that must still be declined.
 *
 * U+2000–U+206F is covered by the font subset, and it also holds every
 * zero-width and bidirectional formatting character. Coverage says the glyph
 * exists; it says nothing about whether the line breaker agrees with the
 * browser about what to do with it.
 */

/** Tab, the line separators, and the vertical whitespace `pre-wrap` would keep. */
const HARD_BREAKS = new Set([0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x2028, 0x2029])

const SOFT_HYPHEN = 0x00ad

const ZERO_WIDTH = new Set([
  0x200b, // zero width space — Pretext issue #210
  0x200c, // zero width non-joiner
  0x200d, // zero width joiner
  0x2060, // word joiner
  0xfeff, // zero width no-break space
])

const BIDI_CONTROLS = new Set([
  0x061c, // Arabic letter mark
  0x200e, // left-to-right mark
  0x200f, // right-to-left mark
  0x202a,
  0x202b,
  0x202c,
  0x202d,
  0x202e, // embedding and override
  0x2066,
  0x2067,
  0x2068,
  0x2069, // isolates
])

function isControlCharacter(codePoint: number): boolean {
  return codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f)
}

function isVariationSelector(codePoint: number): boolean {
  return (
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) || (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
  )
}

/** Emoji, including text-presentation code points that can become emoji. */
const PICTOGRAPH = /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Regional_Indicator}/u

/**
 * A run of repeated symbols long enough to reach Pretext's uncertain handling.
 *
 * Issue #206 reports repeated non-character symbol runs — commas, brackets,
 * pipes, backslashes — breaking differently from browsers. The rule is
 * deliberately about *repetition*, not about punctuation density: `stop.”)!`
 * is four punctuation marks in a row and is perfectly ordinary prose, while
 * `,,,,` and `][][` are the degenerate shapes the issue is about.
 */
const REPEATED_SYMBOL_RUN = /([\p{P}\p{S}])\1{3,}|([\p{P}\p{S}]{2})\2+/u

/**
 * The longest token measured without entering emergency word breaking.
 *
 * At the narrowest search-result content width a line holds roughly
 * thirty-five characters of Source Serif at this size, so a longer token has to
 * be broken mid-word. `overflow-wrap: break-word` is modelled, but the
 * grapheme-level break point inside a long run is exactly where Pretext and
 * browsers are least likely to agree, so this declines rather than gambles.
 * The longest words in the corpus — annihilationism, conditionalism,
 * Thessalonians — sit far below it; URLs sit far above.
 */
const MAX_TOKEN_LENGTH = 30

/** Tokens break at whitespace and at the dashes a browser breaks after. */
const TOKEN_SEPARATOR = /(?:\s|\p{Pd})+/u

/**
 * Decide whether Pretext may measure this text.
 *
 * Rules are checked in a fixed order, so text breaking several of them always
 * reports the same reason. The reason exists for diagnostics and tests; none of
 * it reaches the reader.
 */
export function excerptTextEligibility(text: string): EligibilityResult {
  if (!text || text.trim().length === 0) return { eligible: false, reason: 'empty' }

  for (const character of text) {
    const codePoint = character.codePointAt(0)
    if (codePoint === undefined) return { eligible: false, reason: 'uncovered-script' }
    if (HARD_BREAKS.has(codePoint)) return { eligible: false, reason: 'hard-break' }
    if (isControlCharacter(codePoint)) return { eligible: false, reason: 'control-character' }
    if (codePoint === SOFT_HYPHEN) return { eligible: false, reason: 'soft-hyphen' }
    if (BIDI_CONTROLS.has(codePoint)) return { eligible: false, reason: 'bidi-control' }
    if (ZERO_WIDTH.has(codePoint)) return { eligible: false, reason: 'zero-width' }
    if (isVariationSelector(codePoint)) return { eligible: false, reason: 'variation-selector' }
    if (PICTOGRAPH.test(character)) return { eligible: false, reason: 'emoji' }
    if (!isCovered(codePoint)) return { eligible: false, reason: 'uncovered-script' }
  }

  if (REPEATED_SYMBOL_RUN.test(text)) return { eligible: false, reason: 'repeated-symbol-run' }

  for (const token of text.split(TOKEN_SEPARATOR)) {
    if (token.length > MAX_TOKEN_LENGTH) return { eligible: false, reason: 'long-token' }
  }

  return ELIGIBLE
}

export function isEligibleExcerptText(text: string): boolean {
  return excerptTextEligibility(text).eligible
}
