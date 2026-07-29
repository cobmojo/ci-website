import { getSection } from '@ci/content/case'
import { findPassageByReference, passageRoute } from '@ci/content/passages'
import { formatCitation, getSource } from '@ci/content/sources'
import { getTopic, topicRoute, topics } from '@ci/content/topics'
import type { CaseSection, SourceRecord, TopicRecord } from '@ci/content-schema'
import { Callout } from '@ci/ui'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, type Crumb, FeedbackCta } from '@/components/article/article-chrome'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The topic template.
 *
 * A topic page defines a term, states what it is not, and then hands the reader
 * to the parts of the case where the argument is made. The distinctions list is
 * where Sheol, Hades, Gehenna and the lake of fire are kept apart, so it is
 * rendered as a labelled list rather than folded into the prose.
 */

export function generateStaticParams() {
  return topics.map(topic => ({ slug: topic.slug }))
}

export const dynamicParams = false

function crumbsFor(topic: TopicRecord): readonly Crumb[] {
  return [
    { href: '/', label: 'Home' },
    { href: '/topics/', label: 'Topics' },
    { href: topicRoute(topic), label: topic.title },
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const topic = getTopic(slug)
  if (!topic) return {}
  return pageMetadata({
    title: topic.title,
    description: topic.definition,
    route: topicRoute(topic),
    category: 'Topic',
  })
}

function SectionList({ sections }: { sections: readonly CaseSection[] }) {
  return (
    <ul className="m-0 list-none space-y-2 p-0 font-sans text-[0.95rem]">
      {sections.map(section => (
        <li key={section.id}>
          <Link href={section.route}>
            <span className="text-ink-subtle">{section.id}</span> {section.title}
          </Link>
          <span className="mt-0.5 block text-[0.9rem] text-ink-muted">{section.shortSummary}</span>
        </li>
      ))}
    </ul>
  )
}

export default async function TopicRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopic(slug)
  if (!topic) notFound()

  const crumbs = crumbsFor(topic)

  const relatedSections: readonly CaseSection[] = topic.relatedSections
    .map(id => getSection(id))
    .filter((section): section is CaseSection => Boolean(section))

  const relatedObjections: readonly CaseSection[] = topic.relatedObjections
    .map(id => getSection(id))
    .filter((section): section is CaseSection => Boolean(section))

  const relatedTopics: readonly TopicRecord[] = topic.relatedTerms
    .map(id => getTopic(id))
    .filter((record): record is TopicRecord => Boolean(record))

  const sources: readonly SourceRecord[] = topic.sourceIds
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
              Topic
            </p>
            <h1 className="mt-0 mb-4">{topic.title}</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">{topic.definition}</p>
            {topic.aliases.length > 0 ? (
              <p className="m-0 mt-3 font-sans text-[0.88rem] text-ink-subtle">
                Also called: {topic.aliases.join(', ')}
              </p>
            ) : null}
          </header>

          <div className="space-y-4 text-[1.05rem] leading-[1.65]">
            {topic.body.map(paragraph => (
              <p key={paragraph} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>

          {topic.distinctions.length > 0 ? (
            <section aria-labelledby="what-it-is-not" className="mt-10">
              <h2 id="what-it-is-not" className="mt-0 mb-3 text-[1.25rem]">
                What this is not
              </h2>
              <p className="m-0 mb-3 text-[1rem] text-ink-muted">
                Terms in this dispute are routinely collapsed into one another. These distinctions
                are what keep the argument honest.
              </p>
              <ul className="m-0 space-y-2 pl-5 text-[1.02rem] leading-[1.6]">
                {topic.distinctions.map(distinction => (
                  <li key={distinction}>{distinction}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {topic.principalPassages.length > 0 ? (
            <section aria-labelledby="principal-passages" className="mt-10">
              <h2 id="principal-passages" className="mt-0 mb-3 text-[1.25rem]">
                Principal passages
              </h2>
              <ul className="m-0 list-none space-y-1 p-0 font-sans text-[0.95rem]">
                {topic.principalPassages.map(reference => {
                  const passage = findPassageByReference(reference)
                  return (
                    <li key={reference}>
                      {passage ? (
                        <Link href={passageRoute(passage)}>{reference}</Link>
                      ) : (
                        <Link href="/scripture/">{reference}</Link>
                      )}
                      {passage ? null : (
                        <span className="ml-2 text-[0.85rem] text-ink-subtle">
                          Listed in the Scripture index
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          {relatedSections.length > 0 ? (
            <section aria-labelledby="where-it-is-argued" className="mt-10">
              <h2 id="where-it-is-argued" className="mt-0 mb-3 text-[1.25rem]">
                Where this is argued in the case
              </h2>
              <SectionList sections={relatedSections} />
            </section>
          ) : null}

          {relatedObjections.length > 0 ? (
            <section aria-labelledby="related-objections" className="mt-10">
              <h2 id="related-objections" className="mt-0 mb-3 text-[1.25rem]">
                Objections that turn on this
              </h2>
              <SectionList sections={relatedObjections} />
            </section>
          ) : null}

          {relatedTopics.length > 0 ? (
            <section aria-labelledby="related-topics" className="mt-10">
              <h2 id="related-topics" className="mt-0 mb-3 text-[1.25rem]">
                Related topics
              </h2>
              <ul className="m-0 list-none space-y-1 p-0 font-sans text-[0.95rem]">
                {relatedTopics.map(related => (
                  <li key={related.id}>
                    <Link href={topicRoute(related)}>{related.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {topic.openQuestions.length > 0 ? (
            <Callout tone="question" as="h2" title="Open questions" className="mt-10">
              <p className="m-0">
                These are unsettled. They are recorded here rather than answered, because the case
                does not depend on how they come out.
              </p>
              <ul className="m-0 space-y-2 pl-5">
                {topic.openQuestions.map(question => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </Callout>
          ) : null}

          {sources.length > 0 ? (
            <section aria-labelledby="topic-sources" className="mt-10 border-t border-border pt-6">
              <h2 id="topic-sources" className="mt-0 mb-3 text-[1.2rem]">
                Sources for this topic
              </h2>
              <ol className="m-0 space-y-2 pl-5 font-sans text-[0.9rem] text-ink-muted">
                {sources.map(source => (
                  <li key={source.id}>
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

          <FeedbackCta />
        </article>
      </div>
    </>
  )
}
