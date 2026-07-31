import { getSection } from '@ci/content/case'
import { revisedSectionIds, revisions, revisionsForSection } from '@ci/content/revisions'
import {
  type CaseSection,
  REVISION_TYPE_LABELS,
  type RevisionType,
  revisionTypes,
} from '@ci/content-schema'
import { Badge } from '@ci/ui'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { RevisionEntry } from '@/components/changelog/revision-entry'
import { Link } from '@/components/navigation/link'
import { RelatedPages } from '@/components/navigation/related-pages'
import { pluralise } from '@/lib/format'
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
            <nav aria-labelledby="by-part" className="mb-12 print:hidden">
              <h2 id="by-part" className="mt-0 mb-3">
                Changes by part
              </h2>
              <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
                {sectionIndex.map(entry => (
                  <li key={entry.id}>
                    <Link
                      href={`/changelog/${entry.id.toLowerCase()}/`}
                      className="block rounded-md border border-border bg-paper-raised p-4 no-underline hover:border-border-strong"
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
              {revisions.map(revision => (
                <RevisionEntry key={revision.id} revision={revision} />
              ))}
            </ol>
          </section>

          <RelatedPages>
            <li>
              <Link href="/corrections/">Send a correction of your own</Link>
            </li>
            <li>
              <Link href="/method/">How corrections are assessed</Link>
            </li>
            <li>
              <Link href="/original-document/">What the source document said</Link>
            </li>
          </RelatedPages>
        </div>
      </div>
    </>
  )
}
