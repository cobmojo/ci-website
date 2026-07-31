import {
  commentLedger,
  LEDGER_SUMMARY,
  mediaDispositions,
  migrationTotals,
} from '@ci/content/migration'
import {
  COMMENT_DISPOSITION_LABELS,
  type CommentDisposition,
  commentDispositions,
  type MediaDisposition,
} from '@ci/content-schema'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { ScrollRegion } from '@/components/content/scroll-region'
import { Link } from '@/components/navigation/link'
import { RelatedPages } from '@/components/navigation/related-pages'
import { formatLongDate, pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { siteConfig } from '@/lib/site-config'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/original-document/', label: 'Original Document' },
]

export const metadata = pageMetadata({
  title: 'Original Document',
  description:
    'The source document behind this site, its checksum and inventory, how every paragraph, table, link, image and comment in it was accounted for, and why the file itself is not published.',
  route: '/original-document/',
})

const MEDIA_TREATMENT_LABELS: Record<MediaDisposition['treatment'], string> = {
  'rebuilt-as-semantic-html': 'Rebuilt as semantic HTML',
  'rebuilt-as-accessible-svg': 'Rebuilt as an accessible SVG',
  'used-as-poster': 'Used as a poster image',
  'replaced-with-icon-system': 'Replaced by the icon system',
  regenerated: 'Regenerated',
  'omitted-formatting-artifact': 'Omitted as a formatting artefact',
}

const MEDIA_RIGHTS_LABELS: Record<MediaDisposition['rightsStatus'], string> = {
  'public-domain': 'Public domain',
  cleared: 'Cleared',
  'permission-needed': 'Permission needed',
  'quoted-briefly': 'Quoted briefly',
  paraphrased: 'Paraphrased',
  'link-only': 'Link only',
  'not-applicable': 'No rights question',
}

function countDisposition(disposition: CommentDisposition): number {
  return commentLedger.filter(entry => entry.disposition === disposition).length
}

export default function OriginalDocumentPage() {
  const totals = migrationTotals()
  const started = siteConfig.sourceDocument.startedOn
  const dispositionCounts = commentDispositions
    .map(disposition => ({ disposition, count: countDisposition(disposition) }))
    .filter(entry => entry.count > 0)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[52rem]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              This site
            </p>
            <h1 className="mt-0 mb-4">The original document</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              Everything on this site comes from one file. This page says what that file is, what
              was in it, what happened to each part of it, and what is deliberately not published.
            </p>
          </header>

          <div className="space-y-10 text-[1.06rem] leading-[1.68]">
            <section aria-labelledby="what-it-is">
              <h2 id="what-it-is" className="mt-0 mb-3">
                What the source is
              </h2>
              <dl className="m-0 mb-4 grid gap-x-8 gap-y-3 rounded-md border border-border bg-paper-raised p-5 font-sans text-[0.95rem] sm:grid-cols-2">
                <div>
                  <dt className="text-ink-subtle">Title</dt>
                  <dd className="m-0 text-ink">{siteConfig.sourceDocument.title}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Author</dt>
                  <dd className="m-0 text-ink">{siteConfig.author.name}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Started</dt>
                  <dd className="m-0 text-ink">
                    <time dateTime={started}>{formatLongDate(started)}</time>
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Format and length</dt>
                  <dd className="m-0 text-ink">
                    A word processor document of about fifty-two pages
                  </dd>
                </div>
              </dl>
              <p className="m-0 mb-3">
                The file was written for people who asked the author what he now believed about hell
                and why. It circulated as a shared document, gathered comments from readers, and
                grew over the following years into a long argument with its own table of contents.
              </p>
              <p className="m-0">
                It is the source for every argument on this site. It is not the authority for any
                claim: where the document asserts something its evidence does not support, this site
                states the narrower claim and records the change in the{' '}
                <Link href="/changelog/">changelog</Link>.
              </p>
            </section>

            <section aria-labelledby="how-verified">
              <h2 id="how-verified" className="mt-0 mb-3">
                How the web edition reorganises and verifies it
              </h2>
              <p className="m-0 mb-3">
                The document was read out of its own file format rather than copied from the
                rendered page, so that anything present only in the underlying markup, such as a
                comment, a hyperlink relationship or an image, could not be quietly dropped. Every
                paragraph, table cell, image and link was given an identifier and an entry in a
                migration ledger.
              </p>
              <p className="m-0 mb-3">
                The material was then reorganised into thirty-nine pages, each covering one
                argument, and each carrying the page numbers of the original it was drawn from.
                Scripture references were normalised and checked against a verified public-domain
                corpus. Sources that appeared as bare links in the document were given records with
                an access date, a link status and a rights status. Historical and language claims
                were checked against primary sources where those exist, and narrowed or withdrawn
                where they could not be supported.
              </p>
              <p className="m-0">
                The build refuses to complete if a substantive element from the source has no
                destination, if a Scripture reference cannot be resolved, or if the author’s
                personal contact details appear anywhere in the output. That is why the counts below
                can be published rather than estimated.
              </p>
            </section>

            <section aria-labelledby="inventory">
              <h2 id="inventory" className="mt-0 mb-3">
                The source inventory
              </h2>
              <p className="m-0 mb-3">
                The checksum below identifies the exact file this site was built from. If the source
                is ever revised, the checksum changes and this page changes with it.
              </p>
              <p className="m-0 mb-5 rounded-md border border-border bg-panel/70 p-4 font-sans text-[0.88rem] text-ink-muted">
                <span className="block text-ink-subtle">Source file SHA-256</span>
                <code className="mt-1 block break-all text-[0.86rem] text-ink">
                  {LEDGER_SUMMARY.sourceSha256}
                </code>
              </p>

              <ScrollRegion label="Source document statistics">
                <table className="w-full font-sans text-[0.92rem]">
                  <caption className="mb-2 text-left text-[0.88rem] text-ink-subtle">
                    What the source file contained, and what the migration ledger records. Counts
                    are generated from the file itself, not entered by hand.
                  </caption>
                  <thead>
                    <tr className="bg-panel">
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        Measure
                      </th>
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        Count
                      </th>
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        What it means
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Paragraphs
                      </th>
                      <td className="border border-border p-2.5">
                        {LEDGER_SUMMARY.paragraphCount}
                      </td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Paragraph elements in the file, of which {LEDGER_SUMMARY.nonEmptyParagraphs}{' '}
                        carry text.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Tables
                      </th>
                      <td className="border border-border p-2.5">{LEDGER_SUMMARY.tableCount}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Rebuilt as semantic tables with real header cells.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Hyperlinks
                      </th>
                      <td className="border border-border p-2.5">
                        {LEDGER_SUMMARY.hyperlinkCount}
                      </td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Each given a record in the <Link href="/sources/">source library</Link> with
                        its status.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Images
                      </th>
                      <td className="border border-border p-2.5">{LEDGER_SUMMARY.imageCount}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        None is republished as an image. See the media table below.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Editorial comments
                      </th>
                      <td className="border border-border p-2.5">{LEDGER_SUMMARY.commentCount}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Comments and replies, grouped into {commentLedger.length} threads below.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Ledger entries
                      </th>
                      <td className="border border-border p-2.5">{totals.totalElements}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        One entry for every element considered, with its treatment.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Entries with a destination
                      </th>
                      <td className="border border-border p-2.5">{totals.mapped}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Substantive elements that reached a published page.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Kept in the private record only
                      </th>
                      <td className="border border-border p-2.5">{totals.privateOnly}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Contact details and personal reflections withheld for the reasons below.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Formatting only
                      </th>
                      <td className="border border-border p-2.5">{totals.omittedFormattingOnly}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Empty spacing paragraphs and interface debris with no content to carry.
                      </td>
                    </tr>
                    <tr>
                      <th scope="row" className="border border-border p-2.5 text-left font-normal">
                        Unmapped
                      </th>
                      <td className="border border-border p-2.5">{totals.unmapped}</td>
                      <td className="border border-border p-2.5 text-ink-muted">
                        Substantive elements with no destination. The build fails if this is not
                        zero.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ScrollRegion>
              <p className="m-0 mt-3 font-sans text-[0.88rem] text-ink-subtle">
                Ledger generated {formatLongDate(LEDGER_SUMMARY.generatedAt)}.
              </p>
            </section>

            <section aria-labelledby="preserved">
              <h2 id="preserved" className="mt-0 mb-3">
                How the original wording is preserved
              </h2>
              <p className="m-0 mb-3">
                The migration ledger holds the source text of each element alongside the treatment
                it received: preserved, lightly edited, rewritten for clarity, summarised,
                relocated, qualified, moved to an appendix, kept in the private record, or omitted
                as formatting. Where a claim was narrowed or withdrawn, the ledger still holds what
                the document said.
              </p>
              <p className="m-0">
                That is what makes the changelog checkable rather than merely reassuring. A reader
                who wants to know exactly what was changed can compare the published wording with
                the recorded original, and the entries that did this are listed with their reasons
                in the <Link href="/changelog/">changelog</Link>.
              </p>
            </section>

            <section aria-labelledby="comments">
              <h2 id="comments" className="mt-0 mb-3">
                What happened to the editorial comments
              </h2>
              <p className="m-0 mb-3">
                The document carried {LEDGER_SUMMARY.commentCount} comments and replies from the
                author and from readers, grouped here into {commentLedger.length} threads. They are
                private editorial correspondence, so no commenter is named anywhere on this site and
                no comment is reproduced. What is published is the disposition: what was done about
                each thread, and why.
              </p>
              <ScrollRegion label="Editorial comment dispositions">
                <table className="w-full font-sans text-[0.92rem]">
                  <caption className="mb-2 text-left text-[0.88rem] text-ink-subtle">
                    Comment threads by disposition. Names are held only in the private source
                    record, which no part of this site reads.
                  </caption>
                  <thead>
                    <tr className="bg-panel">
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        Disposition
                      </th>
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        Threads
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispositionCounts.map(entry => (
                      <tr key={entry.disposition}>
                        <th
                          scope="row"
                          className="border border-border p-2.5 text-left font-normal"
                        >
                          {COMMENT_DISPOSITION_LABELS[entry.disposition]}
                        </th>
                        <td className="border border-border p-2.5">{entry.count}</td>
                      </tr>
                    ))}
                    <tr>
                      <th
                        scope="row"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        Total threads
                      </th>
                      <td className="border border-border p-2.5 font-semibold">
                        {commentLedger.length}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ScrollRegion>
              <p className="m-0 mt-3">
                Where a comment led to a change in the argument, that change appears in the
                changelog on its own terms, described by what was wrong and what was done rather
                than by who said it.
              </p>
            </section>

            <section aria-labelledby="media">
              <h2 id="media" className="mt-0 mb-3">
                What happened to the images
              </h2>
              <p className="m-0 mb-3">
                The file contained {LEDGER_SUMMARY.imageCount} embedded images. None is republished
                as an image. Where an image carried part of the argument, that argument was rebuilt
                as text, as a semantic table or as an accessible graphic, because a screenshot
                cannot be read by assistive technology, searched, translated or checked.
              </p>
              <ScrollRegion label="Embedded media dispositions">
                <table className="w-full font-sans text-[0.9rem]">
                  <caption className="mb-2 text-left text-[0.88rem] text-ink-subtle">
                    Every embedded image in the source file, what it showed, and what replaced it.
                  </caption>
                  <thead>
                    <tr className="bg-panel">
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        File
                      </th>
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        What it showed
                      </th>
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        Treatment
                      </th>
                      <th
                        scope="col"
                        className="border border-border p-2.5 text-left font-semibold"
                      >
                        Rights
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediaDispositions.map(media => (
                      <tr key={media.file}>
                        <th
                          scope="row"
                          className="border border-border p-2.5 text-left font-normal break-all"
                        >
                          {media.file}
                        </th>
                        <td className="border border-border p-2.5 text-ink-muted">
                          {media.description}
                        </td>
                        <td className="border border-border p-2.5">
                          {MEDIA_TREATMENT_LABELS[media.treatment]}
                          {media.destination ? (
                            <>
                              {' '}
                              <Link href={media.destination}>See where it went</Link>
                            </>
                          ) : null}
                          <span className="mt-1 block text-ink-muted">{media.note}</span>
                        </td>
                        <td className="border border-border p-2.5">
                          {MEDIA_RIGHTS_LABELS[media.rightsStatus]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            </section>

            <section aria-labelledby="withheld">
              <h2 id="withheld" className="mt-0 mb-3">
                What is deliberately not published
              </h2>
              <p className="m-0 mb-3">
                Two categories of material from the document are withheld, and both are recorded in
                the ledger so that the omission is visible rather than silent. Together they account
                for {totals.privateOnly} ledger {pluralise(totals.privateOnly, 'entry', 'entries')}.
              </p>
              <ul className="m-0 mb-3 list-disc space-y-2 pl-6">
                <li>
                  <strong>Personal contact details.</strong> The document opens with the author’s
                  email address and phone number and invites readers to comment in the file itself.
                  Republishing either on a public site would expose them to automated harvesting for
                  the rest of their working life, and it would place the burden of handling
                  correspondence on one private inbox. A check on every build fails if either ever
                  appears in the output. Corrections come through the form instead.
                </li>
                <li>
                  <strong>Private editorial comments.</strong> The comment threads were written by
                  named people in a private document, in the expectation that they were talking to
                  the author and not to the public. Their substance is accounted for above; their
                  wording and their authors are not published.
                </li>
              </ul>
              <p className="m-0">
                A small number of personal reflections in the document were also kept out of the
                public pages because they were speculation the author himself labelled as such.
                Those decisions are in the changelog with the reasoning, not hidden.
              </p>
            </section>

            <section aria-labelledby="raw-file">
              <h2 id="raw-file" className="mt-0 mb-3">
                Why the file itself is not published
              </h2>
              <p className="m-0 mb-3">
                The original document is not available for download. It is not being withheld
                because its contents are embarrassing: the substance is on this site, and the places
                where it was corrected are listed publicly.
              </p>
              <p className="m-0 mb-3">
                It is withheld because the file carries personal contact details, private comment
                threads with named authors, and long quotations from copyrighted Bible translations,
                and because a word processor file also carries revision metadata that is not visible
                when you read it. Publishing it would mean publishing all of that at once.
              </p>
              <p className="m-0">
                The file will be considered for release only once a rights and privacy audit has
                been completed and the material above has been dealt with. Until then the ledger,
                the changelog and the pages themselves are the public record. Printable versions of
                the case are on the <Link href="/download/">downloads page</Link>.
              </p>
            </section>

            <section aria-labelledby="corrections">
              <h2 id="corrections" className="mt-0 mb-3">
                If something here is wrong
              </h2>
              <p className="m-0">
                If a page misrepresents the source document, drops something substantive from it, or
                narrows a claim further than the evidence requires, please say so through the{' '}
                <Link href="/corrections/">corrections form</Link>. Point at the page and quote the
                wording you are questioning. Accepted corrections are published in the{' '}
                <Link href="/changelog/">changelog</Link> with the issue and the decision.
              </p>
            </section>
          </div>

          <RelatedPages>
            <li>
              <Link href="/method/">The editorial method in full</Link>
            </li>
            <li>
              <Link href="/about/">About the author</Link>
            </li>
            <li>
              <Link href="/changelog/">Every change since publication</Link>
            </li>
            <li>
              <Link href="/privacy/">What this site stores</Link>
            </li>
          </RelatedPages>
        </div>
      </div>
    </>
  )
}
