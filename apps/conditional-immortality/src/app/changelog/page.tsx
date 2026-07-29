import { getSection } from '@ci/content/case'
import { revisedSectionIds, revisions, revisionsForSection } from '@ci/content/revisions'
import {
  type CaseSection,
  REVISION_TYPE_LABELS,
  type RevisionType,
  revisionTypes,
} from '@ci/content-schema'
import { Badge } from '@ci/ui'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { formatLongDate, pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/changelog/', label: 'Changelog' },
]

export const metadata = pageMetadata({
  title: 'Changelog',
  description:
    'Every editorial change made to this site since the source document was migrated, newest first, with the issue raised and the decision taken.',
  route: '/changelog/',
})

function countByType(type: RevisionType): number {
  return revisions.filter(revision => revision.type === type).length
}

interface SectionIndexEntry {
  readonly id: string
  readonly section: CaseSection
  readonly count: number
}

export default function ChangelogPage() {
  const typeCounts = revisionTypes
    .map(type => ({ type, count: countByType(type) }))
    .filter(entry => entry.count > 0)

  const sectionIndex = revisedSectionIds
    .map(id => {
      const section = getSection(id)
      return section ? { id, section, count: revisionsForSection(id).length } : null
    })
    .filter((entry): entry is SectionIndexEntry => entry !== null)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[52rem]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              How this was made
            </p>
            <h1 className="mt-0 mb-4">Changelog</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              Every editorial change to this site, newest first, with the problem that prompted it
              and the decision taken. Changes that weaken the case are recorded here in the same way
              as changes that strengthen it.
            </p>
          </header>

          <section
            aria-labelledby="summary"
            className="mb-10 rounded-md border border-border bg-paper-raised p-5"
          >
            <h2 id="summary" className="mt-0 mb-3 text-[1.12rem]">
              {revisions.length} recorded {pluralise(revisions.length, 'change')}
            </h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {typeCounts.map(entry => (
                <li key={entry.type}>
                  <Badge tone="neutral">
                    {REVISION_TYPE_LABELS[entry.type]}: {entry.count}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-4 text-[1.02rem] text-ink-muted">
              A change is recorded whenever a claim is corrected, narrowed, withdrawn, clarified,
              re-sourced, retranslated or rebuilt for accessibility. The wording that was replaced
              is preserved in the migration ledger described on the{' '}
              <Link href="/original-document/">original document</Link> page, so nothing from the
              source is silently lost.
            </p>
          </section>

          {sectionIndex.length > 0 ? (
            <nav aria-labelledby="by-part" className="mb-12">
              <h2 id="by-part" className="mt-0 mb-3">
                Changes by part
              </h2>
              <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                {sectionIndex.map(entry => (
                  <li key={entry.id}>
                    <Link
                      href={`/changelog/${entry.id.toLowerCase()}/`}
                      className="block rounded-md border border-border bg-paper-raised p-3 no-underline hover:border-border-strong"
                    >
                      <span className="font-sans text-[0.8rem] tracking-wider text-copper-deep uppercase">
                        {entry.id}
                      </span>
                      <span className="mt-0.5 block font-sans text-[0.95rem] font-medium text-navy">
                        {entry.section.title}
                      </span>
                      <span className="mt-0.5 block font-sans text-[0.85rem] text-ink-subtle">
                        {entry.count} recorded {pluralise(entry.count, 'change')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <section aria-labelledby="all-changes">
            <h2 id="all-changes" className="mt-0 mb-5">
              All changes
            </h2>
            <ol className="m-0 list-none space-y-6 p-0">
              {revisions.map(revision => {
                const section = revision.sectionId ? getSection(revision.sectionId) : undefined
                return (
                  <li
                    key={revision.id}
                    id={revision.id}
                    className="rounded-md border border-border bg-paper-raised p-5"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-[0.86rem] text-ink-subtle">
                      <time dateTime={revision.date}>{formatLongDate(revision.date)}</time>
                      <Badge tone="neutral">{REVISION_TYPE_LABELS[revision.type]}</Badge>
                      {section ? (
                        <span>
                          <span className="text-copper-deep">{section.id}</span>{' '}
                          <Link href={section.route}>{section.title}</Link>
                        </span>
                      ) : (
                        <span>Applies across the site</span>
                      )}
                    </div>

                    <h3 className="mt-2.5 mb-3 text-[1.08rem]">{revision.summary}</h3>

                    <dl className="m-0 space-y-3 text-[1.01rem]">
                      <div>
                        <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                          Issue raised
                        </dt>
                        <dd className="m-0 mt-1 text-ink-muted">{revision.issue}</dd>
                      </div>
                      <div>
                        <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                          Decision taken
                        </dt>
                        <dd className="m-0 mt-1 text-ink-muted">{revision.decision}</dd>
                      </div>
                      {revision.details ? (
                        <div>
                          <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                            Further detail
                          </dt>
                          <dd className="m-0 mt-1 text-ink-muted">{revision.details}</dd>
                        </div>
                      ) : null}
                      {revision.creditedTo ? (
                        <div>
                          <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                            Credit
                          </dt>
                          <dd className="m-0 mt-1 text-ink-muted">
                            Raised by {revision.creditedTo}, with permission to publish the name.
                          </dd>
                        </div>
                      ) : null}
                    </dl>

                    {section ? (
                      <p className="m-0 mt-4 font-sans text-[0.88rem]">
                        <Link href={section.route}>Read the revised page</Link>
                        <span aria-hidden="true" className="text-ink-subtle">
                          {' '}
                          ·{' '}
                        </span>
                        <Link href={`/changelog/${section.id.toLowerCase()}/`}>
                          Every change to {section.id}
                        </Link>
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </section>

          <nav
            aria-label="Related pages"
            className="mt-12 border-t border-border pt-6 font-sans text-[0.95rem] print:hidden"
          >
            <ul className="m-0 list-none space-y-2 p-0">
              <li>
                <Link href="/corrections/">Send a correction of your own</Link>
              </li>
              <li>
                <Link href="/method/">How corrections are assessed</Link>
              </li>
              <li>
                <Link href="/original-document/">What the source document said</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
