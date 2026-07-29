import { topicRoute, topics } from '@ci/content/topics'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The topic index.
 *
 * Topics are the conceptual entry point: a reader who arrives with a word
 * rather than a passage starts here. The list is alphabetical by title and
 * every entry carries its own definition, so the index is readable on its own.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/topics/', label: 'Topics' },
]

export const metadata = pageMetadata({
  title: 'Topics',
  description:
    'An alphabetical index of the concepts the argument turns on, from Gehenna and Hades to the second death, each defined in its own right and linked to the parts of the case that treat it.',
  route: '/topics/',
})

export default function TopicsIndexPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <header className="max-w-[var(--spacing-measure)]">
          <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
            The argument by concept
          </p>
          <h1 className="mt-0 mb-4">Topics</h1>
          <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
            {topics.length} topics, in alphabetical order. Each one explains a term in its own
            right, says what it is not, and points to the parts of the case where the argument is
            actually made. Sheol, Hades, Gehenna and the lake of fire are kept genuinely distinct
            from one another rather than collapsed into the single English word hell.
          </p>
          <p className="m-0 mt-4 text-[1rem] text-ink-muted">
            For short definitions of terms rather than full treatments, see the{' '}
            <Link href="/glossary/">glossary</Link>.
          </p>
        </header>

        <section aria-labelledby="all-topics" className="mt-10">
          <h2 id="all-topics" className="sr-only">
            All topics
          </h2>
          <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
            {topics.map(topic => (
              <li
                key={topic.id}
                id={topic.id}
                className="scroll-mt-24 rounded-md border border-border bg-paper-raised p-5"
              >
                <h3 className="mt-0 mb-2 text-[1.1rem]">
                  <Link href={topicRoute(topic)} className="font-sans">
                    {topic.title}
                  </Link>
                </h3>
                <p className="m-0 text-[1rem] text-ink-muted">{topic.definition}</p>
                {topic.aliases.length > 0 ? (
                  <p className="m-0 mt-2 font-sans text-[0.85rem] text-ink-subtle">
                    Also called: {topic.aliases.join(', ')}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
