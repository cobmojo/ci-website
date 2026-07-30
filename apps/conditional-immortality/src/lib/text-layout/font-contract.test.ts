import { describe, expect, it } from 'vitest'
import { buildFontContract, type ComputedTextStyle, preparedCacheKey } from './font-contract'

/** The values the production stylesheet actually resolves to. */
const PRODUCTION: ComputedTextStyle = {
  fontFamily: '"Source Serif 4", ui-serif, Georgia, "Times New Roman", serif',
  fontSize: '14.4px',
  fontStyle: 'normal',
  fontWeight: '400',
  lineHeight: '20.16px',
  letterSpacing: 'normal',
  whiteSpace: 'normal',
  wordBreak: 'normal',
  overflowWrap: 'break-word',
  textWrap: 'wrap',
  lineBudget: '2',
}

function contract(overrides: Partial<ComputedTextStyle> = {}) {
  return buildFontContract({ ...PRODUCTION, ...overrides }, 'en')
}

describe('reading the production contract', () => {
  it('extracts the named family, not the platform alias behind it', () => {
    expect(contract()?.fontFamily).toBe('Source Serif 4')
  })

  it('builds a canvas font string Pretext can use', () => {
    expect(contract()?.font).toBe('400 14.4px "Source Serif 4"')
  })

  it('includes a non-normal style in the canvas font string', () => {
    expect(contract({ fontStyle: 'italic', fontWeight: '600' })?.font).toBe(
      'italic 600 14.4px "Source Serif 4"',
    )
  })

  it('reads numeric font size, line height and line budget', () => {
    const result = contract()
    expect(result?.fontSize).toBe(14.4)
    expect(result?.lineHeight).toBeCloseTo(20.16, 5)
    expect(result?.lineBudget).toBe(2)
  })

  it('reads a three-line budget at the wider container size', () => {
    expect(contract({ lineBudget: '3' })?.lineBudget).toBe(3)
  })

  it('tolerates whitespace around the line-budget custom property', () => {
    expect(contract({ lineBudget: ' 3 ' })?.lineBudget).toBe(3)
  })

  it('translates letter-spacing: normal to numeric zero', () => {
    expect(contract()?.letterSpacing).toBe(0)
  })

  it('reads a real letter-spacing value as pixels', () => {
    expect(contract({ letterSpacing: '0.32px' })?.letterSpacing).toBeCloseTo(0.32, 5)
    expect(contract({ letterSpacing: '-0.1px' })?.letterSpacing).toBeCloseTo(-0.1, 5)
  })

  it('resolves a unitless line height against the font size', () => {
    // Some engines report the specified number rather than the used pixels.
    expect(contract({ lineHeight: '1.4' })?.lineHeight).toBeCloseTo(14.4 * 1.4, 5)
  })

  it('carries the modes Pretext is given, so the two cannot drift', () => {
    const result = contract()
    expect(result?.whiteSpace).toBe('normal')
    expect(result?.wordBreak).toBe('normal')
  })
})

describe('contracts that must be declined', () => {
  it.each([
    ['a missing family', { fontFamily: '' }],
    ['a platform alias first', { fontFamily: 'ui-serif, Georgia, serif' }],
    ['system-ui', { fontFamily: 'system-ui, sans-serif' }],
    ['the fallback serif because the face has not loaded', { fontFamily: 'Georgia, serif' }],
    ['Inter rather than the serif', { fontFamily: 'Inter, sans-serif' }],
    ['a zero font size', { fontSize: '0px' }],
    ['a missing font size', { fontSize: '' }],
    ['line-height: normal', { lineHeight: 'normal' }],
    ['a zero line height', { lineHeight: '0px' }],
    ['a negative line height', { lineHeight: '-4px' }],
    ['an unparseable line height', { lineHeight: 'inherit' }],
    ['a missing line budget', { lineBudget: '' }],
    ['a zero line budget', { lineBudget: '0' }],
    ['a fractional line budget', { lineBudget: '2.5' }],
    ['an unparseable line budget', { lineBudget: 'two' }],
    ['an implausible line budget', { lineBudget: '99' }],
    ['white-space: pre-wrap', { whiteSpace: 'pre-wrap' }],
    ['white-space: nowrap', { whiteSpace: 'nowrap' }],
    ['word-break: break-all', { wordBreak: 'break-all' }],
    ['word-break: keep-all', { wordBreak: 'keep-all' }],
    ['text-wrap: pretty', { textWrap: 'pretty' }],
    ['text-wrap: balance', { textWrap: 'balance' }],
    ['overflow-wrap: anywhere', { overflowWrap: 'anywhere' }],
  ])('declines %s', (_label, overrides) => {
    expect(contract(overrides)).toBeNull()
  })

  it('accepts the several spellings engines use for ordinary wrapping', () => {
    for (const textWrap of ['wrap', 'normal', 'auto', '']) {
      expect(contract({ textWrap })).not.toBeNull()
    }
  })

  it('accepts overflow-wrap: normal as well as break-word', () => {
    expect(contract({ overflowWrap: 'normal' })).not.toBeNull()
  })

  it('matches the family name case-insensitively and unquoted', () => {
    expect(contract({ fontFamily: 'source serif 4, serif' })).not.toBeNull()
    expect(contract({ fontFamily: "'Source Serif 4', serif" })).not.toBeNull()
  })
})

describe('the preparation cache key', () => {
  const base = contract()

  it('covers everything that changes preparation semantics', () => {
    expect(base).not.toBeNull()
    if (!base) return
    const key = preparedCacheKey(base, 'the fire is not quenched')
    expect(key).toContain('the fire is not quenched')
    expect(key).toContain('400 14.4px "Source Serif 4"')
    expect(key).toContain('en')
    expect(key).toContain('normal')
  })

  it('separates two different candidate texts', () => {
    if (!base) return
    expect(preparedCacheKey(base, 'one')).not.toBe(preparedCacheKey(base, 'two'))
  })

  it.each([
    ['font size', { fontSize: '16px' }],
    ['weight', { fontWeight: '600' }],
    ['style', { fontStyle: 'italic' }],
    ['letter spacing', { letterSpacing: '0.4px' }],
  ])('separates a different %s', (_label, overrides) => {
    const other = contract(overrides)
    expect(other).not.toBeNull()
    if (!base || !other) return
    expect(preparedCacheKey(other, 'same text')).not.toBe(preparedCacheKey(base, 'same text'))
  })

  it('separates a different locale', () => {
    const other = buildFontContract(PRODUCTION, 'de')
    expect(other).not.toBeNull()
    if (!base || !other) return
    expect(preparedCacheKey(other, 'same text')).not.toBe(preparedCacheKey(base, 'same text'))
  })

  it('does not include width or line height, because layout is the reusable path', () => {
    if (!base) return
    const narrow = preparedCacheKey(base, 'same text')
    const wide = preparedCacheKey({ ...base, lineBudget: 3 }, 'same text')
    expect(narrow).toBe(wide)
    expect(narrow).not.toContain('20.16')
  })

  it('is stable across calls', () => {
    if (!base) return
    expect(preparedCacheKey(base, 'stable')).toBe(preparedCacheKey(base, 'stable'))
  })
})
