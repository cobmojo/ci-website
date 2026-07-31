/**
 * The one typography contract Pretext and CSS both have to agree on.
 *
 * Pretext measures with a canvas font shorthand, a numeric letter spacing, a
 * white-space mode and a word-break mode. The browser lays out with whatever
 * the cascade resolved. If those two descriptions differ by so much as a
 * fallback family, the predicted line count is a prediction about a different
 * paragraph.
 *
 * So nothing here is assumed. Every value is read back from the element that
 * will actually be painted, and anything that does not match what Pretext
 * models makes the whole contract `null` — which means the reader keeps the
 * ordinary fallback excerpt and nothing has gone wrong.
 *
 * Parsing is kept separate from reading the DOM so it can be unit tested
 * exhaustively without pretending jsdom has a font engine.
 */

/** The computed values this contract is built from, as strings, as CSS reports them. */
export interface ComputedTextStyle {
  readonly fontFamily: string
  readonly fontSize: string
  readonly fontStyle: string
  readonly fontWeight: string
  readonly lineHeight: string
  readonly letterSpacing: string
  readonly whiteSpace: string
  readonly wordBreak: string
  readonly overflowWrap: string
  readonly textWrap: string
  /** The resolved `--search-excerpt-lines` custom property. */
  readonly lineBudget: string
}

export interface FontContract {
  /** Canvas font shorthand, exactly as handed to Pretext. */
  readonly font: string
  /** The named family, confirmed to be the one we self-host. */
  readonly fontFamily: string
  readonly fontSize: number
  readonly lineHeight: number
  readonly letterSpacing: number
  readonly whiteSpace: 'normal'
  readonly wordBreak: 'normal'
  readonly locale: string
  /** Lines the excerpt is allowed to occupy at this container width. */
  readonly lineBudget: number
}

/**
 * The only family the fitted excerpt may be measured in.
 *
 * Named deliberately: `system-ui` and `ui-serif` resolve to different faces on
 * different platforms, and Pretext's own README calls `system-ui` unsafe for
 * layout accuracy on macOS.
 */
export const MEASURED_FONT_FAMILY = 'Source Serif 4'

/** A line budget outside this range means the custom property is wrong. */
const MIN_LINE_BUDGET = 1
const MAX_LINE_BUDGET = 6

/**
 * The two wrapping styles Pretext does not model.
 *
 * Tested by exclusion rather than by an allowlist, because engines spell
 * ordinary wrapping as `wrap`, `normal`, `auto`, `wrap auto` or the empty
 * string depending on which of `text-wrap`, `text-wrap-mode` and
 * `text-wrap-style` they implement. What matters is only that neither of these
 * two is in effect.
 */
const UNMODELLED_WRAP = /pretty|balance/

/** Overflow-wrap values Pretext's break behaviour covers. */
const SUPPORTED_OVERFLOW_WRAP = new Set(['normal', 'break-word'])

function firstFamily(fontFamily: string): string {
  const first = fontFamily.split(',')[0] ?? ''
  return first.trim().replace(/^["']|["']$/g, '')
}

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0
}

/**
 * Build the contract, or decline.
 *
 * Returns `null` rather than throwing or guessing: every rejection here is a
 * perfectly ordinary state — the font has not swapped in yet, the container is
 * still zero-width, someone added `text-wrap: pretty` — and every one of them
 * means "keep the fallback".
 */
export function buildFontContract(style: ComputedTextStyle, locale: string): FontContract | null {
  const family = firstFamily(style.fontFamily)
  if (family.toLowerCase() !== MEASURED_FONT_FAMILY.toLowerCase()) return null

  const fontSize = Number.parseFloat(style.fontSize)
  if (!finitePositive(fontSize)) return null

  const lineHeight = parseLineHeight(style.lineHeight, fontSize)
  if (lineHeight === null) return null

  const letterSpacing = parseLetterSpacing(style.letterSpacing)
  if (letterSpacing === null) return null

  if (style.whiteSpace !== 'normal') return null
  if (style.wordBreak !== 'normal') return null
  if (UNMODELLED_WRAP.test(style.textWrap)) return null
  if (!SUPPORTED_OVERFLOW_WRAP.has(style.overflowWrap.trim())) return null

  const lineBudget = parseLineBudget(style.lineBudget)
  if (lineBudget === null) return null

  const fontStyle = style.fontStyle.trim()
  const fontWeight = style.fontWeight.trim() || '400'
  const stylePrefix = fontStyle && fontStyle !== 'normal' ? `${fontStyle} ` : ''

  return {
    font: `${stylePrefix}${fontWeight} ${fontSize}px "${family}"`,
    fontFamily: family,
    fontSize,
    lineHeight,
    letterSpacing,
    whiteSpace: 'normal',
    wordBreak: 'normal',
    locale,
    lineBudget,
  }
}

/**
 * Line height in pixels.
 *
 * `normal` is refused: it resolves from font metrics the canvas shorthand does
 * not carry, so Pretext could not be told the same number. A bare number is
 * resolved against the font size, because some engines report the specified
 * value rather than the used pixels.
 */
function parseLineHeight(value: string, fontSize: number): number | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'normal') return null

  const parsed = Number.parseFloat(trimmed)
  if (!finitePositive(parsed)) return null
  if (trimmed.endsWith('px')) return parsed
  if (/^-?[\d.]+$/.test(trimmed)) return parsed * fontSize
  return null
}

/** Letter spacing in pixels, with `normal` meaning exactly zero. */
function parseLetterSpacing(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'normal') return 0
  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

/** The integer number of lines the CSS says this excerpt may occupy. */
function parseLineBudget(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed)) return null
  if (parsed < MIN_LINE_BUDGET || parsed > MAX_LINE_BUDGET) return null
  return parsed
}

/**
 * The key a prepared handle is cached under.
 *
 * Everything that changes what `prepareWithSegments()` produces is in here, and
 * nothing that does not. Width and line height are deliberately absent: layout
 * is the cheap reusable path, and keying preparation on width would throw the
 * expensive work away on every resize, which is the one thing Pretext's README
 * tells you not to do.
 */
export function preparedCacheKey(contract: FontContract, text: string): string {
  return [
    contract.font,
    contract.locale,
    contract.letterSpacing,
    contract.whiteSpace,
    contract.wordBreak,
    text,
  ].join('\0')
}

/** The contract plus the width it will be laid out at. */
export interface ExcerptGeometry {
  readonly contract: FontContract
  /** Content-box width in CSS pixels, padding and border already removed. */
  readonly width: number
}

function pixels(value: string): number {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Read the contract and the width off the element that will actually be
 * painted.
 *
 * Deliberately not "the styles we think we wrote": the cascade, a container
 * query, a user stylesheet or a browser default could all have had an opinion,
 * and Pretext has to be told what won. The width is the content box, computed
 * by removing padding and border from the border-box rectangle, so a stray
 * `padding-inline` could never be silently measured as space for text.
 */
export function readExcerptGeometry(element: HTMLElement, locale: string): ExcerptGeometry | null {
  if (typeof getComputedStyle !== 'function') return null
  const style = getComputedStyle(element)

  // `text-wrap-style` is the half of the shorthand that carries pretty and
  // balance; engines that predate it answer through the shorthand instead.
  const textWrap = [style.getPropertyValue('text-wrap-style'), style.getPropertyValue('text-wrap')]
    .join(' ')
    .trim()

  const contract = buildFontContract(
    {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontStyle: style.fontStyle,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      whiteSpace: style.whiteSpace,
      wordBreak: style.wordBreak,
      overflowWrap: style.overflowWrap,
      textWrap,
      lineBudget: style.getPropertyValue('--search-excerpt-lines'),
    },
    locale,
  )
  if (!contract) return null

  /*
   * `clientWidth`, not `getBoundingClientRect().width`.
   *
   * The rect is the *transformed* box, and the search panel arrives on a
   * `scale: 0.98 → 1` enter transition, so a measurement taken during that
   * transition reads about two per cent narrow and is then cached as the
   * layout width for the life of the result set. `clientWidth` is the layout
   * width, unaffected by any ancestor transform, so the fitter no longer
   * depends on when it happens to run. It already excludes the border, so
   * only the padding is subtracted here.
   */
  const width =
    element.clientWidth - pixels(style.paddingInlineStart) - pixels(style.paddingInlineEnd)

  return Number.isFinite(width) && width > 0 ? { contract, width } : null
}
