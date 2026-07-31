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

/* ------------------------------------------------------------------ *
 * The search index tells the truth about headings
 * ------------------------------------------------------------------ */

/**
 * Every heading a search document claims must be a heading on its page.
 *
 * Case sections take theirs from the MDX body, so they cannot drift. The
 * page, topic and passage documents are hand-authored, and when one of them
 * names a section the page does not have, search reports "matched in
 * heading" against text that is not there and quotes it back as the excerpt.
 *
 * Every route in the index is checked, not one of each kind. Several of the
 * sections on those templates are conditional, so the kinds are not uniform:
 * three topics carry no objections, five passages no wording notes, and a
 * sampled document is exactly the one that hides them.
 */

/**
 * HTML text back to the characters it stands for.
 *
 * Headings on this site are full of quotation marks and apostrophes —
 * `The author's own suggested reading`, `"Unquenchable" means it cannot be
 * put out` — and React serialises those as entities. Comparing the raw markup
 * against the index reported eleven real headings as missing. `&amp;` is
 * decoded last, or `&amp;quot;` would turn into a quotation mark.
 */
function decodeEntities(html: string): string {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Heading text as rendered, with React's comment markers and the anchor gone. */
function headingsIn(html: string): string[] {
  return [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(([, , inner]) =>
    decodeEntities(
      (inner ?? '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' '),
    )
      .replace(/#$/, '')
      .trim(),
  )
}

test('every heading claimed by the search index exists on its page', async ({ request }) => {
  const index = await (await request.get('/search-index.json')).json()
  const docs = index.docs as {
    id: string
    route: string
    type: string
    headings: string[]
  }[]

  // Documents sharing a route (the glossary is one page of many entries) need
  // the page fetched once, so this stays a few seconds rather than a minute.
  const claimsByRoute = new Map<string, Set<string>>()
  for (const doc of docs) {
    if (doc.headings.length === 0) continue
    const route = doc.route.split('#')[0] ?? doc.route
    const claims = claimsByRoute.get(route) ?? new Set<string>()
    for (const heading of doc.headings) claims.add(heading)
    claimsByRoute.set(route, claims)
  }
  // If this ever collapses to a handful, the index shrank and the guard went
  // quiet with it.
  expect(claimsByRoute.size).toBeGreaterThan(80)

  const missing: string[] = []
  for (const [route, claims] of claimsByRoute) {
    const response = await request.get(route)
    expect(response.ok(), `${route} did not respond`).toBe(true)
    const rendered = new Set(headingsIn(await response.text()))
    for (const claimed of claims) {
      if (!rendered.has(claimed)) missing.push(`${route} claims "${claimed}"`)
    }
  }

  expect(missing, 'a search document names a heading its page does not render').toEqual([])
})
