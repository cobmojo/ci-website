import { measureLineStats, prepareWithSegments, setLocale, walkLineRanges } from '@chenglou/pretext'
import type { LineCursorRange, PreparedText, TextLayoutEngine } from './engine'
import type { FontContract } from './font-contract'

/**
 * The only module in the application that imports Pretext.
 *
 * It is reached exclusively through a dynamic `import()` in `pretext-client`,
 * so the bundler puts it — and Pretext with it — in a chunk that an article
 * page never requests. Nothing else may import this file statically, or that
 * boundary quietly disappears.
 *
 * Everything below is confined to the public API: `prepareWithSegments` for the
 * one-time analysis, `walkLineRanges` and `measureLineStats` for the cheap
 * re-runnable layout, and the documented `segments` property for cursor
 * mapping. No private array is touched.
 */

/**
 * A string the built chunk can be found by.
 *
 * The bundle-boundary test needs to know which built file carries this code,
 * and hashed chunk names are not something a test should be guessing at. So it
 * greps the production output for this marker instead, and watches for that
 * exact file being requested.
 */
export const PRETEXT_RUNTIME_MARKER = 'ci-pretext-text-layout-runtime-v1'

/**
 * The locale is set exactly once, on first load.
 *
 * `setLocale()` clears Pretext's shared measurement caches as a side effect, so
 * calling it again later would throw away work that every prepared candidate on
 * the page depends on. The site is English throughout and the measured contract
 * is Latin prose, so one call at module init is both correct and sufficient.
 */
let localeInitialised = false

export function createPretextEngine(locale: string): TextLayoutEngine {
  if (!localeInitialised) {
    setLocale(locale)
    localeInitialised = true
  }

  return {
    prepare(text: string, contract: FontContract): PreparedText | null {
      if (!text) return null
      try {
        const prepared = prepareWithSegments(text, contract.font, {
          whiteSpace: contract.whiteSpace,
          wordBreak: contract.wordBreak,
          letterSpacing: contract.letterSpacing,
        })

        return {
          text,
          segments: prepared.segments,

          linesAt(maxWidth: number): readonly LineCursorRange[] {
            const lines: LineCursorRange[] = []
            // The callback's argument is Pretext's own object; copy the cursors
            // rather than retaining whatever it does with them afterwards.
            walkLineRanges(prepared, maxWidth, line => {
              lines.push({
                start: {
                  segmentIndex: line.start.segmentIndex,
                  graphemeIndex: line.start.graphemeIndex,
                },
                end: { segmentIndex: line.end.segmentIndex, graphemeIndex: line.end.graphemeIndex },
                width: line.width,
              })
            })
            return lines
          },

          lineCountAt(maxWidth: number): number {
            return measureLineStats(prepared, maxWidth).lineCount
          },
        }
      } catch {
        // Preparation is best-effort. A throw here means the reader keeps the
        // ordinary excerpt, which is a perfectly good result.
        return null
      }
    },
  }
}
