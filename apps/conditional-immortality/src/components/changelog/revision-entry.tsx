import { getSection } from '@ci/content/case'
import { REVISION_TYPE_LABELS, type RevisionRecord } from '@ci/content-schema'
import { Badge } from '@ci/ui'
import Link from 'next/link'
import { formatLongDate } from '@/lib/format'

/**
 * One revision record, as a card.
 *
 * The public record of accepted changes renders in three places: the
 * corrections page, the full changelog and the per-section changelog. Before
 * this component the ~60-line card was pasted into all three and had already
 * drifted on heading level and size, which is exactly the failure a public
 * record cannot afford.
 */

function FieldLabel({ children }: { children: string }) {
  return (
    <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
      {children}
    </dt>
  )
}

export function RevisionEntry({
  revision,
  as: Heading = 'h3',
  showSection = true,
  linkSiteWideToChangelog = false,
}: {
  revision: RevisionRecord
  /** Heading level, chosen by the page so the document outline stays sound. */
  as?: 'h2' | 'h3'
  /**
   * The per-section changelog already names its section once in the page
   * header, so it switches the per-card section context off.
   */
  showSection?: boolean
  /**
   * Off the changelog itself, a site-wide entry still deserves a way to its
   * home in the record; on `/changelog/` that link would point at the page
   * the reader is already on.
   */
  linkSiteWideToChangelog?: boolean
}) {
  const section = showSection && revision.sectionId ? getSection(revision.sectionId) : undefined

  return (
    <li id={revision.id} className="rounded-md border border-border bg-paper-raised p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-[0.86rem] text-ink-subtle">
        <time dateTime={revision.date}>{formatLongDate(revision.date)}</time>
        <Badge tone="neutral">{REVISION_TYPE_LABELS[revision.type]}</Badge>
        {showSection ? (
          section ? (
            <span>
              <span className="text-copper-deep">{section.id}</span>{' '}
              <Link href={section.route}>{section.title}</Link>
            </span>
          ) : (
            <span>Applies across the site</span>
          )
        ) : null}
      </div>

      <Heading className="mt-2.5 mb-3 text-[1.08rem]">{revision.summary}</Heading>

      <dl className="m-0 space-y-3 text-[1.01rem]">
        <div>
          <FieldLabel>Issue raised</FieldLabel>
          <dd className="m-0 mt-1 text-ink-muted">{revision.issue}</dd>
        </div>
        <div>
          <FieldLabel>Decision taken</FieldLabel>
          <dd className="m-0 mt-1 text-ink-muted">{revision.decision}</dd>
        </div>
        {revision.details ? (
          <div>
            <FieldLabel>Further detail</FieldLabel>
            <dd className="m-0 mt-1 text-ink-muted">{revision.details}</dd>
          </div>
        ) : null}
        {/* Only ever rendered where an explicit credit was given. */}
        {revision.creditedTo ? (
          <div>
            <FieldLabel>Credit</FieldLabel>
            <dd className="m-0 mt-1 text-ink-muted">
              Raised by {revision.creditedTo}, with permission to publish the name.
            </dd>
          </div>
        ) : null}
      </dl>

      {section ? (
        <p className="m-0 mt-4 font-sans text-[0.88rem]">
          <Link href={section.route}>Read the revised page</Link>
          <span aria-hidden="true" className="text-ink-subtle">
            {' '}
            ·{' '}
          </span>
          <Link href={`/changelog/${section.id.toLowerCase()}/`}>Every change to {section.id}</Link>
        </p>
      ) : linkSiteWideToChangelog ? (
        <p className="m-0 mt-4 font-sans text-[0.88rem]">
          <Link href="/changelog/">See it in the full changelog</Link>
        </p>
      ) : null}
    </li>
  )
}
