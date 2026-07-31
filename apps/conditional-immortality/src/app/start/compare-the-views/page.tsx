import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { ScrollRegion } from '@/components/content/scroll-region'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * Side-by-side comparison of the three views of final punishment.
 *
 * Editorial rule for this page: each column is written as its own adherents
 * would state it. Neither the eternal conscious torment column nor the
 * universal reconciliation column is a caricature, and neither is written from
 * a conditionalist summary of the other side.
 *
 * Presentation rule: the comparison data lives in exactly one constant and is
 * rendered twice, as a real table for wide screens and as a stacked set of
 * headed definition lists for narrow ones. The two renderings cannot diverge
 * because neither owns the content.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/start/', label: 'Start Here' },
  { href: '/start/compare-the-views/', label: 'Compare the Views' },
]

export const metadata: Metadata = pageMetadata({
  title: 'Compare the Views',
  description:
    'Eternal conscious torment, conditional immortality and universal reconciliation compared across immortality, resurrection, judgment, the nature of punishment, the final fate of the unrighteous and the meaning of eternal life.',
  route: '/start/compare-the-views/',
})

type ViewKey = 'ect' | 'ci' | 'ur'

interface View {
  readonly key: ViewKey
  readonly label: string
  readonly topicHref: string
}

interface ComparisonRow {
  readonly id: string
  readonly question: string
  readonly answers: Readonly<Record<ViewKey, string>>
}

const VIEWS: readonly View[] = [
  {
    key: 'ect',
    label: 'Eternal conscious torment',
    topicHref: '/topics/eternal-conscious-torment/',
  },
  {
    key: 'ci',
    label: 'Conditional immortality',
    topicHref: '/topics/conditional-immortality/',
  },
  {
    key: 'ur',
    label: 'Universal reconciliation',
    topicHref: '/topics/universal-reconciliation/',
  },
]

/**
 * The single source for both renderings. Every cell states the position of the
 * view named in its column, not this site's assessment of that position.
 */
const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    id: 'human-immortality',
    question: 'Human immortality',
    answers: {
      ect: 'Every human being continues in existence without end. Defenders differ over whether this is native to the soul or upheld by the will of God, but on either account no person ever ceases to be.',
      ci: 'Immortality belongs to God and is given through Christ. Human beings are perishable creatures, so endless existence is a gift received rather than a property owned.',
      ur: 'Every human being will finally exist without end, because everyone is at last reconciled to God and given life in him.',
    },
  },
  {
    id: 'resurrection',
    question: 'Resurrection',
    answers: {
      ect: 'The righteous and the unrighteous are both raised bodily. The unrighteous are raised to stand at judgment and to receive the sentence that follows it.',
      ci: 'Both are raised bodily. Paul describes the imperishable body as the portion of those in Christ, so the unrighteous are raised to be judged rather than made incapable of dying.',
      ur: 'Both are raised bodily. The resurrection of judgment begins a process whose end is reconciliation rather than loss.',
    },
  },
  {
    id: 'final-judgment',
    question: 'Final judgment',
    answers: {
      ect: 'Real, public and by works. The verdict is just, graded by what each person knew and did, and it is never revisited.',
      ci: 'Real, public and by works, graded in the same way. The verdict is never revisited, and the sentence it passes is carried out.',
      ur: 'Real, public and by works. The verdict is severe and truthful, and its purpose is remedial rather than terminal.',
    },
  },
  {
    id: 'nature-of-punishment',
    question: 'Nature of punishment',
    answers: {
      ect: 'Conscious suffering and loss endured without end. Most defenders describe it chiefly as exclusion from God and the experience of his settled judgment, not as torture inflicted by demons, and they reject the popular imagery of pitchforks and caves.',
      ci: 'Conscious, deserved and graded by guilt, culminating in death. The suffering that precedes the end is real punishment; it is not the whole of the sentence, and its length is not stated in Scripture.',
      ur: 'Conscious, painful and corrective. On this reading the fire refines rather than consumes, and it continues for as long as the correction requires.',
    },
  },
  {
    id: 'final-fate',
    question: 'Final fate of the unrighteous',
    answers: {
      ect: 'They exist for ever under the just judgment of God, shut out from his presence and never restored.',
      ci: 'They die the second death. After judgment they are destroyed as whole persons, body and soul, and they are not raised again.',
      ur: 'They are finally reconciled to God and share in the life of the age to come.',
    },
  },
  {
    id: 'eternal-life',
    question: 'Meaning of eternal life',
    answers: {
      ect: 'The blessed, unending life of the redeemed with God. Matthew 25:46 sets it in parallel with a punishment of matching duration.',
      ci: 'Life that has no end, given only in Christ. Its opposite is not an unending life of misery but the loss of life itself.',
      ur: 'The life of the age to come, which every person will finally enter, some by a longer road than others.',
    },
  },
  {
    id: 'how-punishment-ends',
    question: 'Does punishment end in restoration, in continued conscious existence, or in death?',
    answers: {
      ect: 'Continued conscious existence. The punishing does not end, because the state of the lost is permanent.',
      ci: 'Death. The sentence is carried out and its result stands for ever, which is why the punishment is called eternal.',
      ur: 'Restoration. The punishment ends when it has accomplished what it was for.',
    },
  },
]

const TABLE_CAPTION =
  'How eternal conscious torment, conditional immortality and universal reconciliation answer seven questions about final punishment. Each column states the view as its own defenders would state it.'

export default function CompareTheViewsPage() {
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Breadcrumbs trail={CRUMBS} />

      <div className="max-w-[var(--spacing-measure)]">
        <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
          Orientation
        </p>
        <h1 className="mt-0 mb-4">Compare the Views</h1>
        <p className="m-0 mb-4 text-[1.13rem] leading-[1.6] text-ink-muted">
          Three answers to the same question: what happens, finally, to those who are not saved.
          Each column below is written as the people who hold that view would write it.
        </p>
        <p className="m-0 mb-4">
          Eternal conscious torment (ECT) is the view that the lost are raised, judged, and
          consciously suffer the just sentence of God without end. Conditional immortality (CI) is
          the view that immortality is given through Christ, so that the lost are raised, judged,
          punished, and finally destroyed. Universal reconciliation is the view that punishment
          after death is corrective and that God at last reconciles every person to himself.
        </p>
        <p className="m-0">
          This site argues for conditional immortality. That is stated openly so that the other two
          columns can be read as descriptions rather than as rebuttals. Where this site disagrees,
          it disagrees on the pages that make the argument, not in the table.
        </p>
      </div>

      <section aria-labelledby="comparison-heading" className="mt-10">
        <h2 id="comparison-heading" className="mt-0 mb-4">
          Seven questions, three answers
        </h2>

        {/* Wide screens: a real table, so row and column relationships are explicit. */}
        <ScrollRegion label="Comparison of the three views" className="hidden lg:block">
          <table className="w-full min-w-[48rem] border border-border text-left font-sans text-[0.94rem]">
            <caption className="mb-3 text-left font-sans text-[0.88rem] text-ink-muted">
              {TABLE_CAPTION}
            </caption>
            <thead>
              <tr className="bg-panel">
                <th
                  scope="col"
                  className="w-[15%] border border-border p-3 align-top font-semibold"
                >
                  Question
                </th>
                {VIEWS.map(view => (
                  <th
                    key={view.key}
                    scope="col"
                    className="border border-border p-3 align-top font-semibold"
                  >
                    <Link href={view.topicHref}>{view.label}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(row => (
                <tr key={row.id} className="odd:bg-paper-raised">
                  <th
                    scope="row"
                    className="border border-border p-3 align-top font-semibold text-navy"
                  >
                    {row.question}
                  </th>
                  {VIEWS.map(view => (
                    <td key={view.key} className="border border-border p-3 align-top">
                      {row.answers[view.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>

        {/* Narrow screens: the same data grouped by question, with each view named in a
            definition list so no row or column relationship is lost. */}
        <div className="lg:hidden">
          <p className="m-0 mb-5 font-sans text-[0.88rem] text-ink-muted">{TABLE_CAPTION}</p>
          <div className="space-y-6">
            {COMPARISON_ROWS.map(row => (
              <section
                key={row.id}
                aria-labelledby={`row-${row.id}`}
                className="rounded-md border border-border bg-paper-raised p-4"
              >
                <h3 id={`row-${row.id}`} className="mt-0 mb-3 text-[1.05rem]">
                  {row.question}
                </h3>
                <dl className="m-0">
                  {VIEWS.map(view => (
                    <div key={view.key} className="mt-3 first:mt-0">
                      <dt className="font-sans text-[0.82rem] font-semibold tracking-wider text-copper-deep uppercase">
                        {view.label}
                      </dt>
                      <dd className="m-0 mt-1 font-sans text-[0.94rem] text-ink">
                        {row.answers[view.key]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-10 max-w-[var(--spacing-measure)]">
        <section aria-labelledby="agreement">
          <h2 id="agreement" className="mt-0 mb-3 border-b border-border pb-2">
            What all three views agree on
          </h2>
          <p className="m-0 mb-4">
            The disagreement is narrower than it is usually made to sound. All three views hold that
            God is just and good, that human beings are accountable to him, that sin is serious,
            that the dead are raised bodily, and that there is a real and public final judgment at
            which the books are opened. All three are held by people who take Scripture as
            authoritative and who are trying to say what it says. All three reject the folk picture
            of hell as a cavern run by gleeful devils.
          </p>
          <p className="m-0">
            What they differ over is the sentence: whether it continues without end, whether it ends
            in the death of the person judged, or whether it ends in that person's restoration.
          </p>
        </section>

        <section aria-labelledby="next-steps" className="mt-10">
          <h2 id="next-steps" className="mt-0 mb-3 border-b border-border pb-2">
            Where the argument is made
          </h2>
          <ul className="m-0 space-y-2 pl-6 font-sans text-[0.98rem]">
            <li>
              <Link href="/start/what-is-conditional-immortality/">
                What Is Conditional Immortality?
              </Link>{' '}
              for the position in three minutes.
            </li>
            <li>
              <Link href="/start/">Start Here</Link> for the six principal claims and a reading
              path.
            </li>
            <li>
              <Link href="/case/">The Case</Link> for the argument itself, part by part.
            </li>
            <li>
              <Link href="/objections/">Objections</Link> for the strongest replies from the other
              side and the answers offered here.
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
