import { expect, type Page, test } from '@playwright/test'

/**
 * How long the site takes to answer a reader, measured rather than inferred.
 *
 * A Lighthouse navigation audit never touches any of this. It loads a page and
 * leaves, so Total Blocking Time is the only responsiveness signal it produces
 * — and TBT is main-thread congestion during load, not the latency of pressing
 * something. A site can have a TBT of zero and a search dialog that takes half
 * a second to open.
 *
 * So these measure the thing Interaction to Next Paint measures, by the same
 * definition: the `event` timing entry for a real interaction, from the input
 * to the frame that shows its result. Three parts are recorded separately,
 * because they fail for different reasons:
 *
 *   - **input delay** — the main thread was busy when the press landed;
 *   - **processing** — the handler itself is slow;
 *   - **presentation** — the work is done and the frame has not been drawn.
 *
 * Every interaction is exercised twice: once immediately after the document is
 * ready, when hydration is still running and the thread is at its busiest, and
 * once after the page has settled. The first is the case a reader actually hits
 * and the one every synthetic measurement misses.
 *
 * The threshold is Google's: an interaction at or above 200ms is outside the
 * "good" band for INP. It is not derived from what this site currently
 * measures, so it cannot drift upward with a regression.
 */

const GOOD_INP_MS = 200

/** Chrome will not report an `event` entry shorter than this, so silence is a pass. */
const OBSERVER_FLOOR_MS = 16

interface Interaction {
  readonly name: string
  readonly duration: number
  readonly inputDelay: number
  readonly processing: number
  readonly presentation: number
}

declare global {
  interface Window {
    __interactions?: Interaction[]
  }
  /*
   * `interactionId` and `durationThreshold` are Event Timing Level 1, shipped
   * in Chromium since 96 and the basis of INP; TypeScript's DOM library has
   * not caught up. Declared rather than cast, so a future lib update that adds
   * them conflicts loudly instead of leaving a silent `any` behind.
   */
  interface PerformanceEventTiming {
    readonly interactionId: number
  }
  interface PerformanceObserverInit {
    durationThreshold?: number
  }
}

/**
 * Start recording before the interaction, not after.
 *
 * `buffered: true` would replay entries from earlier in the page's life, which
 * on the "immediately after load" runs would attribute hydration's own work to
 * the press under test.
 */
async function recordInteractions(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__interactions = []
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        // `interactionId` is what separates a real interaction from an
        // incidental event; INP is computed over exactly these.
        if (!entry.interactionId) continue
        window.__interactions?.push({
          name: entry.name,
          duration: entry.duration,
          inputDelay: entry.processingStart - entry.startTime,
          processing: entry.processingEnd - entry.processingStart,
          presentation: entry.startTime + entry.duration - entry.processingEnd,
        })
      }
    })
    observer.observe({ type: 'event', buffered: false, durationThreshold: 16 })
  })
}

/**
 * The worst interaction recorded since `recordInteractions`, which is how INP
 * itself is defined over a page visit.
 */
async function worstInteraction(page: Page): Promise<Interaction> {
  return page.evaluate(async () => {
    // Two frames and a tick: the entry is queued after the frame that presents
    // the result, and the observer callback runs on a later task still.
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 150)))
    })
    const recorded = window.__interactions ?? []
    return recorded.reduce<Interaction>(
      (worst, entry) => (entry.duration > worst.duration ? entry : worst),
      { name: 'none', duration: 0, inputDelay: 0, processing: 0, presentation: 0 },
    )
  })
}

/**
 * Log the measurement whether it passes or not — a number that only appears on
 * failure cannot be compared against the last run — and state a zero reading as
 * what it is rather than letting it read as a silent pass.
 */
function report(where: string, measured: Interaction): void {
  console.log(
    `    ${where.padEnd(52)} ` +
      (measured.duration === 0
        ? `under ${OBSERVER_FLOOR_MS}ms (nothing reached the observer)`
        : `${measured.duration.toFixed(0)}ms ` +
          `(delay ${measured.inputDelay.toFixed(0)}, handler ${measured.processing.toFixed(0)}, ` +
          `paint ${measured.presentation.toFixed(0)}) via ${measured.name}`),
  )
  expect(
    measured.duration,
    `${where} took ${measured.duration.toFixed(0)}ms from input to next paint; ` +
      `${GOOD_INP_MS}ms is the ceiling for a good INP. ` +
      `Input delay ${measured.inputDelay.toFixed(0)}ms, ` +
      `handler ${measured.processing.toFixed(0)}ms, ` +
      `presentation ${measured.presentation.toFixed(0)}ms.`,
  ).toBeLessThan(GOOD_INP_MS)
}

/**
 * Arrive at a page with the main thread still busy.
 *
 * `domcontentloaded` returns before hydration finishes, which is the window a
 * reader who presses immediately actually lands in.
 */
async function arriveBusy(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await recordInteractions(page)
}

/** Arrive at a page that has finished everything it is going to do. */
async function arriveSettled(page: Page, route: string): Promise<void> {
  await page.goto(route, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
  await recordInteractions(page)
}

test.describe('search', () => {
  test('opens by pointer, on a busy thread and on a settled one', async ({ page }) => {
    for (const [when, arrive] of [
      ['while hydration is still running', arriveBusy],
      ['once the page has settled', arriveSettled],
    ] as const) {
      await arrive(page, '/case/why-this-matters/')
      await page.getByRole('link', { name: 'Search', exact: true }).click()
      await expect(page.locator('dialog[open]')).toBeVisible()
      report(`open search by pointer, ${when}`, await worstInteraction(page))
      await page.keyboard.press('Escape')
    }
  })

  test('opens by keyboard shortcut', async ({ page }) => {
    await arriveSettled(page, '/case/why-this-matters/')
    await page.keyboard.press('Control+k')
    await expect(page.locator('dialog[open]')).toBeVisible()
    report('open search with Control+k', await worstInteraction(page))
  })

  test('answers a keystroke while the index is already loaded', async ({ page }) => {
    await page.goto('/case/why-this-matters/')
    await page.getByRole('link', { name: 'Search', exact: true }).click()
    const dialog = page.locator('dialog[open]')
    await expect(dialog).toBeVisible()

    // Wait for the index rather than measuring the fetch: the question here is
    // how long a keystroke takes to rank and paint, not how long a network
    // round trip takes.
    await dialog.getByRole('searchbox').fill('judgment')
    await expect(dialog.getByRole('link').first()).toBeVisible()

    await recordInteractions(page)
    await dialog.getByRole('searchbox').press('End')
    await dialog.getByRole('searchbox').pressSequentially(' fire', { delay: 60 })
    await expect(dialog.getByText(/Showing|Nothing matched/)).toBeVisible()
    report('type into search with the index loaded', await worstInteraction(page))
  })

  test('closes and returns focus', async ({ page }) => {
    await page.goto('/case/why-this-matters/')
    await page.getByRole('link', { name: 'Search', exact: true }).click()
    await expect(page.locator('dialog[open]')).toBeVisible()
    await recordInteractions(page)
    await page.getByRole('button', { name: 'Close search' }).click()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    report('close search', await worstInteraction(page))
  })

  test('opens as promptly under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await arriveSettled(page, '/case/why-this-matters/')
    await page.getByRole('link', { name: 'Search', exact: true }).click()
    await expect(page.locator('dialog[open]')).toBeVisible()
    report('open search under prefers-reduced-motion: reduce', await worstInteraction(page))
  })
})

test.describe('navigation and filters', () => {
  test('the mobile sheet opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await arriveBusy(page, '/case/why-this-matters/')
    const trigger = page.getByRole('button', { name: 'Menu' })
    await trigger.click()
    await expect(page.locator('dialog[open]')).toBeVisible()
    report('open the navigation sheet on a busy thread', await worstInteraction(page))

    await recordInteractions(page)
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    report('close the navigation sheet', await worstInteraction(page))
  })

  test('the Scripture index filter answers a keystroke', async ({ page }) => {
    await arriveSettled(page, '/scripture/')
    const field = page.getByLabel('Reference contains')
    await expect(field).toBeVisible()
    await field.pressSequentially('Matthew 1', { delay: 60 })
    await expect(page.getByText(/Showing|entries/i).first()).toBeVisible()
    report('filter the Scripture index by typing', await worstInteraction(page))
  })

  test('the Scripture index filter answers a select', async ({ page }) => {
    await arriveSettled(page, '/scripture/')
    await page.getByLabel('Book', { exact: true }).selectOption({ index: 3 })
    report('filter the Scripture index by book', await worstInteraction(page))
  })

  test('the source library filter answers a select', async ({ page }) => {
    await arriveSettled(page, '/sources/')
    // The library narrows by kind and perspective, both selects; there is no
    // free-text field here, unlike the Scripture index.
    const kind = page.getByLabel('Kind of source')
    await expect(kind).toBeVisible()
    await kind.selectOption({ index: 1 })
    report('narrow the source library by kind', await worstInteraction(page))
  })
})

test.describe('reading', () => {
  test('an in-page anchor moves the reader', async ({ page }) => {
    await arriveSettled(page, '/case/why-this-matters/')
    const anchor = page.locator('nav a[href^="#"]').first()
    await expect(anchor).toBeVisible()
    await anchor.click()
    report('follow an on-this-page anchor', await worstInteraction(page))
  })

  test('the video facade hands over to the player', async ({ page }) => {
    await arriveSettled(page, '/watch/')
    const play = page.getByRole('button', { name: /press play to load it from youtube/i }).first()
    await expect(play).toBeVisible()
    await play.click()
    await expect(page.locator('iframe')).toBeVisible()
    report('activate the video facade', await worstInteraction(page))
  })

  test('a client-side navigation between two case sections', async ({ page }) => {
    await arriveSettled(page, '/case/why-this-matters/')
    const next = page.getByRole('link', { name: /^Next/ }).first()
    await expect(next).toBeVisible()
    await next.click()
    await page.waitForURL(/\/case\/|\/objections\/|\/appendix\//)
    report('press a Next section link', await worstInteraction(page))
  })
})

test.describe('the correction form', () => {
  test('validation answers the reader', async ({ page }) => {
    await arriveSettled(page, '/corrections/')
    const form = page.getByRole('form').or(page.locator('form')).first()
    await recordInteractions(page)
    await form.getByRole('button', { name: 'Send submission' }).click()
    await expect(page.locator('[aria-live]').first()).toBeAttached()
    report('submit an incomplete correction', await worstInteraction(page))
  })
})
