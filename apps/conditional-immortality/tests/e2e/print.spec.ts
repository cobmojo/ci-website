import { expect, test } from '@playwright/test'

/**
 * What actually reaches paper.
 *
 * `/accessibility/` tells a reader that "disclosures are opened so that nothing
 * is lost inside a collapsed section". Until now the only thing checking that
 * was a unit test asserting the presence of CSS rules — which proves the rules
 * are written, not that the content is on the page. Under print emulation a
 * closed `<details>` printed its summary and nothing else in all three engines,
 * because `::details-content` is a user-agent pseudo-element that
 * `display: revert` on the children cannot reach.
 *
 * These assert the rendering, in the medium the claim is about.
 */

test.use({ colorScheme: 'light' })

/**
 * `/full-case/` is the one route with a disclosure that prints.
 *
 * Every other closed `<details>` on the site is the mobile contents panel,
 * which is `print:hidden` by design — there is no reason to put a navigation
 * aid on paper. `/full-case/` is the recommended print-to-PDF edition, so it is
 * exactly where the accessibility statement's claim has to hold.
 */
const DISCLOSURE_ROUTE = '/full-case/'

test('a closed disclosure keeps its content on paper', async ({ page }) => {
  await page.goto(DISCLOSURE_ROUTE)

  const closed = page.locator('details:not([open])').first()
  /*
   * Asserted, not skipped. A conditional skip here would turn "the page no
   * longer has a disclosure" — which would mean the claim under test has
   * quietly stopped applying — into a green run.
   */
  await expect(
    page.locator('details:not([open])'),
    'no closed disclosure on the page this test exists for',
  ).not.toHaveCount(0)

  const hiddenText = await closed.evaluate(element => {
    const body = element.querySelector(':scope > *:not(summary)')
    return (body?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
  })
  expect(hiddenText.length, 'the disclosure has no body text to lose').toBeGreaterThan(20)

  await page.emulateMedia({ media: 'print' })

  const printed = await closed.evaluate(element => {
    const summary = element.querySelector(':scope > summary') as HTMLElement | null
    const content = getComputedStyle(element, '::details-content')
    return {
      open: (element as HTMLDetailsElement).open,
      contentVisibility: content.contentVisibility,
      summaryHeight: summary?.getBoundingClientRect().height ?? 0,
      detailsHeight: element.getBoundingClientRect().height,
    }
  })

  expect(printed.open, 'the disclosure is still closed, which is the case under test').toBe(false)
  expect(printed.contentVisibility, '::details-content is still collapsed on paper').toBe('visible')
  /*
   * Taller than its own summary is what "the body is on the page" measures to.
   * A collapsed disclosure is exactly summary-height, whatever the individual
   * children's boxes report.
   */
  expect(
    printed.detailsHeight,
    'the disclosure is no taller than its summary, so its body did not print',
  ).toBeGreaterThan(printed.summaryHeight + 8)
})

test('the printed page keeps the argument and drops the furniture', async ({ page }) => {
  await page.goto(DISCLOSURE_ROUTE)
  await page.emulateMedia({ media: 'print' })

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.scripture-block').first()).toBeVisible()

  // Navigation and search are interface, not argument, and print without them.
  const furniture = await page.evaluate(() => {
    const hidden = (selector: string) => {
      const element = document.querySelector(selector)
      if (!element) return true
      return getComputedStyle(element).display === 'none'
    }
    return { header: hidden('header'), searchTrigger: hidden('.search-trigger') }
  })
  expect(furniture.header, 'the site header printed').toBe(true)
  expect(furniture.searchTrigger, 'the search trigger printed').toBe(true)
})

test('every external destination is printed after its link text', async ({ page }) => {
  // A page whose external links are citations, which is where the claim
  // matters: the reader is being asked to be able to check them on paper.
  await page.goto('/case/roadblocks/tradition/')
  await page.emulateMedia({ media: 'print' })

  const shown = await page.evaluate(() => {
    const link = [...document.querySelectorAll('main a[href^="http"]')].find(
      candidate => !candidate.getAttribute('href')?.includes(window.location.host),
    )
    if (!link) return null
    const after = getComputedStyle(link, '::after').content
    return { href: link.getAttribute('href'), after }
  })

  expect(shown, 'this route was chosen because it has external links in its body').not.toBeNull()
  expect(shown?.after ?? '', 'an external destination is not printed beside its link').not.toBe(
    'none',
  )
})

test('a link whose text is already its URL does not print it twice', async ({ page }) => {
  /*
   * The other half of the rule above. Scoping it from `.prose-article` to
   * `main` was right — the earlier scope matched none of the site's 278
   * external links — but `main` also contains the source library, where the
   * visible text *is* the address. Measured before the exclusion: 56 doubled
   * anchors on `/sources/` and 29 on `/full-case/`, which are precisely the two
   * pages a reader prints.
   */
  for (const route of ['/sources/', '/full-case/', '/watch/']) {
    await page.goto(route)
    await page.emulateMedia({ media: 'print' })

    const doubled = await page.evaluate(() =>
      [...document.querySelectorAll('main a[href^="http"]')]
        .filter(link => {
          const href = link.getAttribute('href') as string
          const shown = (link.textContent ?? '').replace(/\s*\(opens in a new tab\)\s*$/, '')
          if (!shown.includes(href)) return false
          return getComputedStyle(link, '::after').content !== 'none'
        })
        .map(link => link.getAttribute('href')),
    )

    expect(doubled, `${route} prints ${doubled.length} address(es) twice`).toEqual([])
  }
})

test('a link whose text is prose still prints its destination', async ({ page }) => {
  /*
   * Guards the exclusion above from swallowing the rule it narrows. Not on
   * `/sources/`: every external link there is the URL itself, so the correct
   * count on that page is zero. This is a page whose links are prose, which is
   * where the annotation is the only way to check a citation on paper.
   */
  await page.goto('/case/roadblocks/tradition/')
  await page.emulateMedia({ media: 'print' })

  const annotated = await page.evaluate(
    () =>
      [...document.querySelectorAll('main a[href^="http"]')].filter(
        link => getComputedStyle(link, '::after').content !== 'none',
      ).length,
  )
  expect(annotated, 'the exclusion silenced every external link in the prose').toBeGreaterThan(0)
})
