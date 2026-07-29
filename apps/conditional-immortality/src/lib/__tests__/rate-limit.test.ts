import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clientAddress,
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  rateLimit,
  resetRateLimit,
} from '../rate-limit'

/**
 * The limiter keeps its counters on `globalThis` so a hot reload does not clear
 * everyone's window, which means state leaks between tests unless each one
 * starts from a clean map and a fixed clock.
 */
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-29T12:00:00Z'))
  resetRateLimit()
})

afterEach(() => {
  resetRateLimit()
  vi.useRealTimers()
})

const OPTIONS = { limit: 3, windowMs: 1000 } as const

describe('fixed window', () => {
  it('allows exactly `limit` attempts and refuses the rest', () => {
    const results = [1, 2, 3, 4, 5].map(() => rateLimit('a', OPTIONS))
    expect(results.map(r => r.allowed)).toEqual([true, true, true, false, false])
  })

  it('counts down what is left and stops at zero', () => {
    const results = [1, 2, 3, 4].map(() => rateLimit('a', OPTIONS))
    expect(results.map(r => r.remaining)).toEqual([2, 1, 0, 0])
  })

  it('reports the limit it applied', () => {
    expect(rateLimit('a', OPTIONS).limit).toBe(3)
  })

  it('does not slide the window forward as attempts arrive', () => {
    const first = rateLimit('a', { limit: 5, windowMs: 10_000 })
    vi.advanceTimersByTime(5_000)
    const later = rateLimit('a', { limit: 5, windowMs: 10_000 })
    expect(later.resetAt).toBe(first.resetAt)
  })

  it('opens a fresh window once the old one has expired', () => {
    rateLimit('a', OPTIONS)
    rateLimit('a', OPTIONS)
    expect(rateLimit('a', OPTIONS).allowed).toBe(true)
    expect(rateLimit('a', OPTIONS).allowed).toBe(false)

    vi.advanceTimersByTime(OPTIONS.windowMs)
    const reopened = rateLimit('a', OPTIONS)
    expect(reopened.allowed).toBe(true)
    expect(reopened.remaining).toBe(2)
  })

  it('holds the window until the very last millisecond', () => {
    for (let i = 0; i < 4; i += 1) rateLimit('a', OPTIONS)
    vi.advanceTimersByTime(OPTIONS.windowMs - 1)
    expect(rateLimit('a', OPTIONS).allowed).toBe(false)
  })

  it('keys are independent of one another', () => {
    for (let i = 0; i < 4; i += 1) rateLimit('a', OPTIONS)
    expect(rateLimit('a', OPTIONS).allowed).toBe(false)
    expect(rateLimit('b', OPTIONS).allowed).toBe(true)
  })
})

describe('retry timing', () => {
  it('reports when the window ends', () => {
    const now = Date.now()
    const result = rateLimit('a', { limit: 1, windowMs: 60_000 })
    expect(result.resetAt).toBe(now + 60_000)
    expect(result.retryAfterSeconds).toBe(60)
  })

  it('rounds a part-second up, so `Retry-After` never says wait for nothing', () => {
    rateLimit('a', OPTIONS)
    vi.advanceTimersByTime(OPTIONS.windowMs - 1)
    expect(rateLimit('a', OPTIONS).retryAfterSeconds).toBe(1)
  })
})

describe('defaults', () => {
  it('is five submissions in ten minutes', () => {
    expect(DEFAULT_RATE_LIMIT).toBe(5)
    expect(DEFAULT_RATE_LIMIT_WINDOW_MS).toBe(10 * 60 * 1000)

    const results = Array.from({ length: 6 }, () => rateLimit('a'))
    expect(results.filter(r => r.allowed)).toHaveLength(5)
    expect(results[5]?.allowed).toBe(false)
    expect(results[0]?.resetAt).toBe(Date.now() + DEFAULT_RATE_LIMIT_WINDOW_MS)
  })
})

describe('resetRateLimit', () => {
  it('clears a single key and leaves the others alone', () => {
    for (let i = 0; i < 4; i += 1) {
      rateLimit('a', OPTIONS)
      rateLimit('b', OPTIONS)
    }
    resetRateLimit('a')
    expect(rateLimit('a', OPTIONS).allowed).toBe(true)
    expect(rateLimit('b', OPTIONS).allowed).toBe(false)
  })

  it('clears every key when given no argument', () => {
    for (let i = 0; i < 4; i += 1) {
      rateLimit('a', OPTIONS)
      rateLimit('b', OPTIONS)
    }
    resetRateLimit()
    expect(rateLimit('a', OPTIONS).allowed).toBe(true)
    expect(rateLimit('b', OPTIONS).allowed).toBe(true)
  })
})

describe('clientAddress', () => {
  it('takes the first entry of the forwarding chain, which is the client', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' })
    expect(clientAddress(headers)).toBe('203.0.113.7')
  })

  it('trims the whitespace around a chain entry', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7 , 70.41.3.18' })
    expect(clientAddress(headers)).toBe('203.0.113.7')
  })

  it('falls back to the real-ip header', () => {
    expect(clientAddress(new Headers({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9')
  })

  it('prefers the forwarding chain when both headers are present', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.7',
      'x-real-ip': '203.0.113.9',
    })
    expect(clientAddress(headers)).toBe('203.0.113.7')
  })

  it('names an unknown client rather than returning an empty key', () => {
    expect(clientAddress(new Headers())).toBe('unknown-client')
    expect(clientAddress(new Headers({ 'x-forwarded-for': '' }))).toBe('unknown-client')
    expect(clientAddress(new Headers({ 'x-real-ip': '   ' }))).toBe('unknown-client')
  })

  /**
   * An empty or forged header must still produce one usable key rather than a
   * new key per request, which would let the limiter be bypassed at will.
   */
  it('gives every unidentified client the same key', () => {
    const first = clientAddress(new Headers())
    const second = clientAddress(new Headers({ 'x-real-ip': '' }))
    expect(first).toBe(second)
  })
})
