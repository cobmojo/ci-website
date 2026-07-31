import { revisions } from '@ci/content/revisions'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { RevisionEntry } from '@/components/changelog/revision-entry'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { RelatedPages } from '@/components/navigation/related-pages'
import { pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/corrections/', label: 'Corrections' },
]

export const metadata = pageMetadata({
  title: 'Corrections',
  description:
    'Send a factual correction, a better source, a translation or historical correction, an accessibility problem or a counterargument, and read the public record of every accepted change.',
  route: '/corrections/',
})

/** Newest first, matching the changelog. */
const ACCEPTED = revisions

export default function CorrectionsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[52rem]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              How this was made
            </p>
            <h1 className="mt-0 mb-4">Corrections</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              This project aims to state the strongest biblical case it can, not to avoid criticism.
              If something here is wrong, the fastest way to fix it is to tell the author what and
              why.
            </p>
          </header>

          <section
            aria-labelledby="what-happens"
            className="mb-10 rounded-md border border-border bg-panel/70 p-5"
          >
            <h2 id="what-happens" className="mt-0 mb-3 text-[1.12rem]">
              What happens to a submission
            </h2>
            <ol className="m-0 list-decimal space-y-2 pl-6 text-[1.02rem] text-ink-muted">
              <li>It is recorded as soon as you send it, and it is read.</li>
              <li>
                The claim is checked against the source it concerns, not against whether it helps or
                hurts the case.
              </li>
              <li>
                If it is accepted, the page is changed and a revision record is written with the
                date, the issue and the decision.
              </li>
              <li>
                The revision is published below and in the <Link href="/changelog/">changelog</Link>
                , and appears on the revised page itself.
              </li>
              <li>
                You are never named unless you asked to be credited and the correction was accepted.
              </li>
            </ol>
            <p className="m-0 mt-3 text-[1.02rem] text-ink-muted">
              There is no promise of a reply to every submission. There is a commitment that
              accepted corrections are published with their reasoning, including the ones that make
              the case weaker.
            </p>
          </section>

          <section aria-labelledby="send" className="mb-14">
            <h2 id="send" className="mt-0 mb-3">
              Send a correction or counterargument
            </h2>

            <div className="mb-6 rounded-md border border-border bg-paper-raised p-5">
              <h3 className="mt-0 mb-2 font-sans text-[0.95rem] font-semibold text-ink">
                What this form collects, and for how long
              </h3>
              <ul className="m-0 list-disc space-y-1.5 pl-5 font-sans text-[0.92rem] text-ink-muted">
                <li>
                  The feedback type, your message, and your publication choice. These are required
                  to act on what you send.
                </li>
                <li>
                  A source web address, your name and your email, all optional. Leave any of them
                  empty and nothing is stored in their place.
                </li>
                <li>
                  The part of the site you came from, when you arrive from a link on a section page.
                  This is a section identifier such as S04, nothing more.
                </li>
                <li>
                  Your network address is used only to limit how many submissions one connection can
                  send in ten minutes. It is held in memory for that window and is never written
                  next to your submission.
                </li>
                <li>
                  No cookie is set, no analytics run, no third party is contacted, and there is no
                  CAPTCHA.
                </li>
                <li>
                  Submissions are stored on the site’s own server, are read by the author alone, and
                  are deleted within twenty-four months of being resolved. An accepted correction
                  stays in the public changelog permanently, without your name unless you asked for
                  credit.
                </li>
              </ul>
              <p className="m-0 mt-3 font-sans text-[0.92rem] text-ink-subtle">
                The full statement is on the <Link href="/privacy/">privacy page</Link>.
              </p>
            </div>

            {/*
              The receipt a reader gets when they submit with no scripting.
              The endpoint answers a form-encoded POST with a 303 to one of
              these two fragments, and `:target` reveals the matching one. It
              has to be server-rendered and unconditional: the form is a client
              component, so with scripting off nothing it renders ever appears,
              and the previous `?submitted=1` round trip returned the reader to
              an apparently untouched empty form whether their correction had
              been recorded or not.

              With scripting on the form posts with `fetch` and never
              navigates, so neither fragment is ever reached and the form's own
              status region remains the only message.

              `tabIndex={-1}` is what makes the browser move focus here on the
              fragment navigation, which is what announces it.

              The wording differs from the form's own status region on purpose:
              both are in the DOM at once, and two elements reading "Received."
              on one page is ambiguous to anything scanning it, test or reader.
            */}
            <div
              className="submission-receipt m-0 mb-5 rounded-md border border-affirm/30 bg-affirm-soft p-4 font-sans text-[0.95rem] text-ink"
              id="submission-received"
              tabIndex={-1}
            >
              <p className="m-0">
                <strong className="font-semibold text-affirm">Recorded.</strong> Your submission was
                saved. Every submission is read. If it leads to a change, that change is published
                in the <Link href="/changelog/">changelog</Link> with the issue and the decision.
              </p>
            </div>
            <div
              className="submission-receipt m-0 mb-5 rounded-md border border-deny/30 bg-deny-soft p-4 font-sans text-[0.95rem] text-ink"
              id="submission-not-recorded"
              tabIndex={-1}
            >
              <p className="m-0">
                <strong className="font-semibold text-deny">Not saved.</strong> Nothing was stored,
                and because your browser reloaded this page the form below is empty again. Either a
                field was not accepted — the message needs at least twenty characters, and a source
                address needs to begin with http:// or https:// — or the site could not write the
                submission down. We are sorry to ask you to type it again.
              </p>
            </div>

            <FeedbackForm />
          </section>

          <section aria-labelledby="record">
            <h2 id="record" className="mt-0 mb-3">
              The public record of accepted changes
            </h2>
            <p className="m-0 mb-6 text-[1.06rem] text-ink-muted">
              Every editorial change made to the case since the source document was migrated, newest
              first. {ACCEPTED.length} recorded {pluralise(ACCEPTED.length, 'change')}. Each one
              names the problem and the decision taken, so that a reader can judge whether the
              decision was the right one.
            </p>

            <ol className="m-0 list-none space-y-6 p-0">
              {ACCEPTED.map(revision => (
                <RevisionEntry key={revision.id} revision={revision} linkSiteWideToChangelog />
              ))}
            </ol>
          </section>

          <RelatedPages>
            <li>
              <Link href="/changelog/">The full changelog, including per-part views</Link>
            </li>
            <li>
              <Link href="/method/">How corrections are assessed</Link>
            </li>
            <li>
              <Link href="/accessibility/">Report an accessibility problem</Link>
            </li>
            <li>
              <Link href="/privacy/">What this site stores, and what it does not</Link>
            </li>
          </RelatedPages>
        </div>
      </div>
    </>
  )
}
