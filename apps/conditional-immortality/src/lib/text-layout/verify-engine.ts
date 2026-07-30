import type { TextLayoutEngine } from './engine'
import type { FontContract } from './font-contract'

/**
 * Ask the engine something the browser has already answered.
 *
 * Everything else in this integration checks that the *inputs* are right: the
 * named font is loaded, the contract is one Pretext models, the text is a
 * script the self-hosted subsets cover. This checks the output. Once per font
 * contract, a probe paragraph is laid out by the browser and predicted by the
 * engine, and if the two disagree the enhancement is switched off.
 *
 * It exists because a real engine really does disagree. Pretext 0.0.8 measures
 * through `OffscreenCanvas` where one is available, and in Firefox an
 * `OffscreenCanvas` does not resolve the document's `@font-face` rules — so it
 * measures web-font text in a substituted font and predicts confidently wrong
 * line counts. Every input check passes; only the answer is wrong.
 *
 * A check on inputs can only catch the failures someone thought of. This one
 * catches the rest, including whatever the next engine or the next version of
 * Pretext does differently.
 */

/**
 * The probe.
 *
 * One line of the site's own vocabulary and punctuation, so it exercises the
 * glyphs the excerpts do. Short deliberately: the check below is about how wide
 * this text is, and a single line makes that unambiguous.
 */
const PROBE_TEXT = 'Searching happens in your browser, so nothing'

/**
 * How far the engine's idea of the probe's width may sit from the browser's.
 *
 * Two CSS pixels. Chromium and WebKit come within a hundredth of a pixel of
 * their own layout; an engine measuring in the wrong font is out by tens. There
 * is nothing in between to worry about, and the bracket has to be at least as
 * wide as the fitter's own safety margin.
 */
const WIDTH_TOLERANCE = 2

const results = new Map<string, boolean>()

function probeKey(contract: FontContract): string {
  return `${contract.font}|${contract.lineHeight}|${contract.letterSpacing}`
}

/**
 * The width the browser really gives the probe on one line.
 *
 * Offscreen but rendered — a hidden element has no line boxes. The typography
 * comes from the same canvas font shorthand the engine is given, which is also
 * a valid CSS `font` shorthand, so there is no second description of the
 * contract that could drift from the first.
 */
function browserWidth(contract: FontContract): number | null {
  if (typeof document === 'undefined' || !document.body) return null

  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.position = 'absolute'
  probe.style.insetInlineStart = '-10000px'
  probe.style.insetBlockStart = '0'
  probe.style.inlineSize = 'max-content'
  probe.style.whiteSpace = 'pre'
  probe.style.font = contract.font
  probe.style.letterSpacing = `${contract.letterSpacing}px`
  probe.style.padding = '0'
  probe.style.border = '0'
  probe.textContent = PROBE_TEXT

  document.body.appendChild(probe)
  const width = probe.getBoundingClientRect().width
  probe.remove()

  return Number.isFinite(width) && width > 0 ? width : null
}

/**
 * Whether this engine may be trusted for this contract.
 *
 * The question asked is the sharpest available: how wide does the engine think
 * this text is? It is answered without the engine exposing a width, by bracketing
 * — a column two pixels wider than the browser needs must hold the probe on one
 * line, and a column two pixels narrower must not. An engine measuring in a
 * substituted font fails the second half immediately, which a line-count
 * comparison can miss whenever the two fonts happen to wrap the same number of
 * times.
 */
export function engineAgreesWithBrowser(
  engine: TextLayoutEngine,
  contract: FontContract,
  safetyMargin: number,
): boolean {
  const key = probeKey(contract)
  const cached = results.get(key)
  if (cached !== undefined) return cached

  let agrees = false
  try {
    const width = browserWidth(contract)
    const prepared = engine.prepare(PROBE_TEXT, contract)
    if (width !== null && prepared) {
      const bracket = Math.max(WIDTH_TOLERANCE, safetyMargin + 1)
      const fitsWhenRoomy = prepared.lineCountAt(width + bracket) === 1
      const wrapsWhenTight = prepared.lineCountAt(width - bracket) >= 2
      agrees = fitsWhenRoomy && wrapsWhenTight
    }
  } catch {
    agrees = false
  }

  results.set(key, agrees)
  return agrees
}

/** Forget every verdict. For tests that need a cold start. */
export function resetEngineVerificationForTests(): void {
  results.clear()
}
