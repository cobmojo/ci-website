import { referencedBooks } from '@ci/content/passages'
import { CASE_GROUP_LABELS, type CaseGroup } from '@ci/content-schema'
import {
  SEARCH_DOC_TYPE_LABELS,
  SEARCH_DOC_TYPES,
  type SearchDocType,
  type SearchFilters,
  search,
} from '@ci/search'
import { buttonVariants } from '@ci/ui'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Breadcrumbs } from '@/components/article/article-chrome'
import { SearchEmptyState, SearchResultsList } from '@/components/search/search-results'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { searchIndex } from '@/lib/search-index'

export const metadata: Metadata = pageMetadata({
  title: 'Search',
  description:
    'Search case sections, key passages, objections, topics, the glossary, the source library and the video transcript. Searching runs in your browser.',
  route: '/search/',
  noindex: true,
})

const PAGE_SIZE = 20

type SearchParams = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function listValue(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? [value] : []
}

/**
 * Site search.
 *
 * A real server-rendered form with URL query state, so a result page can be
 * linked, bookmarked and shared, and so the page works with scripting
 * disabled. The header dialog is an enhancement over this page, never a
 * replacement for it.
 *
 * Ranking happens against a prebuilt index. No AI summary is generated above
 * the results: search exists to take a reader to the authored argument.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const query = (firstValue(params.q) ?? '').trim()
  const page = Math.max(1, Number.parseInt(firstValue(params.page) ?? '1', 10) || 1)

  const selectedTypes = listValue(params.type).filter((value): value is SearchDocType =>
    (SEARCH_DOC_TYPES as readonly string[]).includes(value),
  )
  const selectedGroups = listValue(params.group)
  const selectedBooks = listValue(params.book)

  const filters: SearchFilters = {
    ...(selectedTypes.length ? { type: selectedTypes } : {}),
    ...(selectedGroups.length ? { caseGroup: selectedGroups } : {}),
    ...(selectedBooks.length ? { bibleBook: selectedBooks } : {}),
  }

  const index = searchIndex()
  const outcome = query
    ? search(index.docs, query, {
        filters,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
    : { results: [], total: 0, usedTerms: [] }

  const totalPages = Math.max(1, Math.ceil(outcome.total / PAGE_SIZE))
  const caseGroups = Object.keys(CASE_GROUP_LABELS) as CaseGroup[]

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    if (query) next.set('q', query)
    for (const type of selectedTypes) next.append('type', type)
    for (const group of selectedGroups) next.append('group', group)
    for (const book of selectedBooks) next.append('book', book)
    for (const [key, value] of Object.entries(overrides)) {
      next.delete(key)
      if (value) next.set(key, value)
    }
    return `/search/?${next.toString()}`
  }

  /*
   * A hand-typed or stale `?page=` past the end would otherwise render an
   * empty list beneath a count promising results, with a Previous chain
   * walking back from a page that does not exist. Sending the reader to the
   * last real page keeps the URL shareable and the screen truthful.
   */
  if (query && page > totalPages) redirect(buildHref({ page: String(totalPages) }))

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { href: '/', label: 'Home' },
          { href: '/search/', label: 'Search' },
        ])}
      />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          trail={[
            { href: '/', label: 'Home' },
            { href: '/search/', label: 'Search' },
          ]}
        />

        <h1 className="mt-0 mb-2">Search</h1>
        <p className="mt-0 mb-6 text-ink-muted">
          Search case sections, key passages, objections, topics, the glossary, the source library
          and the video transcript. Scripture references work in any common form, including Matthew
          10:28, Matt 10 28 and Mt. 10:28.
        </p>

        {/* A plain GET form: no JavaScript required, and the URL carries state.
            Hidden in print: a paper copy of a results page is the results, not
            the controls that produced them. */}
        <form action="/search/" method="get" className="mb-8 print:hidden">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[16rem] flex-1">
              <label
                htmlFor="search-query"
                className="mb-1 block font-sans text-[0.86rem] font-medium text-ink"
              >
                Search terms
              </label>
              <input
                id="search-query"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="A reference, a phrase, a term, or a section id"
                className="min-h-11 w-full rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[1rem] text-ink"
              />
            </div>
            <button type="submit" className={buttonVariants({ variant: 'primary' })}>
              Search
            </button>
          </div>

          <fieldset className="mt-5 border-0 p-0">
            <legend className="mb-2 font-sans text-[0.86rem] font-medium text-ink">
              Filter by page type
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {SEARCH_DOC_TYPES.map(type => (
                <label
                  key={type}
                  className="inline-flex items-center gap-2 font-sans text-[0.9rem] text-ink-muted"
                >
                  <input
                    type="checkbox"
                    name="type"
                    value={type}
                    defaultChecked={selectedTypes.includes(type)}
                    className="size-4"
                  />
                  {SEARCH_DOC_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Held open when a filter inside it is active. A GET submit
              re-renders the page, and a disclosure that snaps shut would hide
              the case-category or book filter still shaping the results. */}
          <details className="mt-4" open={selectedGroups.length > 0 || selectedBooks.length > 0}>
            <summary className="summary-hit-area font-sans text-[0.9rem] font-medium text-navy">
              More filters
            </summary>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <fieldset className="border-0 p-0">
                <legend className="mb-2 font-sans text-[0.86rem] font-medium text-ink">
                  Case category
                </legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {caseGroups.map(group => (
                    <label
                      key={group}
                      className="inline-flex items-center gap-2 font-sans text-[0.9rem] text-ink-muted"
                    >
                      <input
                        type="checkbox"
                        name="group"
                        value={group}
                        defaultChecked={selectedGroups.includes(group)}
                        className="size-4"
                      />
                      {CASE_GROUP_LABELS[group]}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="search-book"
                  className="mb-1 block font-sans text-[0.86rem] font-medium text-ink"
                >
                  Bible book
                </label>
                <select
                  id="search-book"
                  name="book"
                  defaultValue={selectedBooks[0] ?? ''}
                  className="min-h-11 w-full rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[1rem] text-ink"
                >
                  <option value="">Any book</option>
                  {referencedBooks.map(book => (
                    <option key={book.book} value={book.book}>
                      {book.book}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </details>
        </form>

        <div aria-live="polite" className="mb-4">
          {query ? (
            <p className="m-0 font-sans text-[0.94rem] text-ink-muted">
              {outcome.total === 0
                ? `No results for “${query}”.`
                : `${outcome.total} result${outcome.total === 1 ? '' : 's'} for “${query}”.`}
              {totalPages > 1 ? ` Page ${page} of ${totalPages}.` : ''}
            </p>
          ) : null}
        </div>

        {/* Each result is an h3, so the list needs an h2 above it or the
            document outline jumps straight from the page title to level three. */}
        <section aria-labelledby="search-results-title">
          <h2 id="search-results-title" className="sr-only">
            {query ? `Results for ${query}` : 'Results'}
          </h2>
          {outcome.results.length > 0 ? (
            <SearchResultsList results={outcome.results} />
          ) : (
            <SearchEmptyState query={query || undefined} />
          )}
        </section>

        {totalPages > 1 ? (
          <nav
            aria-label="Search result pages"
            className="mt-8 flex items-center gap-3 print:hidden"
          >
            {page > 1 ? (
              <Link
                href={buildHref({ page: String(page - 1) })}
                rel="prev"
                className="pressable inline-flex min-h-11 items-center rounded-md border border-border px-4 font-sans text-[0.92rem] no-underline hover:bg-panel"
              >
                <span aria-hidden="true">←</span> Previous
              </Link>
            ) : null}
            <span className="font-sans text-[0.9rem] text-ink-subtle">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildHref({ page: String(page + 1) })}
                rel="next"
                className="pressable inline-flex min-h-11 items-center rounded-md border border-border px-4 font-sans text-[0.92rem] no-underline hover:bg-panel"
              >
                Next <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </nav>
        ) : null}

        <p className="mt-10 font-sans text-[0.88rem] text-ink-subtle">
          Search runs entirely in your browser against an index built when the site was published.
          Nothing you type is sent to a server, and no search history is kept.
        </p>
      </div>
    </>
  )
}
