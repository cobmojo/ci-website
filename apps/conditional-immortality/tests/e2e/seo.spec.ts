import type { APIRequestContext } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * What a crawler is told about every page, checked against what was served.
 *
 * `route-sweep.spec.ts` asks whether a page is *sound* — one h1, one main, no
 * console error, no broken fragment. This asks the other question: whether the
 * page's account of itself is true. A canonical pointing at the wrong URL, a
 * description inherited from a template, a second `<title>`, an `og:image` on
 * a host that does not exist — none of those move a pixel, none fail a build,
 * and each one is spent on every reader who never arrives.
 *
 * Everything here reads the served HTML over HTTP rather than driving a
 * browser, for two reasons. It is the crawler's view: the markup as delivered,
 * before any hydration could add to it, which is exactly the thing being
 * claimed. And it is origin-agnostic, so the same assertions run against a
 * deployed preview through the `preview` project without a line of difference.
 */

/** Public, deliberately noindex, and therefore absent from the sitemap. */
const NOINDEX_ROUTES = ['/full-case/', '/search/']

interface Page {
  readonly route: string
  readonly html: string
}

function all(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map(match => match[1] as string)
}

/** `<head>` only. A code sample in the body must not be mistaken for markup. */
function head(html: string): string {
  const end = html.indexOf('</head>')
  return end === -1 ? html : html.slice(0, end)
}

const CANONICAL = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g
const TITLE = /<title[^>]*>([\s\S]*?)<\/title>/g
const DESCRIPTION = /<meta[^>]+name="description"[^>]+content="([^"]*)"/g
const ROBOTS = /<meta[^>]+name="robots"[^>]+content="([^"]*)"/g
const JSON_LD = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
const property = (name: string) =>
  new RegExp(`<meta[^>]+property="${name}"[^>]+content="([^"]*)"`, 'g')
const named = (name: string) => new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]*)"`, 'g')

/**
 * Every route the sitemap lists, plus the two public pages it must not, and
 * the origin the build says it is.
 *
 * The origin comes from the site's own output rather than from `baseURL`,
 * because the two are legitimately different: the canonical origin is baked in
 * at build time, and the local suite serves that build on a different port so
 * two checkouts can test at once. Asserting against `baseURL` would therefore
 * fail on a correct build. What matters here is that the site agrees with
 * *itself* on one origin everywhere; that this origin is the configured one is
 * `scripts/conditional-immortality/canonical-check.ts`, against build output.
 */
async function survey(request: APIRequestContext): Promise<{ pages: Page[]; origin: string }> {
  const response = await request.get('/sitemap.xml')
  expect(response.status(), 'the sitemap must be served for this suite to have a list').toBe(200)
  const locations = all(await response.text(), /<loc>([^<]+)<\/loc>/g)
  expect(
    locations.length,
    'the sitemap listed almost nothing; refusing to report a green SEO sweep',
  ).toBeGreaterThan(100)

  const origin = new URL(locations[0] as string).origin
  const list = [...locations.map(location => new URL(location).pathname), ...NOINDEX_ROUTES]

  const pages: Page[] = []
  for (const route of list) {
    const page = await request.get(route)
    expect(page.status(), route).toBe(200)
    pages.push({ route, html: head(await page.text()) })
  }
  return { pages, origin }
}

test('every page states exactly one canonical, and it is the page you asked for', async ({
  request,
}) => {
  const { pages, origin } = await survey(request)
  const problems: string[] = []

  for (const page of pages) {
    const canonicals = all(page.html, CANONICAL)
    if (canonicals.length !== 1) {
      problems.push(`${page.route}: ${canonicals.length} canonical tags`)
      continue
    }
    const canonical = canonicals[0] as string
    if (!canonical.startsWith(`${origin}/`)) {
      problems.push(`${page.route}: canonical on a foreign origin: ${canonical}`)
      continue
    }
    // A canonical that names a different page than the one serving it is the
    // single most expensive thing on this list: it de-indexes the page and
    // credits another.
    if (new URL(canonical).pathname !== page.route) {
      problems.push(`${page.route}: canonical points at ${new URL(canonical).pathname}`)
    }
  }

  expect(problems, `${problems.length} canonical problem(s)`).toEqual([])
})

test('every page carries one title and one description, and no two pages share either', async ({
  request,
}) => {
  const { pages } = await survey(request)
  const problems: string[] = []
  const titles = new Map<string, string[]>()
  const descriptions = new Map<string, string[]>()

  for (const page of pages) {
    const foundTitles = all(page.html, TITLE)
    const foundDescriptions = all(page.html, DESCRIPTION)

    if (foundTitles.length !== 1) problems.push(`${page.route}: ${foundTitles.length} titles`)
    if (foundDescriptions.length !== 1) {
      problems.push(`${page.route}: ${foundDescriptions.length} descriptions`)
    }

    const title = (foundTitles[0] ?? '').trim()
    const description = (foundDescriptions[0] ?? '').trim()
    if (!title) problems.push(`${page.route}: empty title`)
    if (!description) problems.push(`${page.route}: empty description`)

    titles.set(title, [...(titles.get(title) ?? []), page.route])
    descriptions.set(description, [...(descriptions.get(description) ?? []), page.route])
  }

  /*
   * Uniqueness, not length. Google has no fixed maximum for either and rewrites
   * both freely, so a character count is not a defect. Two pages that cannot be
   * told apart in a result list is.
   */
  for (const [title, owners] of titles) {
    if (owners.length > 1) problems.push(`title "${title}" is shared by ${owners.join(', ')}`)
  }
  for (const [description, owners] of descriptions) {
    if (owners.length > 1) {
      problems.push(`description "${description.slice(0, 60)}…" is shared by ${owners.join(', ')}`)
    }
  }

  expect(problems, `${problems.length} title/description problem(s)`).toEqual([])
})

test('the robots directive on each page matches what that page is for', async ({ request }) => {
  const { pages } = await survey(request)
  const problems: string[] = []

  for (const page of pages) {
    const directives = all(page.html, ROBOTS)
    if (directives.length !== 1) {
      problems.push(`${page.route}: ${directives.length} robots directives`)
      continue
    }
    const directive = (directives[0] as string).toLowerCase()
    const shouldBeNoindex = NOINDEX_ROUTES.includes(page.route)

    if (shouldBeNoindex && !directive.includes('noindex')) {
      problems.push(`${page.route}: is in the sitemap-excluded set but says "${directive}"`)
    }
    if (!shouldBeNoindex && directive.includes('noindex')) {
      // A noindex on a sitemap-listed URL is a direct contradiction: the
      // sitemap invites the crawl and the page refuses the result.
      problems.push(`${page.route}: is in the sitemap but says "${directive}"`)
    }
  }

  expect(problems, `${problems.length} robots problem(s)`).toEqual([])
})

test('social metadata agrees with the canonical, on a host that resolves', async ({ request }) => {
  const { pages, origin } = await survey(request)
  const problems: string[] = []

  for (const page of pages) {
    const canonical = all(page.html, CANONICAL)[0]
    const ogUrl = all(page.html, property('og:url'))[0]
    const ogTitle = all(page.html, property('og:title'))[0]
    const ogDescription = all(page.html, property('og:description'))[0]
    const ogImage = all(page.html, property('og:image'))[0]
    const card = all(page.html, named('twitter:card'))[0]

    if (ogUrl !== canonical)
      problems.push(`${page.route}: og:url ${ogUrl} ≠ canonical ${canonical}`)
    if (!ogTitle) problems.push(`${page.route}: no og:title`)
    if (!ogDescription) problems.push(`${page.route}: no og:description`)
    if (!card) problems.push(`${page.route}: no twitter:card`)
    if (!ogImage || !ogImage.startsWith(`${origin}/`)) {
      problems.push(`${page.route}: og:image is not an absolute URL on this origin: ${ogImage}`)
    }
  }

  expect(problems, `${problems.length} social metadata problem(s)`).toEqual([])
})

test('every JSON-LD block parses, and none of it makes a claim that was removed', async ({
  request,
}) => {
  const { pages } = await survey(request)
  const problems: string[] = []

  for (const page of pages) {
    for (const [index, raw] of all(page.html, JSON_LD).entries()) {
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch (error) {
        problems.push(
          `${page.route}: JSON-LD #${index} does not parse: ${(error as Error).message}`,
        )
        continue
      }
      const data = parsed as Record<string, unknown>
      if (data['@context'] !== 'https://schema.org') {
        problems.push(`${page.route}: JSON-LD #${index} has no schema.org context`)
      }
      if (!data['@type']) problems.push(`${page.route}: JSON-LD #${index} has no @type`)

      const serialised = JSON.stringify(data)
      // Each of these was removed for a documented reason. A revert is a
      // regression, not a preference.
      if (serialised.includes('SearchAction')) {
        problems.push(`${page.route}: the retired sitelinks SearchAction is back`)
      }
      if (data['@type'] === 'Article' && 'publisher' in data) {
        problems.push(`${page.route}: Article names a publisher that does not exist`)
      }
      if (data['@type'] === 'VideoObject' && 'contentUrl' in data) {
        problems.push(`${page.route}: VideoObject.contentUrl is not a media file URL`)
      }
    }
  }

  expect(problems, `${problems.length} JSON-LD problem(s)`).toEqual([])
})

test('the page a search result would land on is served, not assembled in the browser', async ({
  request,
}) => {
  /*
   * A sample rather than the whole site: this asserts the *architecture* holds,
   * and the whole-site version of it is `route-sweep.spec.ts` rendering every
   * route. One page per family, because a family shares a template.
   */
  const samples = [
    '/',
    '/start/what-is-conditional-immortality/',
    '/case/',
    '/watch/',
    '/glossary/',
    '/sources/',
  ]

  for (const route of samples) {
    const response = await request.get(route)
    const html = await response.text()
    const body = html.slice(html.indexOf('</head>'))

    // Server-rendered prose, not an empty shell waiting on JavaScript.
    const text = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
    expect(text.replace(/\s+/g, ' ').trim().length, `${route} served no prose`).toBeGreaterThan(500)
    // Navigation a crawler can follow: real anchors with real hrefs.
    expect(
      all(body, /<a[^>]+href="(\/[^"]*)"/g).length,
      `${route} served no internal links`,
    ).toBeGreaterThan(5)
  }
})

test('the social image endpoint actually returns an image', async ({ request }) => {
  const response = await request.get('/og/?title=Test%20Card&category=Section')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type'] ?? '').toContain('image')
  expect((await response.body()).length).toBeGreaterThan(1_000)
})

test('no page advertises a keywords meta tag', async ({ request }) => {
  /*
   * Google has ignored it since 2009 and it reads as a keyword list to
   * everything else. Its absence is the correct state; this guards against a
   * well-meaning addition.
   */
  const offenders: string[] = []
  for (const page of (await survey(request)).pages) {
    if (all(page.html, named('keywords')).length > 0) offenders.push(page.route)
  }
  expect(offenders).toEqual([])
})
