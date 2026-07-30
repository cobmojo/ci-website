import type { TextRange } from '@ci/search'
import { describe, expect, it } from 'vitest'
import { type FitCandidate, fitSearchExcerpt } from './fit-search-excerpt'
import { buildFontContract, type ComputedTextStyle, type FontContract } from './font-contract'
import { createTestLayoutEngine } from './test-engine'

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

function contractWith(lines: number): FontContract {
  const built = buildFontContract({ ...STYLE, lineBudget: String(lines) }, 'en')
  if (!built) throw new Error('the test contract must be valid')
  return built
}

const TWO_LINES = contractWith(2)
const THREE_LINES = contractWith(3)

/** Ten characters per line at charWidth 10 and width 100. */
const WIDTH = 100

function candidate(
  text: string,
  match: string,
  overrides: Partial<FitCandidate> = {},
): FitCandidate {
  const start = text.indexOf(match)
  if (start === -1) throw new Error(`fixture must contain ${match}`)
  return {
    text,
    matchRanges: [{ start, end: start + match.length }],
    omittedBefore: false,
    omittedAfter: false,
    ...overrides,
  }
}

/** The text a reader sees, with the marks shown as brackets. */
function marked(text: string, ranges: readonly TextRange[]): string {
  let out = ''
  let cursor = 0
  for (const range of ranges) {
    out += `${text.slice(cursor, range.start)}[${text.slice(range.start, range.end)}]`
    cursor = range.end
  }
  return out + text.slice(cursor)
}

/**
 * Fixtures are three-letter words at ten pixels a character in a hundred-pixel
 * column, so every wrap position is arithmetic rather than a guess: two words
 * to a line, eight characters to a line.
 *
 *   aaa bbb | ccc ddd | eee fff | ggg hhh
 *   0     8 10     16 18     24 26     31
 */
const FOUR_LINES_OF_TEXT = 'aaa bbb ccc ddd eee fff ggg hhh'

describe('fitting into the line budget', () => {
  it('fits a long candidate into exactly two lines around its match', () => {
    const engine = createTestLayoutEngine()
    const text = 'aaa bbb ccc ddd eee fff ggg hhh iii FIRE jjj kkk lll mmm nnn ooo ppp qqq rrr sss'
    const result = fitSearchExcerpt(candidate(text, 'FIRE'), TWO_LINES, WIDTH, engine)

    expect(result).not.toBeNull()
    if (!result) return
    expect(result.lineCount).toBeLessThanOrEqual(2)
    expect(result.text).toContain('FIRE')
    expect(marked(result.text, result.matchRanges)).toContain('[FIRE]')
    expect(engine.prepare(result.text, TWO_LINES)?.lineCountAt(WIDTH)).toBeLessThanOrEqual(2)
  })

  it('puts the match on the first line of a two-line window', () => {
    const result = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'eee'),
      TWO_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(result?.text).toBe('…eee fff ggg hhh')
    expect(result?.lineCount).toBe(2)
    expect(marked(result?.text ?? '', result?.matchRanges ?? [])).toBe('…[eee] fff ggg hhh')
  })

  it('puts the match on the second line of a three-line window, with lead-in', () => {
    const result = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'eee'),
      THREE_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(result?.text).toBe('…ccc ddd eee fff ggg hhh')
    expect(result?.lineCount).toBe(3)
    expect(marked(result?.text ?? '', result?.matchRanges ?? [])).toBe('…ccc ddd [eee] fff ggg hhh')
  })

  it('keeps a match on the first line when there is no room to lead in', () => {
    const result = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'aaa'),
      THREE_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(result?.text).toBe('aaa bbb ccc ddd eee fff…')
    expect(result?.matchRanges).toEqual([{ start: 0, end: 3 }])
  })

  it('slides the window back rather than shrinking it at the end of the text', () => {
    const result = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'hhh'),
      TWO_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(result?.text).toBe('…eee fff ggg hhh')
    expect(result?.lineCount).toBe(2)
  })

  it('enforces the budget exactly, never one line over', () => {
    const engine = createTestLayoutEngine()
    for (const contract of [TWO_LINES, THREE_LINES]) {
      const result = fitSearchExcerpt(candidate(FOUR_LINES_OF_TEXT, 'eee'), contract, WIDTH, engine)
      expect(result).not.toBeNull()
      if (!result) continue
      const remeasured = engine.prepare(result.text, contract)?.lineCountAt(WIDTH)
      expect(remeasured).toBe(result.lineCount)
      expect(result.lineCount).toBeLessThanOrEqual(contract.lineBudget)
    }
  })
})

describe('ellipses', () => {
  it('adds neither ellipsis when the whole candidate fits and nothing was omitted', () => {
    const result = fitSearchExcerpt(
      candidate('aaa bbb', 'bbb'),
      TWO_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(result?.text).toBe('aaa bbb')
    expect(result?.matchRanges).toEqual([{ start: 4, end: 7 }])
  })

  it('adds a trailing ellipsis only, when only the tail was dropped', () => {
    const result = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'aaa'),
      TWO_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(result?.text).toBe('aaa bbb ccc ddd…')
    expect(result?.text.startsWith('…')).toBe(false)
  })

  it('inherits the candidate’s own omissions', () => {
    const result = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'bbb', { omittedBefore: true }),
      TWO_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(result?.text).toBe('…aaa bbb ccc ddd…')
    expect(marked(result?.text ?? '', result?.matchRanges ?? [])).toBe('…aaa [bbb] ccc ddd…')
  })

  it('shifts the ranges past a leading ellipsis', () => {
    const result = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'eee'),
      TWO_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    // `eee` is at 16 in the candidate; at 1 in a window that starts there and
    // carries one ellipsis character in front of it.
    expect(result?.matchRanges).toEqual([{ start: 1, end: 4 }])
    expect(result?.text.slice(1, 4)).toBe('eee')
  })

  it('trims whole words when the ellipsis itself causes a new wrap', () => {
    // Without the trailing ellipsis this window is two lines; `ddd…` is four
    // characters wide and tips it onto a third.
    const engine = createTestLayoutEngine()
    const text = 'aaa bbb cccccc ddd eee'
    const result = fitSearchExcerpt(candidate(text, 'bbb'), TWO_LINES, WIDTH, engine)
    expect(result?.text).toBe('aaa bbb cccccc…')
    expect(result?.lineCount).toBe(2)
    expect(marked(result?.text ?? '', result?.matchRanges ?? [])).toBe('aaa [bbb] cccccc…')
  })

  it('never trims away the match itself', () => {
    const engine = createTestLayoutEngine()
    const text = 'aaa bbb cccccc ddd eee'
    const result = fitSearchExcerpt(candidate(text, 'bbb'), TWO_LINES, WIDTH, engine)
    expect(result?.matchRanges.length).toBeGreaterThan(0)
    const range = result?.matchRanges[0]
    expect(result?.text.slice(range?.start, range?.end)).toBe('bbb')
  })
})

describe('multiple matches', () => {
  const text = 'aaa zzz ccc ddd eee zzz ggg hhh'

  it('marks every match that survives inside the window', () => {
    const start = [text.indexOf('zzz'), text.lastIndexOf('zzz')]
    const input: FitCandidate = {
      text,
      matchRanges: start.map(at => ({ start: at, end: at + 3 })),
      omittedBefore: false,
      omittedAfter: false,
    }
    const result = fitSearchExcerpt(input, THREE_LINES, WIDTH, createTestLayoutEngine())
    expect(result).not.toBeNull()
    if (!result) return
    for (const range of result.matchRanges) {
      expect(result.text.slice(range.start, range.end)).toBe('zzz')
    }
    expect(result.matchRanges.length).toBeGreaterThanOrEqual(1)
  })

  it('drops a match the window cut through rather than marking a fragment', () => {
    const input: FitCandidate = {
      text: FOUR_LINES_OF_TEXT,
      matchRanges: [
        { start: 0, end: 3 },
        { start: 16, end: 19 },
      ],
      omittedBefore: false,
      omittedAfter: false,
    }
    const result = fitSearchExcerpt(input, TWO_LINES, WIDTH, createTestLayoutEngine())
    // The window starts at `aaa`, so only that match is inside it.
    expect(result?.text).toBe('aaa bbb ccc ddd…')
    expect(result?.matchRanges).toEqual([{ start: 0, end: 3 }])
  })
})

describe('refusing to fit', () => {
  const engine = createTestLayoutEngine()

  it('returns null for a candidate with no match ranges', () => {
    const input: FitCandidate = {
      text: FOUR_LINES_OF_TEXT,
      matchRanges: [],
      omittedBefore: false,
      omittedAfter: false,
    }
    expect(fitSearchExcerpt(input, TWO_LINES, WIDTH, engine)).toBeNull()
  })

  it('returns null for empty candidate text', () => {
    expect(
      fitSearchExcerpt(
        {
          text: '',
          matchRanges: [{ start: 0, end: 1 }],
          omittedBefore: false,
          omittedAfter: false,
        },
        TWO_LINES,
        WIDTH,
        engine,
      ),
    ).toBeNull()
  })

  it.each([0, 1, 39, Number.NaN, Number.POSITIVE_INFINITY, -100])(
    'returns null at an implausible width of %s',
    width => {
      expect(
        fitSearchExcerpt(candidate(FOUR_LINES_OF_TEXT, 'eee'), TWO_LINES, width, engine),
      ).toBeNull()
    },
  )

  it('returns null when the engine declines to prepare', () => {
    const refusing = { prepare: () => null }
    expect(
      fitSearchExcerpt(candidate(FOUR_LINES_OF_TEXT, 'eee'), TWO_LINES, WIDTH, refusing),
    ).toBeNull()
  })

  it('returns null when the segment stream does not reassemble the candidate', () => {
    const lying = {
      prepare: (text: string) => ({
        text,
        segments: ['not', 'the', 'candidate'],
        linesAt: () => [
          {
            start: { segmentIndex: 0, graphemeIndex: 0 },
            end: { segmentIndex: 3, graphemeIndex: 0 },
            width: 1,
          },
        ],
        lineCountAt: () => 1,
      }),
    }
    expect(
      fitSearchExcerpt(candidate(FOUR_LINES_OF_TEXT, 'eee'), TWO_LINES, WIDTH, lying),
    ).toBeNull()
  })

  it('returns null when the match spans more lines than the budget', () => {
    const text = FOUR_LINES_OF_TEXT
    const input: FitCandidate = {
      text,
      matchRanges: [{ start: 0, end: text.length }],
      omittedBefore: false,
      omittedAfter: false,
    }
    expect(fitSearchExcerpt(input, TWO_LINES, WIDTH, engine)).toBeNull()
  })
})

describe('safety and cost', () => {
  it('is deterministic', () => {
    const first = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'eee'),
      THREE_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    const second = fitSearchExcerpt(
      candidate(FOUR_LINES_OF_TEXT, 'eee'),
      THREE_LINES,
      WIDTH,
      createTestLayoutEngine(),
    )
    expect(first).toEqual(second)
  })

  it('bounds the trimming search rather than walking word by word', () => {
    const engine = createTestLayoutEngine()
    // Two hundred words, all of which the trailing trim could in principle try.
    const words = Array.from({ length: 200 }, (_, i) => (i === 3 ? 'zzz' : 'aaa'))
    const text = words.join(' ')
    engine.resetCounts()
    const result = fitSearchExcerpt(candidate(text, 'zzz'), TWO_LINES, WIDTH, engine)
    expect(result).not.toBeNull()
    expect(engine.prepareCount()).toBeLessThanOrEqual(30)
  })

  it('never splits a grapheme, even when the cut lands beside a combining mark', () => {
    const engine = createTestLayoutEngine()
    const text = 'áaa bbb ccc ddd eee fff ggg hhh'
    const result = fitSearchExcerpt(candidate(text, 'eee'), TWO_LINES, WIDTH, engine)
    expect(result).not.toBeNull()
    if (!result) return
    // No lone surrogate, and no combining mark stranded at the start of a slice.
    expect(/^[̀-ͯ]/.test(result.text.replace(/^…/, ''))).toBe(false)
    for (const range of result.matchRanges) {
      expect(result.text.slice(range.start, range.end)).toBe('eee')
    }
  })

  it('produces ranges that always slice their own text', () => {
    const engine = createTestLayoutEngine()
    for (const contract of [TWO_LINES, THREE_LINES]) {
      for (const word of ['aaa', 'ccc', 'eee', 'hhh']) {
        const result = fitSearchExcerpt(
          candidate(FOUR_LINES_OF_TEXT, word),
          contract,
          WIDTH,
          engine,
        )
        if (!result) continue
        expect(result.matchRanges.length).toBeGreaterThan(0)
        for (const range of result.matchRanges) {
          expect(range.start).toBeGreaterThanOrEqual(0)
          expect(range.end).toBeLessThanOrEqual(result.text.length)
          expect(result.text.slice(range.start, range.end)).toBe(word)
        }
      }
    }
  })
})
