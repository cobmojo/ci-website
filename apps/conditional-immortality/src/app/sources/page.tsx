import { getSection } from '@ci/content/case'
import { formatCitation, sources } from '@ci/content/sources'
import {
  LINK_STATUS_LABELS,
  PERSPECTIVE_LABELS,
  PERSPECTIVE_UNSTATED_LABEL,
  type Perspective,
  RIGHTS_STATUS_LABELS,
  SOURCE_TYPE_LABELS,
  type SourceType,
} from '@ci/content-schema'
import { Badge } from '@ci/ui'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { NewTabLink } from '@/components/content/new-tab-link'
import { type FilterOption, SourceFilter } from '@/components/sources/source-filter'
import { formatLongDate, pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The source library.
 *
 * Every source the case relies on, with the disposition that governs how much
 * of it may appear on the public site. The whole library is server rendered and
 * every entry carries the id that `<Cite>` links to, so a citation anywhere on
 * the site lands on the right row with scripting disabled.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/sources/', label: 'Sources' },
]

export const metadata = pageMetadata({
  title: 'Sources',
  description:
    'The full source library behind the case, with author, publication, rights disposition, link status and the parts of the argument that cite each one.',
  route: '/sources/',
})

const UNSTATED_PERSPECTIVE = 'unstated'

function perspectiveValue(perspective?: Perspective): string {
  return perspective ?? UNSTATED_PERSPECTIVE
}

function perspectiveLabel(perspective?: Perspective): string {
  return perspective ? PERSPECTIVE_LABELS[perspective] : PERSPECTIVE_UNSTATED_LABEL
}

/** Only the facets that actually occur in the library are offered. */
const TYPE_OPTIONS: readonly FilterOption[] = (() => {
  const present = new Map<SourceType, number>()
  for (const source of sources) present.set(source.type, (present.get(source.type) ?? 0) + 1)
  return [...present.entries()]
    .map(([value, count]) => ({ value, label: `${SOURCE_TYPE_LABELS[value]} (${count})` }))
    .sort((a, b) => a.label.localeCompare(b.label))
})()

const PERSPECTIVE_OPTIONS: readonly FilterOption[] = (() => {
  const present = new Map<string, number>()
  for (const source of sources) {
    const key = perspectiveValue(source.perspective)
    present.set(key, (present.get(key) ?? 0) + 1)
  }
  return [...present.entries()]
    .map(([value, count]) => ({
      value,
      label: `${
        value === UNSTATED_PERSPECTIVE
          ? PERSPECTIVE_UNSTATED_LABEL
          : PERSPECTIVE_LABELS[value as Perspective]
      } (${count})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})()

export default function SourcesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <header className="max-w-[var(--spacing-measure)]">
          <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
            What this case rests on
          </p>
          <h1 className="mt-0 mb-4">Sources</h1>
          <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
            {sources.length} sources, listed alphabetically by author. Every citation anywhere on
            this site links to its entry here, and every entry records where the source can be
            found, how far it may be quoted, and which parts of the case cite it.
          </p>
        </header>

        <section
          aria-labelledby="how-to-read-this"
          className="mt-8 max-w-[var(--spacing-measure)] rounded-md border border-border bg-panel/70 p-5"
        >
          <h2 id="how-to-read-this" className="mt-0 mb-2 text-[1.12rem]">
            How to read these labels
          </h2>
          <div className="space-y-3 text-[1rem] text-ink-muted">
            <p className="m-0">
              The perspective label is neutral data. It records where a source is arguing from so
              you can weigh it, not whether it can be dismissed. A source labelled eternal conscious
              torment is cited here because it states that position well, and the case is weaker,
              not stronger, if such a source is misrepresented.
            </p>
            <p className="m-0">
              The rights disposition governs how much of a source appears on this site. Linked
              rather than quoted means exactly that: the site points you to the source and does not
              reproduce its words. Nothing under copyright is reproduced at length anywhere here.
            </p>
          </div>
        </section>

        <SourceFilter
          types={TYPE_OPTIONS}
          perspectives={PERSPECTIVE_OPTIONS}
          total={sources.length}
        />

        <section aria-labelledby="library-title" className="mt-10">
          <h2 id="library-title" className="mt-0 mb-4 text-[1.3rem]">
            The library
          </h2>

          <ul className="m-0 list-none space-y-5 p-0">
            {sources.map(source => {
              const citing = source.citedBy
                .map(id => getSection(id))
                .filter((section): section is NonNullable<typeof section> => Boolean(section))

              return (
                <li
                  key={source.id}
                  id={source.id}
                  data-source-entry
                  data-source-type={source.type}
                  data-source-perspective={perspectiveValue(source.perspective)}
                  className="rounded-md border border-border bg-paper-raised p-5"
                >
                  <h3 className="mt-0 mb-1 text-[1.1rem] leading-snug">
                    {source.author ? (
                      <span className="text-ink-muted">{source.author}. </span>
                    ) : null}
                    {source.title}
                  </h3>

                  <p className="m-0 font-sans text-[0.9rem] text-ink-muted">
                    {formatCitation(source)}
                  </p>

                  <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                    <li>
                      <Badge tone="neutral" glyph="◆">
                        {SOURCE_TYPE_LABELS[source.type]}
                      </Badge>
                    </li>
                    <li>
                      <Badge tone="navy" glyph="▣">
                        {perspectiveLabel(source.perspective)}
                      </Badge>
                    </li>
                    <li>
                      <Badge
                        tone={source.rightsStatus === 'public-domain' ? 'affirm' : 'copper'}
                        glyph="§"
                      >
                        {RIGHTS_STATUS_LABELS[source.rightsStatus]}
                      </Badge>
                    </li>
                    <li>
                      <Badge
                        tone={
                          source.linkStatus === 'dead' || source.linkStatus === 'archived-only'
                            ? 'ochre'
                            : 'neutral'
                        }
                        glyph={source.linkStatus === 'live' ? '✓' : '!'}
                      >
                        {LINK_STATUS_LABELS[source.linkStatus]}
                      </Badge>
                    </li>
                  </ul>

                  <dl className="mt-4 grid gap-x-8 gap-y-2 font-sans text-[0.88rem] sm:grid-cols-2">
                    {source.publication ? (
                      <div>
                        <dt className="text-ink-subtle">Publication</dt>
                        <dd className="m-0 text-ink">{source.publication}</dd>
                      </div>
                    ) : null}
                    {source.publisher ? (
                      <div>
                        <dt className="text-ink-subtle">Publisher</dt>
                        <dd className="m-0 text-ink">{source.publisher}</dd>
                      </div>
                    ) : null}
                    {source.date ? (
                      <div>
                        <dt className="text-ink-subtle">Date</dt>
                        <dd className="m-0 text-ink">{source.date}</dd>
                      </div>
                    ) : null}
                    {source.edition ? (
                      <div>
                        <dt className="text-ink-subtle">Edition</dt>
                        <dd className="m-0 text-ink">{source.edition}</dd>
                      </div>
                    ) : null}
                    {source.locator ? (
                      <div>
                        <dt className="text-ink-subtle">Locator</dt>
                        <dd className="m-0 text-ink">{source.locator}</dd>
                      </div>
                    ) : null}
                    {source.accessedAt ? (
                      <div>
                        <dt className="text-ink-subtle">Accessed</dt>
                        <dd className="m-0 text-ink">
                          <time dateTime={source.accessedAt}>
                            {formatLongDate(source.accessedAt)}
                          </time>
                        </dd>
                      </div>
                    ) : null}
                    {source.url ? (
                      <div className="min-w-0">
                        <dt className="text-ink-subtle">Link</dt>
                        <dd className="m-0 break-words text-ink">
                          <NewTabLink href={source.url}>{source.url}</NewTabLink>
                        </dd>
                      </div>
                    ) : null}
                    {source.archiveUrl ? (
                      <div className="min-w-0">
                        <dt className="text-ink-subtle">Archived copy</dt>
                        <dd className="m-0 break-words text-ink">
                          <NewTabLink href={source.archiveUrl}>{source.archiveUrl}</NewTabLink>
                        </dd>
                      </div>
                    ) : null}
                    {source.sourceDocumentUrl ? (
                      <div className="min-w-0">
                        <dt className="text-ink-subtle">Link as given in the original document</dt>
                        <dd className="m-0 break-words text-ink">
                          <NewTabLink href={source.sourceDocumentUrl}>
                            {source.sourceDocumentUrl}
                          </NewTabLink>
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {source.note ? (
                    <p className="m-0 mt-4 text-[1rem] text-ink-muted">{source.note}</p>
                  ) : null}

                  <div className="mt-4 border-t border-border pt-3">
                    <h4 className="mt-0 mb-1 font-sans text-[0.82rem] font-semibold tracking-wider text-ink-subtle uppercase">
                      Cited in
                    </h4>
                    {citing.length > 0 ? (
                      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 font-sans text-[0.9rem]">
                        {citing.map(section => (
                          <li key={section.id}>
                            <Link href={section.route}>
                              <span className="text-ink-subtle">{section.id}</span> {section.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="m-0 font-sans text-[0.9rem] text-ink-muted">
                        Held in the library for reference. No part of the case cites it directly.
                      </p>
                    )}
                    {citing.length > 0 ? (
                      <p className="m-0 mt-1 font-sans text-[0.82rem] text-ink-subtle">
                        {citing.length} {pluralise(citing.length, 'part')} of the case.
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}
