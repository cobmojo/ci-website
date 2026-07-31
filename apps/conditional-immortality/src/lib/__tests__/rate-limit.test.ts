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

/**
 * `X-Forwarded-For` is a list a client can start and only a proxy can finish.
 *
 * Reading the *first* entry reads whatever the client typed, so a limiter keyed
 * on it is not a limiter: a sender picks a new leftmost address per request and
 * never meets the window. The only entry that means anything is the one the
 * nearest trusted proxy appended, counted from the right — and how many proxies
 * are trusted is a deployment fact, so it is configuration rather than a guess.
 */
describe('clientAddress', () => {
  const CHAIN = '203.0.113.7, 70.41.3.18, 150.172.238.178'

  it('takes the entry the nearest trusted proxy appended, not the one the client sent', () => {
    expect(clientAddress(new Headers({ 'x-forwarded-for': CHAIN }), 1)).toBe('150.172.238.178')
  })

  it('counts further left as more proxies are declared', () => {
    expect(clientAddress(new Headers({ 'x-forwarded-for': CHAIN }), 2)).toBe('70.41.3.18')
    expect(clientAddress(new Headers({ 'x-forwarded-for': CHAIN }), 3)).toBe('203.0.113.7')
  })

  it('assumes exactly one proxy when it is not told otherwise', () => {
    expect(clientAddress(new Headers({ 'x-forwarded-for': CHAIN }))).toBe('150.172.238.178')
  })

  it('trusts nothing forwarded when no proxy is declared', () => {
    const headers = new Headers({ 'x-forwarded-for': CHAIN, 'x-real-ip': '203.0.113.9' })
    expect(clientAddress(headers, 0)).toBe('unknown-client')
  })

  it('refuses a chain shorter than the proxies in front of it, which cannot have come from them', () => {
    expect(clientAddress(new Headers({ 'x-forwarded-for': '203.0.113.7' }), 2)).toBe(
      'unknown-client',
    )
  })

  it('trims the whitespace around a chain entry', () => {
    expect(clientAddress(new Headers({ 'x-forwarded-for': '203.0.113.7 , 70.41.3.18 ' }), 1)).toBe(
      '70.41.3.18',
    )
  })

  it('falls back to the real-ip header, which only a proxy sets', () => {
    expect(clientAddress(new Headers({ 'x-real-ip': '203.0.113.9' }), 1)).toBe('203.0.113.9')
  })

  it('prefers the forwarding chain when both headers are present', () => {
    const headers = new Headers({ 'x-forwarded-for': CHAIN, 'x-real-ip': '203.0.113.9' })
    expect(clientAddress(headers, 1)).toBe('150.172.238.178')
  })

  it('names an unknown client rather than returning an empty key', () => {
    expect(clientAddress(new Headers(), 1)).toBe('unknown-client')
    expect(clientAddress(new Headers({ 'x-forwarded-for': '' }), 1)).toBe('unknown-client')
    expect(clientAddress(new Headers({ 'x-real-ip': '   ' }), 1)).toBe('unknown-client')
  })

  /**
   * An empty or forged header must still produce one usable key rather than a
   * new key per request, which would let the limiter be bypassed at will.
   */
  it('gives every unidentified client the same key', () => {
    const first = clientAddress(new Headers(), 1)
    const second = clientAddress(new Headers({ 'x-real-ip': '' }), 1)
    expect(first).toBe(second)
  })

  it('cannot be moved off a key by prepending addresses, which is the whole point', () => {
    const honest = clientAddress(new Headers({ 'x-forwarded-for': '198.51.100.4' }), 1)
    const forged = clientAddress(
      new Headers({ 'x-forwarded-for': 'anything, else, entirely, 198.51.100.4' }),
      1,
    )
    expect(forged).toBe(honest)
  })
})
