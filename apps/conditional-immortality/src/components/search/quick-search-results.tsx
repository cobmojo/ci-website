'use client'

import { MATCH_FIELD_LABELS, SEARCH_DOC_TYPE_LABELS, type SearchResult } from '@ci/search'
import Link from 'next/link'
import { useRef } from 'react'
import { FittedSearchExcerpt } from '@/components/search/fitted-search-excerpt'
import { HighlightedText } from '@/components/search/highlighted-text'
import {
  type FittingRuntime,
  useFittedSearchExcerpts,
} from '@/lib/text-layout/use-fitted-search-excerpts'

/**
 * The quick dialog's result list.
 *
 * Split out of the dialog so the dialog stays about dialog behaviour — focus,
 * Escape, the backdrop — and this stays about rows. It owns the one resize
 * observer, the one module load and the one font load for the whole list.
 *
 * The list is a container, which is what lets the excerpt choose two lines or
 * three from its own width rather than from the viewport's.
 */
export function QuickSearchResults({
  results,
  open,
  onNavigate,
  runtime,
}: {
  results: readonly SearchResult[]
  open: boolean
  onNavigate: () => void
  /** Replaced in component tests; production always uses the real one. */
  runtime?: FittingRuntime
}) {
  const listRef = useRef<HTMLOListElement>(null)
  const fitted = useFittedSearchExcerpts({
    results,
    containerRef: listRef,
    enabled: open,
    ...(runtime ? { runtime } : {}),
  })

  return (
    <ol ref={listRef} className="quick-search-results m-0 list-none p-0">
      {results.map(result => (
        <li key={result.doc.id} className="border-b border-border py-2.5 last:border-0">
          <Link
            href={result.doc.route}
            onClick={onNavigate}
            className="block rounded px-1 no-underline hover:bg-panel"
          >
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-sans text-[0.74rem] tracking-wide text-ink-subtle uppercase">
                {SEARCH_DOC_TYPE_LABELS[result.doc.type]}
              </span>
              {result.doc.sectionId ? (
                <span className="font-sans text-[0.74rem] text-copper-deep">
                  {/* A section-id match is often the only visible reason a row
                      is here, so the id is highlighted too. */}
                  <HighlightedText text={result.doc.sectionId} terms={result.matchedTerms} />
                </span>
              ) : null}
            </span>

            <span className="mt-0.5 block font-sans text-[0.98rem] font-medium text-navy">
              <HighlightedText text={result.doc.title} terms={result.matchedTerms} />
            </span>

            <FittedSearchExcerpt
              result={result}
              {...(fitted.get(result.doc.id) ? { fitted: fitted.get(result.doc.id) } : {})}
            />

            <span className="mt-0.5 block font-sans text-[0.76rem] text-ink-subtle">
              Matched in{' '}
              {result.matchedFields
                .slice(0, 2)
                .map(field => MATCH_FIELD_LABELS[field])
                .join(', ')}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
