import { describe, expect, it } from 'vitest'
import { excerptTextEligibility, isEligibleExcerptText } from './supported-text'

function reason(text: string): string | undefined {
  return excerptTextEligibility(text).reason
}

describe('eligible text', () => {
  it.each([
    ['ordinary English prose', 'The worm that does not die and the fire that is not quenched.'],
    ['a curly apostrophe', 'The soul’s destruction is final.'],
    ['curly quotation marks', '“Eternal punishment” names a result, not an activity.'],
    ['an em dash', 'The punishment is destruction — not endless punishing.'],
    ['an en dash', 'Mark 9:42–48 is the primary passage.'],
    ['a mathematical minus sign', 'A net outcome of −3 on that reckoning.'],
    ['a Scripture reference', 'Matthew 10:28 and Luke 12:4-5 say the same thing.'],
    ['a Latin transliteration', 'The adjective aionios qualifies the noun it modifies.'],
    ['Latin Extended letters', 'Ēxēmplum with macrons and Ẓ from Latin Extended Additional.'],
    ['a long theological word', 'Evangelical conditionalism and annihilationism overlap.'],
    ['accented Latin', 'Café, naïve, Zürich, Åland and Señor all render locally.'],
    ['digits and section ids', 'Section S04 follows RB2 and precedes APP1.'],
    ['ordinary punctuation runs', 'He asked, “Is it destruction?” — and answered it.'],
    ['a single word', 'destruction'],
    ['a colon and semicolon', 'One point: the soul dies; the body dies too.'],
    ['an ampersand and percent', 'Body & soul, 40% of the case.'],
    ['a hyphenated compound', 'The body-soul question is not a side issue.'],
  ])('accepts %s', (_label, text) => {
    expect(excerptTextEligibility(text)).toEqual({ eligible: true })
    expect(isEligibleExcerptText(text)).toBe(true)
  })
})

describe('scripts the self-hosted subsets do not cover', () => {
  it.each([
    ['Greek', 'The adjective αἰώνιος qualifies its noun.'],
    ['Hebrew', 'The word נפש means a living creature.'],
    ['Arabic', 'The phrase الروح appears here.'],
    ['CJK ideographs', 'The rendering 春天到了 appears here.'],
    ['Hiragana', 'The rendering ひらがな appears here.'],
    ['Katakana', 'The rendering カタカナ appears here.'],
    ['Hangul', 'The rendering 한글 appears here.'],
    ['Cyrillic', 'The rendering Кириллица appears here.'],
    ['Devanagari', 'The rendering देवनागरी appears here.'],
    ['astral letters', 'Mathematical 𝔄𝔟 letters appear here.'],
  ])('declines %s', (_label, text) => {
    expect(reason(text)).toBe('uncovered-script')
    expect(isEligibleExcerptText(text)).toBe(false)
  })
})

describe('input classes with known layout instability', () => {
  it('declines emoji', () => {
    expect(reason('A rocket 🚀 appears here.')).toBe('emoji')
  })

  it('declines an extended pictograph', () => {
    expect(reason('A warning ⚠️ appears here.')).toBe('emoji')
  })

  it('declines a zero-width joiner sequence', () => {
    expect(reason('A family 👨‍👩‍👧‍👦 appears here.')).toBe('emoji')
  })

  it('declines a bare zero-width joiner', () => {
    expect(reason('joined‍text')).toBe('zero-width')
  })

  it('declines a zero-width space', () => {
    // Pretext issue #210: a leading ZWSP is consumed at line start and the
    // line count comes out one short of what a browser produces.
    expect(reason('zero​width')).toBe('zero-width')
  })

  it('declines a zero-width non-joiner and a word joiner', () => {
    expect(reason('a‌b')).toBe('zero-width')
    expect(reason('a⁠b')).toBe('zero-width')
  })

  it('declines a variation selector', () => {
    expect(reason('text️here')).toBe('variation-selector')
  })

  it('declines bidirectional control characters', () => {
    expect(reason('a‮b')).toBe('bidi-control')
    expect(reason('a‏b')).toBe('bidi-control')
    expect(reason('a⁦b⁩')).toBe('bidi-control')
  })

  it('declines a soft hyphen', () => {
    // Pretext materialises a chosen soft-hyphen break as a visible trailing
    // hyphen, so the fitted text would stop being a slice of the source.
    expect(reason('anni­hilationism')).toBe('soft-hyphen')
  })

  it('declines a hard line break or a tab', () => {
    expect(reason('one\ntwo')).toBe('hard-break')
    expect(reason('one\ttwo')).toBe('hard-break')
    expect(reason('one\r\ntwo')).toBe('hard-break')
  })

  it('declines a degenerate repeated-symbol run', () => {
    // Pretext issue #206: repeated symbol runs break differently from browsers.
    expect(reason('a ,,,, b')).toBe('repeated-symbol-run')
    expect(reason('a |||| b')).toBe('repeated-symbol-run')
    expect(reason('a \\\\\\\\ b')).toBe('repeated-symbol-run')
    expect(reason('a ][][ b')).toBe('repeated-symbol-run')
  })

  it('declines an extremely long unbroken token', () => {
    expect(reason(`see ${'a'.repeat(40)} here`)).toBe('long-token')
    expect(reason('https://example.com/a/very/long/path/that/never/breaks/anywhere')).toBe(
      'long-token',
    )
  })

  it('declines empty and whitespace-only text', () => {
    expect(reason('')).toBe('empty')
    expect(reason('   ')).toBe('empty')
  })

  it('declines a C0 control character', () => {
    expect(reason(String.fromCharCode(97, 0, 98))).toBe('control-character')
    expect(reason(String.fromCharCode(97, 7, 98))).toBe('control-character')
  })
})

describe('boundaries of the rules', () => {
  it('allows a punctuation run of three but not four', () => {
    expect(isEligibleExcerptText('He said “stop.”)! and left')).toBe(true)
    expect(isEligibleExcerptText('He said ....!!!! and left')).toBe(false)
  })

  it('allows a token at the limit and declines one past it', () => {
    expect(isEligibleExcerptText('x'.repeat(30))).toBe(true)
    expect(isEligibleExcerptText('x'.repeat(31))).toBe(false)
  })

  it('counts a hyphenated compound as breakable rather than one long token', () => {
    expect(isEligibleExcerptText('a pre-tribulational-premillennial-dispensational view')).toBe(
      true,
    )
  })

  it('is pure: the same input always gives the same answer', () => {
    const text = 'The soul’s destruction — Matthew 10:28 — is final.'
    expect(excerptTextEligibility(text)).toEqual(excerptTextEligibility(text))
  })

  it('reports the first failing rule deterministically for mixed input', () => {
    // Greek and an emoji together always report the same reason.
    const text = 'αἰώνιος 🚀'
    expect(reason(text)).toBe(reason(text))
  })
})
