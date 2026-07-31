import { expect, type Page, test } from '@playwright/test'

/**
 * What a reader gets on paper, in every engine.
 *
 * This file exists because the guarantee it checks is the one the rest of the
 * suite structurally cannot see. `/accessibility/` promises that "disclosures
 * are opened so that nothing is lost inside a collapsed section", and the
 * stylesheet keeps that promise by forcing `::details-content` visible — which
 * Chromium and WebKit honour and Firefox does not, on that pseudo-element
 * specifically. The motion contract asserts the rule is *present* in the CSS,
 * which it is; a Chromium end-to-end run measures the rendered page, which is
 * correct there. Neither could see that a Firefox reader was printing two
 * pages of empty boxes.
 *
 * So this measures rendered print output, and runs in all three engines.
 */

/** Both pages in the corpus with a closed disclosure carrying real content. */
const PAGES_WITH_DISCLOSURES = [
  '/case/biblical-language/body-and-soul/',
  '/case/biblical-language/destruction/',
]

/** Which disclosures are open, by summary, so a print can be shown to restore. */
function openStates() {
  return [...document.querySelectorAll<HTMLDetailsElement>('details')].map(details => ({
    summary: (details.querySelector('summary')?.textContent ?? '').trim().slice(0, 40),
    open: details.open,
  }))
}

/** How much of each disclosure is actually laid out, right now. */
function measure() {
  return (
    [...document.querySelectorAll<HTMLDetailsElement>('details')]
      // Chrome that print drops entirely is not a disclosure of content.
      .filter(details => !details.className.includes('print:hidden'))
      .map(details => ({
        summary: (details.querySelector('summary')?.textContent ?? '').trim().slice(0, 40),
        height: Math.round(details.getBoundingClientRect().height),
        // `innerText`, not `textContent`: the latter reads the whole subtree
        // whether or not any of it is laid out, so it returned 4,848 for a
        // disclosure printing 29 characters of summary. An assertion on it
        // passed against exactly the defect this file exists to catch.
        characters: (details.innerText ?? '').replace(/\s+/g, ' ').trim().length,
      }))
  )
}

/**
 * Wait for the component that owns the `open` attribute to attach.
 *
 * Only the print stylesheet works before hydration, and only in Chromium and
 * WebKit. Dispatching `beforeprint` at a page that has not hydrated does
 * nothing, and in WebKit that went unnoticed because switching the media query
 * un-collapses the content by CSS alone — measured: after the dispatch, both
 * disclosures were still `open: false` with 29 characters laid out.
 */
async function waitForPrintDisclosures(page: Page) {
  await page.waitForSelector('html[data-print-disclosures="ready"]', { state: 'attached' })
}

/** A summary alone is about 30 characters and 50px tall. */
async function expectContentsShown(page: Page) {
  const shown = await page.evaluate(measure)
  expect(shown.length, 'no disclosure found to check').toBeGreaterThan(0)
  for (const details of shown) {
    expect(details.characters, `"${details.summary}" showed only its summary`).toBeGreaterThan(400)
    expect(details.height, `"${details.summary}" was ${details.height}px tall`).toBeGreaterThan(200)
  }
}

/*
 * One test per signal, because the component subscribes to both and the
 * engines disagree about which they send.
 *
 * A single test that fired `beforeprint` *and* switched the media query
 * passed with either subscription deleted — whichever half survived did the
 * whole job, and the accommodation the other half exists for was invisible.
 * Firefox is the reason both are there.
 */
for (const route of PAGES_WITH_DISCLOSURES) {
  test(`the print media query alone opens every disclosure on ${route}`, async ({ page }) => {
    await page.goto(route)
    await waitForPrintDisclosures(page)

    // Captured on screen: switching to print media is itself the signal, so
    // reading after it would record the opened state as "before" and the
    // restore assertion would compare the wrong thing.
    const openBefore = await page.evaluate(openStates)

    await page.emulateMedia({ media: 'print' })
    await expectContentsShown(page)

    await page.emulateMedia({ media: 'screen' })
    expect(await page.evaluate(openStates), 'leaving print media left them open').toEqual(
      openBefore,
    )
  })

  test(`the beforeprint event alone opens every disclosure on ${route}`, async ({ page }) => {
    await page.goto(route)
    await waitForPrintDisclosures(page)
    const openBefore = await page.evaluate(openStates)

    // No media switch: this is the half that has to work on its own in an
    // engine that fires the events and does not re-evaluate the media query.
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
    await expectContentsShown(page)

    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    expect(await page.evaluate(openStates), 'afterprint left them open').toEqual(openBefore)
  })

  test(`a real print fires both signals and still restores on ${route}`, async ({ page }) => {
    await page.goto(route)
    await waitForPrintDisclosures(page)
    const openBefore = await page.evaluate(openStates)

    // Both, in the order a browser sends them, which is what a real print does.
    // This holds the outcome — the reader's page comes back — and not the
    // mechanism: with the record kept in a Set that is never replaced, removing
    // the re-entry guard changes nothing observable, so nothing here should be
    // read as covering it.
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
    await page.emulateMedia({ media: 'print' })
    await expectContentsShown(page)

    await page.emulateMedia({ media: 'screen' })
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    expect(await page.evaluate(openStates), 'printing left disclosures open').toEqual(openBefore)
  })
}
