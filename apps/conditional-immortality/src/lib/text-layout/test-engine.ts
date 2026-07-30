import type { LineCursorRange, PreparedText, TextLayoutEngine } from './engine'

/**
 * A deterministic stand-in for Pretext, for unit tests only.
 *
 * jsdom has no font engine, so a unit test cannot ask the real Pretext how wide
 * `destruction` is and get an answer worth asserting on. What a unit test *can*
 * pin is the fitting algorithm: which window it picks, where it puts the
 * ellipses, how it adjusts the ranges, and that it stops. So this engine gives
 * every character the same width and breaks greedily at spaces, which is enough
 * to make all of that exactly predictable.
 *
 * Real Pretext geometry is validated where it can be validated honestly: in a
 * browser, against the real fonts, by the geometry suite.
 *
 * It segments the way Pretext does — alternating runs of whitespace and
 * non-whitespace, reassembling to exactly the input — so the cursor adapter is
 * exercised for real.
 */
export interface TestEngineOptions {
  /** Width of one character, in pixels. */
  readonly charWidth?: number
}

export interface CountingTextLayoutEngine extends TextLayoutEngine {
  /** How many times `prepare()` has been called. For bounding the fit loop. */
  prepareCount(): number
  resetCounts(): void
}

export function createTestLayoutEngine(options: TestEngineOptions = {}): CountingTextLayoutEngine {
  const charWidth = options.charWidth ?? 10
  let prepares = 0

  return {
    prepareCount: () => prepares,
    resetCounts: () => {
      prepares = 0
    },

    prepare(text: string): PreparedText | null {
      prepares += 1
      if (!text) return null

      const segments = text.match(/\s+|\S+/g) ?? []
      const widthOf = (segment: string) => segment.length * charWidth

      function linesAt(maxWidth: number): readonly LineCursorRange[] {
        const lines: LineCursorRange[] = []
        if (segments.length === 0) return lines

        let lineStart = 0
        let used = 0
        let usedTrimmed = 0

        for (let index = 0; index < segments.length; index += 1) {
          const segment = segments[index] ?? ''
          const isSpace = /^\s+$/.test(segment)
          if (isSpace) {
            used += widthOf(segment)
            continue
          }
          if (usedTrimmed > 0 && used + widthOf(segment) > maxWidth) {
            lines.push({
              start: { segmentIndex: lineStart, graphemeIndex: 0 },
              end: { segmentIndex: index, graphemeIndex: 0 },
              width: usedTrimmed,
            })
            lineStart = index
            used = widthOf(segment)
            usedTrimmed = used
            continue
          }
          used += widthOf(segment)
          usedTrimmed = used
        }

        lines.push({
          start: { segmentIndex: lineStart, graphemeIndex: 0 },
          end: { segmentIndex: segments.length, graphemeIndex: 0 },
          width: usedTrimmed,
        })
        return lines
      }

      return {
        text,
        segments,
        linesAt,
        lineCountAt: (maxWidth: number) => linesAt(maxWidth).length,
      }
    },
  }
}
