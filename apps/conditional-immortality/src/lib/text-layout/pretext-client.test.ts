import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FontContract } from './font-contract'
import { MEASURED_FONT_FAMILY } from './font-contract'
import { ensureMeasuredFont, resetTextLayoutRuntimeForTests } from './pretext-client'

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
  Reflect.deleteProperty(document, 'fonts')
  vi.restoreAllMocks()
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
