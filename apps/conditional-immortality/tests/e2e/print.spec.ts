import { expect, test } from '@playwright/test'

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

for (const route of PAGES_WITH_DISCLOSURES) {
  test(`every disclosure prints its contents on ${route}`, async ({ page }) => {
    await page.goto(route)

    // What the disclosures looked like before, so the restore can be checked.
    // Captured on screen: switching to print media is itself one of the two
    // signals, so reading after it would record the opened state as "before"
    // and the restore assertion would compare the wrong thing.
    const openBefore = await page.evaluate(openStates)

    // A real print fires both signals. Driving only the media query exercises
    // half the wiring, and the half that works in isolation.
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')))
    await page.emulateMedia({ media: 'print' })

    const printed = await page.evaluate(() =>
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
        })),
    )

    expect(printed.length, 'no disclosure found to check').toBeGreaterThan(0)
    for (const details of printed) {
      // A summary alone is about 30 characters and 50px tall. Anything near
      // that means the content did not print.
      expect(details.characters, `"${details.summary}" printed only its summary`).toBeGreaterThan(
        400,
      )
      expect(details.height, `"${details.summary}" printed at ${details.height}px`).toBeGreaterThan(
        200,
      )
    }

    // And the reader's page is as they left it. Opening the disclosures is how
    // this works in Firefox, so it has to put them back: it did not, because a
    // print fires two signals and the second one wiped the record of what the
    // first had opened.
    await page.emulateMedia({ media: 'screen' })
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
    expect(await page.evaluate(openStates), 'printing left disclosures open').toEqual(openBefore)
  })
}
