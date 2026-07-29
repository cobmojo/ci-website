/**
 * Fixed-window, in-memory rate limiter.
 *
 * Deliberately the smallest thing that works. The site has one write endpoint,
 * the correction form, and it needs to stop a single client hammering it. That
 * does not justify a Redis dependency, a paid service, or a CAPTCHA that would
 * exclude readers using assistive technology.
 *
 * Limitations, stated rather than hidden:
 *
 * - Counters live in the process. A restart or a second serverless instance
 *   starts a fresh window, so the effective limit is per instance.
 * - The key is derived from proxy headers, which a determined client can
 *   forge. This is friction against volume, not authentication.
 *
 * Nothing here is written to disk and no key is ever logged, so an address is
 * never associated with the contents of a submission.
 */

export interface RateLimitOptions {
  /** Submissions allowed inside one window. */
  readonly limit?: number
  /** Window length in milliseconds. */
  readonly windowMs?: number
}

export interface RateLimitResult {
  readonly allowed: boolean
  readonly limit: number
  /** Submissions still available in the current window. */
  readonly remaining: number
  /** Epoch milliseconds at which the current window ends. */
  readonly resetAt: number
  /** Whole seconds until the window ends, for the `Retry-After` header. */
  readonly retryAfterSeconds: number
}

interface WindowState {
  count: number
  expiresAt: number
}

export const DEFAULT_RATE_LIMIT = 5
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

/**
 * Upper bound on tracked keys. Reaching it means the oldest windows are
 * dropped, which is safe: a dropped window can only ever be more permissive,
 * never less, and it keeps a flood of distinct addresses from growing the map
 * without limit.
 */
const MAX_TRACKED_KEYS = 20_000

/**
 * Held on `globalThis` so a development hot reload, which re-evaluates this
 * module, does not silently reset everyone's window.
 */
const store = globalThis as typeof globalThis & {
  __ciFeedbackRateLimit?: Map<string, WindowState>
}

const windows: Map<string, WindowState> = store.__ciFeedbackRateLimit ?? new Map()
store.__ciFeedbackRateLimit = windows

function prune(now: number): void {
  for (const [key, state] of windows) {
    if (state.expiresAt <= now) windows.delete(key)
  }
  if (windows.size <= MAX_TRACKED_KEYS) return
  const excess = windows.size - MAX_TRACKED_KEYS
  let removed = 0
  for (const key of windows.keys()) {
    windows.delete(key)
    removed += 1
    if (removed >= excess) break
  }
}

/** Record one attempt against `key` and report whether it is allowed. */
export function rateLimit(key: string, options: RateLimitOptions = {}): RateLimitResult {
  const limit = options.limit ?? DEFAULT_RATE_LIMIT
  const windowMs = options.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS
  const now = Date.now()

  prune(now)

  const existing = windows.get(key)
  const state: WindowState =
    existing && existing.expiresAt > now ? existing : { count: 0, expiresAt: now + windowMs }

  state.count += 1
  windows.set(key, state)

  const allowed = state.count <= limit
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - state.count),
    resetAt: state.expiresAt,
    retryAfterSeconds: Math.max(1, Math.ceil((state.expiresAt - now) / 1000)),
  }
}

/** Clear one key, or every key. Used by tests, never by request handling. */
export function resetRateLimit(key?: string): void {
  if (key === undefined) windows.clear()
  else windows.delete(key)
}

/**
 * Best-effort client address from proxy headers.
 *
 * Returned for rate-limit keying only. It is never persisted and never logged.
 */
export function clientAddress(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown-client'
}
