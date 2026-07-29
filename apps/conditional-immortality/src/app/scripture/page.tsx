import { getSection } from '@ci/content/case'
import {
  referencedBooks,
  type ScriptureIndexEntry,
  scriptureIndex,
  scriptureIndexByTestament,
} from '@ci/content/passages'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { scrollRegionProps } from '@/components/content/scroll-region'
import { ScriptureFilter } from '@/components/scripture/scripture-filter'
import { pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The complete Scripture index.
 *
 * Built by walking the section registry, so a reference added to a part appears
 * here without anyone maintaining a second list. Every row is server rendered:
 * a reader with scripting disabled sees the entire index, and the filter above
 * it is an optional convenience that only hides rows.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/scripture/', label: 'Scripture Index' },
]

export const metadata = pageMetadata({
  title: 'Scripture Index',
  description:
    'Every Scripture reference used anywhere in the case, in canonical order, with the parts that cite it, whether the use is primary, and a link to the passage page where one exists.',
  route: '/scripture/',
})

const LAST_OLD_TESTAMENT_BOOK = 39

function bookAnchor(book: string): string {
  return `book-${book
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}

interface BookGroup {
  readonly book: string
  readonly anchor: string
  readonly entries: readonly ScriptureIndexEntry[]
}

/** Entries arrive in canonical order, so grouping in place preserves that order. */
function groupByBook(entries: readonly ScriptureIndexEntry[]): readonly BookGroup[] {
  const groups: BookGroup[] = []
  const byBook = new Map<string, ScriptureIndexEntry[]>()

  for (const entry of entries) {
    const existing = byBook.get(entry.book)
    if (existing) {
      existing.push(entry)
      continue
    }
    const bucket = [entry]
    byBook.set(entry.book, bucket)
    groups.push({ book: entry.book, anchor: bookAnchor(entry.book), entries: bucket })
  }

  return groups
}

const TESTAMENTS = [
  {
    key: 'old-testament',
    label: 'Old Testament',
    groups: groupByBook(scriptureIndexByTestament.OT),
    entryCount: scriptureIndexByTestament.OT.length,
  },
  {
    key: 'new-testament',
    label: 'New Testament',
    groups: groupByBook(scriptureIndexByTestament.NT),
    entryCount: scriptureIndexByTestament.NT.length,
  },
] as const

const BOOK_NAMES: readonly string[] = referencedBooks.map(book => book.book)

export default function ScriptureIndexPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <header className="max-w-[var(--spacing-measure)]">
          <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
            Every reference in the case
          </p>
          <h1 className="mt-0 mb-4">Scripture Index</h1>
          <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
            {scriptureIndex.length} distinct references across {referencedBooks.length} books, in
            canonical order. A reference is marked primary where the part it appears in is built on
            that text rather than citing it in passing.
          </p>
          <p className="m-0 mt-4 text-[1rem] text-ink-muted">
            References the case works through at length also have their own{' '}
            <Link href="/passages/">passage page</Link>, linked from the row.
          </p>
        </header>

        <nav
          aria-label="Jump to a book"
          className="mt-8 rounded-md border border-border bg-paper-raised p-4 print:hidden"
        >
          <h2 className="mt-0 mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
            Jump to a book
          </h2>
          {TESTAMENTS.map(testament => (
            <div key={testament.key} className="mt-2 first:mt-0">
              <p className="m-0 mb-1 font-sans text-[0.82rem] text-ink-subtle">{testament.label}</p>
              <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 font-sans text-[0.9rem]">
                {referencedBooks
                  .filter(book =>
                    testament.key === 'old-testament'
                      ? book.order <= LAST_OLD_TESTAMENT_BOOK
                      : book.order > LAST_OLD_TESTAMENT_BOOK,
                  )
                  .map(book => (
                    <li key={book.book}>
                      <a href={`#${bookAnchor(book.book)}`}>{book.book}</a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        <ScriptureFilter books={BOOK_NAMES} total={scriptureIndex.length} />

        {TESTAMENTS.map(testament => (
          <section
            key={testament.key}
            id={testament.key}
            aria-labelledby={`${testament.key}-title`}
            className="mt-12"
          >
            <h2 id={`${testament.key}-title`} className="mt-0 mb-4 text-[1.3rem]">
              {testament.label}
              <span className="ml-2 font-sans text-[0.85rem] font-normal text-ink-subtle">
                {testament.entryCount} {pluralise(testament.entryCount, 'reference')}
              </span>
            </h2>

            {testament.groups.map(group => (
              <section
                key={group.book}
                id={group.anchor}
                data-book-group
                aria-labelledby={`${group.anchor}-title`}
                className="mt-8 first:mt-0"
              >
                <h3 id={`${group.anchor}-title`} className="mt-0 mb-2 text-[1.08rem]">
                  {group.book}
                  <span className="ml-2 font-sans text-[0.82rem] font-normal text-ink-subtle">
                    {group.entries.length} {pluralise(group.entries.length, 'reference')}
                  </span>
                </h3>

                <div
                  {...scrollRegionProps(`References in ${group.book}`)}
                  className="overflow-x-auto"
                >
                  <table className="w-full border-collapse font-sans text-[0.92rem]">
                    <caption className="sr-only">
                      References in {group.book} and the parts of the case that use them
                    </caption>
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="border border-border bg-panel px-2 py-2 sm:px-3 text-left font-semibold"
                        >
                          Reference
                        </th>
                        <th
                          scope="col"
                          className="border border-border bg-panel px-2 py-2 sm:px-3 text-left font-semibold"
                        >
                          Appearances
                        </th>
                        <th
                          scope="col"
                          className="border border-border bg-panel px-2 py-2 sm:px-3 text-left font-semibold"
                        >
                          Where it is used
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.entries.map(entry => (
                        <tr
                          key={entry.reference}
                          data-scripture-row
                          data-book={entry.book}
                          data-search={entry.reference.toLowerCase()}
                        >
                          <th
                            scope="row"
                            className="border border-border px-2 py-2 sm:px-3 text-left align-top font-medium"
                          >
                            {entry.passageSlug ? (
                              <>
                                <Link href={`/passages/${entry.passageSlug}/`}>
                                  {entry.reference}
                                </Link>
                                <span className="mt-0.5 block text-[0.8rem] font-normal text-ink-subtle">
                                  Has its own passage page
                                </span>
                              </>
                            ) : (
                              <span className="text-ink">{entry.reference}</span>
                            )}
                          </th>
                          <td className="border border-border px-2 py-2 sm:px-3 align-top text-ink-muted">
                            {entry.useCount}
                          </td>
                          <td className="border border-border px-2 py-2 sm:px-3 align-top">
                            <ul className="m-0 list-none space-y-1 p-0">
                              {entry.uses.map(use => {
                                const section = getSection(use.sectionId)
                                return (
                                  <li key={use.sectionId}>
                                    {section ? (
                                      <Link href={section.route}>
                                        <span className="text-ink-subtle">{section.id}</span>{' '}
                                        {section.title}
                                      </Link>
                                    ) : (
                                      <span>{use.sectionId}</span>
                                    )}{' '}
                                    <span className="text-[0.82rem] text-ink-subtle">
                                      ({use.primary ? 'primary text' : 'supporting reference'})
                                    </span>
                                  </li>
                                )
                              })}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </section>
        ))}
      </div>
    </>
  )
}
