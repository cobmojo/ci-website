import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

/**
 * Accessibility suite.
 *
 * Two independent kinds of check run here.
 *
 * 1. axe-core, against the WCAG 2.0, 2.1 and 2.2 A and AA rule sets. No rule is
 *    ever disabled: a violation means the markup is wrong, not that the rule is
 *    inconvenient.
 * 2. Structural checks axe deliberately does not make at those conformance
 *    levels: one `h1` per page, no heading level skips, the four landmarks, an
 *    accessible name on every `nav`, and original-language text marked with the
 *    right `lang` and direction.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const

/** A nonexistent path, so the 404 response is exercised as a real page. */
const NOT_FOUND_ROUTE = '/this-address-does-not-exist/'

const ROUTES: readonly string[] = [
  '/',
  '/start/',
  '/start/compare-the-views/',
  '/case/',
  '/case/key-texts/eternal-punishment/',
  '/passages/mark-9-42-48/',
  '/search/?q=fire',
  '/sources/',
  '/watch/',
  '/corrections/',
  '/scripture/',
  '/glossary/',
  '/topics/gehenna/',
  '/full-case/',
  // The accessibility statement names this page as one the axe suite covers,
  // so it is covered.
  '/accessibility/',
  NOT_FOUND_ROUTE,
]

interface ViolationSummary {
  readonly id: string
  readonly impact: string
  readonly help: string
  readonly nodes: readonly string[]
}

async function axeViolations(page: Page): Promise<ViolationSummary[]> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze()
  return results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    nodes: violation.nodes
      .slice(0, 4)
      .map(node =>
        `${node.html.slice(0, 200)} :: ${(node.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 260)}`.trim(),
      ),
  }))
}

/**
 * Headings, landmarks and language markup as a browser actually exposes them.
 *
 * Only rendered elements are inspected. A closed `<dialog>` is `display: none`
 * and is therefore absent from the accessibility tree, so counting its headings
 * would describe something no reader ever meets.
 */
async function structure(page: Page) {
  return page.evaluate(() => {
    const rendered = (element: Element): boolean =>
      element instanceof HTMLElement && element.checkVisibility()

    const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter(rendered)
      .map(element => ({
        level: Number(element.tagName.slice(1)),
        text: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
      }))

    const accessibleName = (element: Element): string => {
      const label = element.getAttribute('aria-label')?.trim()
      if (label) return label
      const labelledBy = element.getAttribute('aria-labelledby')
      if (labelledBy) {
        return labelledBy
          .split(/\s+/)
          .map(id => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ')
          .trim()
      }
      const title = element.getAttribute('title')?.trim()
      return title ?? ''
    }

    const namelessNavs = [...document.querySelectorAll('nav')]
      .filter(rendered)
      .filter(element => accessibleName(element).length === 0)
      .map(element => (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80))

    const landmarks = {
      main: document.querySelectorAll('main').length,
      header: [...document.querySelectorAll('header')].filter(
        element => element.closest('main, article, section') === null,
      ).length,
      footer: [...document.querySelectorAll('footer')].filter(
        element => element.closest('main, article, section') === null,
      ).length,
      nav: [...document.querySelectorAll('nav')].filter(rendered).length,
    }

    /* Greek and Hebrew script ranges, including Greek Extended and Hebrew
       presentation forms. */
    const GREEK = /[Ͱ-Ͽἀ-῿]/
    const HEBREW = /[֐-׿יִ-ﭏ]/
    const languageProblems: string[] = []
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const value = node.nodeValue ?? ''
      const hasGreek = GREEK.test(value)
      const hasHebrew = HEBREW.test(value)
      if (!hasGreek && !hasHebrew) continue
      const parent = node.parentElement
      if (!parent) continue
      if (parent.closest('script, style, template, noscript')) continue
      if (!rendered(parent)) continue
      const marked = parent.closest('[lang]')
      const lang = marked?.getAttribute('lang') ?? ''
      const sample = value.replace(/\s+/g, ' ').trim().slice(0, 40)
      if (hasGreek && lang !== 'grc') {
        languageProblems.push(`Greek text "${sample}" carries lang="${lang}", expected grc`)
      }
      if (hasHebrew) {
        if (lang !== 'he') {
          languageProblems.push(`Hebrew text "${sample}" carries lang="${lang}", expected he`)
        } else if ((marked?.getAttribute('dir') ?? '') !== 'rtl') {
          languageProblems.push(`Hebrew text "${sample}" is not marked dir="rtl"`)
        }
      }
    }

    return { headings, namelessNavs, landmarks, languageProblems }
  })
}

/** Consecutive heading levels may fall by any amount but rise by only one. */
function headingSkips(headings: { level: number; text: string }[]): string[] {
  const skips: string[] = []
  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1]
    const current = headings[index]
    if (!previous || !current) continue
    if (current.level > previous.level + 1) {
      skips.push(
        `h${previous.level} "${previous.text}" is followed by h${current.level} "${current.text}"`,
      )
    }
  }
  return skips
}

test.describe('axe-core, WCAG 2.0 / 2.1 / 2.2 level AA', () => {
  for (const route of ROUTES) {
    test(`reports no violations on ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      expect(await axeViolations(page)).toEqual([])
    })
  }

  test('reports no violations with the navigation dialog open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Menu' })
    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Site navigation' })).toBeVisible()
    expect(await axeViolations(page)).toEqual([])
  })

  test('reports no violations with the search dialog open', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Search', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Search this site' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('searchbox', { name: 'Search terms' }).fill('gehenna')
    await expect(dialog.getByRole('link', { name: /gehenna/i }).first()).toBeVisible()
    expect(await axeViolations(page)).toEqual([])
  })
})

test.describe('document structure', () => {
  for (const route of ROUTES) {
    test(`is sound on ${route}`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')
      const { headings, namelessNavs, landmarks, languageProblems } = await structure(page)

      const levelOne = headings.filter(heading => heading.level === 1)
      expect(levelOne.map(heading => heading.text)).toHaveLength(1)

      expect(headingSkips(headings)).toEqual([])

      expect(landmarks.main).toBe(1)
      expect(landmarks.header).toBeGreaterThanOrEqual(1)
      expect(landmarks.footer).toBeGreaterThanOrEqual(1)
      expect(landmarks.nav).toBeGreaterThanOrEqual(1)

      expect(namelessNavs).toEqual([])
      expect(languageProblems).toEqual([])
    })
  }
})

/* ------------------------------------------------------------------ *
 * Keyboard operation, where axe cannot see
 * ------------------------------------------------------------------ */

/**
 * These four are things a rule engine has no way to check: where focus is
 * after a navigation, whether a tab stop has anything behind it, and whether
 * a modal really is modal. Each was a measured defect before it was a test.
 */

test.describe('keyboard operation', () => {
  test('a transcript timestamp moves focus to the player it scrolled to', async ({ page }) => {
    await page.goto('/watch/')

    const timestamp = page.getByRole('link', { name: /Closing and further resources/ })
    await timestamp.click()
    await expect(page).toHaveURL(/\/watch\/\?t=\d+$/)

    // A query-only navigation is a soft one: the router resets the scroll
    // position but leaves focus behind, which stranded a keyboard reader
    // twenty-one thousand pixels below the player they had just asked for.
    await expect(page.locator('#video-player')).toBeFocused()
  })

  test('paging the search results moves focus into them', async ({ page }) => {
    await page.goto('/search/?q=fire')

    const next = page.getByRole('link', { name: /Next/ })
    await expect(next).toBeVisible()
    await next.click()
    await expect(page).toHaveURL(/page=2/)

    await expect(page.locator('#search-results')).toBeFocused()
    // The next tab stop belongs to the results, not to the footer beyond them.
    await page.keyboard.press('Tab')
    const inResults = await page.evaluate(() =>
      Boolean(document.activeElement?.closest('#search-results')),
    )
    expect(inResults, 'tabbing from the results landed outside them').toBe(true)
  })

  test('an open dialog stops the page behind it scrolling', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.locator('dialog[open]')).toBeVisible()

    // Over the backdrop, never over the panel: `showModal` makes the page
    // inert to activation but does nothing about the wheel.
    const box = page.viewportSize()
    await page.mouse.move(
      Math.round((box?.width ?? 800) * 0.06),
      Math.round((box?.height ?? 600) * 0.9),
    )
    await page.mouse.wheel(0, 800)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('the Scripture index has no tab stop that cannot be scrolled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/scripture/')

    const dead = async () =>
      page.evaluate(
        () =>
          [...document.querySelectorAll<HTMLElement>('[role="group"][tabindex="0"]')].filter(
            node => node.scrollWidth - node.clientWidth < 1,
          ).length,
      )

    // Forty-four of this page's tab stops used to do nothing at all.
    await expect.poll(dead).toBe(0)

    // The stop has to come back where the table really does overflow, or the
    // fix has broken WCAG 2.1.1 to tidy the tab order.
    await page.setViewportSize({ width: 320, height: 900 })
    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            [...document.querySelectorAll<HTMLElement>('[role="group"][tabindex="0"]')].filter(
              node => node.scrollWidth - node.clientWidth >= 1,
            ).length,
        ),
      )
      .toBeGreaterThan(0)
  })
})
