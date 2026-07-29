import { describe, expect, it } from 'vitest'
import { escapeHtml, TEXT_WIDTH, wrapText } from '../plain-text'

const PROSE =
  'The wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.'

describe('wrapText', () => {
  it('keeps every line inside the width', () => {
    for (const line of wrapText(PROSE, 40)) {
      expect(line.length).toBeLessThanOrEqual(40)
    }
  })

  it('defaults to the width the generated files are read at', () => {
    expect(TEXT_WIDTH).toBe(78)
    for (const line of wrapText(PROSE)) {
      expect(line.length).toBeLessThanOrEqual(TEXT_WIDTH)
    }
  })

  it('fills each line before starting the next', () => {
    expect(wrapText('one two three four five', 12)).toEqual(['one two', 'three four', 'five'])
  })

  it('preserves every word, in order', () => {
    expect(wrapText(PROSE, 30).join(' ').split(' ')).toEqual(PROSE.split(' '))
  })

  it('leaves a word longer than the width intact rather than breaking it', () => {
    const long = 'a'.repeat(30)
    expect(wrapText(`short ${long} tail`, 20)).toEqual(['short', long, 'tail'])
  })

  it('applies the indent to every line, not just the first', () => {
    const lines = wrapText('one two three four five', 12, '  ')
    expect(lines).toEqual(['  one two', '  three four', '  five'])
  })

  it('collapses the whitespace it is given', () => {
    expect(wrapText('one   two\nthree', 40)).toEqual(['one two three'])
  })

  it('returns no lines at all for empty or blank text', () => {
    expect(wrapText('')).toEqual([])
    expect(wrapText('   \n\t ')).toEqual([])
  })
})

describe('escapeHtml', () => {
  it('escapes the five characters that can break out of the handout markup', () => {
    expect(escapeHtml(`<script>alert("x" & 'y')</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;',
    )
  })

  it('escapes the ampersand first, so an entity is not silently un-escaped', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
    expect(escapeHtml('AT&T')).toBe('AT&amp;T')
  })

  it('leaves ordinary prose, including typographic punctuation, alone', () => {
    const prose = 'The author’s own reading — “eternal punishment” — stands.'
    expect(escapeHtml(prose)).toBe(prose)
  })
})
