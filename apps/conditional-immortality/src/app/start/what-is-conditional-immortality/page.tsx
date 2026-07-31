import { getSection } from '@ci/content/case'
import type { Metadata } from 'next'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { Link } from '@/components/navigation/link'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The three-minute summary.
 *
 * Plain language first, technical vocabulary second, and an explicit account
 * of what the position does not claim. Body prose is kept to roughly 650
 * words so the page really is readable start to finish in about three
 * minutes; anything longer belongs in the case itself.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/start/', label: 'Start Here' },
  { href: '/start/what-is-conditional-immortality/', label: 'What Is Conditional Immortality?' },
]

export const metadata: Metadata = pageMetadata({
  title: 'What Is Conditional Immortality?',
  description:
    'A three-minute summary: everlasting life is conditional on receiving life from God through Christ, the unrighteous are finally destroyed after a real and conscious judgment, and neither universalism nor a denial of resurrection follows.',
  route: '/start/what-is-conditional-immortality/',
})

/** The section that argues the position at length. Titles are never retyped. */
const CORE_SECTION = getSection('S22')

export default function WhatIsConditionalImmortalityPage() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Breadcrumbs trail={CRUMBS} />

      <div className="max-w-[var(--spacing-measure)]">
        <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
          Three-minute summary
        </p>
        <h1 className="mt-0 mb-4">What Is Conditional Immortality?</h1>
        <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
          The short version, in ordinary words before technical ones. Nothing on this page is the
          argument itself. It is a description of the position, so that what follows is being agreed
          with or disagreed with accurately.
        </p>

        <section aria-labelledby="plain-answer" className="mt-10">
          <h2 id="plain-answer" className="mt-0 mb-3 border-b border-border pb-2">
            The plain answer
          </h2>
          <p className="m-0 mb-4">
            Living for ever is not something people already have. It is something God gives. He
            gives it through Jesus Christ, to those who are his. People who are not his are not
            given it, and so they do not live for ever. After they are raised and judged, they come
            to an end.
          </p>
          <p className="m-0">
            That is the whole idea in ordinary words. The rest of this page puts the same thing in
            the vocabulary the debate actually uses, and clears away four things it is regularly
            mistaken for.
          </p>
        </section>

        <section aria-labelledby="the-doctrine" className="mt-10">
          <h2 id="the-doctrine" className="mt-0 mb-3 border-b border-border pb-2">
            The doctrine, stated
          </h2>
          <p className="m-0 mb-4">
            Conditional immortality (CI) is the doctrine that everlasting life is conditional on
            receiving life from God through Christ. Immortality is God's own, and Scripture
            describes it as brought to light and given in the gospel rather than as standard issue
            for every creature. What is conditional is immortality itself, which is where the name
            comes from.
          </p>
          <p className="m-0">
            Annihilationism is a second word, and it is not a synonym. It describes an outcome: the
            final destruction of the unrighteous. Conditional immortality says where immortality
            comes from; annihilationism says how things end for those who never receive it. Because
            the two normally travel together within an evangelical frame,{' '}
            <strong>evangelical conditionalism</strong> is a useful umbrella label for the family of
            positions, and it is the label this site is most at home under.
          </p>
        </section>

        <section aria-labelledby="not-universalism" className="mt-10">
          <h2 id="not-universalism" className="mt-0 mb-3 border-b border-border pb-2">
            This site does not teach universalism
          </h2>
          <p className="m-0 mb-4">
            Universal reconciliation holds that punishment after death is corrective and that
            everyone is finally reconciled to God. This site does not teach that. On the view argued
            here, some people really are lost, the loss is their own, and it is not reversed later.
            Rejecting torment without end does not commit anyone to believing that no one is lost,
            and the two conclusions are reached by different arguments from different texts.
          </p>
          <p className="m-0">
            <Link href="/start/compare-the-views/">
              The comparison page sets out all three views side by side
            </Link>
            , each stated as its own defenders would state it.
          </p>
        </section>

        <section aria-labelledby="not-a-denial" className="mt-10">
          <h2 id="not-a-denial" className="mt-0 mb-3 border-b border-border pb-2">
            This site does not deny resurrection, judgment or punishment
          </h2>
          <p className="m-0 mb-4">
            The unrighteous are raised bodily. They stand at a real and public judgment. They are
            conscious there, they are answerable there, and what they receive is punishment in the
            full sense of the word: deserved, imposed by God, and measured against what each person
            knew and did. None of that is softened on this view, and none of it is a figure of
            speech.
          </p>
          <p className="m-0">
            So conditional immortality is not the claim that there is no hell. It is a claim about
            what the sentence at the end of hell's proceedings actually is. Hades, Sheol, Gehenna
            and the lake of fire are four distinct things in Scripture, and this site keeps them
            distinct rather than folding all four into one English word.
          </p>
        </section>

        <section aria-labelledby="conscious-suffering" className="mt-10">
          <h2 id="conscious-suffering" className="mt-0 mb-3 border-b border-border pb-2">
            Punishment is not painless, instant, or uniform
          </h2>
          <p className="m-0 mb-4">
            Many conditionalists hold that punishment can include conscious suffering before final
            destruction, and the writers cited here say so plainly. The end of the sentence is
            death; the sentence is not only its end. Scripture speaks of few blows and many blows,
            and of one town facing a more bearable day than another, which is difficult to state at
            all if every outcome is identical and immediate.
          </p>
          <p className="m-0">
            The exact nature and duration of that conscious punishment is not presumed to be
            uniform, and this site does not claim to know how long it lasts for anyone. Scripture
            does not give a schedule. Conditionalists differ among themselves here, and where they
            differ that is recorded rather than smoothed over.
          </p>
        </section>

        <section aria-labelledby="next" className="mt-10">
          <h2 id="next" className="mt-0 mb-3 border-b border-border pb-2">
            Where to go next
          </h2>
          <ul className="m-0 space-y-2 pl-6 font-sans text-[0.98rem]">
            <li>
              <Link href="/start/">Start Here</Link> for the six principal claims and a twelve-page
              reading path.
            </li>
            <li>
              <Link href="/start/compare-the-views/">Compare the Views</Link> for the three
              positions question by question.
            </li>
            <li>
              <Link href="/start/case-map/">Case Map</Link> for how each claim connects to the
              sections that argue it.
            </li>
            {CORE_SECTION ? (
              <li>
                <Link href={CORE_SECTION.route}>{CORE_SECTION.title}</Link> for the argument itself.
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  )
}
