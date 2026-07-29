import { passageRoute, passages } from '@ci/content/passages'
import { PASSAGE_ROLE_LABELS, type PassageRecord } from '@ci/content-schema'
import { Badge } from '@ci/ui'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The key passages index.
 *
 * Only passages the case actually works through at length have a page. Every
 * other reference lives in the Scripture index, so no thin auto-generated page
 * is created for a passing citation.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/passages/', label: 'Key Passages' },
]

export const metadata = pageMetadata({
  title: 'Key Passages',
  description:
    'Passage by passage treatments of the texts the argument turns on, from Isaiah 66 to Revelation 20, each with the traditional reading stated before the conditionalist response.',
  route: '/passages/',
})

/** Malachi closes the Old Testament at position 39 in the Protestant canon. */
const LAST_OLD_TESTAMENT_BOOK = 39

const TESTAMENT_GROUPS: readonly {
  key: 'old-testament' | 'new-testament'
  label: string
  records: readonly PassageRecord[]
}[] = [
  {
    key: 'old-testament',
    label: 'Old Testament',
    records: passages.filter(passage => passage.bookOrder <= LAST_OLD_TESTAMENT_BOOK),
  },
  {
    key: 'new-testament',
    label: 'New Testament',
    records: passages.filter(passage => passage.bookOrder > LAST_OLD_TESTAMENT_BOOK),
  },
]

export default function PassagesIndexPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <header className="max-w-[var(--spacing-measure)]">
          <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
            Text by text
          </p>
          <h1 className="mt-0 mb-4">Key Passages</h1>
          <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
            {passages.length} passages carry most of the weight in this dispute, whichever side of
            it you are on. Each has its own page giving the text in full, the setting it stands in,
            the reading defenders of eternal conscious torment give it, the conditionalist reading,
            what both sides agree on, and the single point where they part company.
          </p>
          <p className="m-0 mt-4 text-[1rem] text-ink-muted">
            A passage gets a page only where the case works through it at length. Every other
            reference in the argument, and there are many, is listed in the{' '}
            <Link href="/scripture/">complete Scripture index</Link> with the parts that use it.
          </p>
        </header>

        <nav
          aria-label="Jump to a testament"
          className="mt-8 rounded-md border border-border bg-paper-raised p-4 print:hidden"
        >
          <h2 className="mt-0 mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
            Jump to
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 font-sans text-[0.9rem]">
            {TESTAMENT_GROUPS.map(group => (
              <li key={group.key}>
                <a href={`#${group.key}`}>
                  {group.label} ({group.records.length})
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {TESTAMENT_GROUPS.map(group => (
          <section
            key={group.key}
            id={group.key}
            aria-labelledby={`${group.key}-title`}
            className="mt-10 scroll-mt-24"
          >
            <h2 id={`${group.key}-title`} className="mt-0 mb-4 text-[1.3rem]">
              {group.label}
              <span className="ml-2 font-sans text-[0.85rem] font-normal text-ink-subtle">
                {group.records.length} {pluralise(group.records.length, 'passage')}
              </span>
            </h2>

            <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
              {group.records.map(passage => (
                <li
                  key={passage.id}
                  id={passage.slug}
                  className="scroll-mt-24 rounded-md border border-border bg-paper-raised p-5"
                >
                  <h3 className="mt-0 mb-2 text-[1.1rem]">
                    <Link href={passageRoute(passage)} className="font-sans">
                      {passage.normalizedReference}
                    </Link>
                  </h3>
                  <p className="m-0 text-[1rem] text-ink-muted">{passage.shortDescription}</p>

                  <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                    {passage.roles.map(role => (
                      <li key={role}>
                        <Badge tone={role === 'ect-proof-text' ? 'ochre' : 'navy'} glyph="◆">
                          {PASSAGE_ROLE_LABELS[role]}
                        </Badge>
                      </li>
                    ))}
                  </ul>

                  <p className="m-0 mt-3 font-sans text-[0.85rem] text-ink-subtle">
                    Used in {passage.usedInSections.length}{' '}
                    {pluralise(passage.usedInSections.length, 'part')} of the case
                    {passage.additionalReferences.length > 0 ? (
                      <>
                        <span aria-hidden="true"> · </span>
                        Also covers {passage.additionalReferences.join(', ')}
                      </>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
