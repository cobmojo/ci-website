import { video } from '@ci/content/video'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { formatTimestamp } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { siteConfig } from '@/lib/site-config'

const ROUTE = '/download/'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: ROUTE, label: 'Downloads' },
]

export const metadata: Metadata = pageMetadata({
  title: 'Downloads',
  description:
    'The complete case in a printer-friendly edition, the video transcript and the bibliography as plain text, and a printable one-page handout with a QR code to this site.',
  route: ROUTE,
})

export default function DownloadPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[52rem]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              Take it with you
            </p>
            <h1 className="mt-0 mb-4">Downloads</h1>
            <p className="m-0 max-w-[var(--spacing-measure)] text-[1.13rem] leading-[1.6] text-ink-muted">
              Everything here is generated from the same content as the site itself, so a printed or
              downloaded copy says exactly what the pages say. Nothing needs an account, an email
              address or a third-party service.
            </p>
          </header>

          <ul className="m-0 grid list-none gap-5 p-0">
            <li>
              <section
                aria-labelledby="download-full-case"
                className="rounded-md border border-border bg-paper-raised p-5 sm:p-6"
              >
                <h2 id="download-full-case" className="mt-0 mb-2 text-[1.18rem]">
                  The complete case, printer friendly
                </h2>
                <p className="m-0 mb-3 max-w-[var(--spacing-measure)] text-[1rem] text-ink-muted">
                  Every section in canonical order on one page, followed by the full bibliography.
                  To keep a copy, open it and use the print command in your browser, Ctrl and P on
                  Windows or Command and P on a Mac, then choose Save as PDF. Navigation and
                  interactive controls are dropped from the printed copy and each section starts on
                  a new page.
                </p>
                <p className="m-0 font-sans text-[0.95rem]">
                  <Link
                    href="/full-case/"
                    className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 font-medium text-white no-underline hover:bg-navy-deep"
                  >
                    Open the full case
                  </Link>
                </p>
              </section>
            </li>

            <li>
              <section
                aria-labelledby="download-transcript"
                className="rounded-md border border-border bg-paper-raised p-5 sm:p-6"
              >
                <h2 id="download-transcript" className="mt-0 mb-2 text-[1.18rem]">
                  Video transcript, plain text
                </h2>
                <p className="m-0 mb-3 max-w-[var(--spacing-measure)] text-[1rem] text-ink-muted">
                  The complete transcript of the {formatTimestamp(video.durationSeconds)} overview,
                  with chapter headings and timestamps. This is the caption track published by the
                  author with the video, not a machine transcription.
                </p>
                <p className="m-0 font-sans text-[0.95rem]">
                  <a
                    href="/download/transcript.txt"
                    download
                    className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-panel px-4 font-medium text-navy no-underline hover:bg-panel-strong"
                  >
                    Download transcript.txt
                  </a>
                  <span className="text-ink-subtle">
                    {' '}
                    or read it on the <Link href="/watch/">watch page</Link>.
                  </span>
                </p>
              </section>
            </li>

            <li>
              <section
                aria-labelledby="download-bibliography"
                className="rounded-md border border-border bg-paper-raised p-5 sm:p-6"
              >
                <h2 id="download-bibliography" className="mt-0 mb-2 text-[1.18rem]">
                  Bibliography, plain text
                </h2>
                <p className="m-0 mb-3 max-w-[var(--spacing-measure)] text-[1rem] text-ink-muted">
                  Every source in the library, grouped by kind, with its citation, its link, the
                  date it was last checked and the rights position taken on it. Useful if you want
                  to follow the argument back to its sources or to check one of them yourself.
                </p>
                <p className="m-0 font-sans text-[0.95rem]">
                  <a
                    href="/download/bibliography.txt"
                    download
                    className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-panel px-4 font-medium text-navy no-underline hover:bg-panel-strong"
                  >
                    Download bibliography.txt
                  </a>
                  <span className="text-ink-subtle">
                    {' '}
                    or browse the <Link href="/sources/">source library</Link>.
                  </span>
                </p>
              </section>
            </li>

            <li>
              <section
                aria-labelledby="download-handout"
                className="rounded-md border border-border bg-paper-raised p-5 sm:p-6"
              >
                <h2 id="download-handout" className="mt-0 mb-2 text-[1.18rem]">
                  One-page handout
                </h2>
                <p className="m-0 mb-3 max-w-[var(--spacing-measure)] text-[1rem] text-ink-muted">
                  A single printable page: what this case claims in six sentences, the shortest
                  reading path through it, the address of this site in plain text and a QR code that
                  points at it. Meant for a study group, a class or a conversation where a link is
                  not much use.
                </p>
                <p className="m-0 font-sans text-[0.95rem]">
                  <a
                    href="/download/handout.html"
                    className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-panel px-4 font-medium text-navy no-underline hover:bg-panel-strong"
                  >
                    Open the printable handout
                  </a>
                  <span className="text-ink-subtle"> then print it or save it as PDF.</span>
                </p>
              </section>
            </li>

            <li>
              <section
                aria-labelledby="download-original"
                className="rounded-md border border-border bg-panel/50 p-5 sm:p-6"
              >
                <h2 id="download-original" className="mt-0 mb-2 text-[1.18rem]">
                  The original document
                </h2>
                <p className="m-0 mb-3 max-w-[var(--spacing-measure)] text-[1rem] text-ink-muted">
                  This site is a web edition of a working document by {siteConfig.author.name}. The
                  original file is not published, because it carries private contact details and
                  editorial comments from named readers. What it contained, how every part of it was
                  treated and where each part now lives are all documented instead.
                </p>
                <p className="m-0 font-sans text-[0.95rem]">
                  <Link
                    href="/original-document/"
                    className="inline-flex min-h-11 items-center rounded-md border border-navy px-4 font-medium text-navy no-underline hover:bg-panel"
                  >
                    Read about the original document
                  </Link>
                </p>
              </section>
            </li>
          </ul>

          <section aria-labelledby="download-notes" className="mt-10 border-t border-border pt-6">
            <h2 id="download-notes" className="mt-0 mb-3 text-[1.12rem]">
              Reusing any of this
            </h2>
            <p className="m-0 max-w-[var(--spacing-measure)] text-[1rem] text-ink-muted">
              Quote it, print it, hand it round. If you find an error in a downloaded copy, please
              check it against the site first, since the site is always the current version, and
              then tell us through <Link href="/corrections/">corrections</Link>.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
