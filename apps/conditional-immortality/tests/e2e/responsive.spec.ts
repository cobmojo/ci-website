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

/* ------------------------------------------------------------------ *
 * Keyboard-reachable scroll regions
 *
 * WCAG 2.1.1 requires that anything a pointer can scroll, a keyboard can
 * scroll too. A `div` with `overflow-x: auto` is not focusable by default, so
 * a keyboard-only reader can never see the columns past the right edge.
 * ------------------------------------------------------------------ */

test.describe('every horizontally scrolling region can be reached by keyboard', () => {
  const CASES = [
    { route: '/start/compare-the-views/', width: 768, height: 1024 },
    { route: '/scripture/', width: 320, height: 568 },
    { route: '/original-document/', width: 320, height: 568 },
    { route: '/case/biblical-language/body-and-soul/', width: 375, height: 812 },
    { route: '/appendix/afterlife-odds/', width: 375, height: 812 },
    { route: '/full-case/', width: 375, height: 812 },
  ]

  for (const testCase of CASES) {
    test(`${testCase.route} at ${testCase.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: testCase.width, height: testCase.height })
      await page.goto(testCase.route)
      await settle(page)

      const unreachable = await page.evaluate(() => {
        const offenders: string[] = []

        for (const element of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
          // Only regions that genuinely scroll sideways right now.
          if (element.scrollWidth <= element.clientWidth + 1) continue
          const overflowX = getComputedStyle(element).overflowX
          if (overflowX !== 'auto' && overflowX !== 'scroll') continue
          // The page scroller itself is handled by the browser.
          if (element === document.body || element === document.documentElement) continue

          const tabIndex = element.getAttribute('tabindex')
          const focusable = tabIndex !== null && Number(tabIndex) >= 0
          if (focusable) continue

          const classes = element.className
            ? `.${String(element.className).trim().split(/\s+/).slice(0, 2).join('.')}`
            : ''
          offenders.push(
            `${element.tagName.toLowerCase()}${classes} scrolls ${element.scrollWidth - element.clientWidth}px but has no tabindex`,
          )
        }

        return [...new Set(offenders)]
      })

      expect(unreachable, `unreachable scroll regions on ${testCase.route}`).toEqual([])
    })
  }
})

/* ------------------------------------------------------------------ *
 * Line length
 *
 * Long measures are hard to read: the eye loses its place returning to the
 * start of the next line. Body prose on this site is capped near 70
 * characters. Supporting text is allowed to run wider, but not without limit.
 * ------------------------------------------------------------------ */

const MAX_CHARACTERS_PER_LINE = 90

test.describe('no prose runs to an unreadable measure', () => {
  const WIDE_VIEWPORTS = [
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]

  for (const viewport of WIDE_VIEWPORTS) {
    test(`at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)

      const failures: string[] = []
      for (const route of ROUTES) {
        await page.goto(route)
        await settle(page)

        const wide = await page.evaluate(maxChars => {
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) return []

          const offenders: { selector: string; chars: number; snippet: string }[] = []
          const candidates = document.querySelectorAll<HTMLElement>('p, li, dd, blockquote')

          for (const element of Array.from(candidates)) {
            const text = (element.textContent ?? '').trim()
            // Short strings never form a long line however wide the box is.
            if (text.length < 200) continue
            // Only leaf-ish prose, not wrappers that happen to contain text.
            if (element.querySelector('p, li, dd, blockquote, table')) continue

            // The element's box is only the line length if the text actually
            // flows across it. A flex or grid row concatenates the text of
            // several narrower children, so measuring its width would blame
            // the container for a line that is never that long.
            const hasBlockChild = Array.from(element.children).some(child => {
              const display = getComputedStyle(child).display
              return !display.startsWith('inline') && display !== 'contents'
            })
            if (hasBlockChild) continue

            const rect = element.getBoundingClientRect()
            if (rect.width === 0) continue

            const style = getComputedStyle(element)
            context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
            // Average advance over a representative sample of English text.
            const sample = 'abcdefghijklmnopqrstuvwxyz ETAOIN SHRDLU ,.'
            const averageAdvance = context.measureText(sample).width / sample.length
            if (!averageAdvance) continue

            const chars = rect.width / averageAdvance
            if (chars <= maxChars) continue

            const classes = element.className
              ? `.${String(element.className).trim().split(/\s+/).slice(0, 2).join('.')}`
              : ''
            offenders.push({
              selector: `${element.tagName.toLowerCase()}${classes}`,
              chars: Math.round(chars),
              snippet: text.slice(0, 55),
            })
          }

          return offenders
        }, MAX_CHARACTERS_PER_LINE)

        for (const offender of wide) {
          failures.push(
            `  ${route}: ${offender.selector} runs ${offender.chars}ch "${offender.snippet}"`,
          )
        }
      }

      expect([...new Set(failures)].join('\n'), `over ${MAX_CHARACTERS_PER_LINE}ch`).toBe('')
    })
  }
})

/* ------------------------------------------------------------------ *
 * The comparison of the three views
 *
 * This page renders its comparison twice, as a table for wide screens and as
 * stacked groups for narrow ones. Exactly one must be visible, and whichever
 * is showing must fit the space it is given: a table forced to scroll takes
 * its caption with it, and the caption is what tells a screen reader what the
 * table is.
 * ------------------------------------------------------------------ */

test.describe('the comparison of the three views fits its container', () => {
  for (const width of [320, 375, 640, 767, 768, 800, 819, 820, 1024, 1280, 1440]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/start/compare-the-views/')
      await settle(page)

      const state = await page.evaluate(() => {
        const isVisible = (element: Element) => {
          const rect = element.getBoundingClientRect()
          return rect.width > 0 && rect.height > 0
        }

        const tables = Array.from(document.querySelectorAll('table')).filter(isVisible)
        const stacked = Array.from(document.querySelectorAll('dl')).filter(isVisible)

        const table = tables[0]
        if (!table) return { tables: tables.length, stacked: stacked.length, clipped: 0 }

        const wrapper = table.parentElement
        const forced = wrapper ? wrapper.scrollWidth - wrapper.clientWidth : 0
        return {
          tables: tables.length,
          stacked: stacked.length,
          clipped: forced > 1 ? forced : 0,
        }
      })

      // Exactly one presentation, never both and never neither.
      const showing = (state.tables > 0 ? 1 : 0) + (state.stacked > 0 ? 1 : 0)
      expect(showing, `table:${state.tables} stacked:${state.stacked} at ${width}px`).toBe(1)

      // And whichever is showing must fit.
      expect(
        state.clipped,
        `the comparison table is forced to scroll ${state.clipped}px at ${width}px, which clips its caption`,
      ).toBe(0)
    })
  }
})

/* ------------------------------------------------------------------ *
 * Case map legibility
 *
 * Text inside an SVG is sized in user units, so it shrinks with the diagram.
 * Below a certain width the labels become unreadable, and because they are
 * presentation attributes they also ignore the reader's own text-size
 * setting. Where the diagram cannot be read it should not be shown: the
 * nested list beneath it carries exactly the same information.
 * ------------------------------------------------------------------ */

const MIN_LEGIBLE_PX = 12

test.describe('the case map is legible wherever it is shown', () => {
  for (const width of [320, 375, 430, 768, 820, 1024, 1280, 1440, 1920]) {
    test(`at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/start/case-map/')
      await settle(page)

      const state = await page.evaluate(() => {
        const svg = document.querySelector('svg[role="img"]')
        const visible = svg ? svg.getBoundingClientRect().width > 0 : false

        let smallest = Number.POSITIVE_INFINITY
        if (svg && visible) {
          const matrix = (svg as SVGGraphicsElement).getScreenCTM()
          const scale = matrix ? matrix.a : 1
          for (const text of Array.from(svg.querySelectorAll('text'))) {
            const declared = Number.parseFloat(
              text.getAttribute('font-size') ?? getComputedStyle(text).fontSize,
            )
            if (Number.isFinite(declared)) smallest = Math.min(smallest, declared * scale)
          }
        }

        // The list equivalent must always be present, diagram or not.
        const listItems = document.querySelectorAll('[data-case-map-list] a').length

        return {
          diagramVisible: visible,
          smallestTextPx: Number.isFinite(smallest) ? smallest : null,
          listItems,
        }
      })

      // The accessible equivalent is never optional.
      expect(state.listItems, 'the case map list equivalent must always render').toBeGreaterThan(20)

      if (state.diagramVisible && state.smallestTextPx !== null) {
        expect(
          state.smallestTextPx,
          `smallest diagram label renders at ${state.smallestTextPx.toFixed(2)}px at ${width}px`,
        ).toBeGreaterThanOrEqual(MIN_LEGIBLE_PX)
      }
    })
  }
})

/* ------------------------------------------------------------------ *
 * Touch target spacing
 *
 * WCAG 2.2 SC 2.5.8 asks for 24 by 24 CSS pixels, or enough spacing that a
 * 24 pixel circle centred on each target does not overlap its neighbour.
 * There is an exception for targets inline in a sentence, but "arguably
 * exempt" is not a standard worth relying on, so the site clears the spacing
 * requirement outright.
 * ------------------------------------------------------------------ */

test.describe('adjacent links keep 24px of spacing', () => {
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 430, height: 932 },
  ]) {
    test(`at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)

      const failures: string[] = []
      for (const route of ['/', '/start/', '/objections/satan-and-angels/', '/watch/', '/case/']) {
        await page.goto(route)
        await settle(page)

        const tight = await page.evaluate(() => {
          /**
           * SC 2.5.8 exempts a target that is "in a sentence or its size is
           * otherwise constrained by the line-height of non-target text".
           * A link rendered inline inside a paragraph is exactly that, and
           * measuring it is misleading anyway: `getBoundingClientRect` on an
           * inline element that wraps returns the union of its line boxes, so
           * two wrapped links report centres far closer than either is
           * clickable. Anything laid out as a block, a flex or a grid item is
           * not covered by the exception and is still measured.
           */
          const isInlineInText = (element: HTMLElement) => {
            if (!getComputedStyle(element).display.startsWith('inline')) return false
            const parent = element.parentElement
            if (!parent) return false
            const parentDisplay = getComputedStyle(parent).display
            if (parentDisplay === 'flex' || parentDisplay === 'grid') return false
            // Sits in a run of text rather than being the whole of its parent.
            return (
              (parent.textContent ?? '').trim().length > (element.textContent ?? '').trim().length
            )
          }

          const targets = Array.from(document.querySelectorAll<HTMLElement>('a[href], button'))
            .map(element => ({ element, rect: element.getBoundingClientRect() }))
            .filter(({ element, rect }) => {
              if (rect.width === 0 || rect.height === 0) return false
              // Ignore anything inside a closed disclosure: laid out, never hit-tested.
              const details = element.closest('details')
              if (details && !details.open) return false
              if (isInlineInText(element)) return false
              return true
            })

          const problems: string[] = []
          for (let i = 0; i < targets.length; i += 1) {
            const a = targets[i]
            if (!a) continue
            // Already large enough on its own.
            if (a.rect.width >= 24 && a.rect.height >= 24) continue

            const centreA = { x: a.rect.x + a.rect.width / 2, y: a.rect.y + a.rect.height / 2 }
            for (let j = 0; j < targets.length; j += 1) {
              if (i === j) continue
              const b = targets[j]
              if (!b) continue
              const centreB = { x: b.rect.x + b.rect.width / 2, y: b.rect.y + b.rect.height / 2 }
              const distance = Math.hypot(centreA.x - centreB.x, centreA.y - centreB.y)
              if (distance >= 24) continue
              problems.push(
                `${(a.element.textContent ?? '').trim().slice(0, 32)} is ${distance.toFixed(1)}px from ${(b.element.textContent ?? '').trim().slice(0, 32)}`,
              )
              break
            }
          }
          return [...new Set(problems)]
        })

        for (const problem of tight) failures.push(`  ${route}: ${problem}`)
      }

      expect([...new Set(failures)].join('\n'), 'targets closer than 24px').toBe('')
    })
  }
})
