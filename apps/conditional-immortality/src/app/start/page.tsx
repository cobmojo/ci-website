import { caseSections, ESSENTIAL_PATH, getSection, PRINCIPAL_CLAIMS } from '@ci/content/case'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The orientation hub.
 *
 * Everything a first-time reader needs in order to decide where to go next:
 * what the position is, how it differs from the two views it is most often
 * confused with, the six claims the case rests on, and a twelve-page path
 * through the argument. The claims and the path are imported from the content
 * registry so this page can never drift from the case itself.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/start/', label: 'Start Here' },
]

export const metadata: Metadata = pageMetadata({
  title: 'Start Here',
  description:
    'A short orientation to conditional immortality: what the position claims, how it differs from eternal conscious torment and universal reconciliation, the six principal claims, and a twelve-page reading path through the case.',
  route: '/start/',
})

/** Sections named by the essential path, resolved once and reused. */
const ESSENTIAL_SECTIONS = ESSENTIAL_PATH.map(id => getSection(id)).filter(
  (section): section is NonNullable<typeof section> => Boolean(section),
)

export default function StartHerePage() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Breadcrumbs trail={CRUMBS} />

      <div className="max-w-[var(--spacing-measure)]">
        <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
          Orientation
        </p>
        <h1 className="mt-0 mb-4">Start Here</h1>
        <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
          This site argues that final judgment is real, conscious, deserved and permanent, and that
          it ends in the second death rather than in punishing that never stops. This page is the
          shortest complete orientation to that argument, and it says where every part of it is
          worked out at length.
        </p>
      </div>

      <div className="mt-10 max-w-[var(--spacing-measure)]">
        <section aria-labelledby="what-it-is">
          <h2 id="what-it-is" className="mt-0 mb-3 border-b border-border pb-2">
            What conditional immortality is
          </h2>
          <p className="m-0 mb-4">
            Conditional immortality (CI) is the doctrine that everlasting life is conditional.
            Immortality belongs to God, and human beings receive it from him through Christ. Nobody
            holds endless life as a possession of their own nature, so those who are finally lost do
            not go on living for ever.
          </p>
          <p className="m-0 mb-4">
            Annihilationism is the related term, and the two are not identical. Conditional
            immortality is a claim about where immortality comes from. Annihilationism describes the
            outcome for those who never receive it: the final destruction of the unrighteous after
            judgment. Most writers who hold one hold the other, and{' '}
            <Link href="/topics/annihilationism/">annihilationism</Link> is the broader label,
            covering positions that reach the same outcome by different routes.
          </p>
          <p className="m-0">
            <Link href="/start/what-is-conditional-immortality/">
              Read the three-minute summary
            </Link>
            , which sets out what the position claims and what it does not.
          </p>
        </section>

        <section aria-labelledby="three-views" className="mt-10">
          <h2 id="three-views" className="mt-0 mb-3 border-b border-border pb-2">
            How it differs from the two neighbouring views
          </h2>
          <p className="m-0 mb-4">
            Eternal conscious torment (ECT) is the view held by most of the Western church for many
            centuries. The lost are raised, judged, and consciously suffer the just sentence of God
            without end. Its defenders understand this as the settled verdict of a holy God on sin
            rather than as cruelty, and they take no pleasure in it.
          </p>
          <p className="m-0 mb-4">
            Universal reconciliation is the view that God finally reconciles every person to
            himself, so that punishment after death is corrective and temporary. Its defenders
            affirm judgment, wrath, and the seriousness of sin. What they deny is that anyone is
            lost for ever.
          </p>
          <p className="m-0 mb-4">
            Conditional immortality agrees with eternal conscious torment that some people are
            finally lost, and agrees with universal reconciliation that conscious torment does not
            continue for ever. It holds that the sentence itself is death: conscious in its
            execution, graded by guilt, and permanent in its result.
          </p>
          <p className="m-0">
            <Link href="/start/compare-the-views/">
              Compare the three views question by question
            </Link>
            , with each stated as its own adherents would state it.
          </p>
        </section>

        <section aria-labelledby="cumulative" className="mt-10">
          <h2 id="cumulative" className="mt-0 mb-3 border-b border-border pb-2">
            A cumulative case, not one isolated proof text
          </h2>
          <p className="m-0 mb-4">
            No single verse settles this question, and this site does not claim that one does. The
            argument here is cumulative: it asks which reading accounts for the whole pattern of
            what Scripture says about immortality, the penalty of sin, destruction, the shape of
            God's judgments, and the passages usually cited on the other side. Any one claim, taken
            alone, could be answered. The case is that they converge.
          </p>
          <p className="m-0">
            That also means the case can be tested piece by piece. Every claim below names the pages
            where it is argued, and every one of those pages states the eternal conscious torment
            reading before answering it.
          </p>
        </section>

        <section aria-labelledby="principal-claims" className="mt-10">
          <h2 id="principal-claims" className="mt-0 mb-3 border-b border-border pb-2">
            The six principal claims
          </h2>
          <p className="m-0 mb-5">
            These are the load-bearing claims. If they stand, the conclusion follows. If one of them
            fails, the case is weaker by exactly that much.
          </p>
          <ol className="m-0 list-none space-y-6 p-0">
            {PRINCIPAL_CLAIMS.map(claim => {
              const sections = claim.sectionIds
                .map(id => getSection(id))
                .filter((section): section is NonNullable<typeof section> => Boolean(section))
              return (
                <li key={claim.id}>
                  <h3 className="mt-0 mb-2 text-[1.1rem]">
                    <span className="font-sans text-[0.8rem] font-semibold tracking-wider text-copper-deep uppercase">
                      Claim {claim.number}
                    </span>
                    <span className="mt-1 block">{claim.title}</span>
                  </h3>
                  <p className="m-0 mb-2 text-[1.02rem] text-ink-muted">{claim.summary}</p>
                  <p className="m-0 font-sans text-[0.9rem]">
                    <span className="text-ink-subtle">Argued in: </span>
                    {sections.map((section, index) => (
                      <span key={section.id}>
                        {index > 0 ? <span className="text-ink-subtle">, </span> : null}
                        <Link href={section.route}>
                          {section.id}. {section.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                </li>
              )
            })}
          </ol>
        </section>

        <section aria-labelledby="essential-path" className="mt-10">
          <h2 id="essential-path" className="mt-0 mb-3 border-b border-border pb-2">
            The essential reading path
          </h2>
          <p className="m-0 mb-5">
            The full case runs to <Link href="/case/">{caseSections.length} parts</Link>. These{' '}
            {ESSENTIAL_SECTIONS.length} pages, read in this order, meet every load-bearing part of
            the argument without reading all of them.
          </p>
          <ol className="m-0 space-y-3 pl-6">
            {ESSENTIAL_SECTIONS.map(section => (
              <li key={section.id}>
                <Link href={section.route} className="font-sans text-[1rem]">
                  {section.id}. {section.title}
                </Link>
                <span className="mt-0.5 block font-sans text-[0.88rem] text-ink-muted">
                  {section.question}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="where-next" className="mt-10">
          <h2 id="where-next" className="mt-0 mb-3 border-b border-border pb-2">
            Other ways in
          </h2>
          <p className="m-0 mb-5">
            The same material is available in several shapes. Nothing here is a summary that
            replaces the argument; each route leads to the same pages.
          </p>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {ENTRY_POINTS.map(entry => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="block h-full rounded-md border border-border bg-paper-raised p-4 no-underline hover:border-border-strong"
                >
                  <span className="block font-sans text-[1rem] font-medium text-navy">
                    {entry.label}
                  </span>
                  <span className="mt-1 block font-sans text-[0.9rem] text-ink-muted">
                    {entry.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

const ENTRY_POINTS: readonly { href: string; label: string; description: string }[] = [
  {
    href: '/watch/',
    label: 'Watch the overview',
    description:
      'The whole case in one twenty-eight minute video, with a proofread transcript and chapter links into the written sections.',
  },
  {
    href: '/case/',
    label: 'The case, part by part',
    description:
      'Every part in a guided order, grouped by roadblocks, key texts, biblical language, patterns of judgment and final destiny.',
  },
  {
    href: '/full-case/',
    label: 'The full case on one page',
    description:
      'Every section in reading order in a single document, for printing or reading offline.',
  },
  {
    href: '/passages/',
    label: 'Key passages',
    description:
      'Passage-by-passage treatments of Mark 9, Revelation 14 and 20, Matthew 25, Luke 16 and the rest.',
  },
  {
    href: '/objections/',
    label: 'Objections',
    description:
      'Direct answers to the strongest objections, including whether destruction is a real punishment and what becomes of evangelism.',
  },
  {
    href: '/sources/',
    label: 'Sources',
    description:
      'The full source library, with defenders of eternal conscious torment cited in their own words rather than summarised by opponents.',
  },
  {
    href: '/start/case-map/',
    label: 'Case map',
    description:
      'A diagram and a matching list showing how the six principal claims connect to the sections that argue them.',
  },
  {
    href: '/scripture/',
    label: 'Scripture index',
    description:
      'Every reference used anywhere in the case, with links to the sections that treat it.',
  },
]
