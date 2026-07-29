import {
  highlightSegments,
  MATCH_FIELD_LABELS,
  SEARCH_DOC_TYPE_LABELS,
  type SearchResult,
} from '@ci/search'
import { Badge } from '@ci/ui'
import Link from 'next/link'

/**
 * Highlighted excerpt.
 *
 * Matched runs are wrapped in `<mark>`, which conveys the emphasis
 * semantically rather than by colour alone. Text is passed as React children,
 * never as HTML, so nothing from content can inject markup.
 */
export function Highlighted({ text, terms }: { text: string; terms: readonly string[] }) {
  const segments = highlightSegments(text, terms)
  return (
    <>
      {segments.map((segment, index) =>
        segment.matched ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional by construction
          <mark key={index} className="rounded-sm bg-ochre-soft px-0.5 text-ink">
            {segment.text}
          </mark>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional by construction
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}

export function SearchResultItem({ result }: { result: SearchResult }) {
  const { doc, matchedFields, matchedTerms, excerpt } = result
  const why = matchedFields
    .slice(0, 3)
    .map(field => MATCH_FIELD_LABELS[field])
    .join(', ')

  return (
    <li className="border-b border-border py-4 last:border-b-0">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{SEARCH_DOC_TYPE_LABELS[doc.type]}</Badge>
        {doc.sectionId ? <Badge tone="navy">{doc.sectionId}</Badge> : null}
        <span className="font-sans text-[0.8rem] text-ink-subtle">{doc.breadcrumb}</span>
      </div>

      <h3 className="m-0 text-[1.05rem]">
        <Link href={doc.route} className="no-underline hover:underline">
          <Highlighted text={doc.title} terms={matchedTerms} />
        </Link>
      </h3>

      <p className="m-0 mt-1 text-[0.97rem] leading-snug text-ink-muted">
        <Highlighted text={excerpt} terms={matchedTerms} />
      </p>

      {why ? (
        <p className="m-0 mt-1.5 font-sans text-[0.79rem] text-ink-subtle">Matched in {why}.</p>
      ) : null}
    </li>
  )
}

export function SearchResultsList({ results }: { results: readonly SearchResult[] }) {
  return (
    <ol className="m-0 list-none p-0">
      {results.map(result => (
        <SearchResultItem key={result.doc.id} result={result} />
      ))}
    </ol>
  )
}

/** Shown before a query is typed, and when nothing matches. */
export function SearchEmptyState({ query }: { query?: string }) {
  const suggestions: Array<[string, string]> = [
    ['Matthew 10:28', 'a Scripture reference, in any common abbreviation'],
    ['unquenchable fire', 'a phrase from a passage'],
    ['aionios', 'a Greek or Hebrew term'],
    ['second death', 'a theological term'],
    ['S04', 'a permanent section id'],
    ['Sodom', 'a person, place or event'],
  ]

  return (
    <div className="py-6">
      {query ? (
        <p className="mt-0 mb-4 text-[1.02rem]">
          Nothing matched <strong>{query}</strong>. Try a different wording, a Scripture reference,
          or one of the examples below.
        </p>
      ) : (
        <p className="mt-0 mb-4 text-[1.02rem] text-ink-muted">
          Search case sections, passages, objections, topics, the glossary, sources and the video
          transcript. Searching happens in your browser; nothing you type is sent anywhere.
        </p>
      )}
      <ul className="m-0 list-none space-y-2 p-0">
        {suggestions.map(([term, note]) => (
          <li key={term} className="font-sans text-[0.92rem]">
            <Link href={`/search/?q=${encodeURIComponent(term)}`} className="font-medium">
              {term}
            </Link>{' '}
            <span className="text-ink-subtle">{note}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
