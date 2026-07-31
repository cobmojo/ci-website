import { getSection } from '@ci/content/case'
import { getPassage, passageRoute, passages } from '@ci/content/passages'
import { getSource } from '@ci/content/sources'
import type { CaseSection, PassageRecord, SourceRecord } from '@ci/content-schema'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  Breadcrumbs,
  type Crumb,
  FeedbackCta,
  SectionLinkList,
  SourcesCited,
} from '@/components/article/article-chrome'
import { Scripture } from '@/components/content/scripture'
import { Link } from '@/components/navigation/link'
import { formatLongDate } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The passage template.
 *
 * The order is fixed for every passage: text, context, why it matters, then the
 * two readings side by side with the agreements named before the disagreement
 * is isolated. No verse text is typed here. `<Scripture>` renders it from the
 * verified public-domain corpus by reference alone.
 */

export function generateStaticParams() {
  return passages.map(passage => ({ slug: passage.slug }))
}

export const dynamicParams = false

function crumbsFor(passage: PassageRecord): readonly Crumb[] {
  return [
    { href: '/', label: 'Home' },
    { href: '/passages/', label: 'Key Passages' },
    { href: passageRoute(passage), label: passage.normalizedReference },
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const passage = getPassage(slug)
  if (!passage) return {}
  return pageMetadata({
    title: passage.normalizedReference,
    description: passage.shortDescription,
    route: passageRoute(passage),
    type: 'article',
    category: 'Key passage',
  })
}

export default async function PassageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const passage = getPassage(slug)
  if (!passage) notFound()

  const crumbs = crumbsFor(passage)

  const usedIn: readonly CaseSection[] = passage.usedInSections
    .map(id => getSection(id))
    .filter((section): section is CaseSection => Boolean(section))

  const related: readonly PassageRecord[] = passage.relatedPassages
    .map(relatedSlug => getPassage(relatedSlug))
    .filter((record): record is PassageRecord => Boolean(record))

  const sources: readonly SourceRecord[] = passage.sourceIds
    .map(id => getSource(id))
    .filter((source): source is SourceRecord => Boolean(source))

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={crumbs} />

        <article className="max-w-[var(--spacing-measure)]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              Key passage
            </p>
            <h1 className="mt-0 mb-4">{passage.normalizedReference}</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              {passage.shortDescription}
            </p>
          </header>

          <section aria-labelledby="the-text">
            <h2 id="the-text" className="mt-0 mb-3 text-[1.25rem]">
              The text
            </h2>
            {passage.quotations.map(quotation => (
              <Scripture key={quotation.reference} reference={quotation.reference} />
            ))}
          </section>

          <section aria-labelledby="immediate-context" className="mt-10">
            <h2 id="immediate-context" className="mt-0 mb-3 text-[1.25rem]">
              The immediate context
            </h2>
            <p className="m-0 text-[1.05rem] leading-[1.65]">{passage.immediateContext}</p>
          </section>

          {passage.canonicalContext ? (
            <section aria-labelledby="canonical-context" className="mt-10">
              <h2 id="canonical-context" className="mt-0 mb-3 text-[1.25rem]">
                Where it sits in the canon
              </h2>
              <p className="m-0 text-[1.05rem] leading-[1.65]">{passage.canonicalContext}</p>
            </section>
          ) : null}

          <section aria-labelledby="why-it-matters" className="mt-10">
            <h2 id="why-it-matters" className="mt-0 mb-3 text-[1.25rem]">
              Why it matters
            </h2>
            <p className="m-0 text-[1.05rem] leading-[1.65]">{passage.whyItMatters}</p>
          </section>

          {/* -------------------------------------------------------------- */}

          <section aria-labelledby="how-it-is-interpreted" className="mt-12">
            <h2 id="how-it-is-interpreted" className="mt-0 mb-4 text-[1.25rem]">
              How the passage is interpreted
            </h2>

            <div className="rounded-md border border-border-strong bg-panel p-4 sm:p-5">
              <h3
                id="ect-reading"
                className="mt-0 mb-2 font-sans text-[0.95rem] font-semibold tracking-wide text-navy uppercase"
              >
                <span aria-hidden="true">▣ </span>
                The eternal conscious torment reading
              </h3>
              <p className="m-0 text-[1.02rem] leading-[1.65]">{passage.ectReading}</p>
            </div>

            <div className="mt-4 rounded-md border border-copper/35 bg-paper-raised p-4 sm:p-5">
              <h3
                id="conditionalist-reading"
                className="mt-0 mb-2 font-sans text-[0.95rem] font-semibold tracking-wide text-copper-deep uppercase"
              >
                <span aria-hidden="true">◈ </span>
                The conditionalist reading
              </h3>
              <p className="m-0 text-[1.02rem] leading-[1.65]">{passage.conditionalistReading}</p>
            </div>

            <div className="mt-4 rounded-md border border-affirm/30 bg-affirm-soft p-4 sm:p-5">
              <h3
                id="where-the-readings-agree"
                className="mt-0 mb-2 font-sans text-[0.95rem] font-semibold tracking-wide text-affirm uppercase"
              >
                <span aria-hidden="true">✓ </span>
                Where the readings agree
              </h3>
              <ul className="m-0 space-y-2 pl-5 text-[1.02rem] leading-[1.6]">
                {passage.agreements.map(agreement => (
                  <li key={agreement}>{agreement}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 rounded-md border border-ochre/40 bg-ochre-soft p-4 sm:p-5">
              <h3
                id="where-the-disagreement-lies"
                className="mt-0 mb-2 font-sans text-[0.95rem] font-semibold tracking-wide text-ochre uppercase"
              >
                <span aria-hidden="true">! </span>
                Where the disagreement lies
              </h3>
              <p className="m-0 text-[1.02rem] leading-[1.65]">{passage.disagreement}</p>
            </div>
          </section>

          {/* -------------------------------------------------------------- */}

          {passage.languageNotes.length > 0 ? (
            <section aria-labelledby="language-notes" className="mt-12">
              <h2 id="language-notes" className="mt-0 mb-3 text-[1.25rem]">
                Notes on the wording
              </h2>
              <ul className="m-0 space-y-2 pl-5 text-[1.02rem] leading-[1.6]">
                {passage.languageNotes.map(note => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="m-0 mt-3 font-sans text-[0.88rem] text-ink-subtle">
                Fuller treatment of the Greek and Hebrew words behind these notes is in the{' '}
                <Link href="/glossary/">glossary and language notes</Link>.
              </p>
            </section>
          ) : null}

          {passage.notes.length > 0 ? (
            <section aria-labelledby="editorial-notes" className="mt-10">
              <h2 id="editorial-notes" className="mt-0 mb-3 text-[1.25rem]">
                Editorial notes
              </h2>
              <ul className="m-0 space-y-2 pl-5 text-[1.02rem] leading-[1.6]">
                {passage.notes.map(note => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* -------------------------------------------------------------- */}

          <section aria-labelledby="used-in-the-case" className="mt-12 border-t border-border pt-6">
            <h2 id="used-in-the-case" className="mt-0 mb-3 text-[1.18rem]">
              Where this passage appears in the case
            </h2>
            {usedIn.length > 0 ? (
              <SectionLinkList sections={usedIn} />
            ) : (
              <p className="m-0 text-[1rem] text-ink-muted">
                This passage is treated on its own page rather than inside a numbered part of the
                case. Every reference the argument makes is listed in the{' '}
                <Link href="/scripture/">Scripture index</Link>.
              </p>
            )}
          </section>

          {related.length > 0 ? (
            <section aria-labelledby="related-passages" className="mt-10">
              <h2 id="related-passages" className="mt-0 mb-3 text-[1.18rem]">
                Related passages
              </h2>
              <ul className="m-0 list-none space-y-2 p-0 font-sans text-[0.95rem]">
                {related.map(record => (
                  <li key={record.id}>
                    <Link href={passageRoute(record)}>{record.normalizedReference}</Link>
                    <span className="mt-0.5 block text-[0.9rem] text-ink-muted">
                      {record.shortDescription}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <SourcesCited
            sources={sources}
            headingId="passage-sources"
            title="Sources consulted for this passage"
            divider={false}
          />

          <footer className="mt-8 border-t border-border pt-4 font-sans text-[0.85rem] text-ink-subtle">
            <p className="m-0">
              Scripture is quoted from the World English Bible, which is in the public domain. This
              page was last reviewed{' '}
              <time dateTime={passage.lastReviewed}>{formatLongDate(passage.lastReviewed)}</time>.
            </p>
          </footer>

          <FeedbackCta />
        </article>
      </div>
    </>
  )
}
