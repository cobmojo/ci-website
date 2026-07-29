import { expect, test } from '@playwright/test'

/**
 * Responsive behaviour, verified against the rendered page.
 *
 * These assert what a reader experiences at a given viewport, not how the CSS
 * is written, so they survive a change of technique. Every viewport listed is
 * one a real reader turns up on.
 */

/** Routes that exercise every distinct layout the site has. */
const ROUTES = [
  '/',
  '/start/',
  '/start/what-is-conditional-immortality/',
  '/start/compare-the-views/',
  '/start/case-map/',
  '/case/',
  '/case/key-texts/eternal-punishment/',
  '/case/biblical-language/body-and-soul/',
  '/objections/',
  '/objections/satan-and-angels/',
  '/appendix/afterlife-odds/',
  '/appendix/net-outcome-of-humanity/',
  '/passages/',
  '/passages/mark-9-42-48/',
  '/scripture/',
  '/topics/',
  '/topics/gehenna/',
  '/glossary/',
  '/sources/',
  '/watch/',
  '/full-case/',
  '/search/?q=fire',
  '/corrections/',
  '/changelog/',
  '/method/',
  '/about/',
  '/original-document/',
  '/download/',
  '/accessibility/',
  '/privacy/',
  '/this-page-does-not-exist/',
] as const

/**
 * Pages carrying a data table, which is where table semantics can be lost.
 * S10 holds the anthropology matrices, APP1 the outcome games, and
 * compare-the-views the three-view comparison.
 */
const TABLE_ROUTES = [
  '/case/biblical-language/body-and-soul/',
  '/appendix/afterlife-odds/',
  '/start/compare-the-views/',
  '/original-document/',
] as const

/**
 * Every viewport a real reader turns up on, including the awkward ones.
 * 320 is the WCAG reflow floor and the narrowest phone still in use; the
 * landscape entries are where sticky headers usually fall apart.
 */
const VIEWPORTS = [
  { name: '320 narrowest phone', width: 320, height: 568 },
  { name: '360 common Android', width: 360, height: 740 },
  { name: '375 iPhone mini', width: 375, height: 812 },
  { name: '390 iPhone', width: 390, height: 844 },
  { name: '430 iPhone Pro Max', width: 430, height: 932 },
  { name: '667 phone landscape', width: 667, height: 375 },
  { name: '768 tablet portrait', width: 768, height: 1024 },
  { name: '820 iPad Air', width: 820, height: 1180 },
  { name: '1024 tablet landscape', width: 1024, height: 768 },
  { name: '1280 laptop', width: 1280, height: 800 },
  { name: '1440 desktop', width: 1440, height: 900 },
  { name: '1920 large desktop', width: 1920, height: 1080 },
] as const

/**
 * Wait until layout has actually stopped moving.
 *
 * `networkidle` alone is not enough. Under parallel workers the server is slow
 * enough that fonts can still be swapping in when the first measurement runs,
 * and a page measured mid-swap reports overflow that does not exist. Waiting
 * for the font set and then for two animation frames pins the layout before
 * anything is read.
 */
async function settle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('load')
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

/**
 * Find what is actually sticking out, not just that something is.
 *
 * Reports the deepest offending elements, since an overflowing child makes
 * every ancestor look guilty and the ancestor is rarely the thing to fix.
 */
async function measureOverflow(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const limit = window.innerWidth + 1
    const offenders: { selector: string; right: number; width: number; snippet: string }[] = []

    for (const element of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue
      if (rect.right <= limit) continue

      // Skip if an ancestor already clips this, which makes it invisible
      // rather than page-widening.
      let clipped = false
      let ancestor = element.parentElement
      while (ancestor && ancestor !== document.body) {
        const overflowX = getComputedStyle(ancestor).overflowX
        if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') {
          clipped = true
          break
        }
        ancestor = ancestor.parentElement
      }
      if (clipped) continue

      // Report the deepest offender only.
      if (offenders.some(o => element.contains(document.querySelector(o.selector)))) continue

      const classes = element.className
        ? `.${String(element.className).trim().split(/\s+/).slice(0, 3).join('.')}`
        : ''
      offenders.push({
        selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${classes}`,
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        snippet: (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 70),
      })
      if (offenders.length >= 6) break
    }

    return {
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      offenders,
    }
  })
}

/* ------------------------------------------------------------------ *
 * Anchor landing position
 *
 * Following an in-page link should put the target just below the sticky
 * header. Too little clearance hides the heading behind the header; too much
 * wastes screen, which matters most on a landscape phone where the viewport
 * is only a few hundred pixels tall.
 * ------------------------------------------------------------------ */

test.describe('in-page anchors land just below the header', () => {
  const CASES = [
    { route: '/case/key-texts/eternal-punishment/#in-brief', width: 812, height: 375 },
    { route: '/case/key-texts/eternal-punishment/#in-brief', width: 375, height: 812 },
    { route: '/case/biblical-language/body-and-soul/#in-brief', width: 1440, height: 900 },
    /*
     * The continuous edition is deliberately absent here. It is a single
     * 260,000 pixel document holding all forty bodies, and measuring an
     * anchor on it races the browser's own scroll restoration often enough
     * to be unreliable as a signal. Its anchors are covered instead by the
     * unique-id test above and by the link checker, which resolves every
     * fragment on that page against the built HTML.
     */
  ]

  for (const testCase of CASES) {
    test(`${testCase.route} at ${testCase.width}x${testCase.height}`, async ({ page }) => {
      await page.setViewportSize({ width: testCase.width, height: testCase.height })
      await page.goto(testCase.route)
      await settle(page)

      const geometry = await page.evaluate(() => {
        const id = decodeURIComponent(location.hash.slice(1))
        const target = document.getElementById(id)
        const header = document.querySelector('header')
        if (!target || !header) return null
        return {
          targetTop: target.getBoundingClientRect().top,
          headerBottom: header.getBoundingClientRect().bottom,
          viewportHeight: window.innerHeight,
        }
      })

      expect(geometry, 'target and header must both exist').not.toBeNull()
      if (!geometry) return

      const clearance = geometry.targetTop - geometry.headerBottom

      // Never underneath the header.
      expect(
        clearance,
        `heading sits ${Math.round(-clearance)}px behind the sticky header`,
      ).toBeGreaterThanOrEqual(0)

      // And never wasting a big share of a short viewport.
      const wasted = clearance / geometry.viewportHeight
      expect(
        wasted,
        `anchor leaves ${Math.round(clearance)}px of gap, ${Math.round(wasted * 100)}% of the viewport`,
      ).toBeLessThan(0.2)
    })
  }
})

/* ------------------------------------------------------------------ *
 * Unique element ids
 *
 * A duplicated id silently breaks in-page navigation: the browser scrolls to
 * the first match, so every "on this page" link and every cross-reference to
 * a later section lands in the wrong place. It also breaks `aria-labelledby`,
 * which resolves against the first match even when that copy is hidden.
 * ------------------------------------------------------------------ */

test.describe('element ids are unique on a page', () => {
  for (const route of [
    '/full-case/',
    '/case/key-texts/eternal-punishment/',
    '/case/biblical-language/body-and-soul/',
    '/objections/satan-and-angels/',
    '/appendix/afterlife-odds/',
    '/glossary/',
    '/scripture/',
    '/start/compare-the-views/',
  ]) {
    test(`on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(route)
      await settle(page)

      const duplicates = await page.evaluate(() => {
        const counts = new Map<string, number>()
        for (const element of Array.from(document.querySelectorAll('[id]'))) {
          const id = element.id
          if (!id) continue
          counts.set(id, (counts.get(id) ?? 0) + 1)
        }
        return [...counts.entries()]
          .filter(([, count]) => count > 1)
          .sort((a, b) => b[1] - a[1])
          .map(([id, count]) => `${id} x${count}`)
      })

      expect(duplicates, `duplicate ids on ${route}`).toEqual([])
    })
  }
})

/* ------------------------------------------------------------------ *
 * Horizontal overflow
 *
 * Nothing on this site is meant to scroll sideways. A reader who has to pan
 * left and right to finish a sentence has lost the page, and WCAG 1.4.10
 * requires reflow down to 320 CSS pixels without it.
 * ------------------------------------------------------------------ */

test.describe('no page scrolls sideways', () => {
  for (const viewport of VIEWPORTS) {
    test(`at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      const failures: string[] = []
      for (const route of ROUTES) {
        await page.goto(route)
        await settle(page)

        // Measure twice and only believe an agreement. A single reading can
        // catch the page mid-relayout under load; two readings a frame apart
        // that both see overflow is a real defect.
        let result = await measureOverflow(page)
        if (result.scrollWidth > result.innerWidth + 1) {
          await settle(page)
          const confirm = await measureOverflow(page)
          if (confirm.scrollWidth <= confirm.innerWidth + 1) continue
          result = confirm
        } else {
          continue
        }

        const detail = result.offenders
          .map(o => `        ${o.selector} extends to ${o.right}px (w=${o.width}) "${o.snippet}"`)
          .join('\n')
        failures.push(
          `  ${route}: scrollWidth ${result.scrollWidth} vs viewport ${result.innerWidth}\n${detail}`,
        )
      }

      expect(failures.join('\n'), `horizontal overflow at ${viewport.width}px`).toBe('')
    })
  }
})

/* ------------------------------------------------------------------ *
 * Table semantics
 *
 * A wide table needs to scroll on a narrow screen, but `display: block` on
 * the table element itself strips its implicit ARIA role, and a screen reader
 * then loses every row and column relationship. The scroll container has to be
 * an ancestor, never the table.
 * ------------------------------------------------------------------ */

test.describe('data tables keep their semantics while still scrolling', () => {
  for (const route of TABLE_ROUTES) {
    test(`on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(route)
      await settle(page)

      const tables = await page.evaluate(() => {
        return [...document.querySelectorAll('table')].map(table => {
          const style = getComputedStyle(table)

          // Walk up looking for something that can actually scroll sideways.
          let scrollParent: string | null = null
          let node: HTMLElement | null = table.parentElement
          while (node && node !== document.body) {
            const overflowX = getComputedStyle(node).overflowX
            if (overflowX === 'auto' || overflowX === 'scroll') {
              scrollParent = node.tagName.toLowerCase()
              break
            }
            node = node.parentElement
          }

          return {
            display: style.display,
            caption: Boolean(table.querySelector('caption')),
            headerCells: table.querySelectorAll('th').length,
            scopedHeaders: table.querySelectorAll('th[scope]').length,
            scrollParent,
            overflowsViewport: table.getBoundingClientRect().width > window.innerWidth + 1,
            snippet: (table.textContent ?? '').replace(/\s+/g, ' ').slice(0, 60),
          }
        })
      })

      expect(tables.length, `${route} should render at least one table`).toBeGreaterThan(0)

      for (const table of tables) {
        // The table must still be a table to assistive technology.
        expect(
          table.display,
          `table "${table.snippet}" has display:${table.display}, which strips its ARIA table role`,
        ).toMatch(/^(table|inline-table)$/)

        // And it must live inside something that can scroll it.
        expect(
          table.scrollParent,
          `table "${table.snippet}" has no horizontally scrollable ancestor, so it will either clip or push the page wide`,
        ).not.toBeNull()

        // Header cells carry scope so the relationships survive linearisation.
        if (table.headerCells > 0) {
          expect(
            table.scopedHeaders,
            `table "${table.snippet}" has ${table.headerCells} header cells but ${table.scopedHeaders} with scope`,
          ).toBe(table.headerCells)
        }
      }
    })
  }
})
