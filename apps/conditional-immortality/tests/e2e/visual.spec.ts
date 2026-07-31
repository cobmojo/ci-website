import { expect, test } from '@playwright/test'

/**
 * Visual regression, on a deliberately small set of surfaces.
 *
 * The repository had none, and `docs/implementation-report.md` said so: the
 * text-geometry suite compares predicted and actual line counts and says
 * nothing about appearance. So a token change, a stray utility class or a
 * layout regression could pass every gate the site has.
 *
 * What is protected here is the design system and the high-value layouts — the
 * places where a regression would be systemic — and not every content page. A
 * hundred screenshots of prose would be a hundred baselines to re-approve every
 * time a paragraph is edited, and a suite nobody trusts is worse than no suite:
 * the first reflex on a red becomes `--update-snapshots`.
 *
 * Determinism is the whole game. Every source of drift is pinned:
 *
 * - one engine, one viewport and one device scale factor, fixed by the project;
 * - reduced motion, also set by the project — in Playwright 1.62 it lives under
 *   `contextOptions`, and passing it as a top-level `use` key is accepted and
 *   ignored, which is how the first set of baselines came to be taken with
 *   animation still enabled;
 * - fonts awaited through `document.fonts.ready`, so no shot is taken in the
 *   fallback face;
 * - the caret hidden and scroll positions reset;
 * - dates and counts on these surfaces are registry-derived and change only
 *   when the content does, which is a change worth re-approving.
 *
 * Baselines are committed and were reviewed by eye before being committed;
 * `bun run test:visual:update` regenerates them, and regenerating without
 * looking is the one thing this suite cannot survive.
 */

/** Everything that has to settle before a screenshot means anything. */
async function settle(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready
    window.scrollTo(0, 0)
  })
  // The arrival animations are one frame at most under reduced motion, but the
  // paint after fonts resolve is not.
  await page.waitForTimeout(150)
}

const SHOT = {
  animations: 'disabled',
  caret: 'hide',
  // A hair of tolerance for sub-pixel text rasterisation, far below anything a
  // human would call a change.
  maxDiffPixelRatio: 0.002,
} as const

/**
 * `target` names the thing the shot is about.
 *
 * Without it every shot is the viewport, which is the top 900 pixels — and for
 * a surface whose whole point is below the fold, that is a screenshot of a
 * heading. `table-heavy` was exactly that: a picture of a page title, standing
 * in for a comparison table it never contained. Where a surface is about one
 * component, the shot is of that component; where it is about the page's first
 * impression, the viewport is right.
 */
const SURFACES: ReadonlyArray<{ name: string; route: string; target?: string }> = [
  { name: 'home', route: '/' },
  { name: 'start', route: '/start/' },
  { name: 'article', route: '/case/key-texts/eternal-punishment/' },
  { name: 'case-index', route: '/case/' },
  { name: 'search-results', route: '/search/?q=fire' },
  { name: 'corrections', route: '/corrections/' },
  { name: 'sources', route: '/sources/' },
  { name: 'table-heavy', route: '/start/compare-the-views/', target: 'main table' },
  { name: 'watch-poster', route: '/watch/' },
  { name: 'not-found', route: '/this-address-does-not-exist/' },
  // The article's Scripture treatment, which is the site's most distinctive
  // component and sits well below the fold on every page that has one.
  {
    name: 'scripture-block',
    route: '/case/key-texts/eternal-punishment/',
    target: '.scripture-block',
  },
]

for (const surface of SURFACES) {
  test(`${surface.name} is unchanged`, async ({ page }) => {
    await page.goto(surface.route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const shot = surface.target ? page.locator(surface.target).first() : page
    if (surface.target) await expect(page.locator(surface.target).first()).toBeVisible()
    await settle(page)
    await expect(shot).toHaveScreenshot(`${surface.name}.png`, SHOT)
  })
}

test('the quick-search dialog is unchanged', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('link', { name: 'Search', exact: true })
  await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('searchbox', { name: 'Search terms' }).fill('gehenna')
  await expect(dialog.getByRole('listitem').first()).toBeVisible()
  await settle(page)

  await expect(dialog).toHaveScreenshot('quick-search-dialog.png', SHOT)
})

test('the mobile navigation sheet is unchanged', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.getByRole('button', { name: /menu/i }).click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('mobile-navigation.png', SHOT)
})

test('a form field carries the boundary a reader has to see', async ({ page }) => {
  // The narrowest visual proof of SC 1.4.11: a control against its surround.
  await page.goto('/corrections/')
  const field = page.getByRole('textbox', { name: /correction, counterargument/i })
  await expect(field).toBeVisible()
  await settle(page)
  await expect(field).toHaveScreenshot('form-control.png', SHOT)
})
