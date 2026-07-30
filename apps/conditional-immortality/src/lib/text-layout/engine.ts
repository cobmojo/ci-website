import type { LayoutCursorLike } from './cursor-source-map'
import type { FontContract } from './font-contract'

/**
 * The slice of a text layout engine this application actually uses.
 *
 * Pretext is behind this interface and nothing else in the application imports
 * it. That keeps the dependency to one adapter module, lets every unit test run
 * against a deterministic stand-in instead of pretending jsdom has a font
 * engine, and means a future engine change is a change to one file.
 *
 * The shape mirrors Pretext's own division of labour: `prepare` does the
 * expensive analysis and measurement once, and everything after it is cheap
 * arithmetic that may be re-run at any width.
 */

/** One wrapped line, as the segment/grapheme cursors Pretext works in. */
export interface LineCursorRange {
  readonly start: LayoutCursorLike
  /** Exclusive, as Pretext defines it. */
  readonly end: LayoutCursorLike
  readonly width: number
}

export interface PreparedText {
  /** Exactly the text that was prepared. */
  readonly text: string
  /** The public prepared segment stream, which must reassemble to `text`. */
  readonly segments: readonly string[]
  /** Wrapped lines at a width. Cheap: no preparation is repeated. */
  linesAt(maxWidth: number): readonly LineCursorRange[]
  /** Line count alone, avoiding the line allocations when they are not needed. */
  lineCountAt(maxWidth: number): number
}

export interface TextLayoutEngine {
  /**
   * Analyse and measure text under a typography contract.
   *
   * Returns `null` when the engine cannot do it — a missing canvas, a font that
   * has not loaded, anything at all. A `null` here means the reader keeps the
   * ordinary fallback excerpt, which is a perfectly good outcome.
   */
  prepare(text: string, contract: FontContract): PreparedText | null
}
