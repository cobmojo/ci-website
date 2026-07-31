import { getSection } from '@ci/content/case'
import { revisions } from '@ci/content/revisions'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { RevisionEntry } from '@/components/changelog/revision-entry'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { RelatedPages } from '@/components/navigation/related-pages'
import { pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { loadSection, sectionBodyExists } from '@/lib/sections'
import { siteConfig } from '@/lib/site-config'

/**
 * Heading ids per section, read once per process.
 *
 * This route renders per request, so calling `loadSection` from the handler
 * put a synchronous `readFileSync` and eleven chained whole-body regexes on
 * the request path, for a body averaging 8.5kB, to answer one question about a
 * set of ids. Every other caller is statically generated. The ids cannot change
 * without a rebuild, so they are computed on first use and kept.
 */
const HEADING_IDS = new Map<string, ReadonlySet<string>>()

function headingIdsFor(
  id: string,
  section: Parameters<typeof loadSection>[0],
): ReadonlySet<string> {
  const cached = HEADING_IDS.get(id)
  if (cached) return cached
  const ids = new Set(loadSection(section).headings.map(heading => heading.id))
  HEADING_IDS.set(id, ids)
  return ids
}

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

/**
 * The query string is resolved here, on the server.
 *
 * That makes this route render per request rather than being prerendered, and
 * it is the price of the promise the API route makes: that the form works
 * without JavaScript. A static page cannot vary by query string, so a reader
 * without scripting who submitted a correction was redirected back to a page
 * that looked untouched — no confirmation, no error, and the section they were
 * correcting dropped from the hidden field. `/search/` pays the same price for
 * the same reason.
 */
export default async function CorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const one = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value
  const knownSectionId = (value: string | undefined): string =>
    value && getSection(value) ? value : ''
  /*
   * A heading id is checked against the headings that section actually has,
   * for the reason the section id is checked against the registry. Bounding it
   * at the schema's 128 characters was not a check: a longer value was
   * silently truncated to a prefix that resolves to no heading and stored
   * anyway, where the section id was dropped rather than mangled. Both are
   * listed on `/privacy/` as what a submission carries, so both have to be
   * something this site put in the address.
   */
  const knownHeadingId = (section: string, value: string | undefined): string => {
    if (!value || !section) return ''
    const record = getSection(section)
    if (!record || !sectionBodyExists(record)) return ''
    return headingIdsFor(record.id, record).has(value) ? value : ''
  }
  const sectionId = knownSectionId(one(params.section) ?? one(params.sectionId))
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
                  The part of the site you came from, when you arrive from a link on a section page,
                  and a heading anchor if the address carries one. These are a section identifier
                  such as S04 and an anchor such as in-brief, nothing more.
                </li>
                <li>
                  The time it arrived, a reference for it, and its place in the queue, added by the
                  server, so that a submission can be found, answered and deleted.
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

            {/* The form itself is dropped from the printed copy, where it
                would be a page of boxes nobody can fill in. A paper reader
                still needs to know where to go. */}
            <p className="m-0 hidden font-sans text-[0.95rem] text-ink-muted print:block">
              To send a correction, visit {siteConfig.url}/corrections/ in a browser.
            </p>

            {/*
             * Both are checked here, where they enter, and not only where they
             * are echoed back.
             *
             * The hidden `sectionId` field is filled straight from the address,
             * and the schema bounds it at 16 characters. A longer value made
             * every submission from that URL fail: with scripting, on a banner
             * reading "Not recorded. Form: Too big" — naming no control on the
             * page, because the rejected value is in the address bar and not in
             * any field — and without it, on the message telling the reader to
             * check wording that was never the problem, with their text gone.
             * Retrying from the same URL failed identically every time.
             *
             * A section id is only ever put there by this site, and always a
             * real one, so anything that does not resolve is not a correction
             * about a page. Dropping it sends an unattached correction, which
             * is what the form does with no `?section=` at all.
             */}
            <FeedbackForm
              sectionId={sectionId}
              headingId={knownHeadingId(sectionId, one(params.heading) ?? one(params.headingId))}
              type={one(params.type)}
              submitted={one(params.submitted)}
            />
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
