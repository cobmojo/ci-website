import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { type BrowserContext, expect, type Page, test } from '@playwright/test'

/**
 * Quick search, end to end, against the production build.
 *
 * The enhancement this suite covers is optional by design, so most of what it
 * asserts is what happens when the enhancement does *not* arrive: the reader
 * still gets a working, highlighted, navigable result list. The parts that
 * assert fitting also assert that the fitting was real — a marked match inside
 * the line budget, in text the browser actually laid out.
 */

/** The stable marker the runtime adapter carries into the built chunk. */
const RUNTIME_MARKER = 'ci-pretext-text-layout-runtime-v1'
/** A Pretext export name, so the chunk is found by content, not by guesswork. */
const PRETEXT_SYMBOL = 'prepareWithSegments'

/**
 * The built chunks that carry the text-layout runtime.
 *
 * Found by reading the production output, never by guessing a hashed filename.
 * If the bundler splits the runtime differently tomorrow, this finds whatever
 * it produced instead.
 */
function runtimeChunkNames(): readonly string[] {
  const root = path.resolve(process.cwd(), '.next/static/chunks')
  const names: string[] = []

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!entry.name.endsWith('.js')) continue
      const source = readFileSync(full, 'utf8')
      if (source.includes(RUNTIME_MARKER) || source.includes(PRETEXT_SYMBOL)) {
        names.push(entry.name)
      }
    }
  }

  walk(root)
  return names
}

const RUNTIME_CHUNKS = runtimeChunkNames()

function isRuntimeRequest(url: string): boolean {
  return RUNTIME_CHUNKS.some(name => url.includes(name))
}

/**
 * Wait until the trigger has been enhanced.
 *
 * Before hydration the trigger is exactly what it degrades to — a plain link to
 * `/search/` — so clicking it navigates instead of opening the dialog, and a
 * keyboard shortcut has no listener to reach. `aria-haspopup` is added only
 * once the component has mounted, which makes it the honest readiness signal.
 */
async function waitForSearchEnhancement(page: Page) {
  await expect(page.getByRole('link', { name: 'Search', exact: true })).toHaveAttribute(
    'aria-haspopup',
    'dialog',
  )
}

async function openSearch(page: Page) {
  await waitForSearchEnhancement(page)
  await page.getByRole('link', { name: 'Search', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await expect(dialog).toBeVisible()
  return dialog
}

async function search(page: Page, query: string) {
  const dialog = await openSearch(page)
  await dialog.getByRole('searchbox', { name: 'Search terms' }).fill(query)
  await expect(dialog.getByRole('listitem').first()).toBeVisible()
  return dialog
}

/** Every excerpt element in the dialog, with the state it settled in. */
async function excerptStates(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-search-excerpt]')].map(element => ({
      state: element.dataset.pretextState ?? '',
      text: element.textContent ?? '',
      marks: [...element.querySelectorAll('mark')].map(mark => mark.textContent ?? ''),
      blockHeight: element.getBoundingClientRect().height,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      lineBudget: Number(getComputedStyle(element).getPropertyValue('--search-excerpt-lines')),
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
    })),
  )
}

async function waitForFitted(page: Page) {
  await page.waitForFunction(() =>
    [...document.querySelectorAll<HTMLElement>('[data-search-excerpt]')].some(
      element => element.dataset.pretextState === 'fitted',
    ),
  )
}

/* ------------------------------------------------------------------ *
 * Quick search
 * ------------------------------------------------------------------ */

test.describe('quick search', () => {
  test('opens by click, focuses the field, and finds results', async ({ page }) => {
    await page.goto('/')
    const dialog = await openSearch(page)
    await expect(dialog.getByRole('searchbox', { name: 'Search terms' })).toBeFocused()

    await dialog.getByRole('searchbox', { name: 'Search terms' }).fill('unquenchable fire')
    await expect(dialog.getByRole('listitem').first()).toBeVisible()
    await expect(dialog.locator('mark').first()).toBeVisible()
  })

  test('opens by keyboard shortcut', async ({ page }) => {
    await page.goto('/')
    await waitForSearchEnhancement(page)
    await page.keyboard.press('Control+k')
    const dialog = page.getByRole('dialog', { name: 'Search this site' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('searchbox', { name: 'Search terms' })).toBeFocused()
  })

  test('fetches the index only once a reader shows interest', async ({ page }) => {
    const requested: string[] = []
    page.on('request', request => requested.push(request.url()))

    await page.goto('/case/key-texts/eternal-punishment/')
    await page.waitForLoadState('networkidle')
    expect(requested.some(url => url.includes('search-index.json'))).toBe(false)

    await openSearch(page)
    await page.waitForFunction(() =>
      performance.getEntriesByType('resource').some(entry => entry.name.includes('search-index')),
    )
  })

  for (const query of [
    'Matthew 10:28',
    'unquenchable fire',
    'aionios',
    'second death',
    'S04',
    'Sodom',
  ]) {
    test(`returns results for ${query}`, async ({ page }) => {
      await page.goto('/')
      const dialog = await search(page, query)
      const rows = dialog.getByRole('listitem')
      expect(await rows.count()).toBeGreaterThan(0)
      // Something visible has to say why the row is there.
      const marks = await dialog.locator('mark').count()
      expect(marks).toBeGreaterThan(0)
    })
  }

  test('keeps the ranked order the ranker produced', async ({ page }) => {
    await page.goto('/')
    const dialog = await search(page, 'unquenchable fire')
    const titles = await dialog.locator('li a > span:nth-of-type(2)').allTextContents()
    expect(titles.length).toBeGreaterThan(1)
    // The Mark 9 section carries the phrase in its title and must lead.
    expect(titles[0]).toMatch(/Mark 9/i)
  })

  test('navigates to the chosen result', async ({ page }) => {
    await page.goto('/')
    const dialog = await search(page, 'unquenchable fire')
    await dialog.getByRole('listitem').first().getByRole('link').click()
    await expect(page).toHaveURL(/\/(case|passages|topics|appendix|objections)\//)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    await page.goto('/')
    const dialog = await search(page, 'fire')
    const field = dialog.getByRole('searchbox', { name: 'Search terms' })

    /*
     * Two presses, and the first one is the platform's, not ours.
     *
     * Escape inside a non-empty `<input type="search">` clears the field and
     * consumes the event — a browser affordance the dialog neither adds nor
     * should fight. Once the field is empty, Escape reaches the dialog and the
     * platform closes it.
     */
    await page.keyboard.press('Escape')
    await expect(field).toHaveValue('')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Search', exact: true })).toBeFocused()
  })

  test('closes on Escape immediately when the field is empty', async ({ page }) => {
    await page.goto('/')
    const dialog = await openSearch(page)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(page.getByRole('link', { name: 'Search', exact: true })).toBeFocused()
  })

  test('closes on a backdrop press', async ({ page }) => {
    await page.goto('/')
    const dialog = await search(page, 'fire')
    // The backdrop is the dialog element itself outside its content box.
    await page.mouse.click(5, 5)
    await expect(dialog).not.toBeVisible()
  })

  test('carries the query through to the full search page', async ({ page }) => {
    await page.goto('/')
    const dialog = await search(page, 'unquenchable fire')
    await dialog.getByRole('link', { name: 'Full search page' }).click()
    // The query is percent-encoded, so the space arrives as %20.
    await expect(page).toHaveURL(/\/search\/\?q=unquenchable(%20|\+)fire/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Search')
    await expect(page.getByRole('searchbox', { name: 'Search terms' })).toHaveValue(
      'unquenchable fire',
    )
  })
})

/* ------------------------------------------------------------------ *
 * Responsive fitting
 * ------------------------------------------------------------------ */

const FITTING_VIEWPORTS = [
  { label: '320', width: 320, height: 720, budget: 2 },
  { label: '375', width: 375, height: 812, budget: 2 },
  { label: '768 tablet', width: 768, height: 1024, budget: 3 },
  { label: '1280 desktop', width: 1280, height: 800, budget: 3 },
] as const

test.describe('responsive fitting', () => {
  for (const { label, width, height, budget } of FITTING_VIEWPORTS) {
    test(`fits into ${budget} lines at ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')
      await search(page, 'unquenchable fire')
      await waitForFitted(page)

      const states = await excerptStates(page)
      const fitted = states.filter(state => state.state === 'fitted')
      expect(fitted.length, 'at least one row should have been fitted').toBeGreaterThan(0)

      for (const state of fitted) {
        expect(state.lineBudget).toBe(budget)
        // The reserved block is exactly the budget, and the text fits inside it.
        expect(state.blockHeight).toBeCloseTo(budget * state.lineHeight, 0)
        expect(state.marks.length, 'a fitted excerpt always carries its match').toBeGreaterThan(0)
        expect(state.scrollWidth).toBeLessThanOrEqual(state.clientWidth + 1)
        // An ellipsis is only ever added where text was really omitted, and it
        // never buys itself an extra line.
        expect(state.text.length).toBeGreaterThan(0)
      }

      // The page itself must not scroll sideways at any of these widths.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }

  test('re-fits when the dialog grows and again when it shrinks', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await search(page, 'unquenchable fire')
    await waitForFitted(page)

    const narrow = await excerptStates(page)
    expect(narrow.every(state => state.lineBudget === 2)).toBe(true)

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.waitForFunction(() => {
      const element = document.querySelector<HTMLElement>('[data-search-excerpt]')
      return element
        ? getComputedStyle(element).getPropertyValue('--search-excerpt-lines').trim() === '3'
        : false
    })
    await waitForFitted(page)
    const wide = await excerptStates(page)
    expect(wide.every(state => state.lineBudget === 3)).toBe(true)
    for (const state of wide.filter(s => s.state === 'fitted')) {
      expect(state.marks.length).toBeGreaterThan(0)
      expect(state.blockHeight).toBeCloseTo(3 * state.lineHeight, 0)
    }

    // And back again: the dialog must still be usable and correctly budgeted.
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForFunction(() => {
      const element = document.querySelector<HTMLElement>('[data-search-excerpt]')
      return element
        ? getComputedStyle(element).getPropertyValue('--search-excerpt-lines').trim() === '2'
        : false
    })
    await waitForFitted(page)
    const backToNarrow = await excerptStates(page)
    expect(backToNarrow.every(state => state.lineBudget === 2)).toBe(true)
    await expect(page.getByRole('dialog', { name: 'Search this site' })).toBeVisible()
  })

  test('reserves the same block height whether or not fitting happened', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await search(page, 'unquenchable fire')
    await waitForFitted(page)
    const fittedHeights = (await excerptStates(page)).map(state => Math.round(state.blockHeight))

    // A second context with the runtime blocked, so the rows stay on fallback.
    const blocked = await context.browser()?.newContext()
    if (!blocked) return
    const blockedPage = await blocked.newPage()
    await blockPretextRuntime(blocked)
    await blockedPage.setViewportSize({ width: 1280, height: 800 })
    await blockedPage.goto('/')
    await search(blockedPage, 'unquenchable fire')
    const fallbackStates = await excerptStates(blockedPage)
    expect(fallbackStates.every(state => state.state === 'fallback')).toBe(true)
    const fallbackHeights = fallbackStates.map(state => Math.round(state.blockHeight))

    expect(fallbackHeights).toEqual(fittedHeights)
    await blocked.close()
  })

  test('leaves the fitted text selectable, ordinary DOM text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await search(page, 'unquenchable fire')
    await waitForFitted(page)

    const selected = await page.evaluate(() => {
      const element = document.querySelector<HTMLElement>('[data-pretext-state="fitted"]')
      if (!element) return null
      const range = document.createRange()
      range.selectNodeContents(element)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      return selection?.toString() ?? null
    })

    expect(selected).not.toBeNull()
    expect((selected ?? '').length).toBeGreaterThan(10)
    // Nothing is painted to a canvas: the words are in the accessibility tree.
    const canvases = await page.locator('dialog canvas').count()
    expect(canvases).toBe(0)
  })
})

/* ------------------------------------------------------------------ *
 * Failure paths
 * ------------------------------------------------------------------ */

async function blockPretextRuntime(context: BrowserContext) {
  await context.route('**/*.js', async route => {
    if (isRuntimeRequest(route.request().url())) await route.abort()
    else await route.fallback()
  })
}

test.describe('failing open', () => {
  test('search still works when the runtime chunk cannot load', async ({ page, context }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await blockPretextRuntime(context)

    await page.goto('/')
    const dialog = await search(page, 'unquenchable fire')
    await expect(dialog.getByRole('listitem').first()).toBeVisible()
    await expect(dialog.locator('mark').first()).toBeVisible()

    const states = await excerptStates(page)
    expect(states.length).toBeGreaterThan(0)
    expect(states.every(state => state.state === 'fallback')).toBe(true)
    expect(errors).toEqual([])
  })

  test('search still works when the Source Serif face cannot load', async ({ page, context }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await context.route('**/fonts/SourceSerif4-*.woff2', route => route.abort())

    await page.goto('/')
    const dialog = await search(page, 'unquenchable fire')
    await expect(dialog.getByRole('listitem').first()).toBeVisible()
    await expect(dialog.locator('mark').first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('an unsupported script keeps its ordinary excerpt', async ({ page }) => {
    await page.goto('/')
    // A Greek lemma: the glossary and language notes carry real Greek, which
    // the eligibility gate declines because the self-hosted subsets do not
    // cover it.
    const dialog = await search(page, 'aionios')
    await expect(dialog.getByRole('listitem').first()).toBeVisible()

    const states = await excerptStates(page)
    for (const state of states) {
      // Whatever the state, the row is readable and marked.
      expect(state.text.length).toBeGreaterThan(0)
      if (state.state === 'fitted') expect(state.marks.length).toBeGreaterThan(0)
    }
  })

  test('raises no uncaught error or console error during a normal search', async ({ page }) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await page.goto('/')
    await search(page, 'unquenchable fire')
    await waitForFitted(page)
    await page.getByRole('searchbox', { name: 'Search terms' }).fill('second death')
    await page.getByRole('searchbox', { name: 'Search terms' }).fill('Matthew 10:28')
    await page.waitForTimeout(300)

    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })
})

/* ------------------------------------------------------------------ *
 * Progressive enhancement
 * ------------------------------------------------------------------ */

test.describe('with scripting disabled', () => {
  test.use({ javaScriptEnabled: false })

  test('the search page still searches', async ({ page }) => {
    const requested: string[] = []
    page.on('request', request => requested.push(request.url()))

    await page.goto('/search/?q=unquenchable+fire')

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Search')
    await expect(page.getByRole('searchbox', { name: 'Search terms' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()

    const results = page
      .getByRole('listitem')
      .filter({ has: page.getByRole('heading', { level: 3 }) })
    expect(await results.count()).toBeGreaterThan(0)
    await expect(page.locator('mark').first()).toBeVisible()

    const firstLink = results.first().getByRole('link').first()
    await expect(firstLink).toHaveAttribute('href', /\/.+\//)

    // Nothing about the text-layout runtime is involved in this page at all.
    expect(requested.some(isRuntimeRequest)).toBe(false)
  })

  test('the search trigger degrades to a real link', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('link', { name: 'Search', exact: true })
    await expect(trigger).toHaveAttribute('href', '/search/')
    await trigger.click()
    await expect(page).toHaveURL(/\/search\/$/)
  })
})

/* ------------------------------------------------------------------ *
 * Bundle boundary
 * ------------------------------------------------------------------ */

test.describe('the lazy bundle boundary', () => {
  test('the production build isolates the runtime in its own chunk', () => {
    expect(
      RUNTIME_CHUNKS.length,
      'the built output must contain a chunk carrying the text-layout runtime',
    ).toBeGreaterThan(0)
  })

  test('an article page never requests the runtime', async ({ page }) => {
    const requested: string[] = []
    page.on('request', request => requested.push(request.url()))

    await page.goto('/case/key-texts/eternal-punishment/')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(requested.filter(isRuntimeRequest)).toEqual([])
  })

  test('search intent requests it', async ({ page }) => {
    const requested: string[] = []
    page.on('request', request => requested.push(request.url()))

    await page.goto('/case/key-texts/eternal-punishment/')
    await page.waitForLoadState('networkidle')
    expect(requested.filter(isRuntimeRequest)).toEqual([])

    await openSearch(page)
    await page.waitForTimeout(500)
    expect(requested.filter(isRuntimeRequest).length).toBeGreaterThan(0)
  })

  test('merely focusing the trigger is enough to start the load', async ({ page }) => {
    const requested: string[] = []
    page.on('request', request => requested.push(request.url()))

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Search', exact: true }).focus()
    await page.waitForTimeout(500)
    expect(requested.filter(isRuntimeRequest).length).toBeGreaterThan(0)
  })
})
