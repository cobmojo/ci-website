import type { APIRequestContext } from '@playwright/test'
import { expect, type Page, test } from '@playwright/test'

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

/**
 * Heading text as a reader hears it: React's comment markers, the anchor and
 * anything `aria-hidden` removed.
 *
 * A `Callout` heading carries its tone glyph in an `aria-hidden` span inside
 * the heading, so the raw text of "Open questions" is "? Open questions".
 * Assistive technology does not say the glyph and the index should not claim
 * it, so neither does this.
 */
function headingsIn(html: string): { level: number; text: string }[] {
  return [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(([, level, inner]) => ({
    level: Number(level),
    text: decodeEntities(
      (inner ?? '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' '),
    )
      .replace(/#$/, '')
      .trim(),
  }))
}

/**
 * Headings every page of a kind carries, which the index deliberately leaves
 * out. Indexing them would match every passage on the word "sources" without
 * telling a reader anything.
 */
const CHROME_HEADINGS = new Set([
  'Sources for this topic',
  'Sources consulted for this passage',
  'Sources cited on this page',
  'Found an error or have a counterargument?',
  'Revisions to this page',
  'Start here',
  'Read',
  'How this was made',
  'This site',
])

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
  const unclaimed: string[] = []
  for (const [route, claims] of claimsByRoute) {
    const response = await request.get(route)
    expect(response.ok(), `${route} did not respond`).toBe(true)
    const headings = headingsIn(await response.text())
    const rendered = new Set(headings.map(heading => heading.text))

    for (const claimed of claims) {
      if (!rendered.has(claimed)) missing.push(`${route} claims "${claimed}"`)
    }

    // The other direction. Checking only that claims are real cannot see a
    // heading left out, and one was: "Open questions" is a real h2 on 23 of the
    // 27 topics that no list ever named, so a search for its wording matched
    // nothing in the headings. Only the two templated kinds are checked this
    // way — the MDX pages take their headings from the body and cannot drift.
    //
    // Level 2 only. The subheadings under "How the passage is interpreted" are
    // the same four on all eighteen passages, so indexing them would match
    // every passage on "the conditionalist reading" and tell a reader nothing,
    // which is the reason the chrome is left out too.
    const templated = /^\/(topics|passages)\/[^/]+\/$/.test(route)
    if (templated) {
      for (const heading of headings) {
        if (heading.level !== 2) continue
        if (CHROME_HEADINGS.has(heading.text) || claims.has(heading.text)) continue
        unclaimed.push(`${route} renders "${heading.text}"`)
      }
    }
  }

  expect(missing, 'a search document names a heading its page does not render').toEqual([])
  expect(unclaimed, 'a page renders a heading its search document never claims').toEqual([])
})

/* ------------------------------------------------------------------ *
 * The correction form without JavaScript
 * ------------------------------------------------------------------ */

/**
 * The API route's own docstring promises this form works without JavaScript,
 * and it did not. The page was statically prerendered and read its query
 * string in the browser, so the server sent the same bytes to everyone: a
 * reader without scripting submitted a correction, was redirected back, and
 * saw a page that looked untouched — no confirmation, no error, and the
 * section they were correcting silently dropped from the hidden field. The
 * natural response is to send it again, five times, into the rate limit.
 */
test.describe('the correction form without scripting', () => {
  test.use({ javaScriptEnabled: false })

  test('says a submission was received, where the reader can see it', async ({ page }) => {
    // The fragment is the whole point. `toBeVisible` is not enough on its own:
    // it asks only for a non-empty box, and this message sits about 2,000px
    // down the page, so without the fragment the reader lands on what still
    // looks like an untouched form.
    await page.goto('/corrections/?submitted=1#submission-status')
    const status = page.getByText('Received.')
    await expect(status).toBeVisible()
    await expect(status).toBeInViewport()
  })

  test('tells a rejected submission apart from one the server could not store', async ({
    page,
  }) => {
    await page.goto('/corrections/?submitted=0#submission-status')
    const rejected = page.getByText(/values sent could not be accepted/)
    await expect(rejected).toBeVisible()
    await expect(rejected).toBeInViewport()

    // A storage failure is not the reader's fault, and telling them to check
    // their wording sends them back into a failure that will repeat.
    await page.goto('/corrections/?submitted=error#submission-status')
    const notRecorded = page.getByText(/fault at our end, not with what you wrote/)
    await expect(notRecorded).toBeVisible()
    await expect(notRecorded).toBeInViewport()
  })

  test('a failed submission keeps the section, heading and type for the retry', async ({
    page,
  }) => {
    // The reader is told to send it again, so the form they resend from has to
    // be the form they arrived with. Losing the context here delivers the
    // retry with no page attached and relabelled as a factual correction —
    // the exact failure the redirect was rebuilt to prevent.
    await page.goto('/corrections/?submitted=0&section=S04&heading=the-text&type=broken-link')

    await expect(page.locator('input[name="sectionId"]')).toHaveValue('S04')
    await expect(page.locator('input[name="headingId"]')).toHaveValue('the-text')
    await expect(page.locator('select[name="type"]')).toHaveValue('broken-link')
  })

  test('offers a video control that works', async ({ page }) => {
    // The poster was an 830x466 button that produced no request, no iframe and
    // no explanation when pressed without scripting. It is a link to the video
    // until the script that can load it in place has run.
    await page.goto('/watch/')
    const poster = page.locator('a.video-play')
    await expect(poster).toBeVisible()
    await expect(poster).toHaveAttribute('href', /youtu\.be|youtube/)
    await expect(poster).toHaveAttribute('target', '_blank')
    // It says what it will do, rather than promising to load a player that
    // cannot load.
    await expect(poster).toContainText('Watch it on YouTube')
  })

  test('carries the section and the type a reader arrived with', async ({ page }) => {
    await page.goto('/corrections/?section=S04&heading=the-text&type=broken-link#form')

    // Every feedback link on the site ends in `#form`. The link checker cannot
    // see this page any more — it renders on demand, so there is no file for it
    // to read — so the anchor is asserted here instead.
    await expect(page.locator('#form')).toHaveCount(1)
    await expect(page.locator('input[name="sectionId"]')).toHaveValue('S04')
    await expect(page.locator('input[name="headingId"]')).toHaveValue('the-text')
    await expect(page.locator('select[name="type"]')).toHaveValue('broken-link')
  })
})

/* ------------------------------------------------------------------ *
 * What the reader actually gets
 * ------------------------------------------------------------------ */

test('a collapsed disclosure prints its contents', async ({ page }) => {
  // `/accessibility/` promises "disclosures are opened so that nothing is lost
  // inside a collapsed section". The browser's own stylesheet puts
  // `content-visibility: hidden` on `::details-content`, which no rule on the
  // children can reach, so every closed disclosure printed as its summary and
  // nothing else: a 49px box where the content is 3,902px and four tables.
  await page.emulateMedia({ media: 'print' })
  await page.goto('/case/biblical-language/body-and-soul/')

  const printed = await page.evaluate(() =>
    [...document.querySelectorAll('details')]
      // The contents panel is `print:hidden` and correctly prints nothing.
      .filter(details => details.getBoundingClientRect().height > 0)
      .map(details => ({
        open: details.open,
        height: Math.round(details.getBoundingClientRect().height),
        contentVisibility: getComputedStyle(details, '::details-content').contentVisibility,
        characters: (details.textContent ?? '').replace(/\s+/g, ' ').trim().length,
      })),
  )

  expect(printed.length).toBeGreaterThan(0)
  for (const details of printed) {
    expect(details.contentVisibility, 'a printed disclosure is still collapsed').not.toBe('hidden')
    expect(details.characters, 'a printed disclosure carries only its summary').toBeGreaterThan(200)
  }
})

test('paper carries no control and no navigation', async ({ page }) => {
  // `/accessibility/` and `/full-case/` both promise that navigation and
  // interactive controls are dropped from the printed copy. Three surfaces
  // were not: the correction form printed a page and a half of empty boxes
  // under a "Send submission" button, and two navigation panels printed
  // several pages of links, one of them addressing a player the same
  // stylesheet removes.
  await page.emulateMedia({ media: 'print' })

  const tallest = (selector: string) =>
    page.evaluate(
      css =>
        [...document.querySelectorAll(css)].reduce(
          (max, element) => Math.max(max, element.getBoundingClientRect().height),
          0,
        ),
      selector,
    )

  await page.goto('/corrections/')
  expect(await tallest('form, input, select, textarea, button')).toBe(0)
  // And says where to go instead, since a paper reader cannot use the form.
  await expect(page.getByText(/\/corrections\/ in a browser/)).toBeVisible()

  await page.goto('/watch/')
  expect(await tallest('nav[aria-labelledby="chapters-title"]')).toBe(0)

  await page.goto('/changelog/')
  expect(await tallest('nav[aria-labelledby="by-part"]')).toBe(0)
})

test('a transcript timestamp seeks a video that is already playing', async ({ page }) => {
  await page.goto('/watch/')
  await page.locator('a.video-play').click()

  const player = page.locator('iframe.video-frame')
  await expect(player).toBeVisible()
  // Nothing in the src said where to start, because the reader had not asked
  // for a timestamp yet.
  await expect(player).not.toHaveAttribute('src', /start=/)

  const timestamps = page.locator('a[href^="?t="]')
  await timestamps.nth(1).click()

  // Without this the src came back byte-identical: the video carried on where
  // it was while the page pulled the reader up to the player, and nothing said
  // the seek had not happened.
  await expect(player).toHaveAttribute('src', /[?&]start=\d+/)

  // Twice on the same timestamp, which is what a reader does to hear a passage
  // again. Modelled as a value rather than a request, the second press set the
  // state to what it already held, React declined to re-render, and the frame
  // never reloaded. The count of load events is the only honest witness: the
  // `src` is identical by design here.
  const rebuiltOnRepeat = await playerWasRebuilt(page, async () => {
    await timestamps.nth(1).click()
  })
  expect(rebuiltOnRepeat, 'pressing the same timestamp twice did not reload the player').toBe(true)

  // And the opening chapter, whose offset is zero — the value the player
  // starts life holding, so it was dropped for the same reason. The previous
  // version of this test excluded it by hand.
  const rebuiltOnZero = await playerWasRebuilt(page, async () => {
    await timestamps.first().click()
  })
  expect(rebuiltOnZero, 'the 0:00 timestamp did not reload the player').toBe(true)
  await expect(player).not.toHaveAttribute('src', /[?&]start=/)
})

test('the poster link goes where a click on it would go', async ({ page }) => {
  await page.goto('/watch/')

  // The href was a constant, so everything that follows the poster as a link
  // rather than running its handler — Ctrl or middle click, "open in a new
  // tab", dragging it, the address a reader reads in the status bar before
  // deciding — offered the video from the beginning, while a plain click on
  // the same element in the same state started at the requested moment.
  const timestamp = page.locator('a[href^="?t="]').nth(3)
  const requested = (await timestamp.getAttribute('href'))?.match(/\?t=(\d+)/)?.[1]
  expect(requested).toBeTruthy()

  await timestamp.click()
  const poster = page.locator('a.video-play')
  await expect(poster).toHaveAttribute('href', new RegExp(`[?&]t=${requested}$`))

  // And after Back, which is an ordinary "undo that". The href comes from
  // state and the click reads the address bar, so they agreed only while the
  // history moved forward: Back left the href pointing at the moment the
  // reader had just undone.
  await page.goBack()
  await expect(page).toHaveURL(/\/watch\/$/)
  await expect(poster).not.toHaveAttribute('href', /[?&]t=\d/)
})

/**
 * Did the player get rebuilt while `act` ran?
 *
 * Node identity is the only honest signal here. A repeat seek produces a
 * byte-identical `src`, so comparing the attribute cannot see it; counting
 * `load` events cannot either, and a version of this helper that tried was
 * measured passing against the very defect it was written for. Marking the
 * element and looking for the mark afterwards asks the real question: did
 * React tear this frame down and build a new one, which is what makes the
 * video actually seek.
 */
async function playerWasRebuilt(page: Page, act: () => Promise<void>): Promise<boolean> {
  await page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('iframe.video-frame')
    if (frame) frame.dataset.seekProbe = 'before'
  })
  await act()
  await page.waitForTimeout(600)
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>('iframe.video-frame')
    return Boolean(frame) && frame?.dataset.seekProbe !== 'before'
  })
}

test('filtering the Scripture index leaves nothing pointing at hidden sections', async ({
  page,
}) => {
  await page.goto('/scripture/')

  const jumpNav = page.locator('[data-book-jump]')
  await expect(jumpNav).toBeVisible()

  await page.getByLabel(/Reference contains/i).fill('matthew 10')

  // Forty-four book links stayed clickable while forty-three of them pointed at
  // `display: none` sections: the address bar gained a fragment and the page
  // did not move, with nothing to say why.
  await expect(jumpNav).toBeHidden()
  await expect(page.locator('[data-book-group]:visible')).toHaveCount(1)
  await expect(page.locator('[data-testament]:visible')).toHaveCount(1)

  // And a filter matching nothing says so, rather than leaving two headings
  // counting references that are not there.
  await page.getByLabel(/Reference contains/i).fill('zzzqqq')
  await expect(page.locator('[data-testament]:visible')).toHaveCount(0)
  await expect(page.getByText(/Nothing in the index matches that/)).toBeVisible()
})

/* ------------------------------------------------------------------ *
 * State a reader accumulates
 * ------------------------------------------------------------------ */

test('a second tab adds to the reading record rather than replacing it', async ({ context }) => {
  // The record was written from memory, so a tab that had loaded before any
  // reading held an empty list, and one click there replaced four parts
  // recorded in the other tab with one.
  const first = await context.newPage()
  const second = await context.newPage()
  await first.goto('/case/')
  await second.goto('/case/')

  await first.evaluate(() =>
    localStorage.setItem('ci:case-reading-progress', JSON.stringify(['S07', 'S10', 'S16', 'S17'])),
  )
  await second.locator('a[data-section-id]').first().click()

  const stored = await second.evaluate(() =>
    JSON.parse(localStorage.getItem('ci:case-reading-progress') ?? '[]'),
  )
  expect(stored).toEqual(expect.arrayContaining(['S07', 'S10', 'S16', 'S17']))
  expect(stored.length).toBeGreaterThan(4)
})

test('the reading count never exceeds what the page can mark', async ({ page }) => {
  await page.goto('/case/')
  // Ids of the right shape that are not on this page: the count was taken from
  // storage, so it read "4 of 40" above a single marker, and a larger store
  // read "45 of 40".
  await page.evaluate(() =>
    localStorage.setItem(
      'ci:case-reading-progress',
      JSON.stringify(['ZZ99', 'QQ1', 'AAA12', 'S04']),
    ),
  )
  await page.reload()

  await expect(page.getByText(/You have opened 1 of 40 pages/)).toBeVisible()

  // By part, not by marker: the hub lists some sections twice, once in the
  // guided order and once on the essential path, so one opened part can carry
  // two markers. What matters is that only the part actually on the page is
  // marked.
  const markedParts = await page.evaluate(() => [
    ...new Set(
      [...document.querySelectorAll<HTMLElement>('[data-visited-marker]')]
        .filter(marker => marker.checkVisibility())
        .map(marker => marker.closest('[data-section-entry]')?.getAttribute('data-section-entry')),
    ),
  ])
  expect(markedParts).toEqual(['S04'])

  // And the count the test is named for: membership alone did not deduplicate,
  // so one id stored forty-five times still read "45 of 40 pages".
  await page.evaluate(() =>
    localStorage.setItem('ci:case-reading-progress', JSON.stringify(Array(45).fill('S04'))),
  )
  await page.reload()
  await expect(page.getByText(/You have opened 1 of 40 pages/)).toBeVisible()
})

test('search filters do not survive a URL that does not carry them', async ({ page }) => {
  await page.goto('/search/?q=hell&type=objection&book=Matthew')
  await expect(page.locator('input[name="type"]:checked')).toHaveCount(1)

  // A soft navigation, not a second `page.goto`. A full load re-renders the
  // defaults from the server whatever the key does, so a `goto`-based version
  // of this test passes with the key deleted.
  const trigger = page.locator('a.search-trigger')
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Search this site' })

  // And a query that spells the filter it must not be confused with: the key
  // was a comma-joined string, so "hell,objection" and "hell" plus the
  // Objections filter produced the same key and the form did not remount.
  await dialog.getByRole('searchbox', { name: 'Search terms' }).fill('hell,objection')
  await dialog.getByRole('link', { name: /full search page/i }).click()

  await expect(page).toHaveURL(/q=hell%2Cobjection/)
  await expect(page.locator('input[name="type"]:checked')).toHaveCount(0)
  await expect(page.locator('select[name="book"]')).toHaveValue('')
})

test('the search index is fetched once, however search is opened', async ({ page }) => {
  await page.goto('/case/')
  const trigger = page.locator('a.search-trigger')
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')

  // Hover then click inside one gesture fired two prewarms 8ms apart, and the
  // guard was React state that had not committed between them: 610kB twice.
  await trigger.hover()
  await trigger.click()
  await expect(page.getByRole('dialog', { name: 'Search this site' })).toBeVisible()

  const indexFetches = () =>
    page.evaluate(
      () =>
        performance
          .getEntriesByType('resource')
          .filter(entry => entry.name.includes('search-index.json')).length,
    )

  await expect.poll(indexFetches).toBe(1)
})

test('search recovers from a failed index fetch, as the failure message promises', async ({
  page,
}) => {
  // The guard that stopped the double fetch was a ref set before the request
  // and released nowhere, so one dropped connection ended search for the whole
  // session — while the pane said "Reopen search to try again". Counting
  // fetches on the success path cannot see that: a latched guard produces the
  // same 1.
  let failNext = true
  await page.route('**/search-index.json', route => {
    if (failNext) {
      failNext = false
      return route.abort('connectionfailed')
    }
    return route.continue()
  })

  await page.goto('/case/')
  const trigger = page.locator('a.search-trigger')
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await expect(dialog.getByText(/could not load/i)).toBeVisible()

  // Reopening is the recovery the reader is told to perform.
  await page.keyboard.press('Escape')
  await trigger.click()
  await dialog.getByRole('searchbox', { name: 'Search terms' }).fill('gehenna')
  await expect(dialog.getByRole('listitem').first()).toBeVisible()
})

test('the card route always answers with a card', async ({ request }) => {
  // `ImageResponse` streams, so a renderer failure lands after the handler has
  // returned: an Arabic title closed the socket with no response written at
  // all. The bytes are buffered now so the failure can be answered.
  const titles = [
    '', // no title at all
    'Mark 9:42-48',
    'العذاب الأبدي', // the script that produced no reply
    'Hell 🔥 forever? 家族',
    'x'.repeat(400),
  ]

  for (const title of titles) {
    const response = await request.get(`/og/?title=${encodeURIComponent(title)}`)
    expect(response.status(), `no card for ${JSON.stringify(title.slice(0, 20))}`).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
    expect((await response.body()).length).toBeGreaterThan(1000)
  }
})

test('the search index can be revalidated rather than refetched', async ({ request }) => {
  // 610kB with `must-revalidate` and no validator meant every visit
  // re-downloaded it — three visits cost 1.8MB — while /privacy/ described it
  // as downloaded the first time search is opened.
  const response = await request.get('/search-index.json')
  expect(response.status()).toBe(200)

  const headers = response.headers()
  expect(headers.etag, 'no validator to revalidate against').toBeTruthy()
  expect(headers['cache-control']).toMatch(/max-age=[1-9]/)
})

/**
 * One noun, one meaning.
 *
 * The case is 37 parts — three roadblocks and thirty-four numbered arguments —
 * and the hub lists 40 pages, those parts plus a preface and two appendices.
 * The homepage, the 404, /start/ and the header nav all send a reader to
 * "thirty-seven parts"; the hub then headed its list "All 40 parts", said
 * "Everything in the forty parts", and counted progress "of 40 parts", three
 * screens below its own sentence defining the preface and appendices as
 * alongside the parts rather than among them. A reader given one number and
 * shown another has no way to tell which is wrong.
 *
 * Both counts are real and the unit test pins both. What could not stand is
 * the one word carrying both, so "parts" now always means the 37.
 */
test('the case is never described as forty parts', async ({ page }) => {
  for (const route of ['/', '/case/', '/start/', '/objections/', '/no-such-page/']) {
    await page.goto(route)
    const text = await page.locator('body').innerText()
    expect(text, `${route} says "parts" of a count that is not 37`).not.toMatch(
      /(?:40|forty)\s+parts/i,
    )
  }

  // And the hub agrees with the number every other surface gives.
  await page.goto('/case/')
  await expect(page.getByText(/thirty-seven parts/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'All 40 pages' })).toBeVisible()
})
