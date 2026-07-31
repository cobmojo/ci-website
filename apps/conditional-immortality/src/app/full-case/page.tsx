import { caseReadingOrder, caseSectionsByGroup } from '@ci/content/case'
import { formatCitation, sources } from '@ci/content/sources'
import { CASE_GROUP_LABELS } from '@ci/content-schema'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { MdxContent } from '@/components/content/mdx-content'
import { NewTabLink } from '@/components/content/new-tab-link'
import { pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { loadSection } from '@/lib/sections'
import { siteConfig } from '@/lib/site-config'

const ROUTE = '/full-case/'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/case/', label: 'The Case' },
  { href: ROUTE, label: 'Full Case' },
]

export const metadata: Metadata = pageMetadata({
  title: 'Full Case',
  description:
    'The whole case on one page, in canonical order, for continuous reading or for printing to PDF. Every section is the same text as its own page.',
  route: ROUTE,
  noindex: true,
})

/**
 * The continuous edition.
 *
 * Every section here is loaded from the same registry and the same MDX body as
 * its individual page, so the two can never drift. Nothing is duplicated by
 * hand and nothing is abridged: the reading order is `caseReadingOrder`, which
 * runs P00, RB1 to RB3, S01 to S34, then the two appendices.
 *
 * The page is `noindex, follow`, because it would otherwise compete with the
 * forty pages it is assembled from.
 */
export default function FullCasePage() {
  const loaded = caseReadingOrder.map(section => loadSection(section))
  const totalMinutes = loaded.reduce((sum, item) => sum + item.readingMinutes, 0)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[52rem]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              Continuous edition
            </p>
            <h1 className="mt-0 mb-4">Full Case</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              Every part of the case in canonical order on a single page, assembled from the same
              text as the individual pages. About {totalMinutes} {pluralise(totalMinutes, 'minute')}{' '}
              of reading, or roughly {Math.round(totalMinutes / 60)} hours at a careful pace.
            </p>
            <p className="mt-4 mb-0 font-sans text-[0.9rem] text-ink-subtle">
              {loaded.length} sections{'. '}
              Last substantively reviewed across the site on{' '}
              <time dateTime={siteConfig.lastSubstantivelyUpdated}>
                {siteConfig.lastSubstantivelyUpdated}
              </time>
              .
            </p>
          </header>

          <section
            aria-labelledby="printing-title"
            className="mb-10 rounded-md border border-border bg-paper-raised p-5 print:hidden"
          >
            <h2 id="printing-title" className="mt-0 mb-2 text-[1.12rem]">
              Printing or saving as PDF
            </h2>
            <p className="m-0 mb-3 text-[1rem] text-ink-muted">
              Use the print command in your browser, Ctrl and P on Windows or Command and P on a
              Mac, then choose Save as PDF. Navigation, the contents panel and every interactive
              control are removed from the printed copy, each section starts on a new page, and the
              bibliography is printed in full.
            </p>
            <p className="m-0 font-sans text-[0.95rem]">
              <Link href="/download/">Other formats and downloads</Link>
            </p>
          </section>

          <nav
            aria-labelledby="contents-title"
            className="mb-12 rounded-md border border-border bg-panel/50 p-5 print:hidden"
          >
            <h2 id="contents-title" className="mt-0 mb-3 text-[1.18rem]">
              Contents
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {caseSectionsByGroup.map(bucket => (
                <div key={bucket.group}>
                  <h3 className="mt-0 mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
                    {bucket.label}
                  </h3>
                  <ol className="m-0 list-none space-y-1 p-0 font-sans text-[0.9rem]">
                    {bucket.sections.map(section => (
                      <li key={section.id}>
                        <a href={`#${section.id}`}>
                          <span className="text-ink-subtle">{section.id}</span> {section.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <div>
                <h3 className="mt-0 mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
                  Back matter
                </h3>
                <ol className="m-0 list-none space-y-1 p-0 font-sans text-[0.9rem]">
                  <li>
                    <a href="#bibliography">Bibliography</a>
                  </li>
                </ol>
              </div>
            </div>
          </nav>

          {loaded.map(item => (
            <section
              key={item.section.id}
              aria-labelledby={item.section.id}
              className="print-section-break mt-12 border-t border-border pt-8"
            >
              <p className="m-0 mb-1.5 font-sans text-[0.8rem] font-semibold tracking-wider text-copper-deep uppercase">
                {item.section.id} <span aria-hidden="true">·</span>{' '}
                {CASE_GROUP_LABELS[item.section.group]}
              </p>
              <h2
                id={item.section.id}
                className="mt-0 mb-3 text-[1.7rem] leading-tight sm:text-[2.05rem]"
              >
                {item.section.title}
              </h2>
              <p className="m-0 mb-6 text-[1.06rem] text-ink-muted">{item.section.thesis}</p>

              <article
                className="prose-article article-body max-w-[var(--spacing-measure)]"
                data-section-id={item.section.id}
              >
                {/* Headings demoted one level: this page has already spent h2
                    on the section titles, so the body's own "In brief" must
                    sit beneath its section in the outline, not beside it. */}
                <MdxContent
                  source={item.body}
                  idPrefix={item.section.id.toLowerCase()}
                  demoteHeadings
                />
              </article>

              <p className="mt-5 mb-0 font-sans text-[0.85rem] text-ink-subtle">
                <Link href={item.section.route}>Open {item.section.id} on its own page</Link>
                <span> for sources cited there, revision history and related sections.</span>
              </p>
            </section>
          ))}

          <section
            aria-labelledby="bibliography"
            className="print-section-break mt-12 border-t border-border pt-8"
          >
            <h2 id="bibliography" className="mt-0 mb-3 text-[1.7rem] sm:text-[2.05rem]">
              Bibliography
            </h2>
            <p className="m-0 mb-5 text-[1.06rem] text-ink-muted">
              Every source in the library, whether it argues for conditional immortality, against
              it, or neither. Sources are listed by author, or by title where there is no named
              author.
            </p>
            <ol className="m-0 space-y-3 pl-5 font-sans text-[0.9rem] text-ink-muted">
              {sources.map(source => (
                <li key={source.id} id={`bibliography-${source.id}`}>
                  <span className="text-ink">{formatCitation(source)}</span>
                  {source.url ? (
                    <>
                      <br />
                      <NewTabLink href={source.url} showsUrl>
                        {source.url}
                      </NewTabLink>
                    </>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <footer className="mt-12 border-t border-border pt-6 font-sans text-[0.85rem] text-ink-subtle">
            <p className="m-0">
              This continuous edition is generated from the same content registry as the individual
              pages. If a section reads differently here, that is a bug worth reporting through{' '}
              <Link href="/corrections/">corrections</Link>.
            </p>
          </footer>
        </div>
      </div>
    </>
  )
}
