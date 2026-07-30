import { layout, prepare, setLocale } from '@chenglou/pretext'

/**
 * Pretext, running in the page, for tests only.
 *
 * This file is never imported by the application. It is bundled separately at
 * test time, written to a temporary directory outside the repository, and
 * injected into the page with `addScriptTag`. Nothing about it reaches
 * `public/`, a route, or the production client bundle — which is the point:
 * the site must not ship a diagnostic surface just so it can be tested.
 *
 * The API it exposes is deliberately one function. The test asks "how many
 * lines, and how tall" and gets an answer; every decision about which text to
 * ask about, and what to compare the answer to, stays in the spec.
 */

export interface GeometryRequest {
  readonly text: string
  /** Canvas font shorthand, exactly as the production contract builds it. */
  readonly font: string
  readonly letterSpacing: number
  readonly maxWidth: number
  readonly lineHeight: number
}

export interface GeometryResult {
  readonly lineCount: number
  readonly height: number
}

declare global {
  interface Window {
    __ciPretextGeometry?: (request: GeometryRequest) => GeometryResult
    __ciPretextHarnessReady?: boolean
  }
}

// The production runtime sets the locale exactly once, before any preparation.
// The harness has to make the same call or it would be measuring under a
// different segmentation than the site does.
setLocale('en')

window.__ciPretextGeometry = ({ text, font, letterSpacing, maxWidth, lineHeight }) => {
  const prepared = prepare(text, font, {
    whiteSpace: 'normal',
    wordBreak: 'normal',
    letterSpacing,
  })
  const { lineCount, height } = layout(prepared, maxWidth, lineHeight)
  // Pretext reports an empty string as zero lines; a browser still gives an
  // empty block one line box. The site's own clamp does the same.
  return { lineCount: Math.max(1, lineCount), height: Math.max(lineHeight, height) }
}

window.__ciPretextHarnessReady = true
