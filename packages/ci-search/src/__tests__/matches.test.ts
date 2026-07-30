import { describe, expect, it } from 'vitest'
import { findTermRanges, highlightSegments, segmentByRanges } from '../matches'

/** The text a reader would see, reassembled from the rendered segments. */
function rendered(text: string, terms: readonly string[]): string {
  return highlightSegments(text, terms)
    .map(segment => segment.text)
    .join('')
}

function marked(text: string, terms: readonly string[]): string[] {
  return highlightSegments(text, terms)
    .filter(segment => segment.matched)
    .map(segment => segment.text)
}

describe('findTermRanges', () => {
  it('locates a term after a character that NFKD expands', () => {
    // `ñ` decomposes to two units, so every normalised offset after it is one
    // ahead of the source. Marking source text with a normalised index would
    // highlight `ire ` instead of `fire`.
    const text = 'Mañana the fire'
    expect(findTermRanges(text, ['fire'])).toEqual([{ start: 11, end: 15 }])
    expect(marked(text, ['fire'])).toEqual(['fire'])
  })

  it('locates a term after a collapsed whitespace run', () => {
    const text = 'destruction   and   fire'
    expect(marked(text, ['fire'])).toEqual(['fire'])
  })

  it('finds a straight-quoted term inside curly-quoted source', () => {
    expect(marked('The soul’s end', ["soul's"])).toEqual(['soul’s'])
  })

  it('finds a hyphenated term inside en-dashed source', () => {
    expect(marked('the body–soul question', ['body-soul'])).toEqual(['body–soul'])
  })

  it('marks every occurrence of a repeated term', () => {
    expect(marked('fire and fire and fire', ['fire'])).toEqual(['fire', 'fire', 'fire'])
  })

  it('merges overlapping terms into one range', () => {
    // `unquenchable fire` and `fire` overlap; the reader should see one run.
    expect(marked('the unquenchable fire burns', ['unquenchable fire', 'fire'])).toEqual([
      'unquenchable fire',
    ])
  })

  it('merges adjacent ranges that touch', () => {
    expect(marked('bodysoul', ['body', 'soul'])).toEqual(['bodysoul'])
  })

  it('gives a longer overlapping term precedence over a shorter one', () => {
    const ranges = findTermRanges('eternal punishment here', ['punishment', 'eternal punishment'])
    expect(ranges).toEqual([{ start: 0, end: 18 }])
  })

  it('ignores terms of one character or less', () => {
    expect(marked('a fire', ['a', ''])).toEqual([])
  })

  it('returns nothing for an empty term list', () => {
    expect(findTermRanges('nothing here', [])).toEqual([])
    expect(highlightSegments('nothing here', [])).toEqual([
      { text: 'nothing here', matched: false, start: 0, end: 12 },
    ])
  })

  it('handles a term that is absent', () => {
    expect(highlightSegments('nothing here', ['absent'])).toEqual([
      { text: 'nothing here', matched: false, start: 0, end: 12 },
    ])
  })

  it('never marks part of a surrogate pair', () => {
    const text = 'rocket 🚀 fire'
    for (const segment of highlightSegments(text, ['fire', 'rocket'])) {
      expect(segment.text).toBe(text.slice(segment.start, segment.end))
      expect(segment.text.normalize()).toBe(segment.text.normalize())
      const first = segment.text.charCodeAt(0)
      const last = segment.text.charCodeAt(segment.text.length - 1)
      expect(first >= 0xdc00 && first <= 0xdfff).toBe(false)
      expect(last >= 0xd800 && last <= 0xdbff).toBe(false)
    }
  })

  it('does not split a combining sequence', () => {
    // NFKD decomposes an accent, it does not strip it: the ranker has never
    // matched `nephesh` against `néphesh`, and this is not the change that
    // starts doing so. What must hold is that marking the accented spelling
    // keeps the base and its mark together.
    const text = 'the néphesh soul'
    const segments = highlightSegments(text, ['néphesh'])
    expect(segments.map(s => s.text).join('')).toBe(text)
    expect(marked(text, ['néphesh'])).toEqual(['néphesh'])
    expect(marked(text, ['nephesh'])).toEqual([])
  })

  it('finds Greek and Hebrew text through their own spelling', () => {
    // Both scripts survive the round trip even though the enhanced fitted
    // excerpt will decline them: search correctness and Pretext eligibility are
    // separate decisions.
    const greek = 'the word αἰώνιος here'
    expect(marked(greek, ['αἰώνιος'])).toEqual(['αἰώνιος'])
    const hebrew = 'the word נפש here'
    expect(marked(hebrew, ['נפש'])).toEqual(['נפש'])
  })
})

describe('highlightSegments', () => {
  it.each([
    'Destruction, perishing, and the second death.',
    'The soul’s end — and the body’s.',
    'Mañana ﬁre 🚀 αἰώνιος נפש',
    '   leading and trailing   ',
    '',
  ])('reconstructs %j exactly', text => {
    expect(rendered(text, ['death', 'destruction', 'fire', 'soul', 'end'])).toBe(text)
  })

  it('reports offsets that slice the original text', () => {
    const text = 'The fire is not quenched'
    for (const segment of highlightSegments(text, ['fire', 'quenched'])) {
      expect(text.slice(segment.start, segment.end)).toBe(segment.text)
    }
  })

  it('produces contiguous, gapless segments', () => {
    const text = 'fire and worm and fire'
    const segments = highlightSegments(text, ['fire', 'worm'])
    let cursor = 0
    for (const segment of segments) {
      expect(segment.start).toBe(cursor)
      cursor = segment.end
    }
    expect(cursor).toBe(text.length)
  })

  it('preserves source punctuation inside a marked run', () => {
    expect(marked('“eternal punishment” means', ['eternal punishment'])).toEqual([
      'eternal punishment',
    ])
  })

  it('leaves an excerpt ellipsis unmarked when ranges are carried forward', () => {
    // The excerpt builder knows exactly where the match is, so the ellipsis it
    // added can never be swept into a mark by a second fuzzy search.
    const text = '…the fire is not quenched…'
    const segments = segmentByRanges(text, [{ start: 5, end: 9 }])
    expect(segments.filter(s => s.matched).map(s => s.text)).toEqual(['fire'])
    expect(segments.map(s => s.text).join('')).toBe(text)
  })
})

describe('segmentByRanges', () => {
  it('clamps and orders ranges that arrive out of order or out of bounds', () => {
    const text = 'fire and worm'
    const segments = segmentByRanges(text, [
      { start: 9, end: 13 },
      { start: 0, end: 4 },
      { start: 40, end: 50 },
    ])
    expect(segments.filter(s => s.matched).map(s => s.text)).toEqual(['fire', 'worm'])
    expect(segments.map(s => s.text).join('')).toBe(text)
  })

  it('returns one unmatched segment for text with no ranges', () => {
    expect(segmentByRanges('plain', [])).toEqual([
      { text: 'plain', matched: false, start: 0, end: 5 },
    ])
  })

  it('returns nothing for empty text', () => {
    expect(segmentByRanges('', [{ start: 0, end: 1 }])).toEqual([])
  })
})
