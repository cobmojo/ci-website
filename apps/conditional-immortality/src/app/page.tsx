import { getSection, PRINCIPAL_CLAIMS } from '@ci/content/case'
import { findPassageByReference } from '@ci/content/passages'
import { topics } from '@ci/content/topics'
import { video } from '@ci/content/video'
import { buttonVariants } from '@ci/ui'
import type { Metadata } from 'next'
import { ClickToLoadVideo } from '@/components/media/click-to-load-video'
import { Link } from '@/components/navigation/link'
import { JsonLd, pageMetadata, websiteJsonLd } from '@/lib/metadata'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = pageMetadata({
  title: siteConfig.homepageTitle,
  description: siteConfig.description,
  route: '/',
})

/* ------------------------------------------------------------------ *
 * Homepage content
 *
 * Everything here is orientation. The homepage never argues the case; it
 * shows a reader what the position is, what it is not, and where to begin.
 * ------------------------------------------------------------------ */

const AFFIRMS: readonly string[] = [
  'The resurrection of the righteous and the unrighteous',
  'A conscious final judgment',
  'Judgment according to what each person has done',
  'Different degrees of punishment',
  'The wrath and justice of God',
  'Salvation through Jesus Christ alone',
  'Permanent exclusion from eternal life',
  'The final and irreversible second death',
]

const DENIES: readonly string[] = [
  'Universal salvation',
  'Universal reconciliation',
  'Salvation apart from Christ',
  'Postmortem conversion',
  'That judgment is painless',
  'That punishment is trivial',
  'That punishment is necessarily instantaneous',
  'That nothing happens to the wicked',
]

const ENTRY_POINTS: readonly {
  heading: string
  body: string
  href: string
  cta: string
}[] = [
  {
    heading: 'I have three minutes',
    body: 'Read the central argument in plain language, without technical vocabulary.',
    href: '/start/what-is-conditional-immortality/',
    cta: 'Read the summary',
  },
  {
    heading: 'I would rather watch',
    body: 'Watch the overview with chapters and a complete transcript.',
    href: '/watch/',
    cta: 'Watch the overview',
  },
  {
    heading: 'Show me the full biblical case',
    body: 'Read all thirty-seven parts in a guided order, with an essential path through them.',
    href: '/case/',
    cta: 'Start the case',
  },
  {
    heading: 'I am concerned about one passage',
    body: 'Find the relevant text and both competing interpretations, side by side.',
    href: '/passages/',
    cta: 'Browse key passages',
  },
  {
    heading: 'I have a specific objection',
    body: 'Browse direct responses to the concerns raised most often.',
    href: '/objections/',
    cta: 'See the objections',
  },
  {
    heading: 'I want to examine the sources',
    body: 'Inspect the Scripture index, historical claims, language notes and scholarship.',
    href: '/sources/',
    cta: 'Open the source library',
  },
]

/**
 * The difficult passages, phrased as honest questions rather than as answers.
 * A reader who arrives worried about one of these should see their own worry
 * reflected back before they see a response.
 */
const DIFFICULT_PASSAGES: readonly { reference: string; question: string }[] = [
  {
    reference: 'Mark 9:42-48',
    question: 'Does "unquenchable fire" mean a fire that never stops burning?',
  },
  {
    reference: 'Isaiah 66:15-24',
    question: 'What does Isaiah 66 contribute to Jesus’ warning in Mark 9?',
  },
  {
    reference: 'Revelation 20:10-15',
    question: 'Whose torment continues for ever in Revelation 20?',
  },
  {
    reference: 'Matthew 25:31-46',
    question: 'Does "eternal punishment" require an eternally continuing act of punishing?',
  },
  {
    reference: 'Luke 16:19-31',
    question: 'Is the rich man already experiencing final judgment?',
  },
  {
    reference: 'Matthew 10:28',
    question: 'What does it mean for God to destroy both body and soul?',
  },
  {
    reference: 'Revelation 14:9-11',
    question: 'What exactly is said to rise for ever, the torment or the smoke?',
  },
  {
    reference: '2 Thessalonians 1:5-10',
    question: 'Is the punishment described as separation, or as destruction?',
  },
  {
    reference: 'Daniel 12:2',
    question: 'Must someone be conscious to be an object of everlasting contempt?',
  },
]

const FEATURED_TOPIC_IDS: readonly string[] = [
  'conditional-immortality',
  'annihilationism',
  'eternal-conscious-torment',
  'eternal-life',
  'immortality',
  'death',
  'second-death',
  'destruction',
  'perishing',
  'fire',
  'eternal-and-everlasting',
  'punishment',
  'final-judgment',
  'resurrection',
  'hades',
  'sheol',
  'gehenna',
  'lake-of-fire',
  'tree-of-life',
  'intermediate-state',
  'body-soul-and-spirit',
  'sodom-and-gomorrah',
]

export default function HomePage() {
  const featuredTopics = FEATURED_TOPIC_IDS.map(id => topics.find(topic => topic.id === id)).filter(
    (topic): topic is NonNullable<typeof topic> => Boolean(topic),
  )

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      {/* ---------------- Hero ---------------- */}
      <section className="border-b border-border bg-paper-raised">
        <div className="mx-auto max-w-[80rem] px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-[46rem]">
            <p className="m-0 mb-3 font-sans text-[0.85rem] font-semibold tracking-[0.12em] text-copper-deep uppercase">
              Evangelical conditionalism
            </p>
            <h1 className="mt-0 mb-5">{siteConfig.homepageTitle}</h1>
            <p className="m-0 text-[1.2rem] leading-[1.6] text-ink-muted">
              {siteConfig.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/start/what-is-conditional-immortality/"
                className={buttonVariants({ variant: 'primary', size: 'lg' })}
              >
                Read the 3-minute summary
              </Link>
              <Link href="/case/" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Start the full case
              </Link>
              <Link
                href="/watch/"
                className={buttonVariants({ variant: 'copperSoft', size: 'lg' })}
              >
                Watch the 28-minute overview
              </Link>
            </div>

            <p className="mt-5 mb-0 font-sans text-[0.92rem]">
              <Link href="/full-case/">Read continuously</Link>
              <span className="text-ink-subtle"> if you would rather have it all on one page.</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[80rem] px-4 sm:px-6">
        {/* ---------------- Featured video ---------------- */}
        <section aria-labelledby="video-title" className="border-b border-border py-12">
          <h2 id="video-title" className="mt-0 mb-2">
            Watch the 28-minute overview
          </h2>
          <p className="mt-0 mb-6 text-ink-muted">
            The whole cumulative case in one sitting, with chapters and a complete transcript on the
            watch page.
          </p>
          <div className="max-w-[52rem]">
            <ClickToLoadVideo />
          </div>
        </section>

        {/* ---------------- What this view means ---------------- */}
        <section aria-labelledby="means-title" className="border-b border-border py-12">
          <h2 id="means-title" className="mt-0 mb-2">
            What this view means
          </h2>
          <p className="mt-0 mb-6 text-ink-muted">
            The disagreement is about the nature of eternal punishment, not about whether judgment
            is serious, conscious, just, irreversible or eternally consequential.
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-md border border-affirm/30 bg-affirm-soft p-5 sm:p-6">
              <h3 className="mt-0 mb-3 flex items-baseline gap-2 font-sans text-[1.02rem] text-affirm">
                <span aria-hidden="true">✓</span> This case affirms
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {AFFIRMS.map(item => (
                  <li key={item} className="flex gap-2.5 text-[1rem] leading-snug">
                    <span aria-hidden="true" className="mt-0.5 text-affirm">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-deny/30 bg-deny-soft p-5 sm:p-6">
              <h3 className="mt-0 mb-3 flex items-baseline gap-2 font-sans text-[1.02rem] text-deny">
                <span aria-hidden="true">✕</span> This case does not teach
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {DENIES.map(item => (
                  <li key={item} className="flex gap-2.5 text-[1rem] leading-snug">
                    <span aria-hidden="true" className="mt-0.5 text-deny">
                      ✕
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-6 mb-0 text-[1.02rem]">
            Stated precisely: human beings are not inherently immortal. The unrighteous are
            resurrected, consciously judged, and receive the full and proportionate punishment God
            determines. That punishment culminates in their complete and irreversible death. Eternal
            life and immortality are gifts given through Christ, not qualities every human being
            automatically possesses.
          </p>
        </section>

        {/* ---------------- Choose where to begin ---------------- */}
        <section aria-labelledby="begin-title" className="border-b border-border py-12">
          <h2 id="begin-title" className="mt-0 mb-6">
            Choose where to begin
          </h2>
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {ENTRY_POINTS.map(entry => (
              <li key={entry.href} className="rounded-md border border-border bg-paper-raised p-5">
                <h3 className="mt-0 mb-2 font-sans text-[1.02rem]">{entry.heading}</h3>
                <p className="m-0 mb-3 text-[0.98rem] leading-snug text-ink-muted">{entry.body}</p>
                <Link href={entry.href} className="font-sans text-[0.94rem] font-medium">
                  {entry.cta}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------- The case in six points ---------------- */}
        <section aria-labelledby="claims-title" className="border-b border-border py-12">
          <h2 id="claims-title" className="mt-0 mb-2">
            The case in six points
          </h2>
          <p className="mt-0 mb-6 text-ink-muted">
            No single point is meant to carry the argument alone. The case is cumulative: each claim
            is set out in full, with the strongest opposing reading stated first.
          </p>
          <ol className="m-0 list-none space-y-6 p-0">
            {PRINCIPAL_CLAIMS.map(claim => {
              const sections = claim.sectionIds
                .map(id => getSection(id))
                .filter((section): section is NonNullable<typeof section> => Boolean(section))
              return (
                <li key={claim.id} className="grid gap-3 sm:grid-cols-[3rem_minmax(0,1fr)]">
                  <span
                    aria-hidden="true"
                    className="font-sans text-[1.5rem] font-semibold text-ink-subtle"
                  >
                    {claim.number}
                  </span>
                  <div className="max-w-[46rem]">
                    <h3 className="mt-0 mb-1.5 text-[1.1rem]">
                      <span className="sr-only">Claim {claim.number}. </span>
                      {claim.title}
                    </h3>
                    <p className="m-0 mb-2 text-[1rem] leading-snug text-ink-muted">
                      {claim.summary}
                    </p>
                    <p className="m-0 font-sans text-[0.9rem]">
                      {sections.map((section, index) => (
                        <span key={section.id}>
                          {index > 0 ? <span className="text-ink-subtle"> · </span> : null}
                          <Link href={section.route}>
                            {section.id} {section.title}
                          </Link>
                        </span>
                      ))}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* ---------------- Difficult passages ---------------- */}
        <section aria-labelledby="difficult-title" className="border-b border-border py-12">
          <h2 id="difficult-title" className="mt-0 mb-2">
            Start with the difficult passages
          </h2>
          <p className="mt-0 mb-6 text-ink-muted">
            If one text is the reason you find this position hard to accept, start there. Each page
            states the traditional reading in the form its own defenders would recognise before
            offering any response.
          </p>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFICULT_PASSAGES.map(item => {
              const passage = findPassageByReference(item.reference)
              const href = passage ? `/passages/${passage.slug}/` : '/scripture/'
              return (
                <li key={item.reference}>
                  <Link
                    href={href}
                    className="block h-full rounded-md border border-border bg-paper-raised p-4 no-underline hover:border-border-strong"
                  >
                    <span className="block font-sans text-[0.82rem] font-semibold tracking-wide text-copper-deep">
                      {item.reference}
                    </span>
                    <span className="mt-1.5 block text-[1rem] leading-snug text-ink">
                      {item.question}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------------- Browse by subject ---------------- */}
        <section aria-labelledby="subjects-title" className="border-b border-border py-12">
          <h2 id="subjects-title" className="mt-0 mb-2">
            Browse by subject
          </h2>
          <p className="mt-0 mb-5 text-ink-muted">
            Each topic explains a term in its own right and says what it is not. Hades, Sheol,
            Gehenna and the lake of fire are kept distinct throughout.
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {featuredTopics.map(topic => (
              <li key={topic.id}>
                <Link
                  href={`/topics/${topic.slug}/`}
                  className="pressable inline-flex min-h-11 items-center rounded-md border border-border bg-paper-raised px-3 font-sans text-[0.9rem] text-ink-muted no-underline hover:border-navy hover:text-navy"
                >
                  {topic.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 mb-0 font-sans text-[0.92rem]">
            <Link href="/topics/">All topics</Link>
            <span className="text-ink-subtle"> · </span>
            <Link href="/glossary/">Glossary</Link>
            <span className="text-ink-subtle"> · </span>
            <Link href="/scripture/">Scripture index</Link>
          </p>
        </section>

        {/* ---------------- Why this project exists ---------------- */}
        <section aria-labelledby="why-title" className="border-b border-border py-12">
          <h2 id="why-title" className="mt-0 mb-4">
            Why this project exists
          </h2>
          <div className="max-w-[var(--spacing-measure)] space-y-4 text-[1.04rem]">
            <p className="m-0">
              {siteConfig.author.name} was raised for roughly thirty-five years in churches that
              taught eternal conscious torment. He had come to terms with it, knew the usual
              arguments for why unending punishment was fitting, and was not looking for a softer
              alternative.
            </p>
            <p className="m-0">
              In November 2022 he encountered the conditionalist position for the first time. He was
              initially skeptical. He became persuaded not by one argument but by working through
              the cumulative biblical case, and he began writing this material down on 1 March 2023.
            </p>
            <p className="m-0">
              He remains open to correction. As he puts it in the source document, either he was
              wrong for thirty years or he is wrong now, so he welcomes anything that brings him
              closer to the truth.
            </p>
            <p className="m-0 font-sans text-[0.94rem]">
              <Link href="/about/">More about the author</Link>
              <span className="text-ink-subtle"> · </span>
              <Link href="/method/">How this site handles evidence</Link>
              <span className="text-ink-subtle"> · </span>
              <Link href="/original-document/">The original document</Link>
            </p>
          </div>
        </section>

        {/* ---------------- Corrections ---------------- */}
        <section aria-labelledby="corrections-title" className="py-12">
          <div className="max-w-[var(--spacing-measure)] rounded-md border border-border bg-panel/70 p-6">
            <h2 id="corrections-title" className="mt-0 mb-2">
              Corrections and counterarguments
            </h2>
            <p className="m-0 mb-4 text-[1.02rem] text-ink-muted">
              This project aims to present the strongest biblical case it can, not to avoid
              criticism. Factual corrections, better sources, serious counterarguments and
              accessibility reports are welcome.
            </p>
            <Link
              href="/corrections/"
              className={buttonVariants({ variant: 'primary', size: 'lg' })}
            >
              Submit a correction or counterargument
            </Link>
            <p className="mt-4 mb-0 font-sans text-[0.9rem] text-ink-subtle">
              Accepted corrections are published in the <Link href="/changelog/">changelog</Link>,
              with the reason recorded.
            </p>
          </div>
        </section>
      </div>

      <span className="sr-only">
        Video overview duration {Math.floor(video.durationSeconds / 60)} minutes.
      </span>
    </>
  )
}
