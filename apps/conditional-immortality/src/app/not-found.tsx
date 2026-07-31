import { buttonVariants } from '@ci/ui'
import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * 404.
 *
 * A missing page is a navigation failure, so this offers the four routes a
 * reader is most likely to have been looking for plus search, rather than an
 * apology. It carries no breadcrumb trail, because there is no position in the
 * site to describe.
 *
 * Metadata is written inline rather than through `pageMetadata`: this response
 * has no canonical URL of its own and must never be indexed.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  description:
    'That address does not exist on this site. Search, start here, the full case, the key passages, and the objections.',
  robots: { index: false, follow: true },
}

const DESTINATIONS: readonly { href: string; label: string; description: string }[] = [
  {
    href: '/start/',
    label: 'Start Here',
    description:
      'What conditional immortality is, what it is not, and the three-minute summary of the argument.',
  },
  {
    href: '/case/',
    label: 'The Case',
    description:
      'All thirty-seven parts in a guided reading order, with the essential path marked for a shorter route.',
  },
  {
    href: '/passages/',
    label: 'Key Passages',
    description:
      'Passage by passage, with the traditional reading stated first and the conditionalist reading beside it.',
  },
  {
    href: '/objections/',
    label: 'Objections',
    description: 'Direct answers to the objections most often raised against this position.',
  },
]

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-12 sm:px-6 sm:py-16">
      <div className="max-w-[var(--spacing-measure)]">
        <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
          404
        </p>
        <h1 className="mt-0 mb-4">That page does not exist</h1>
        <p className="m-0 mb-3 text-[1.13rem] leading-[1.6] text-ink-muted">
          The address you followed is not a page on this site. It may have been mistyped, or it may
          be an old link from before the case was reorganised into one page per argument.
        </p>
        <p className="m-0 mb-8 text-[1.06rem] text-ink-muted">
          Nothing has been lost. Every argument in the original document is published somewhere
          here, so what you were looking for is almost certainly below. The few things deliberately
          withheld are listed on the <Link href="/original-document/">original document</Link> page.
        </p>

        <section
          aria-labelledby="search-heading"
          className="mb-10 rounded-md border border-border bg-paper-raised p-5"
        >
          <h2 id="search-heading" className="mt-0 mb-2 text-[1.12rem]">
            Search the whole site
          </h2>
          <p className="m-0 mb-4 text-[1.02rem] text-ink-muted">
            Search covers every part, passage, topic, glossary term and source. Try a Scripture
            reference such as Matthew 10:28, a phrase such as unquenchable fire, or a part
            identifier such as S04. Press Ctrl or Cmd and K for the quick panel, which matches
            inside your browser.
          </p>
          <Link href="/search/" className={buttonVariants({ variant: 'primary' })}>
            Go to search
          </Link>
        </section>

        <section aria-labelledby="destinations-heading">
          <h2 id="destinations-heading" className="mt-0 mb-4">
            Or start from one of these
          </h2>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {DESTINATIONS.map(destination => (
              <li key={destination.href}>
                <Link
                  href={destination.href}
                  className="block h-full rounded-md border border-border bg-paper-raised p-4 no-underline hover:border-border-strong"
                >
                  <span className="block font-sans text-[1rem] font-semibold text-navy">
                    {destination.label}
                  </span>
                  <span className="mt-1 block text-[0.98rem] leading-snug text-ink-muted">
                    {destination.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 border-t border-border pt-6 font-sans text-[0.95rem] text-ink-muted">
          If you followed a link from somewhere else and it should have worked, please report it
          through the <Link href="/corrections/?type=broken-link#form">corrections form</Link> so it
          can be fixed.
        </p>
      </div>
    </div>
  )
}
