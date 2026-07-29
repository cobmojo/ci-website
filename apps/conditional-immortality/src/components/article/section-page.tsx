import { getSection } from '@ci/content/case'
import { revisionsForSection } from '@ci/content/revisions'
import { formatCitation, sourcesForSection } from '@ci/content/sources'
import { chaptersForSection, videoTimestampUrl } from '@ci/content/video'
import { REVISION_TYPE_LABELS } from '@ci/content-schema'
import Link from 'next/link'
import {
  ArticleHeader,
  Breadcrumbs,
  FeedbackCta,
  OnThisPage,
  PreviousNextNavigation,
} from '@/components/article/article-chrome'
import {
  CaseChapterDisclosure,
  CaseChapterNavigation,
} from '@/components/article/chapter-navigation'
import { MdxContent } from '@/components/content/mdx-content'
import { formatLongDate, formatTimestamp } from '@/lib/format'
import { passageBySlugOrReference } from '@/lib/passages'
import type { LoadedSection } from '@/lib/sections'

/**
 * The shared article template for every RB, S and APP page.
 *
 * Layout on wide screens is three columns: chapter navigation, article, and
 * "On this page". The on-page contents appears *before* the article in source
 * order so keyboard and screen-reader users reach it first, and is positioned
 * to the right visually with CSS ordering.
 */
export function SectionPage({ loaded }: { loaded: LoadedSection }) {
  const { section, body, headings, readingMinutes, previous, next, crumbs } = loaded
  const sources = sourcesForSection(section.id)
  const revisions = revisionsForSection(section.id)
  const chapters = chaptersForSection(section.id)

  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs trail={crumbs} />

      <div className="reading-layout gap-8 lg:grid lg:grid-cols-[var(--spacing-chapter-nav)_minmax(0,1fr)] xl:grid-cols-[var(--spacing-chapter-nav)_minmax(0,1fr)_var(--spacing-page-nav)]">
        <CaseChapterNavigation
          currentId={section.id}
          className="hidden lg:block lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:max-h-[calc(100dvh-var(--header-height)-3rem)] lg:overflow-y-auto lg:pr-2 print:hidden"
        />

        <div className="min-w-0">
          <ArticleHeader section={section} readingMinutes={readingMinutes} />

          <CaseChapterDisclosure currentId={section.id} />

          <OnThisPage
            headings={headings}
            titleId="on-this-page-inline"
            className="mb-8 rounded-md border border-border bg-paper-raised p-4 xl:hidden print:hidden"
          />

          <article
            className="prose-article article-body max-w-[var(--spacing-measure)]"
            data-section-id={section.id}
          >
            <MdxContent source={body} />
          </article>

          {chapters.length > 0 ? (
            <section
              aria-labelledby="watch-this-section"
              className="mt-10 rounded-md border border-border bg-paper-raised p-5 print:hidden"
            >
              <h2 id="watch-this-section" className="mt-0 mb-2 text-[1.08rem]">
                Watch this part of the overview
              </h2>
              <ul className="m-0 list-none space-y-1 p-0">
                {chapters.map(chapter => (
                  <li key={chapter.id} className="font-sans text-[0.94rem]">
                    <Link href={`/watch/#${chapter.id}`}>{chapter.title}</Link>{' '}
                    <span className="text-ink-subtle">
                      (
                      <a
                        href={videoTimestampUrl(chapter.start)}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {formatTimestamp(chapter.start)}
                      </a>
                      )
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <RelatedSections loaded={loaded} />

          {sources.length > 0 ? (
            <section
              aria-labelledby="page-sources-cited"
              className="mt-10 border-t border-border pt-6"
            >
              <h2 id="page-sources-cited" className="mt-0 mb-3 text-[1.18rem]">
                Sources cited on this page
              </h2>
              <ol className="m-0 space-y-2 pl-5 font-sans text-[0.9rem] text-ink-muted">
                {sources.map(source => (
                  <li key={source.id} id={`source-${source.id}`}>
                    {formatCitation(source)}
                    {source.url ? (
                      <>
                        {' '}
                        <a href={source.url} rel="noopener noreferrer" target="_blank">
                          View original
                          <span className="sr-only"> of {source.title}, opens in a new tab</span>
                        </a>
                      </>
                    ) : null}{' '}
                    <Link href={`/sources/#${source.id}`} className="text-ink-subtle">
                      Details
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {revisions.length > 0 ? (
            <section aria-labelledby="revision-history" className="mt-8">
              <h2 id="revision-history" className="mt-0 mb-3 text-[1.18rem]">
                Revision history
              </h2>
              <ul className="m-0 list-none space-y-3 p-0">
                {revisions.map(revision => (
                  <li key={revision.id} className="font-sans text-[0.9rem]">
                    <span className="text-ink-subtle">
                      <time dateTime={revision.date}>{formatLongDate(revision.date)}</time>
                      <span aria-hidden="true"> · </span>
                      {REVISION_TYPE_LABELS[revision.type]}
                    </span>
                    <p className="m-0 mt-0.5 text-ink">{revision.summary}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-sans text-[0.88rem]">
                <Link href={`/changelog/${section.id.toLowerCase()}/`}>
                  Full changelog for {section.id}
                </Link>
              </p>
            </section>
          ) : null}

          <footer className="article-footer mt-8 border-t border-border pt-4 font-sans text-[0.85rem] text-ink-subtle">
            <p className="m-0">
              Section {section.id}.{' '}
              {section.lastSubstantiveRevision ? (
                <>
                  Last substantively revised{' '}
                  <time dateTime={section.lastSubstantiveRevision}>
                    {formatLongDate(section.lastSubstantiveRevision)}
                  </time>
                  .
                </>
              ) : null}{' '}
              Drawn from approximately{' '}
              {section.originalPages.length > 1
                ? `pages ${section.originalPages[0]} to ${section.originalPages[section.originalPages.length - 1]}`
                : `page ${section.originalPages[0]}`}{' '}
              of the <Link href="/original-document/">original document</Link>.
            </p>
          </footer>

          <PreviousNextNavigation previous={previous} next={next} />
          <FeedbackCta sectionId={section.id} />
        </div>

        <OnThisPage
          headings={headings}
          titleId="on-this-page-sidebar"
          className="hidden xl:block xl:sticky xl:top-[calc(var(--header-height)+1.5rem)] xl:max-h-[calc(100dvh-var(--header-height)-3rem)] xl:overflow-y-auto print:hidden"
        />
      </div>
    </div>
  )
}

function RelatedSections({ loaded }: { loaded: LoadedSection }) {
  const { section } = loaded
  const related = section.relatedSections
    .map(id => getSection(id))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))
  const passages = [...section.primaryPassages, ...section.relatedPassages]
    .map(reference => ({ reference, page: passageBySlugOrReference(reference) }))
    .filter(entry => entry.page)
    .slice(0, 10)

  if (related.length === 0 && passages.length === 0) return null

  return (
    <section aria-labelledby="related-title" className="mt-10 border-t border-border pt-6">
      <h2 id="related-title" className="mt-0 mb-3 text-[1.18rem]">
        Related sections and passages
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {related.length > 0 ? (
          <div>
            <h3 className="mt-0 mb-2 font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
              Sections
            </h3>
            <ul className="m-0 list-none space-y-1 p-0 font-sans text-[0.92rem]">
              {related.map(item => (
                <li key={item.id}>
                  <Link href={item.route}>
                    <span className="text-ink-subtle">{item.id}</span> {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {passages.length > 0 ? (
          <div>
            <h3 className="mt-0 mb-2 font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
              Passages
            </h3>
            <ul className="m-0 list-none space-y-1 p-0 font-sans text-[0.92rem]">
              {passages.map(entry => (
                <li key={entry.reference}>
                  <Link href={entry.page?.route ?? '/scripture/'}>{entry.reference}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
