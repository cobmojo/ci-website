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
