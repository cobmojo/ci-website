'use client'

import { useEffect } from 'react'

/**
 * Open every disclosure for printing, and put them back afterwards.
 *
 * The print stylesheet already forces `::details-content` visible, which is
 * what a collapsed disclosure needs since the browser's own stylesheet gives it
 * `content-visibility: hidden` and no rule on the children can reach a
 * pseudo-element. Measured across engines, that fixes Chromium and WebKit and
 * does nothing at all in Firefox, which declines `content-visibility` on that
 * pseudo-element specifically: with `visible`, with `auto`, and with `display`
 * alongside, the computed value stays `hidden` and the box stays 52px where the
 * content is 3,902px and four tables.
 *
 * The `open` attribute is the one lever that measures the same in all three, so
 * this sets it. Two pages carry a closed disclosure with substantial content —
 * 5,612 characters and four tables between them — and `/accessibility/` tells
 * the reader that "disclosures are opened so that nothing is lost inside a
 * collapsed section".
 *
 * Restoring afterwards matters: a reader who prints and carries on reading
 * should find the page as they left it, not with every aside sprung open.
 *
 * The CSS stays, and does the work where scripting is off. This is the layer
 * that cannot be done in CSS at all: there is no selector that sets an
 * attribute.
 */
export function PrintDisclosures() {
  useEffect(() => {
    /** Disclosures this opened, so only those are closed again. */
    let opened: HTMLDetailsElement[] = []

    const openAll = () => {
      opened = [...document.querySelectorAll<HTMLDetailsElement>('details')].filter(details => {
        // Anything the print stylesheet drops entirely stays as it is.
        if (details.classList.contains('print:hidden') || details.open) return false
        details.open = true
        return true
      })
    }

    const restore = () => {
      for (const details of opened) details.open = false
      opened = []
    }

    window.addEventListener('beforeprint', openAll)
    window.addEventListener('afterprint', restore)

    // Safari fires neither event reliably; it changes the print media query
    // instead, and does so around the same moment.
    const printMedia = window.matchMedia('print')
    const onMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) openAll()
      else restore()
    }
    printMedia.addEventListener('change', onMediaChange)

    return () => {
      window.removeEventListener('beforeprint', openAll)
      window.removeEventListener('afterprint', restore)
      printMedia.removeEventListener('change', onMediaChange)
      restore()
    }
  }, [])

  return null
}
