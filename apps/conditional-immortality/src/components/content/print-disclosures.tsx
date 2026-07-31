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
    const opened = new Set<HTMLDetailsElement>()
    /**
     * A real print fires both signals, not one: `beforeprint` and the media
     * query change. Both are subscribed on purpose, because engines differ over
     * which they send, so `openAll` is called twice for one print.
     *
     * This stops the second call re-scanning the document. It is no longer what
     * keeps the record intact — `opened` is a `const` Set that accumulates and
     * is never replaced, and `openAll` skips anything already open, so the
     * second call adds nothing and destroys nothing. The failure this once
     * prevented, where the second signal replaced the record and `restore`
     * closed nothing, cannot happen against the code as written; it is not the
     * kind of thing an end-to-end test can show either, so this says so rather
     * than leaving a test to imply it.
     */
    let printing = false

    const openAll = () => {
      if (printing) return
      printing = true
      for (const details of document.querySelectorAll<HTMLDetailsElement>('details')) {
        // Anything print drops entirely stays as it is, and so does anything
        // the reader opened themselves: closing that would be its own defect.
        if (details.classList.contains('print:hidden') || details.open) continue
        details.open = true
        opened.add(details)
      }
    }

    const restore = () => {
      printing = false
      for (const details of opened) details.open = false
      opened.clear()
    }

    window.addEventListener('beforeprint', openAll)
    window.addEventListener('afterprint', restore)

    /*
     * Says the listeners are attached.
     *
     * Only the print stylesheet works before hydration, and it works in two
     * engines out of three. A test that dispatches `beforeprint` to check the
     * half that Firefox depends on therefore has to know this has run: in
     * WebKit the dispatch landed first and nothing happened, and the test
     * passed anyway because switching the media query un-collapses the content
     * by CSS alone there. Waiting on this makes each signal testable on its
     * own, which is the only way either one can be shown to work.
     */
    document.documentElement.dataset.printDisclosures = 'ready'

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
      delete document.documentElement.dataset.printDisclosures
      restore()
    }
  }, [])

  return null
}
