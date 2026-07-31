'use client'

import { useEffect } from 'react'
import { siteConfig } from '@/lib/site-config'
import './globals.css'

/**
 * The last resort: an error in the root layout itself.
 *
 * This replaces the whole document, so it renders its own `<html>` and
 * `<body>` — the layout that would normally supply them is what failed. The
 * `lang` attribute is set here for the same reason: without it a screen reader
 * announces the page in whatever voice it was last using.
 *
 * It does not replace everything. Next still emits a static `500.html` and
 * serves it for a failure that never reaches React at all — a crash in the
 * server runtime rather than in a render. There is no supported way to replace
 * that document in the App Router, so the honest scope of this file is "an
 * uncaught error in the React tree", which is the case a reader can actually
 * reach by following a link.
 *
 * Deliberately plain. No header, no navigation, no search: every one of them
 * is rendered by the layout that just failed, and importing them here would
 * risk failing again inside the page whose job is to fail gracefully. A link
 * to the home page is the one thing that cannot go wrong.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The digest only: it is the sole value that ties a reader's report to a
    // server log line, and it carries none of the page's content.
    console.error(`[error] the layout failed to render${error.digest ? ` (${error.digest})` : ''}`)
  }, [error.digest])

  return (
    <html lang={siteConfig.language}>
      <body className="flex min-h-dvh flex-col">
        <main className="mx-auto w-full max-w-[40rem] flex-1 px-4 py-16" id="main-content">
          <h1 className="mt-0 mb-4">This page could not be displayed</h1>
          <p className="m-0 mb-4 text-ink-muted">
            Something went wrong while building the page. Nothing you did caused it, and nothing has
            been lost.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className="pressable inline-flex min-h-11 items-center rounded-md border border-copper/45 bg-copper/10 px-4 font-sans text-copper-deep"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
            <a
              className="pressable inline-flex min-h-11 items-center rounded-md border border-navy px-4 font-sans text-navy no-underline"
              href="/"
            >
              Go to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
