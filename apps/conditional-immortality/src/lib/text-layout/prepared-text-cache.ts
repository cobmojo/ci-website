/**
 * A small, bounded cache for prepared text handles.
 *
 * Pretext keeps its own internal measurement caches, but preparing a candidate
 * is still the expensive half of the work, and the dialog asks for the same
 * candidates repeatedly: on every resize, on every re-render, and every time a
 * reader backspaces to a query they already typed. This keeps those handles
 * around without letting the set grow for the lifetime of the page.
 *
 * Deliberately generic: it stores whatever it is given and never imports
 * Pretext, so it is testable without a canvas and cannot become a second place
 * that knows about the layout engine.
 *
 * Nothing here calls Pretext's own `clearCache()`. That is a global reset of
 * measurements shared across every prepared handle on the page, and doing it
 * during ordinary typing or resizing would throw away exactly the work this
 * cache exists to protect.
 */

export interface PreparedTextCache<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
  readonly size: number
  /** Drop everything. For tests that need a cold start, not for normal use. */
  clear(): void
}

/**
 * The default bound.
 *
 * The quick dialog shows twelve rows, so this holds roughly twenty distinct
 * queries' worth of candidates at one font contract — far more than a reader
 * revisits in a session, and small enough that the memory is never a question.
 */
export const PREPARED_CACHE_MAX_ENTRIES = 256

/**
 * Least-recently-used, on insertion-ordered `Map` semantics.
 *
 * A hit re-inserts its entry, which moves it to the end of the iteration
 * order; eviction always takes the first key. That makes both recency and
 * eviction exactly observable, which is what the tests pin.
 */
export function createPreparedTextCache<T>(
  maxEntries: number = PREPARED_CACHE_MAX_ENTRIES,
): PreparedTextCache<T> {
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError(`Prepared text cache needs a positive bound, got ${maxEntries}`)
  }

  const entries = new Map<string, T>()

  return {
    get(key: string): T | undefined {
      const value = entries.get(key)
      if (value === undefined) return undefined
      entries.delete(key)
      entries.set(key, value)
      return value
    },

    set(key: string, value: T): void {
      if (entries.has(key)) entries.delete(key)
      entries.set(key, value)
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next()
        if (oldest.done) break
        entries.delete(oldest.value)
      }
    },

    get size(): number {
      return entries.size
    },

    clear(): void {
      entries.clear()
    },
  }
}
