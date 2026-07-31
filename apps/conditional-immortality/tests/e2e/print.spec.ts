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

for (const route of PAGES_WITH_DISCLOSURES) {
  test(`every disclosure prints its contents on ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.emulateMedia({ media: 'print' })

    const printed = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLDetailsElement>('details')]
        // Chrome that print drops entirely is not a disclosure of content.
        .filter(details => !details.className.includes('print:hidden'))
        .map(details => ({
          summary: (details.querySelector('summary')?.textContent ?? '').trim().slice(0, 40),
          height: Math.round(details.getBoundingClientRect().height),
          characters: (details.textContent ?? '').replace(/\s+/g, ' ').trim().length,
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
  })
}
