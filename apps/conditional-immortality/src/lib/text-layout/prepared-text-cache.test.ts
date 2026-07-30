import { describe, expect, it } from 'vitest'
import { buildFontContract, type ComputedTextStyle, preparedCacheKey } from './font-contract'
import { createPreparedTextCache, PREPARED_CACHE_MAX_ENTRIES } from './prepared-text-cache'

describe('the prepared-handle cache', () => {
  it('misses on a key it has never seen', () => {
    const cache = createPreparedTextCache<string>(4)
    expect(cache.get('a')).toBeUndefined()
    expect(cache.size).toBe(0)
  })

  it('hits on a key it holds', () => {
    const cache = createPreparedTextCache<string>(4)
    cache.set('a', 'prepared-a')
    expect(cache.get('a')).toBe('prepared-a')
    expect(cache.size).toBe(1)
  })

  it('replaces a value without growing', () => {
    const cache = createPreparedTextCache<string>(4)
    cache.set('a', 'first')
    cache.set('a', 'second')
    expect(cache.get('a')).toBe('second')
    expect(cache.size).toBe(1)
  })

  it('evicts the least recently used entry when full', () => {
    const cache = createPreparedTextCache<string>(3)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.set('d', '4')
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe('2')
    expect(cache.get('c')).toBe('3')
    expect(cache.get('d')).toBe('4')
    expect(cache.size).toBe(3)
  })

  it('a read refreshes recency, so the read entry survives the next eviction', () => {
    const cache = createPreparedTextCache<string>(3)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    expect(cache.get('a')).toBe('1')
    cache.set('d', '4')
    // `b` was the least recently used once `a` had been read again.
    expect(cache.get('a')).toBe('1')
    expect(cache.get('b')).toBeUndefined()
  })

  it('a write refreshes recency too', () => {
    const cache = createPreparedTextCache<string>(3)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.set('a', '1 again')
    cache.set('d', '4')
    expect(cache.get('a')).toBe('1 again')
    expect(cache.get('b')).toBeUndefined()
  })

  it('evicts deterministically over a long run', () => {
    const cache = createPreparedTextCache<number>(2)
    for (let i = 0; i < 100; i += 1) cache.set(`k${i}`, i)
    expect(cache.size).toBe(2)
    expect(cache.get('k98')).toBe(98)
    expect(cache.get('k99')).toBe(99)
    expect(cache.get('k97')).toBeUndefined()
  })

  it('clears completely, for a test that needs a cold start', () => {
    const cache = createPreparedTextCache<string>(4)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })

  it('defaults to the documented bound', () => {
    expect(PREPARED_CACHE_MAX_ENTRIES).toBe(256)
    const cache = createPreparedTextCache<number>()
    for (let i = 0; i < PREPARED_CACHE_MAX_ENTRIES + 50; i += 1) cache.set(`k${i}`, i)
    expect(cache.size).toBe(PREPARED_CACHE_MAX_ENTRIES)
  })

  it('refuses a nonsensical bound rather than growing without limit', () => {
    expect(() => createPreparedTextCache<number>(0)).toThrow()
    expect(() => createPreparedTextCache<number>(-1)).toThrow()
  })
})

describe('keys keep incompatible contracts apart', () => {
  const base: ComputedTextStyle = {
    fontFamily: '"Source Serif 4", serif',
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

  it('never hands a handle prepared for one font to another', () => {
    const small = buildFontContract(base, 'en')
    const large = buildFontContract({ ...base, fontSize: '19px' }, 'en')
    expect(small).not.toBeNull()
    expect(large).not.toBeNull()
    if (!small || !large) return

    const cache = createPreparedTextCache<string>(8)
    cache.set(preparedCacheKey(small, 'the fire'), 'small handle')
    expect(cache.get(preparedCacheKey(large, 'the fire'))).toBeUndefined()
    expect(cache.get(preparedCacheKey(small, 'the fire'))).toBe('small handle')
  })

  it('never hands a handle prepared for one locale to another', () => {
    const english = buildFontContract(base, 'en')
    const german = buildFontContract(base, 'de')
    if (!english || !german) return

    const cache = createPreparedTextCache<string>(8)
    cache.set(preparedCacheKey(english, 'the fire'), 'english handle')
    expect(cache.get(preparedCacheKey(german, 'the fire'))).toBeUndefined()
  })

  it('reuses one handle across line budgets, because width is not in the key', () => {
    const narrow = buildFontContract(base, 'en')
    const wide = buildFontContract({ ...base, lineBudget: '3' }, 'en')
    if (!narrow || !wide) return

    const cache = createPreparedTextCache<string>(8)
    cache.set(preparedCacheKey(narrow, 'the fire'), 'one handle')
    expect(cache.get(preparedCacheKey(wide, 'the fire'))).toBe('one handle')
  })
})
