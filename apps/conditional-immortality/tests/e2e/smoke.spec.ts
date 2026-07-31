import { expect, test } from '@playwright/test'

/**
 * The production flows that must work in every engine, and against a real
 * deployment.
 *
 * This file is the cross-browser and deployed-preview suite. Everything in it
 * is deliberately origin-agnostic: it reads nothing from `.next`, assumes no
 * build artefact on disk, and uses only relative URLs, so the same tests run
 * against a locally served production build, a preview deployment or a staging
 * host with nothing but `PLAYWRIGHT_BASE_URL` changed.
 *
 * Scope is chosen rather than copied. Running the whole suite in four engines
 * would quadruple the run to re-prove things that cannot differ between
 * engines — content, metadata, redirects — while a carefully chosen set of
 * flows catches the things that can: layout, focus, dialog behaviour, and
 * whether the page works at all.
 */

/** Hosts the site must not contact until a reader asks it to. */
const THIRD_PARTY_HOSTS = ['youtube.com', 'youtube-nocookie.com', 'ytimg.com', 'youtu.be']

function isThirdParty(url: string, baseUrl: string): boolean {
  try {
    const host = new URL(url).hostname
    const own = new URL(baseUrl).hostname
    if (host === own) return false
    return host !== 'localhost' && host !== '127.0.0.1'
  } catch {
    return false
  }
}

test('the home page renders its argument, not just a shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('conditional immortality', {
    ignoreCase: true,
  })
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toBeVisible()
})

test('an article renders its Scripture and its citations', async ({ page }) => {
  await page.goto('/case/key-texts/eternal-punishment/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const main = page.getByRole('main')
  await expect(main.locator('.scripture-block').first()).toBeVisible()
  await expect(main).toContainText('Matthew')
})

test('exactly one first-level heading and one main landmark, on every shape of page', async ({
  page,
}) => {
  for (const route of [
    '/',
    '/case/',
    '/case/key-texts/eternal-punishment/',
    '/search/',
    '/watch/',
  ]) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 }), route).toHaveCount(1)
    await expect(page.getByRole('main'), route).toHaveCount(1)
  }
})

test('the search page answers a query without any scripting', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/search/?q=fire')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('main')).toContainText(/result/i)
  await context.close()
})

test('the quick-search dialog opens, answers, and closes on Escape', async ({ page }) => {
  await page.goto('/')

  const trigger = page.getByRole('link', { name: 'Search', exact: true })
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await expect(dialog).toBeVisible()

  const field = dialog.getByRole('searchbox', { name: 'Search terms' })
  await field.fill('gehenna')
  await expect(dialog.getByRole('listitem').first()).toBeVisible()

  /*
   * One press, and it closes — in every engine this project runs.
   *
   * This used to allow two presses, on the reasoning that Escape inside a
   * non-empty `<input type="search">` clears the field first and the dialog
   * should not fight the platform. That decision was reversed: losing the
   * query *and* keeping the panel open costs the reader two things at once,
   * and only when they have something to lose. Escape dismissing a modal is
   * what the ARIA authoring practices describe.
   *
   * Asserted on the dialog rather than on a conditional read of its
   * visibility: the panel stays painted through its 150ms exit, so
   * `isVisible()` immediately after the press answers "yes" to a dialog that
   * is already closing, and the branch it used to take then waited fifteen
   * seconds for a field that was being removed.
   */
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('the skip link comes first, is visible once focused, and moves focus', async ({ page }) => {
  await page.goto('/')

  const skip = page.getByRole('link', { name: 'Skip to main content' })

  /*
   * That it is *first* is the site's property, and is asserted in DOM order
   * rather than by pressing Tab. WebKit does not move Tab focus to links at all
   * unless the platform's full-keyboard-access preference is on — measured
   * here: the first Tab lands on the video poster button, skipping the skip
   * link and every navigation link — and that is a user-agent setting, not
   * something this site controls. Asserting Tab order in a cross-engine suite
   * would be asserting the preference. Tab reachability is covered where it is
   * a site property, in `motion.spec.ts` and `reading.spec.ts`.
   */
  const isFirstFocusable = await page.evaluate(() => {
    const candidates = document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    return candidates[0]?.classList.contains('skip-link') ?? false
  })
  expect(isFirstFocusable, 'something focusable precedes the skip link').toBe(true)

  await skip.focus()
  await expect(skip).toBeFocused()

  /*
   * Polled, not sampled once. The link slides in over `--motion-overlay-exit`
   * for a reader with no motion preference, so a single `boundingBox()` taken
   * the instant after Tab reads a position part way through the transition —
   * which is how this passed in Chromium and failed in WebKit while the CSS
   * was identical and correct in both. What is asserted is unchanged: once
   * focused, the link is fully inside the viewport rather than clipped above it.
   */
  await expect
    .poll(async () => (await skip.boundingBox())?.y ?? -1, {
      message: 'the focused skip link never came fully into view',
    })
    .toBeGreaterThanOrEqual(0)

  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('nothing outside this origin is contacted before a reader presses play', async ({
  page,
  baseURL,
}) => {
  const foreign: string[] = []
  page.on('request', request => {
    if (isThirdParty(request.url(), baseURL as string)) foreign.push(request.url())
  })

  for (const route of ['/', '/watch/', '/case/key-texts/eternal-punishment/']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }

  expect(foreign, `contacted: ${foreign.join(', ')}`).toEqual([])
})

test('the video is only fetched once a reader activates it', async ({ page }) => {
  const youtube: string[] = []
  page.on('request', request => {
    const url = request.url()
    if (THIRD_PARTY_HOSTS.some(host => url.includes(host))) youtube.push(url)
  })

  await page.goto('/watch/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(youtube, 'YouTube was contacted before activation').toEqual([])

  /*
   * A link, not a button. The poster is a single element: before hydration it
   * is an ordinary link to YouTube, and once scripting has run it intercepts
   * the click and swaps in the player. A locator that asks for a button here
   * matched nothing and spent the whole test timeout finding that out.
   */
  await page
    .getByRole('link', { name: /press play to load it from youtube/i })
    .first()
    .click()
  await expect(page.locator('iframe')).toBeVisible()
  expect(youtube.length, 'activation did not reach YouTube').toBeGreaterThan(0)
})

test('an address that does not exist answers 404, not a styled 200', async ({ page }) => {
  const response = await page.goto('/this-address-does-not-exist/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('main')).toContainText(/not (exist|found)/i)
})

test('the corrections form is a real form that works without scripting', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/corrections/')

  const form = page.locator('form#form')
  // The canonical, slashed path that `trailingSlash: true` requires: posting to
  // the unslashed one would take a 308 first.
  await expect(form).toHaveAttribute('action', '/api/feedback/')
  await expect(form).toHaveAttribute('method', /post/i)
  await expect(form.getByRole('textbox', { name: /correction, counterargument/i })).toBeVisible()
  await context.close()
})

test('the three downloads are served with the right type and are not empty', async ({
  request,
}) => {
  const expected = [
    ['/download/transcript.txt', 'text/plain'],
    ['/download/bibliography.txt', 'text/plain'],
    ['/download/handout.html', 'text/html'],
  ] as const

  for (const [route, type] of expected) {
    const response = await request.get(route)
    expect(response.status(), route).toBe(200)
    expect(response.headers()['content-type'] ?? '', route).toContain(type)
    expect((await response.text()).length, route).toBeGreaterThan(5_000)
  }
})

test('robots.txt and the sitemap are served and agree with each other', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  expect(robots.status()).toBe(200)
  const robotsText = await robots.text()

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type'] ?? '').toContain('xml')

  const locations = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    match => match[1] as string,
  )
  expect(locations.length).toBeGreaterThan(100)

  const origin = new URL(locations[0] as string).origin
  // Every entry agrees on one origin, and robots points at that same sitemap.
  for (const location of locations) expect(location.startsWith(origin), location).toBe(true)
  if (robotsText.includes('Sitemap:')) {
    expect(robotsText).toContain(`${origin}/sitemap.xml`)
  }
})

test('a shared alias redirects permanently to its canonical route', async ({ request }) => {
  /*
   * Two hops, both permanent: `trailingSlash: true` normalises the unslashed
   * path first, and only then does the alias table match. Asserted as a chain
   * so the intermediate step is documented rather than discovered, and so a
   * change that turns either hop temporary fails here.
   */
  const first = await request.get('/annihilationism', { maxRedirects: 0 })
  expect([301, 308]).toContain(first.status())
  expect(first.headers().location).toContain('/annihilationism/')

  const second = await request.get('/annihilationism/', { maxRedirects: 0 })
  expect([301, 308]).toContain(second.status())
  expect(second.headers().location).toContain('/topics/annihilationism/')

  const destination = await request.get('/topics/annihilationism/')
  expect(destination.status()).toBe(200)
})
