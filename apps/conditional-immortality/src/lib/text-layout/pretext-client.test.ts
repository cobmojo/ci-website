import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FontContract } from './font-contract'
import { MEASURED_FONT_FAMILY } from './font-contract'
import {
  ensureMeasuredFont,
  loadTextLayoutEngine,
  resetTextLayoutRuntimeForTests,
} from './pretext-client'
import type { CountingTextLayoutEngine } from './test-engine'

/**
 * The runtime module is the only thing standing between this file and Pretext
 * itself, so it is replaced with the deterministic counting engine the rest of
 * the unit tests use. Capturing the instance is what lets a test see how many
 * preparations actually reached the engine, rather than how many were asked
 * for — which is the whole point of the cache under test.
 */
const runtimeModule = vi.hoisted(() => ({
  engine: null as CountingTextLayoutEngine | null,
}))

vi.mock('./pretext-runtime', async () => {
  const { createTestLayoutEngine } = await import('./test-engine')
  return {
    createPretextEngine: () => {
      runtimeModule.engine = createTestLayoutEngine()
      return runtimeModule.engine
    },
  }
})

/**
 * Font readiness, which is the gate that decides whether Pretext is allowed to
 * measure anything at all.
 *
 * The interesting property is not "does it wait" — it is *what it is waiting
 * for*. Source Serif is split by `unicode-range`, so "the font is ready" is
 * only ever true of the subsets the sample text needed. An answer cached for
 * one sample must not be handed to a sample that needs a face nobody has
 * requested yet.
 */

const CONTRACT: FontContract = {
  font: '400 1rem/1.5 "Source Serif 4", Georgia, serif',
  fontFamily: '"Source Serif 4", Georgia, serif',
  fontSize: 16,
  lineHeight: 24,
  letterSpacing: 0,
  whiteSpace: 'normal',
  wordBreak: 'normal',
  locale: 'en',
  lineBudget: 2,
}

interface StubbedFonts {
  readonly samples: string[]
}

function stubFontFaceSet(): StubbedFonts {
  const samples: string[] = []
  const load = vi.fn(async (_font: string, text: string) => {
    samples.push(text)
    return [{ family: MEASURED_FONT_FAMILY, status: 'loaded' }]
  })
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { load },
  })
  return { samples }
}

afterEach(() => {
  resetTextLayoutRuntimeForTests()
  runtimeModule.engine = null
  Reflect.deleteProperty(document, 'fonts')
  vi.restoreAllMocks()
})

/**
 * The preparation cache, pinned where it actually lives.
 *
 * `withPreparationCache` is applied inside `loadTextLayoutEngine` and nowhere
 * else, so a test that injects its own engine — as every component test does —
 * cannot see it. Without this block, deleting the wrapper leaves the whole
 * suite green while a resize silently re-measures every row.
 */
describe('loadTextLayoutEngine', () => {
  const SAMPLE = 'The wages of sin is death, and the gift of God is eternal life.'

  function withCanvas() {
    // jsdom has no 2D context. The support probe only asks whether one exists.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      {} as CanvasRenderingContext2D,
    )
  }

  it('prepares once for repeated calls with the same text and contract', async () => {
    withCanvas()
    const engine = await loadTextLayoutEngine()
    expect(engine).not.toBeNull()

    engine?.prepare(SAMPLE, CONTRACT)
    engine?.prepare(SAMPLE, CONTRACT)
    engine?.prepare(SAMPLE, CONTRACT)

    // This is what makes a resize cheap: width is not part of preparation, so
    // laying the same text out at a second width must reach the engine zero
    // extra times.
    expect(runtimeModule.engine?.prepareCount()).toBe(1)
  })

  it('does not reuse a preparation for different text', async () => {
    withCanvas()
    const engine = await loadTextLayoutEngine()
    engine?.prepare(SAMPLE, CONTRACT)
    engine?.prepare(`${SAMPLE} And the second death has no power.`, CONTRACT)
    expect(runtimeModule.engine?.prepareCount()).toBe(2)
  })

  it('does not reuse a preparation across anything that changes measurement', async () => {
    withCanvas()
    const engine = await loadTextLayoutEngine()
    engine?.prepare(SAMPLE, CONTRACT)
    engine?.prepare(SAMPLE, { ...CONTRACT, letterSpacing: 0.4 })
    engine?.prepare(SAMPLE, { ...CONTRACT, font: '400 1.5rem/1.5 "Source Serif 4", serif' })
    expect(runtimeModule.engine?.prepareCount()).toBe(3)
  })

  it('reuses a preparation when only the line budget and height changed', async () => {
    withCanvas()
    const engine = await loadTextLayoutEngine()
    engine?.prepare(SAMPLE, CONTRACT)
    // Line height and budget are layout, not preparation. Keying on them would
    // throw the expensive work away every time the container query flipped.
    engine?.prepare(SAMPLE, { ...CONTRACT, lineHeight: 36, lineBudget: 3 })
    expect(runtimeModule.engine?.prepareCount()).toBe(1)
  })

  it('loads the runtime once however many callers ask at once', async () => {
    withCanvas()
    const [first, second] = await Promise.all([loadTextLayoutEngine(), loadTextLayoutEngine()])
    expect(first).toBe(second)
    expect(first).not.toBeNull()
  })

  it('answers null rather than throwing where there is no canvas', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    await expect(loadTextLayoutEngine()).resolves.toBeNull()
  })
})

describe('ensureMeasuredFont', () => {
  it('shares one request between samples needing the same subsets', async () => {
    const fonts = stubFontFaceSet()

    await Promise.all([
      ensureMeasuredFont(CONTRACT, 'the second death'),
      ensureMeasuredFont(CONTRACT, 'a wholly different ASCII sentence'),
    ])

    expect(fonts.samples).toHaveLength(1)
  })

  it('does not answer for a subset it never waited on', async () => {
    const fonts = stubFontFaceSet()

    await ensureMeasuredFont(CONTRACT, 'destruction of body and soul')
    await ensureMeasuredFont(CONTRACT, 'the Septuagint renders it āpōleia')

    // The second sample needs the Latin Extended face. Reusing the first
    // answer would report "ready" for a woff2 that has not been asked for,
    // and Pretext would measure that row in whatever the platform substituted.
    expect(fonts.samples).toHaveLength(2)
    expect(fonts.samples[1]).toContain('āpōleia')
  })

  it('waits again for text outside the Latin ranges', async () => {
    const fonts = stubFontFaceSet()

    await ensureMeasuredFont(CONTRACT, 'plain ascii')
    await ensureMeasuredFont(CONTRACT, 'ψυχή')

    expect(fonts.samples).toHaveLength(2)
  })

  it('is false when the named family is not among the resolved faces', async () => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: async () => [{ family: 'Georgia', status: 'loaded' }] },
    })

    await expect(ensureMeasuredFont(CONTRACT, 'the second death')).resolves.toBe(false)
  })

  it('is false when the named family resolved but has not loaded', async () => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: async () => [{ family: MEASURED_FONT_FAMILY, status: 'unloaded' }] },
    })

    await expect(ensureMeasuredFont(CONTRACT, 'the second death')).resolves.toBe(false)
  })

  it('is false, not a rejection, when the font set throws', async () => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        load: () => {
          throw new Error('blocked')
        },
      },
    })

    await expect(ensureMeasuredFont(CONTRACT, 'the second death')).resolves.toBe(false)
  })
})
