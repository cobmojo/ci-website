import { caseSections } from '@ci/content/case'
import { passageRoute, passages } from '@ci/content/passages'
import { revisedSectionIds } from '@ci/content/revisions'
import { topicRoute, topics } from '@ci/content/topics'
import { afterEach, describe, expect, it, vi } from 'vitest'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { NOINDEX_ROUTES, STATIC_ROUTES } from '@/lib/navigation'
import { siteConfig } from '@/lib/site-config'

/**
 * What the site tells a crawler it may do, and where it says the pages are.
 *
 * These two files decide whether the site is findable at all, and both fail
 * silently: a wrong `robots.txt` and a wrong sitemap each render perfectly and
 * each cost every page in the index.
 */

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('robots.txt on a preview deployment', () => {
  it('lets a crawler in, because that is the only way it can read the noindex', () => {
    /*
     * The preview used to answer `Disallow: /` *and* send
     * `X-Robots-Tag: noindex`. Those two directives cancel each other out.
     * Google's own wording: "If the page is blocked by a robots.txt file or
     * the crawler can't access the page, the crawler will never see the
     * noindex rule, and the page can still appear in search results."
     *
     * So the disallow was not belt-and-braces — it was the thing stopping the
     * braces from working, and it left a discovered preview URL eligible for a
     * URL-only result with no way to remove it. Crawling is what has to be
     * allowed for the header to be obeyed.
     */
    vi.stubEnv('SITE_ENV', 'preview')

    const rules = robots().rules
    const list = Array.isArray(rules) ? rules : [rules]

    expect(list).toHaveLength(1)
    expect(list[0]?.disallow).toBeUndefined()
    expect(list[0]?.allow).toBe('/')
  })

  it('never advertises the preview as a canonical origin', () => {
    vi.stubEnv('SITE_ENV', 'preview')

    const output = robots()
    // A preview that lists its own sitemap invites a crawler to enumerate
    // URLs that must not compete with production.
    expect(output.sitemap).toBeUndefined()
    expect(output.host).toBeUndefined()
  })
})

describe('robots.txt on the canonical deployment', () => {
  it('opens the site and closes only the write endpoint', () => {
    vi.stubEnv('SITE_ENV', 'production')

    const rules = robots().rules
    const list = Array.isArray(rules) ? rules : [rules]

    expect(list[0]?.allow).toBe('/')
    expect(list[0]?.disallow).toEqual(['/api/'])
  })

  it('points at the sitemap on the canonical origin', () => {
    vi.stubEnv('SITE_ENV', 'production')

    expect(robots().sitemap).toBe(`${siteConfig.url}/sitemap.xml`)
    expect(robots().host).toBe(siteConfig.url)
  })
})

describe('the sitemap', () => {
  const entries = sitemap()
  const urls = entries.map(entry => entry.url)

  it('carries no field Google ignores', () => {
    /*
     * "Google ignores <priority> values" and "Google ignores <changefreq>
     * values". Nothing else in this repository reads them either, so every
     * entry carried two numbers that no consumer has ever used and that a
     * future editor would have to keep plausible. Removing them removes the
     * maintenance, not a signal.
     */
    for (const entry of entries) {
      expect(entry).not.toHaveProperty('priority')
      expect(entry).not.toHaveProperty('changeFrequency')
    }
  })

  it('lists every indexable route exactly once, and nothing else', () => {
    const expected = new Set<string>([
      ...STATIC_ROUTES,
      ...caseSections.map(section => section.route),
      ...passages.map(passage => passageRoute(passage)),
      ...topics.map(topic => topicRoute(topic)),
      ...revisedSectionIds.map(id => `/changelog/${id.toLowerCase()}/`),
    ])
    for (const route of NOINDEX_ROUTES) expected.delete(route)

    const actual = urls.map(url => new URL(url).pathname)
    expect(new Set(actual).size).toBe(actual.length)
    expect([...actual].sort()).toEqual([...expected].sort())
  })

  it('excludes the routes that are deliberately noindex', () => {
    for (const route of NOINDEX_ROUTES) {
      expect(urls).not.toContain(`${siteConfig.url}${route}`)
    }
  })

  it('uses absolute canonical URLs on the resolved origin', () => {
    for (const url of urls) {
      expect(url.startsWith(`${siteConfig.url}/`)).toBe(true)
      expect(url).not.toContain('?')
      expect(url).not.toContain('#')
      // Every canonical route on this site ends in a slash; a sitemap entry
      // that did not would be a URL the canonical tag disagrees with.
      expect(url.endsWith('/')).toBe(true)
    }
  })

  it('never claims a page was modified in the future', () => {
    const now = Date.now()
    for (const entry of entries) {
      const modified = new Date(entry.lastModified as Date).getTime()
      expect(Number.isNaN(modified)).toBe(false)
      expect(modified).toBeLessThanOrEqual(now)
    }
  })
})
