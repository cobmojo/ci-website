import { describe, expect, it } from 'vitest'
import { LOCALHOST_SITE_URL, resolveSiteUrl } from '../site-url'

/**
 * The canonical origin decides the canonical link on all 129 pages, every URL
 * in the sitemap, every Open Graph URL and the destination encoded in the
 * printed QR code. A build that guesses it wrongly is silently wrong
 * everywhere at once, so the resolver is tested as a pure function of its
 * environment rather than through a rendered page.
 */

/** A release build: no opt-out, so the localhost fallback is not available. */
const RELEASE = {} as const

/** What local development, the test servers and CI pass. */
const LOCAL = { NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL: '1' } as const

describe('resolveSiteUrl', () => {
  it('uses an explicit https origin', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.org' })).toBe(
      'https://example.org',
    )
  })

  it('strips trailing slashes so no URL is ever built with a double slash', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.org///' })).toBe(
      'https://example.org',
    )
  })

  it('trims surrounding whitespace, which a pasted dashboard value carries', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '  https://example.org  ' })).toBe(
      'https://example.org',
    )
  })

  it('keeps an explicit port, which a self-hosted origin legitimately has', () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.org:8443' })).toBe(
      'https://example.org:8443',
    )
  })

  it('rejects a path component, which would double every canonical URL', () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.org/site' })).toThrow(
      /path/i,
    )
  })

  it('rejects a query string', () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.org/?a=1' })).toThrow(
      /query|fragment/i,
    )
  })

  it('rejects a fragment', () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://example.org/#top' })).toThrow(
      /query|fragment/i,
    )
  })

  it('rejects embedded credentials', () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://u:p@example.org' })).toThrow(
      /credential/i,
    )
  })

  it('rejects a non-http protocol', () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'ftp://example.org' })).toThrow(/https/i)
  })

  it('rejects a value that is not a URL at all', () => {
    expect(() => resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'example.org' })).toThrow(/absolute/i)
  })

  it('rejects plain http for a release build', () => {
    expect(() =>
      resolveSiteUrl({ ...RELEASE, NEXT_PUBLIC_SITE_URL: 'http://example.org' }),
    ).toThrow(/https/i)
  })

  it('allows plain http when the localhost opt-out is set, which is how the browser suites run', () => {
    expect(resolveSiteUrl({ ...LOCAL, NEXT_PUBLIC_SITE_URL: 'http://localhost:3211' })).toBe(
      'http://localhost:3211',
    )
  })

  /**
   * There is deliberately no provider fallback.
   *
   * This module is in the client bundle, where Next inlines `NEXT_PUBLIC_`
   * variables and nothing else. A server-only input such as
   * `VERCEL_PROJECT_PRODUCTION_URL` would resolve on the server and be
   * `undefined` in the browser, so a deployment relying on it would build
   * cleanly, serve correct canonical URLs, and throw at module load in a
   * reader's browser. Two inputs, both public, both halves see the same thing.
   */
  it('consults no server-only provider variable, whatever is set', () => {
    expect(() =>
      resolveSiteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: 'example.org',
        VERCEL_URL: 'deployment-xyz.vercel.app',
      } as never),
    ).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })

  it('refuses to fall back to localhost for a release build', () => {
    expect(() => resolveSiteUrl(RELEASE)).toThrow(/NEXT_PUBLIC_SITE_URL/)
  })

  it('names the opt-out in the failure, so the message is actionable', () => {
    expect(() => resolveSiteUrl(RELEASE)).toThrow(/ALLOW_LOCALHOST_SITE_URL/)
  })

  it('falls back to localhost only when the opt-out is set', () => {
    expect(resolveSiteUrl(LOCAL)).toBe(LOCALHOST_SITE_URL)
  })

  it('treats an empty variable as unset rather than as an empty origin', () => {
    expect(resolveSiteUrl({ ...LOCAL, NEXT_PUBLIC_SITE_URL: '   ' })).toBe(LOCALHOST_SITE_URL)
  })

  it('still validates an explicit value when the opt-out is set', () => {
    expect(() =>
      resolveSiteUrl({ ...LOCAL, NEXT_PUBLIC_SITE_URL: 'https://example.org/x' }),
    ).toThrow(/path/i)
  })
})
