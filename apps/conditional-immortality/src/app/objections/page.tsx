import { objectionSections } from '@ci/content/case'
import Link from 'next/link'
import {
  Breadcrumbs,
  type Crumb,
  EvidenceRoleBadge,
  ReviewStatusBadge,
} from '@/components/article/article-chrome'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The objections index.
 *
 * Each objection is stated as the question a reader would actually ask, in the
 * words of someone who holds it, before any answer is offered.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/objections/', label: 'Objections' },
]

export const metadata = pageMetadata({
  title: 'Objections',
  description:
    'Seven serious objections to conditional immortality, each stated at its strongest as a question before it is answered, with a short summary of the response.',
  route: '/objections/',
})

export default function ObjectionsIndexPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <header className="max-w-[var(--spacing-measure)]">
          <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
            Answers to the hard questions
          </p>
          <h1 className="mt-0 mb-4">Objections</h1>
          <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
            An objection is worth answering only if it has been stated properly first. Each page
            below puts the objection at its strongest, in the form someone who holds it would
            recognise, and only then gives the response. Where the response is partial, or where
            conditionalists differ among themselves, the page says so rather than claiming more than
            it has.
          </p>
        </header>

        <section aria-labelledby="all-objections" className="mt-10">
          <h2 id="all-objections" className="sr-only">
            All objections
          </h2>
          <ol className="m-0 list-none space-y-4 p-0">
            {objectionSections.map(section => (
              <li
                key={section.id}
                id={section.id}
                className="rounded-md border border-border bg-paper-raised p-5"
              >
                <h3 className="mt-0 mb-2 text-[1.14rem] leading-snug">
                  <Link href={section.route} className="font-sans">
                    {section.question ?? section.title}
                  </Link>
                </h3>
                <p className="m-0 text-[1.02rem] text-ink-muted">{section.shortSummary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <EvidenceRoleBadge section={section} />
                  <ReviewStatusBadge section={section} />
                </div>
                <p className="m-0 mt-3 font-sans text-[0.88rem]">
                  <Link href={section.route}>
                    Read {section.id}: {section.title}
                  </Link>
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="more-objections"
          className="mt-10 max-w-[var(--spacing-measure)] rounded-md border border-border bg-panel/70 p-5"
        >
          <h2 id="more-objections" className="mt-0 mb-2 text-[1.12rem]">
            An objection that is not here
          </h2>
          <p className="m-0 text-[1rem] text-ink-muted">
            Objections are answered on the pages where they belong as well as here. If the one you
            have in mind is missing, the roadblocks at the start of{' '}
            <Link href="/case/#roadblock">the case</Link> deal with the objections from tradition
            and from the image of God, and anything still unanswered can be sent through the{' '}
            <Link href="/corrections/">corrections page</Link>.
          </p>
        </section>
      </div>
    </>
  )
}
