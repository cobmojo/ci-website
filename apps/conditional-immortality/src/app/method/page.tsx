import type { ExtractedHeading } from '@ci/content'
import {
  EVIDENCE_ROLE_DEFINITIONS,
  EVIDENCE_ROLE_LABELS,
  evidenceRoles,
  REVIEW_STATUS_DEFINITIONS,
  reviewStatuses,
} from '@ci/content-schema'
import { Badge } from '@ci/ui'
import Link from 'next/link'
import {
  Breadcrumbs,
  type Crumb,
  OnThisPage,
  ReviewStatusBadge,
} from '@/components/article/article-chrome'
import { RelatedPages } from '@/components/navigation/related-pages'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/method/', label: 'Method' },
]

export const metadata = pageMetadata({
  title: 'Method',
  description:
    'How this site handles Scripture, translations, original languages, historical claims, opposing views, evidence labels, review status, sources, corrections and unresolved questions.',
  route: '/method/',
})

/** Shaped as extracted headings so the shared OnThisPage can render them. */
const CONTENTS: readonly ExtractedHeading[] = [
  { depth: 2, id: 'authority', text: 'The authority given to Scripture' },
  { depth: 2, id: 'cumulative', text: 'Why the case is cumulative' },
  { depth: 2, id: 'evidence-and-inference', text: 'Direct evidence and inference' },
  { depth: 2, id: 'opposing-views', text: 'How the opposing view is presented' },
  { depth: 2, id: 'translations', text: 'How Bible translations are handled' },
  { depth: 2, id: 'original-languages', text: 'How original languages are handled' },
  { depth: 2, id: 'history', text: 'How historical claims are reviewed' },
  { depth: 2, id: 'evidence-roles', text: 'The evidence-role labels' },
  { depth: 2, id: 'review-status', text: 'The review-status labels' },
  { depth: 2, id: 'sources', text: 'The source hierarchy' },
  { depth: 2, id: 'corrections', text: 'Corrections and revisions' },
  { depth: 2, id: 'unresolved', text: 'How unresolved issues are shown' },
  { depth: 2, id: 'philosophy', text: 'Why philosophy is not treated as proof' },
  { depth: 2, id: 'openness', text: 'Why this stays open to correction' },
]

export default function MethodPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[var(--spacing-measure)]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              How this was made
            </p>
            <h1 className="mt-0 mb-4">Method</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              This page sets out the rules the site works by, so that a reader who disagrees with
              its conclusion can still audit how it was reached. Every claim about method here is
              something you can check against the pages themselves.
            </p>
          </header>

          <OnThisPage
            headings={CONTENTS}
            titleId="method-contents"
            className="mb-10 rounded-md border border-border bg-paper-raised p-4 print:hidden"
          />

          <div className="space-y-10 text-[1.06rem] leading-[1.68]">
            <section aria-labelledby="authority">
              <h2 id="authority" className="mt-0 mb-3">
                The authority given to Scripture
              </h2>
              <p className="m-0 mb-3">
                This is an evangelical project. It treats the Old and New Testaments as the word of
                God written, true in what they affirm, and the final court of appeal on the fate of
                the wicked. No tradition, no council, no scholar and no argument on this site
                outranks a biblical text read in its own context.
              </p>
              <p className="m-0 mb-3">
                That commitment cuts in a direction some readers will not expect. It means the
                question is not which view is more comfortable, or more traditional, or better
                represented in the churches the author grew up in. It means the question is what the
                texts say. Where the texts are difficult, the difficulty is stated rather than
                resolved by assertion.
              </p>
              <p className="m-0">
                It also means the case can be defeated the way any biblical argument can be
                defeated: by showing that a text has been read against its context, that a word has
                been given a sense it does not carry, or that a pattern claimed across Scripture is
                not actually there.
              </p>
            </section>

            <section aria-labelledby="cumulative">
              <h2 id="cumulative" className="mt-0 mb-3">
                Why the case is cumulative
              </h2>
              <p className="m-0 mb-3">
                No single verse settles this question, and the site does not pretend otherwise. The
                argument is cumulative: a large number of passages, read in their own contexts,
                point in the same direction, and the strength of the case lies in the convergence
                rather than in any one page.
              </p>
              <p className="m-0 mb-3">
                A cumulative case carries an obvious risk. Weak arguments can be piled up until the
                heap looks impressive, and a reader has no way to tell the load-bearing pieces from
                the decoration. Two devices guard against that here. First, every page carries an
                evidence-role label, described below, which says plainly what kind of weight the
                argument is meant to bear. Second, the <Link href="/start/case-map/">case map</Link>{' '}
                names the six principal claims and shows which pages support each of them, so a
                reader can attack the structure directly instead of arguing with the pile.
              </p>
              <p className="m-0">
                If a page is removed, the case map shows what the removal costs. Some pages could be
                deleted with no effect on the conclusion. Others could not, and those are labelled
                as core biblical arguments.
              </p>
            </section>

            <section aria-labelledby="evidence-and-inference">
              <h2 id="evidence-and-inference" className="mt-0 mb-3">
                Direct evidence and inference
              </h2>
              <p className="m-0 mb-3">
                A statement in a text and a conclusion drawn from several texts are different
                things, and the site keeps them apart. When Paul writes that the wages of sin is
                death, that is direct evidence about the stated penalty. When the site argues that
                the death in view must be the second death because believers and unbelievers alike
                die physically, that is an inference: a conclusion assembled from more than one
                claim.
              </p>
              <p className="m-0 mb-3">
                Inferences are not weaker by definition, and Scripture itself reasons this way. But
                an inference can fail in ways a quotation cannot, because it depends on every step
                holding. So inferences are marked as inferences, both in the page label and in the
                prose, and each page states what its argument establishes and what it does not
                establish by itself.
              </p>
              <p className="m-0">
                Where the author is offering his own reading rather than reporting a consensus, the
                page says so and the review status records it. That distinction is not a hedge. It
                is information a critic needs in order to aim at the right target.
              </p>
            </section>

            <section aria-labelledby="opposing-views">
              <h2 id="opposing-views" className="mt-0 mb-3">
                How the opposing view is presented
              </h2>
              <p className="m-0 mb-3">
                Every page that touches a disputed passage states the eternal conscious torment
                reading before answering it, in the strongest form its own defenders would
                recognise. Where possible the traditional reading is drawn from writers who hold it,
                not from conditionalist summaries of it.
              </p>
              <p className="m-0 mb-3">
                Three things are ruled out. The site does not caricature the traditional view, does
                not suggest that those who hold it are uncaring, dishonest or deceived, and does not
                claim that the matter is obvious. Millions of careful readers of Scripture have held
                the traditional view, including most of the people who taught the author to read the
                Bible at all.
              </p>
              <p className="m-0">
                Agreement is also recorded. Each passage page lists what both readings accept before
                it states where they part, because a disagreement is only interesting once the
                shared ground is clear.
              </p>
            </section>

            <section aria-labelledby="translations">
              <h2 id="translations" className="mt-0 mb-3">
                How Bible translations are handled
              </h2>
              <p className="m-0 mb-3">
                Full passage displays use the World English Bible, which is in the public domain.
                Every displayed verse comes from a verified corpus held in the codebase, and no
                author can type Scripture text by hand into a page. A page names a reference and the
                text is rendered from the corpus, which removes the possibility of a misquoted verse
                and makes the translation visible on the page.
              </p>
              <p className="m-0 mb-3">
                Where an argument turns on a specific modern rendering, the few words at issue are
                quoted, the translation is named, and the difference is explained in the site’s own
                prose rather than by reproducing the passage. That is a deliberate limit. A
                reference work of this size quotes Scripture far beyond what the incidental
                quotation allowances of the copyrighted translations cover, and a project asking to
                be judged on its honesty cannot help itself to text it has no licence to publish.
              </p>
              <p className="m-0 mb-3">
                The source document quoted modern translations at length. The decision to move to a
                public-domain base text is recorded in the <Link href="/changelog/">changelog</Link>{' '}
                along with its reasoning.
              </p>
              <p className="m-0">
                Two consequences are worth stating plainly. The World English Bible is a revision of
                the American Standard Version and its English is occasionally stiffer than a modern
                reader expects. And no translation is neutral on this subject, this one included,
                which is exactly why arguments that turn on a rendering are examined at the level of
                the underlying word rather than settled by citing a favourite version.
              </p>
            </section>

            <section aria-labelledby="original-languages">
              <h2 id="original-languages" className="mt-0 mb-3">
                How original languages are handled
              </h2>
              <p className="m-0 mb-3">
                Greek and Hebrew appear on this site in their own script, with a transliteration and
                a gloss, marked up with the right language attribute so that assistive technology
                pronounces them correctly. Hebrew is set right to left. Nothing depends on a reader
                being able to read either script.
              </p>
              <p className="m-0 mb-3">
                The standard for a language claim is higher than for an English observation. A word
                study is not an argument on its own: a lexicon entry lists a range of senses, and
                the question is always which sense the context requires. Where the site makes a
                claim about a word, it names the lexical range, states the reading it is arguing
                for, and states the competing readings alongside it. The lexicons and grammars used
                are cited by name in the <Link href="/sources/">source library</Link>.
              </p>
              <p className="m-0">
                The author of the source document does not read Greek or Hebrew formally. Any page
                whose argument depends on a technical claim about either language carries the
                specialist review pending status, and the specific claim in question is stated so
                that someone with the training can check it. Several such pages exist, and they are
                listed as such rather than quietly presented as settled.
              </p>
            </section>

            <section aria-labelledby="history">
              <h2 id="history" className="mt-0 mb-3">
                How historical claims are reviewed
              </h2>
              <p className="m-0 mb-3">
                Historical claims are the easiest place for a theological argument to go wrong,
                because a striking fact travels faster than its evidence. Three rules apply.
              </p>
              <ol className="m-0 mb-3 list-decimal space-y-2 pl-6">
                <li>
                  A claim about what an early writer believed is tied to a passage in that writer,
                  cited with a locator that a reader can look up, not to a secondary source
                  reporting it.
                </li>
                <li>
                  Where the surviving evidence does not support a strong claim, the site states the
                  narrower claim the evidence does support, and says what would be needed to settle
                  the stronger one.
                </li>
                <li>
                  Where a familiar claim turns out to have no primary support, it is withdrawn in
                  public rather than quietly dropped, with the reason recorded in the changelog.
                </li>
              </ol>
              <p className="m-0">
                One claim in the source document was narrowed under this rule and two were withdrawn
                entirely. Those decisions are in the <Link href="/changelog/">changelog</Link>, each
                with the original claim, the problem, and what replaced it.
              </p>
            </section>

            <section aria-labelledby="evidence-roles">
              <h2 id="evidence-roles" className="mt-0 mb-3">
                The evidence-role labels
              </h2>
              <p className="m-0 mb-4">
                Every page in the case carries exactly one evidence role. It is shown as a labelled
                badge at the top of the page and repeated in the page metadata. The label says what
                kind of weight the page is meant to bear, so that a reader can tell a load-bearing
                exegetical argument from a pastoral reflection without having to guess.
              </p>
              <dl className="m-0 space-y-5">
                {evidenceRoles.map(role => (
                  <div key={role} className="rounded-md border border-border bg-paper-raised p-4">
                    <dt className="m-0">
                      <Badge tone="navy" glyph="◆">
                        {EVIDENCE_ROLE_LABELS[role]}
                      </Badge>
                    </dt>
                    <dd className="m-0 mt-2.5 text-[1.02rem] text-ink-muted">
                      {EVIDENCE_ROLE_DEFINITIONS[role]}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="review-status">
              <h2 id="review-status" className="mt-0 mb-3">
                The review-status labels
              </h2>
              <p className="m-0 mb-4">
                The second badge on every page records how far that page has been checked. It is
                deliberately visible rather than hidden in an editorial system, because a reader is
                entitled to know whether a page has been read against its own citations, and whether
                a known problem with it is outstanding.
              </p>
              <dl className="m-0 space-y-5">
                {reviewStatuses.map(status => (
                  <div key={status} className="rounded-md border border-border bg-paper-raised p-4">
                    <dt className="m-0">
                      <ReviewStatusBadge status={status} />
                    </dt>
                    <dd className="m-0 mt-2.5 text-[1.02rem] text-ink-muted">
                      {REVIEW_STATUS_DEFINITIONS[status]}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="m-0 mt-4">
                Nothing here is conveyed by colour alone. Each badge carries its own words and a
                text glyph, so the distinction survives a greyscale print, a screen reader and a
                colour vision deficiency alike.
              </p>
            </section>

            <section aria-labelledby="sources">
              <h2 id="sources" className="mt-0 mb-3">
                The source hierarchy
              </h2>
              <p className="m-0 mb-3">
                Not all sources count the same, and the site ranks them in this order.
              </p>
              <ol className="m-0 mb-3 list-decimal space-y-2 pl-6">
                <li>
                  <strong>The biblical text</strong>, read in context. Everything else is
                  subordinate to it.
                </li>
                <li>
                  <strong>Primary historical sources</strong>: the early Christian writers,
                  Josephus, the classical authors, quoted from the work itself with a locator.
                </li>
                <li>
                  <strong>Lexicons, grammars and reference works</strong>, for what a word can mean,
                  never for what it must mean in a given verse.
                </li>
                <li>
                  <strong>Academic scholarship and serious commentary</strong>, including
                  scholarship that argues against this site’s conclusion.
                </li>
                <li>
                  <strong>Books, articles and sermons by advocates on either side</strong>, useful
                  for stating a position accurately, not for establishing a fact.
                </li>
                <li>
                  <strong>Popular websites and videos</strong>, which are cited only where they are
                  the thing being discussed, never as evidence for a historical or linguistic claim.
                </li>
              </ol>
              <p className="m-0">
                Every source used anywhere on the site has a record in the{' '}
                <Link href="/sources/">source library</Link> with its type, its perspective where
                that is relevant, its rights status, and when its link was last checked. A claim
                supported only by a source low in this list is either qualified on the page or not
                made.
              </p>
            </section>

            <section aria-labelledby="corrections">
              <h2 id="corrections" className="mt-0 mb-3">
                Corrections and revisions
              </h2>
              <p className="m-0 mb-3">
                Anyone can submit a correction, a better source, an accessibility problem or a
                counterargument through the <Link href="/corrections/">corrections form</Link>.
                There is no account and no CAPTCHA. The process after that is fixed.
              </p>
              <ol className="m-0 mb-3 list-decimal space-y-2 pl-6">
                <li>The submission is recorded and read.</li>
                <li>
                  The claim is checked against the source it concerns, not against whether it helps
                  or hurts the case.
                </li>
                <li>
                  If it is accepted, the affected page is changed and a revision record is written
                  with the date, the section, the issue, and the decision taken.
                </li>
                <li>
                  The revision appears in the <Link href="/changelog/">public changelog</Link> and
                  on the revised page itself.
                </li>
                <li>
                  Nobody is named without asking. A submitter is credited only where they chose that
                  option on the form.
                </li>
              </ol>
              <p className="m-0">
                Revisions are typed, so the record distinguishes a factual correction from a
                clarification, a source update, a translation change, a substantive revision and an
                accessibility fix. Nothing is silently edited: where a claim from the source
                document was narrowed or withdrawn, the original wording is preserved in the
                migration ledger described on the{' '}
                <Link href="/original-document/">original document</Link> page.
              </p>
            </section>

            <section aria-labelledby="unresolved">
              <h2 id="unresolved" className="mt-0 mb-3">
                How unresolved issues are shown
              </h2>
              <p className="m-0 mb-3">
                Open questions are published, not parked. Where the site does not know something,
                the page says so in the main flow of the argument rather than in a footnote, and the
                page carries a status that reflects it.
              </p>
              <ul className="m-0 mb-3 list-disc space-y-2 pl-6">
                <li>
                  A page with a known outstanding problem carries the revision needed status and
                  states what the problem is.
                </li>
                <li>
                  A page whose argument depends on a technical language or history claim carries the
                  specialist review pending status and states the specific claim that needs
                  checking.
                </li>
                <li>
                  A reading held loosely by the author is labelled as his present interpretation,
                  with his own hesitancy preserved rather than tidied away.
                </li>
                <li>
                  A reading that some conditionalists hold and others do not is labelled as such,
                  and the page states that the wider case does not depend on it.
                </li>
              </ul>
              <p className="m-0">
                A cumulative case that hides its weak points is not making an argument, it is
                running a campaign. The labels exist so that a critic can find the soft ground
                quickly.
              </p>
            </section>

            <section aria-labelledby="philosophy">
              <h2 id="philosophy" className="mt-0 mb-3">
                Why philosophy is not treated as proof
              </h2>
              <p className="m-0 mb-3">
                Arguments about what a just God would or would not do appear on this site, because
                they appear in the discussion and because the source document raises them. They are
                never treated as biblical evidence, and they are labelled as further consideration
                or theological inference rather than as core biblical argument.
              </p>
              <p className="m-0 mb-3">
                The reason is simple and it applies against this site as much as for it. Our sense
                of what a proportionate punishment looks like is formed by our own time and place,
                and it is not a reliable guide to what God has said. An argument that endless
                torment feels excessive is not evidence that Scripture teaches otherwise. An
                argument that sin against an infinite God must warrant infinite punishment is not
                evidence either, and the site says so on the page where that argument is examined.
              </p>
              <p className="m-0">
                This also rules out a particular kind of rhetorical shortcut. The site does not
                argue that conditional immortality must be true because the alternative is
                unbearable. Final judgment on this account is real, conscious, just, deserved and
                permanent, and nothing here is offered as a softening of it.
              </p>
            </section>

            <section aria-labelledby="openness">
              <h2 id="openness" className="mt-0 mb-3">
                Why this stays open to correction
              </h2>
              <p className="m-0 mb-3">
                The author held the traditional view for about thirty-five years and now holds a
                different one. Whatever else that shows, it shows that at least one of those two
                positions was wrong, and that he is capable of being wrong about it for a long time
                while being entirely sincere.
              </p>
              <p className="m-0 mb-3">
                So the project is built to be corrected. The evidence labels, the review statuses,
                the public changelog, the migration ledger and the source library all exist for the
                same reason: to make it possible for a reader who thinks this is mistaken to show
                exactly where, and to make it costly to quietly ignore them.
              </p>
              <p className="m-0">
                If you can show that a page has misread a text, misused a word, misreported a
                historical source or misstated the traditional view, please{' '}
                <Link href="/corrections/">send it in</Link>. Accepted corrections are published
                with the reasoning, including the ones that make the case weaker.
              </p>
            </section>
          </div>

          <RelatedPages>
            <li>
              <Link href="/about/">About this project and its author</Link>
            </li>
            <li>
              <Link href="/original-document/">The original document and how it was migrated</Link>
            </li>
            <li>
              <Link href="/changelog/">Every change made since publication</Link>
            </li>
            <li>
              <Link href="/sources/">The full source library</Link>
            </li>
          </RelatedPages>
        </div>
      </div>
    </>
  )
}
