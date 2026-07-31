import type { APIRequestContext, Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

/**
 * Every public route, rendered, at every width a reader turns up on.
 *
 * `responsive.spec.ts` walks a hand-picked list of thirty-one routes that
 * covers every distinct layout, which is the right shape for the detailed
 * layout assertions it makes. This is the other half: a shallower check over
 * *all* of them, driven by the sitemap so a route cannot be added without
 * being swept. A handwritten list cannot answer "is any page broken"; it can
 * only answer "is any of these thirty-one pages broken".
 *
 * One test per viewport rather than one per route × viewport. Six hundred
 * Playwright tests would take longer to schedule than to run, and a failure
 * that names every offending route at once is easier to act on than six
 * hundred results with four reds in them. Each failure carries its route, so
 * diagnosis does not suffer.
 */

/** Public, but deliberately absent from the sitemap because both are noindex. */
const EXTRA_ROUTES = ['/full-case/', '/search/']

const VIEWPORTS = [
  { label: '320 narrowest phone', width: 320, height: 640 },
  { label: '375 phone', width: 375, height: 812 },
  { label: '768 tablet portrait', width: 768, height: 1024 },
  { label: '1280 laptop', width: 1280, height: 800 },
  { label: '1920 wide desktop', width: 1920, height: 1080 },
] as const

/** Console noise that is the browser talking about itself, not about the page. */
const IGNORABLE = [/favicon/i, /Download the React DevTools/i]

async function publicRoutes(request: APIRequestContext): Promise<string[]> {
  const response = await request.get('/sitemap.xml')
  expect(response.status(), 'the sitemap must be served for the sweep to have a list').toBe(200)
  const routes = [...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    match => new URL(match[1] as string).pathname,
  )
  expect(
    routes.length,
    'the sitemap listed almost nothing; refusing to report a green sweep',
  ).toBeGreaterThan(100)
  return [...routes, ...EXTRA_ROUTES]
}

interface Problem {
  readonly route: string
  readonly what: string
}

/** Everything that can be wrong with a rendered page, checked in one visit. */
async function inspect(page: Page, route: string): Promise<Problem[]> {
  const problems: Problem[] = []
  const consoleErrors: string[] = []
  const pageErrors: string[] = []

  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (IGNORABLE.some(pattern => pattern.test(text))) return
    consoleErrors.push(text)
  }
  const onPageError = (error: Error) => pageErrors.push(error.message)

  page.on('console', onConsole)
  page.on('pageerror', onPageError)

  try {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    const status = response?.status() ?? 0
    if (status !== 200) problems.push({ route, what: `answered ${status}` })

    const measured = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(element => element.id)
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
      const fragments = [...document.querySelectorAll('a[href^="#"]')]
        .map(anchor => (anchor.getAttribute('href') as string).slice(1))
        .filter(id => id.length > 0)
      const broken = fragments.filter(id => {
        try {
          return document.getElementById(decodeURIComponent(id)) === null
        } catch {
          return document.getElementById(id) === null
        }
      })
      return {
        h1: document.querySelectorAll('h1').length,
        mains: document.querySelectorAll('main').length,
        lang: document.documentElement.lang,
        title: document.title,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        duplicates: [...new Set(duplicates)],
        brokenFragments: [...new Set(broken)],
      }
    })

    if (measured.h1 !== 1) problems.push({ route, what: `${measured.h1} first-level headings` })
    if (measured.mains !== 1) problems.push({ route, what: `${measured.mains} main landmarks` })
    if (!measured.lang) problems.push({ route, what: 'no lang on the document' })
    if (!measured.title.trim()) problems.push({ route, what: 'no document title' })
    if (measured.overflow > 1) {
      problems.push({ route, what: `scrolls sideways by ${measured.overflow}px` })
    }
    if (measured.duplicates.length > 0) {
      problems.push({ route, what: `duplicate ids: ${measured.duplicates.join(', ')}` })
    }
    if (measured.brokenFragments.length > 0) {
      problems.push({
        route,
        what: `fragments pointing nowhere: ${measured.brokenFragments.join(', ')}`,
      })
    }
  } catch (error) {
    problems.push({ route, what: `did not render: ${(error as Error).message}` })
  } finally {
    page.off('console', onConsole)
    page.off('pageerror', onPageError)
  }

  for (const message of consoleErrors) problems.push({ route, what: `console error: ${message}` })
  for (const message of pageErrors) problems.push({ route, what: `uncaught: ${message}` })

  return problems
}

for (const viewport of VIEWPORTS) {
  test(`every public route is sound at ${viewport.label}`, async ({ page, request }) => {
    const routes = await publicRoutes(request)
    await page.setViewportSize({ width: viewport.width, height: viewport.height })

    const problems: Problem[] = []
    for (const route of routes) problems.push(...(await inspect(page, route)))

    expect(
      problems.map(problem => `${problem.route}: ${problem.what}`),
      `${problems.length} problem(s) across ${routes.length} routes at ${viewport.label}`,
    ).toEqual([])
  })
}

test('the sweep covers every route the sitemap lists, and then some', async ({ request }) => {
  // Guards the guard: a sweep over an empty list passes silently.
  const routes = await publicRoutes(request)
  expect(new Set(routes).size).toBe(routes.length)
  for (const extra of EXTRA_ROUTES) expect(routes).toContain(extra)
})
