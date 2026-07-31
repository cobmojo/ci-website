import { expect, type Page, test } from '@playwright/test'

/**
 * What the site fetches that the reader did not ask for.
 *
 * `<Link>` prefetches a static route in full — the whole React Server
 * Component payload — as soon as the link enters the viewport. For 128 of the
 * 129 routes here that is a few kilobytes and an unambiguous win. For
 * `/full-case/` it is not: the continuous edition is 1.8 MB of HTML, its RSC
 * payload is 190 kB, and it was being downloaded on the home page by every
 * reader who had not asked for it — 38% of that page's entire transfer, in
 * competition with the document, the stylesheet and the two preloaded faces
 * that the largest paint waits on.
 *
 * Measured on the standard Lighthouse mobile configuration, the home page was
 * carrying 686 kB and reaching its largest paint at 3,459ms against a 2,500ms
 * ceiling.
 *
 * So this is a budget, not a ban. Prefetching stays on everywhere it is cheap;
 * a route whose payload is an order of magnitude larger than its neighbours
 * has to be asked for. The numbers below are measured with room above them,
 * and they are deliberately absolute: a relative budget would rise with the
 * thing it is meant to catch.
 */

/** Bytes of speculative route payload one page load may start. */
const TOTAL_PREFETCH_BUDGET = 80_000

/** Bytes any single speculative route payload may be. */
const SINGLE_PREFETCH_BUDGET = 30_000

interface Prefetch {
  readonly route: string
  readonly bytes: number
}

/**
 * Watch the wire, not the markup.
 *
 * A `prefetch={false}` that a refactor drops is invisible in a snapshot and
 * obvious here. Sizes come from the response body rather than
 * `Content-Length`, because the payloads are streamed.
 */
async function prefetchesDuring(page: Page, route: string): Promise<Prefetch[]> {
  const seen: Prefetch[] = []

  page.on('response', response => {
    const url = new URL(response.url())
    if (!url.searchParams.has('_rsc')) return
    void response
      .body()
      .then(body => seen.push({ route: url.pathname, bytes: body.length }))
      .catch(() => {
        /* a payload that never arrived cost nothing */
      })
  })

  await page.goto(route)
  // Prefetching is driven by an IntersectionObserver, so it starts after
  // hydration and after layout. Settle before counting, or the budget passes
  // by measuring a moment too early.
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  return seen
}

const ROUTES = [
  '/',
  '/start/',
  '/case/',
  '/download/',
  '/scripture/',
  '/case/key-texts/eternal-punishment/',
] as const

for (const route of ROUTES) {
  test(`${route} starts no speculative download it cannot justify`, async ({ page }) => {
    const prefetches = await prefetchesDuring(page, route)
    const total = prefetches.reduce((sum, entry) => sum + entry.bytes, 0)

    const largest = prefetches.reduce<Prefetch>(
      (worst, entry) => (entry.bytes > worst.bytes ? entry : worst),
      { route: 'none', bytes: 0 },
    )

    console.log(
      `    ${route.padEnd(38)} ${String(prefetches.length).padStart(2)} prefetches, ` +
        `${String(total).padStart(7)} bytes, largest ${largest.route} at ${largest.bytes}`,
    )

    expect(
      largest.bytes,
      `${route} prefetched ${largest.bytes} bytes of ${largest.route} before anyone asked for it`,
    ).toBeLessThan(SINGLE_PREFETCH_BUDGET)

    expect(
      total,
      `${route} started ${total} bytes of speculative route payload during its own load, ` +
        'which competes with the document, the stylesheet and the fonts the largest paint waits on',
    ).toBeLessThan(TOTAL_PREFETCH_BUDGET)
  })
}

test('the one link that is allowed to prefetch does, once it is in view', async ({ page }) => {
  /*
   * The other half of the policy. Inverting the default is only defensible if
   * the exception works: sequential reading is the one navigation on this site
   * that is predictable, so Previous and Next are prefetched — but only when
   * the reader reaches them, which on a section four thousand words long is a
   * scroll rather than a page load. An assertion that they prefetch on load
   * would be asserting the opposite of what the budget above requires.
   */
  const seen: string[] = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.searchParams.has('_rsc')) seen.push(url.pathname)
  })

  await page.goto('/case/key-texts/eternal-punishment/')
  await page.waitForLoadState('networkidle')
  expect(seen, 'nothing is prefetched before the reader has read anything').toEqual([])

  const next = page.getByRole('link', { name: /^Next/ }).first()
  await next.scrollIntoViewIfNeeded()
  const target = new URL(await next.evaluate(a => (a as HTMLAnchorElement).href)).pathname

  await expect
    .poll(() => seen, { message: `${target} was never prefetched after coming into view` })
    .toContain(target)
})

test('the continuous edition is still one press away, and still prefetch-free', async ({
  page,
}) => {
  /*
   * The other half of the budget: not prefetching must not mean not
   * navigating. The link is a real link, it goes to the real page, and the
   * client-side navigation still happens — it just starts when the reader
   * presses it.
   */
  const prefetches = await prefetchesDuring(page, '/case/')
  expect(
    prefetches.some(entry => entry.route === '/full-case/'),
    'the continuous edition was prefetched from the case index',
  ).toBe(false)

  const link = page.getByRole('link', { name: /read (the )?(whole|full|continuous)/i }).first()
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/full-case\/$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Full Case' })).toBeVisible()
})
