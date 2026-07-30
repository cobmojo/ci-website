import { describe, expect, it } from 'vitest'
import {
  formatLongDate,
  formatTimestamp,
  isoDuration,
  pluralise,
  readingTimeMinutes,
} from '../format'

describe('formatLongDate', () => {
  it('renders an ISO calendar date as prose', () => {
    expect(formatLongDate('2026-07-29')).toBe('July 29, 2026')
    expect(formatLongDate('2025-03-06')).toBe('March 6, 2025')
  })

  /**
   * The formatter is pinned to UTC. Without that, a date rendered west of
   * Greenwich shifts back a day on the client and disagrees with the server,
   * which React reports as a hydration mismatch.
   */
  it('does not shift the day, whatever the local time zone', () => {
    expect(formatLongDate('2023-03-01')).toBe('March 1, 2023')
    expect(formatLongDate('2024-12-31')).toBe('December 31, 2024')
  })

  it('returns the input unchanged when it is not a calendar date', () => {
    expect(formatLongDate('not a date')).toBe('not a date')
    expect(formatLongDate('')).toBe('')
    expect(formatLongDate('2026-07-29T09:00:00Z')).toBe('2026-07-29T09:00:00Z')
  })
})

describe('formatTimestamp', () => {
  it('formats seconds as minutes and padded seconds', () => {
    expect(formatTimestamp(1712)).toBe('28:32')
    expect(formatTimestamp(65)).toBe('1:05')
    expect(formatTimestamp(0)).toBe('0:00')
    expect(formatTimestamp(59)).toBe('0:59')
  })

  it('does not roll over into hours', () => {
    expect(formatTimestamp(3600)).toBe('60:00')
  })

  it('truncates fractional cue times and floors at zero', () => {
    expect(formatTimestamp(22.9)).toBe('0:22')
    expect(formatTimestamp(-5)).toBe('0:00')
  })
})

describe('isoDuration', () => {
  it('produces a value valid in a `datetime` attribute', () => {
    expect(isoDuration(1712)).toBe('PT28M32S')
    expect(isoDuration(65)).toBe('PT1M5S')
    expect(isoDuration(0)).toBe('PT0M0S')
  })

  it('floors at zero rather than emitting a negative duration', () => {
    expect(isoDuration(-30)).toBe('PT0M0S')
  })
})

describe('readingTimeMinutes', () => {
  const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ')

  it('counts at 220 words per minute, rounded', () => {
    expect(readingTimeMinutes(words(220))).toBe(1)
    expect(readingTimeMinutes(words(660))).toBe(3)
    expect(readingTimeMinutes(words(330))).toBe(2)
  })

  it('never reports less than a minute', () => {
    expect(readingTimeMinutes('')).toBe(1)
    expect(readingTimeMinutes('   ')).toBe(1)
    expect(readingTimeMinutes('a handful of words')).toBe(1)
  })

  it('ignores the shape of the whitespace between words', () => {
    expect(readingTimeMinutes('one\n\ntwo\tthree   four')).toBe(1)
  })
})

describe('pluralise', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralise(1, 'minute')).toBe('minute')
    expect(pluralise(0, 'minute')).toBe('minutes')
    expect(pluralise(2, 'minute')).toBe('minutes')
  })

  it('takes an irregular plural when the default would be wrong', () => {
    expect(pluralise(2, 'this', 'these')).toBe('these')
    expect(pluralise(1, 'this', 'these')).toBe('this')
  })
})
