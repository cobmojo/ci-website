import type { PreparedText, TextLayoutEngine } from './engine'
import { type FontContract, MEASURED_FONT_FAMILY, preparedCacheKey } from './font-contract'
import { createPreparedTextCache, type PreparedTextCache } from './prepared-text-cache'

/**
 * The application's boundary onto Pretext.
 *
 * Three jobs, all of them about *when*: load the engine no earlier than a
 * reader shows search intent, load it no more than once, and refuse to measure
 * until the font that will actually be painted has arrived.
 *
 * Nothing here touches `window`, `document` or a canvas at module scope, so the
 * file is safe to evaluate anywhere — it just answers "no" to everything when
 * there is no browser.
 */

/** How long to wait for the measured face before giving up on enhancement. */
const FONT_TIMEOUT_MS = 3_000

let enginePromise: Promise<TextLayoutEngine | null> | null = null
let preparedCache: PreparedTextCache<PreparedText> = createPreparedTextCache<PreparedText>()
const fontPromises = new Map<string, Promise<boolean>>()

/** `Intl.Segmenter` and a 2D canvas are Pretext's stated runtime requirements. */
export function hasLayoutRuntimeSupport(): boolean {
  if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return false
  if (typeof document === 'undefined') return false
  try {
    return document.createElement('canvas').getContext('2d') !== null
  } catch {
    return false
  }
}

/**
 * Load the engine, at most once per page.
 *
 * The import is a native dynamic `import()` of an application module, which is
 * what puts Pretext in its own chunk. The promise is cached, so twelve results
 * arriving at once issue one request between them, and a failure is cached as
 * `null` rather than retried on every keystroke.
 */
export function loadTextLayoutEngine(locale = 'en'): Promise<TextLayoutEngine | null> {
  enginePromise ??= (async () => {
    if (!hasLayoutRuntimeSupport()) return null
    try {
      const runtime = await import('./pretext-runtime')
      return withPreparationCache(runtime.createPretextEngine(locale))
    } catch {
      // A failed chunk request, a parse error, anything: search still works.
      return null
    }
  })()
  return enginePromise
}

/**
 * Memoise preparation across widths and re-renders.
 *
 * Pretext's README is explicit that `prepare()` is the expensive half and must
 * not be re-run when only the width changed. The fitting algorithm calls
 * `prepare` freely — for the candidate, and again for each ellipsised
 * substring it probes — so the cache is what makes that free on the second and
 * every later pass.
 */
function withPreparationCache(engine: TextLayoutEngine): TextLayoutEngine {
  return {
    prepare(text: string, contract: FontContract): PreparedText | null {
      const key = preparedCacheKey(contract, text)
      const cached = preparedCache.get(key)
      if (cached) return cached

      const prepared = engine.prepare(text, contract)
      if (prepared) preparedCache.set(key, prepared)
      return prepared
    },
  }
}

/**
 * Wait for the exact named face, not merely for something to render with.
 *
 * The site serves its fonts with `font-display: swap`, so between first paint
 * and the woff2 arriving the excerpt is drawn in a fallback serif with entirely
 * different metrics. Measuring then and painting later is how a fitted excerpt
 * ends up one line too tall.
 *
 * `document.fonts.load()` is used rather than `check()` because `check()` will
 * happily report true for a fallback that can render the sample text. The
 * resolved `FontFace` objects are inspected instead: the intended family has to
 * be among them, and it has to have actually loaded.
 *
 * One promise per font specification, shared by every row on the page.
 */
export function ensureMeasuredFont(contract: FontContract, sampleText: string): Promise<boolean> {
  const key = contract.font
  const existing = fontPromises.get(key)
  if (existing) return existing

  const promise = (async () => {
    if (typeof document === 'undefined' || !document.fonts) return false
    try {
      const faces = await withTimeout(
        document.fonts.load(contract.font, sampleText || MEASURED_FONT_FAMILY),
        FONT_TIMEOUT_MS,
      )
      if (faces === null) return false
      return faces.some(
        face =>
          face.family.replace(/^["']|["']$/g, '').toLowerCase() ===
            MEASURED_FONT_FAMILY.toLowerCase() && face.status === 'loaded',
      )
    } catch {
      // A 404, a blocked request, a browser that rejects: keep the fallback.
      return false
    }
  })()

  fontPromises.set(key, promise)
  return promise
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise<T | null>(resolve => {
    const timer = setTimeout(() => resolve(null), ms)
    promise.then(
      value => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
    )
  })
}

/**
 * Drop every cached promise and prepared handle.
 *
 * For tests that need a cold start. Deliberately not called during typing or
 * resizing, and it never calls Pretext's own `clearCache()`: that would discard
 * measurements shared by every prepared handle on the page.
 */
export function resetTextLayoutRuntimeForTests(): void {
  enginePromise = null
  preparedCache = createPreparedTextCache<PreparedText>()
  fontPromises.clear()
}
