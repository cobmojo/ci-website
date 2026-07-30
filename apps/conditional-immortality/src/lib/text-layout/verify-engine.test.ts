import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PreparedText, TextLayoutEngine } from './engine'
import { buildFontContract, type ComputedTextStyle, type FontContract } from './font-contract'
import { engineAgreesWithBrowser, resetEngineVerificationForTests } from './verify-engine'

/**
 * The self-check, with layout stubbed.
 *
 * jsdom has no layout, so `getBoundingClientRect` is replaced with a rule as
 * simple as the one the test engine uses: every character is ten pixels wide.
 * That makes "the engine agrees with the browser" and "the engine is measuring
 * a different font" both exactly expressible, which is the whole point of the
 * check. Real engines against real fonts are the geometry suite's job.
 */

const STYLE: ComputedTextStyle = {
  fontFamily: '"Source Serif 4", serif',
  fontSize: '10px',
  fontStyle: 'normal',
  fontWeight: '400',
  lineHeight: '14px',
  letterSpacing: 'normal',
  whiteSpace: 'normal',
  wordBreak: 'normal',
  overflowWrap: 'break-word',
  textWrap: 'wrap',
  lineBudget: '2',
}

function contractWith(overrides: Partial<ComputedTextStyle> = {}): FontContract {
  const built = buildFontContract({ ...STYLE, ...overrides }, 'en')
  if (!built) throw new Error('the fixture contract must be valid')
  return built
}

const CHARACTER_WIDTH = 10
const SAFETY_MARGIN = 1

let originalRect: typeof Element.prototype.getBoundingClientRect

/** A browser that gives every character exactly ten pixels. */
function stubLayout(pixelsPerCharacter = CHARACTER_WIDTH) {
  Element.prototype.getBoundingClientRect = function stubbed(this: Element) {
    const length = (this.textContent ?? '').length
    return {
      width: length * pixelsPerCharacter,
      height: 14,
      top: 0,
      left: 0,
      right: length * pixelsPerCharacter,
      bottom: 14,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect
  }
}

/** An engine that measures at its own idea of a character width. */
function engineMeasuring(pixelsPerCharacter: number): TextLayoutEngine & { prepares: number[] } {
  const prepares: number[] = []
  return {
    prepares,
    prepare(text: string): PreparedText | null {
      prepares.push(1)
      const width = text.length * pixelsPerCharacter
      return {
        text,
        segments: [text],
        linesAt: () => [],
        lineCountAt: (maxWidth: number) => Math.max(1, Math.ceil(width / maxWidth)),
      }
    },
  }
}

beforeEach(() => {
  originalRect = Element.prototype.getBoundingClientRect
  resetEngineVerificationForTests()
})

afterEach(() => {
  Element.prototype.getBoundingClientRect = originalRect
  resetEngineVerificationForTests()
})

describe('verifying the engine against the browser', () => {
  it('accepts an engine that measures the way the browser lays out', () => {
    stubLayout()
    expect(
      engineAgreesWithBrowser(engineMeasuring(CHARACTER_WIDTH), contractWith(), SAFETY_MARGIN),
    ).toBe(true)
  })

  it('rejects an engine measuring in a different font', () => {
    // Six per cent narrow: the size of the Firefox OffscreenCanvas discrepancy
    // that this check exists to catch.
    stubLayout()
    expect(
      engineAgreesWithBrowser(
        engineMeasuring(CHARACTER_WIDTH * 0.94),
        contractWith(),
        SAFETY_MARGIN,
      ),
    ).toBe(false)
  })

  it('rejects an engine measuring wider than the browser', () => {
    stubLayout()
    expect(
      engineAgreesWithBrowser(
        engineMeasuring(CHARACTER_WIDTH * 1.06),
        contractWith(),
        SAFETY_MARGIN,
      ),
    ).toBe(false)
  })

  it('tolerates a disagreement inside the bracket', () => {
    // A probe of 44 characters at 10px is 440px; a quarter of a pixel per
    // character would be far outside the bracket, so the tolerated band is
    // deliberately tiny in relative terms.
    stubLayout()
    const almost = engineMeasuring(CHARACTER_WIDTH + 0.02)
    expect(engineAgreesWithBrowser(almost, contractWith(), SAFETY_MARGIN)).toBe(true)
  })

  it('refuses when the browser cannot measure at all', () => {
    // jsdom's own zero-size rectangles: no layout, no verdict, no enhancement.
    expect(
      engineAgreesWithBrowser(engineMeasuring(CHARACTER_WIDTH), contractWith(), SAFETY_MARGIN),
    ).toBe(false)
  })

  it('refuses when the engine declines to prepare', () => {
    stubLayout()
    expect(engineAgreesWithBrowser({ prepare: () => null }, contractWith(), SAFETY_MARGIN)).toBe(
      false,
    )
  })

  it('refuses when the engine throws', () => {
    stubLayout()
    const throwing: TextLayoutEngine = {
      prepare: () => {
        throw new Error('boom')
      },
    }
    expect(engineAgreesWithBrowser(throwing, contractWith(), SAFETY_MARGIN)).toBe(false)
  })

  it('leaves no probe element behind', () => {
    stubLayout()
    const before = document.body.childElementCount
    engineAgreesWithBrowser(engineMeasuring(CHARACTER_WIDTH), contractWith(), SAFETY_MARGIN)
    expect(document.body.childElementCount).toBe(before)
  })
})

describe('caching the verdict', () => {
  it('asks the engine once per contract, however many rows follow', () => {
    stubLayout()
    const engine = engineMeasuring(CHARACTER_WIDTH)
    const contract = contractWith()
    for (let i = 0; i < 5; i += 1) engineAgreesWithBrowser(engine, contract, SAFETY_MARGIN)
    expect(engine.prepares).toHaveLength(1)
  })

  it('re-checks when the contract changes', () => {
    stubLayout()
    const engine = engineMeasuring(CHARACTER_WIDTH)
    engineAgreesWithBrowser(engine, contractWith(), SAFETY_MARGIN)
    engineAgreesWithBrowser(engine, contractWith({ fontSize: '16px' }), SAFETY_MARGIN)
    expect(engine.prepares).toHaveLength(2)
  })

  it('does not re-check for a different line budget, which cannot change widths', () => {
    stubLayout()
    const engine = engineMeasuring(CHARACTER_WIDTH)
    engineAgreesWithBrowser(engine, contractWith(), SAFETY_MARGIN)
    engineAgreesWithBrowser(engine, contractWith({ lineBudget: '3' }), SAFETY_MARGIN)
    expect(engine.prepares).toHaveLength(1)
  })

  it('caches a refusal too, so a bad engine is not re-probed on every keystroke', () => {
    stubLayout()
    const engine = engineMeasuring(CHARACTER_WIDTH * 0.94)
    const contract = contractWith()
    expect(engineAgreesWithBrowser(engine, contract, SAFETY_MARGIN)).toBe(false)
    expect(engineAgreesWithBrowser(engine, contract, SAFETY_MARGIN)).toBe(false)
    expect(engine.prepares).toHaveLength(1)
  })

  it('forgets everything on reset', () => {
    stubLayout()
    const engine = engineMeasuring(CHARACTER_WIDTH)
    const contract = contractWith()
    engineAgreesWithBrowser(engine, contract, SAFETY_MARGIN)
    resetEngineVerificationForTests()
    engineAgreesWithBrowser(engine, contract, SAFETY_MARGIN)
    expect(engine.prepares).toHaveLength(2)
  })
})
