import type { APIRequestContext } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * Content guarantees, checked against what the server actually sends.
 *
 * These read raw responses rather than driving a browser: the questions here
 * are about the delivered document, and asking every route through a page
 * object would take minutes to answer the same thing.
 */

/** Routes that are deliberately absent from the sitemap but still public. */
const EXTRA_ROUTES = ['/full-case/', '/search/', '/search/?q=fire']
const MISSING_ROUTE = '/this-address-does-not-exist/'

const PLACEHOLDERS: readonly { label: string; pattern: RegExp }[] = [
  { label: 'TODO', pattern: /\bTODO\b/i },
  { label: 'TBD', pattern: /\bTBD\b/i },
  { label: 'lorem ipsum', pattern: /lorem ipsum/i },
  { label: 'coming soon', pattern: /coming soon/i },
  { label: 'FIXME', pattern: /\bFIXME\b/i },
]

/** Written as an escape so this file contains no em dash of its own. */
const EM_DASH = '\u2014'

/** Sampled pages for the canonical URL check, one of each page shape. */
const CANONICAL_SAMPLE: readonly string[] = [
  '/',
  '/start/compare-the-views/',
  '/case/key-texts/eternal-punishment/',
  '/objections/is-annihilation-punishment/',
  '/appendix/afterlife-odds/',
  '/passages/mark-9-42-48/',
  '/topics/gehenna/',
  '/scripture/',
  '/sources/',
  '/watch/',
]

let sitemapRoutes: string[] = []

async function loadSitemapRoutes(request: APIRequestContext): Promise<string[]> {
  if (sitemapRoutes.length > 0) return sitemapRoutes
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  const xml = await response.text()
  sitemapRoutes = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    match => new URL(match[1] as string).pathname,
  )
  expect(sitemapRoutes.length).toBeGreaterThan(100)
  return sitemapRoutes
}

/** Visible text only: script payloads and stylesheets are not page copy. */
function bodyText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(stripped)
  return (body?.[1] ?? stripped).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

function articleText(html: string): string {
  const article = /<article[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/article>/i.exec(
    html,
  )
  if (!article) return ''
  return (article[1] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function excerptAround(text: string, index: number): string {
  return text.slice(Math.max(0, index - 80), index + 80)
}

/* ------------------------------------------------------------------ *
 * Prose hygiene, across every published route
 * ------------------------------------------------------------------ */

/**
 * Remove quoted Scripture before checking the site's own prose style.
 *
 * The no-em-dash rule is a house style rule for copy this project writes. It
 * does not extend to quoted material. The World English Bible genuinely uses
 * em dashes in several verses, and the corpus is a faithful reproduction of a
 * public-domain text, so those must survive untouched. Editing a quotation to
 * satisfy an internal style guide would be the wrong trade.
 */
function stripQuotedScripture(html: string): string {
  return html.replace(/<figure[^>]*class="[^"]*scripture-block[^"]*"[\s\S]*?<\/figure>/g, ' ')
}

test('no page body contains an em dash outside quoted Scripture', async ({ request }) => {
  const routes = [...(await loadSitemapRoutes(request)), ...EXTRA_ROUTES, MISSING_ROUTE]
  const offenders: string[] = []

  for (const route of routes) {
    const response = await request.get(route)
    const text = bodyText(stripQuotedScripture(await response.text()))
    const index = text.indexOf(EM_DASH)
    if (index !== -1) offenders.push(`${route}: ...${excerptAround(text, index)}...`)
  }

  expect(offenders).toEqual([])
})

test('quoted Scripture is reproduced faithfully, punctuation included', async ({ request }) => {
  // Guards the decision above: if someone "tidies" the corpus to satisfy the
  // style rule, this fails. Mark 9:45 carries an em dash in the WEB text.
  const response = await request.get('/passages/mark-9-42-48/')
  const html = await response.text()
  const scripture = html.match(/<figure[^>]*class="[^"]*scripture-block[^"]*"[\s\S]*?<\/figure>/g)
  expect(scripture, 'the passage page must render Scripture blocks').not.toBeNull()
  expect(scripture?.join(' ')).toContain(EM_DASH)
})

test('no page contains placeholder copy', async ({ request }) => {
  const routes = [...(await loadSitemapRoutes(request)), ...EXTRA_ROUTES, MISSING_ROUTE]
  const offenders: string[] = []

  for (const route of routes) {
    const response = await request.get(route)
    const text = bodyText(await response.text())
    for (const placeholder of PLACEHOLDERS) {
      const match = placeholder.pattern.exec(text)
      if (match) {
        offenders.push(`${route} (${placeholder.label}): ...${excerptAround(text, match.index)}...`)
      }
    }
  }

  expect(offenders).toEqual([])
})

/* ------------------------------------------------------------------ *
 * The case itself
 * ------------------------------------------------------------------ */

test('every section route renders a real article', async ({ request }) => {
  const routes = (await loadSitemapRoutes(request)).filter(route =>
    /^\/(case\/.+|objections\/[^/]+|appendix\/[^/]+)\/$/.test(route),
  )

  expect(routes, 'the case is 40 sections: 31 case pages, 7 objections, 2 appendices').toHaveLength(
    40,
  )

  const thin: string[] = []
  for (const route of routes) {
    const response = await request.get(route)
    expect(response.status(), route).toBe(200)
    const text = articleText(await response.text())
    if (text.length < 1500) thin.push(`${route}: ${text.length} characters`)
  }

  expect(thin).toEqual([])
})

/* ------------------------------------------------------------------ *
 * Indexing signals
 * ------------------------------------------------------------------ */

test('the two non-canonical pages are noindex', async ({ request }) => {
  for (const route of ['/full-case/', '/search/']) {
    const response = await request.get(route)
    expect(response.status(), route).toBe(200)
    const html = await response.text()
    const robots = /<meta name="robots" content="([^"]+)"/i.exec(html)?.[1] ?? ''
    expect(robots, route).toContain('noindex')
  }
})

test('canonical links are present and absolute', async ({ request }) => {
  for (const route of CANONICAL_SAMPLE) {
    const html = await (await request.get(route)).text()
    const canonical = /<link rel="canonical" href="([^"]+)"/i.exec(html)?.[1]
    expect(canonical, `no canonical link on ${route}`).toBeTruthy()
    const url = new URL(canonical as string)
    expect(url.protocol, route).toMatch(/^https?:$/)
    expect(url.host, route).not.toBe('')
    expect(url.pathname, route).toBe(route)
  }
})

test('the sitemap is XML and lists only indexable routes', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type'] ?? '').toContain('xml')

  const xml = await response.text()
  expect(xml).toContain('<urlset')
  expect(xml).toContain('<loc>')
  expect(xml).not.toContain('/full-case/')
  expect(xml).not.toContain('/search/')

  const routes = await loadSitemapRoutes(request)
  expect(routes).toContain('/')
  expect(routes).toContain('/case/key-texts/eternal-punishment/')
  expect(new Set(routes).size, 'the sitemap lists no route twice').toBe(routes.length)
})

test('robots.txt is plain text and points at the sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type'] ?? '').toContain('text/plain')

  const body = await response.text()
  expect(body).toMatch(/^User-Agent: \*/im)
  expect(body).toMatch(/^Sitemap: https?:\/\/.+\/sitemap\.xml$/im)
})

/* ------------------------------------------------------------------ *
 * Downloads
 * ------------------------------------------------------------------ */

const DOWNLOADS: readonly { route: string; type: string; minimumBytes: number }[] = [
  { route: '/download/transcript.txt', type: 'text/plain', minimumBytes: 10_000 },
  { route: '/download/bibliography.txt', type: 'text/plain', minimumBytes: 5_000 },
  { route: '/download/handout.html', type: 'text/html', minimumBytes: 5_000 },
]

for (const download of DOWNLOADS) {
  test(`${download.route} is served complete`, async ({ request }) => {
    const response = await request.get(download.route)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type'] ?? '').toContain(download.type)

    const body = await response.text()
    expect(body.length).toBeGreaterThan(download.minimumBytes)
    expect(body).not.toContain(EM_DASH)
    for (const placeholder of PLACEHOLDERS) {
      expect(
        placeholder.pattern.test(body),
        `${download.route} contains ${placeholder.label}`,
      ).toBe(false)
    }
  })
}
