import { describe, expect, it } from 'vitest'
import { buildCursorSourceMap } from './cursor-source-map'

/**
 * Pretext hands back segment/grapheme cursors, not string offsets. These tests
 * feed the adapter segment arrays directly, exactly as `prepareWithSegments()`
 * exposes them, so the mapping is pinned without needing a canvas.
 */

describe('building the map', () => {
  it('accepts a segment stream that reassembles the candidate exactly', () => {
    const map = buildCursorSourceMap(['hello', ' ', 'world'], 'hello world')
    expect(map).not.toBeNull()
    expect(map?.text).toBe('hello world')
  })

  it('refuses a stream that does not reassemble the candidate', () => {
    // Pretext drops soft-hyphen segments out of materialised text and can add a
    // visible hyphen, so a stream that disagrees is a reason to fail open.
    expect(buildCursorSourceMap(['hello', 'world'], 'hello world')).toBeNull()
    expect(buildCursorSourceMap(['hello', ' ', 'world', '!'], 'hello world')).toBeNull()
    expect(buildCursorSourceMap([], 'hello')).toBeNull()
  })

  it('accepts an empty stream for empty text', () => {
    expect(buildCursorSourceMap([], '')?.text).toBe('')
  })
})

describe('cursors at segment boundaries', () => {
  const map = buildCursorSourceMap(['The', ' ', 'fire', ' ', 'burns'], 'The fire burns')

  it.each([
    [0, 0],
    [1, 3],
    [2, 4],
    [3, 8],
    [4, 9],
  ])('maps segment %i at grapheme 0 to offset %i', (segmentIndex, expected) => {
    expect(map?.offsetAt({ segmentIndex, graphemeIndex: 0 })).toBe(expected)
  })

  it('maps the exclusive end-of-text cursor to the text length', () => {
    expect(map?.offsetAt({ segmentIndex: 5, graphemeIndex: 0 })).toBe(14)
  })

  it('maps a grapheme index inside a segment', () => {
    expect(map?.offsetAt({ segmentIndex: 2, graphemeIndex: 2 })).toBe(6)
    expect(map?.offsetAt({ segmentIndex: 2, graphemeIndex: 4 })).toBe(8)
  })

  it('maps repeated words to their own occurrences', () => {
    const repeated = buildCursorSourceMap(['fire', ' ', 'and', ' ', 'fire'], 'fire and fire')
    expect(repeated?.offsetAt({ segmentIndex: 0, graphemeIndex: 0 })).toBe(0)
    expect(repeated?.offsetAt({ segmentIndex: 4, graphemeIndex: 0 })).toBe(9)
    expect(repeated?.offsetAt({ segmentIndex: 4, graphemeIndex: 4 })).toBe(13)
  })
})

describe('cursors inside multi-unit graphemes', () => {
  it('counts a combining sequence as one grapheme', () => {
    // `e` + combining acute is two UTF-16 units but one grapheme.
    const text = `néphesh`
    const map = buildCursorSourceMap([text], text)
    expect(map?.offsetAt({ segmentIndex: 0, graphemeIndex: 1 })).toBe(1)
    // Past the accented grapheme: `n` is 1 unit, `e` plus its mark is 2.
    expect(map?.offsetAt({ segmentIndex: 0, graphemeIndex: 2 })).toBe(3)
    expect(map?.offsetAt({ segmentIndex: 0, graphemeIndex: 3 })).toBe(4)
  })

  it('counts a surrogate pair as one grapheme', () => {
    const text = 'a\u{1D400}b'
    const map = buildCursorSourceMap([text], text)
    expect(map?.offsetAt({ segmentIndex: 0, graphemeIndex: 1 })).toBe(1)
    expect(map?.offsetAt({ segmentIndex: 0, graphemeIndex: 2 })).toBe(3)
    expect(map?.offsetAt({ segmentIndex: 0, graphemeIndex: 3 })).toBe(4)
  })

  it('never returns an offset that splits a surrogate pair', () => {
    const text = 'a\u{1D400}b'
    const map = buildCursorSourceMap([text], text)
    for (let graphemeIndex = 0; graphemeIndex <= 3; graphemeIndex += 1) {
      const offset = map?.offsetAt({ segmentIndex: 0, graphemeIndex })
      expect(offset).not.toBe(2)
    }
  })
})

describe('failing open on a cursor that makes no sense', () => {
  const map = buildCursorSourceMap(['The', ' ', 'fire'], 'The fire')

  it.each([
    ['a negative segment index', { segmentIndex: -1, graphemeIndex: 0 }],
    ['a segment index past the end', { segmentIndex: 4, graphemeIndex: 0 }],
    ['a grapheme index past the segment', { segmentIndex: 0, graphemeIndex: 9 }],
    ['a negative grapheme index', { segmentIndex: 0, graphemeIndex: -1 }],
    ['a non-integer index', { segmentIndex: 0.5, graphemeIndex: 0 }],
    ['a grapheme index on the end-of-text cursor', { segmentIndex: 3, graphemeIndex: 1 }],
  ])('returns null for %s', (_label, cursor) => {
    expect(map?.offsetAt(cursor)).toBeNull()
  })
})

describe('efficiency', () => {
  it('segments each segment at most once, however many cursors are asked for', () => {
    const map = buildCursorSourceMap(['alpha', ' ', 'beta'], 'alpha beta')
    const first = map?.offsetAt({ segmentIndex: 0, graphemeIndex: 3 })
    const again = map?.offsetAt({ segmentIndex: 0, graphemeIndex: 3 })
    expect(first).toBe(3)
    expect(again).toBe(3)
    expect(map?.segmentedCount()).toBe(1)
  })

  it('does no grapheme work at all for boundary cursors', () => {
    const map = buildCursorSourceMap(['alpha', ' ', 'beta'], 'alpha beta')
    map?.offsetAt({ segmentIndex: 2, graphemeIndex: 0 })
    expect(map?.segmentedCount()).toBe(0)
  })
})
