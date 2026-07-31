import type { ExtractedHeading } from '@ci/content'
import { formatCitation } from '@ci/content/sources'
import {
  CASE_GROUP_LABELS,
  type CaseSection,
  EVIDENCE_ROLE_DEFINITIONS,
  EVIDENCE_ROLE_LABELS,
  REVIEW_STATUS_DEFINITIONS,
  REVIEW_STATUS_LABELS,
  type ReviewStatus,
  type SourceRecord,
} from '@ci/content-schema'
import { Badge, buttonVariants, cn } from '@ci/ui'
import Link from 'next/link'
import { NewTabLink } from '@/components/content/new-tab-link'
import { formatLongDate } from '@/lib/format'

/* ------------------------------------------------------------------ *
 * Breadcrumbs
 * ------------------------------------------------------------------ */

export interface Crumb {
  readonly href: string
  readonly label: string
}

export function Breadcrumbs({ trail }: { trail: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 print:hidden">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-sans text-[0.83rem] text-ink-subtle">
        {trail.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span aria-hidden="true" className="text-border-strong">
                /
              </span>
            ) : null}
            {index === trail.length - 1 ? (
              <span aria-current="page" className="text-ink-muted">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="no-underline hover:underline">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------ *
 * Role and status badges
 *
 * Each badge carries its own label text. Colour is never the only signal,
 * and the definition is exposed through the title attribute and repeated in
 * full on the Method page.
 * ------------------------------------------------------------------ */

export function EvidenceRoleBadge({ section }: { section: CaseSection }) {
  return (
    <Badge tone="navy" glyph="◆" title={EVIDENCE_ROLE_DEFINITIONS[section.evidenceRole]}>
      {EVIDENCE_ROLE_LABELS[section.evidenceRole]}
    </Badge>
  )
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const needsAttention = status === 'revision-needed' || status === 'specialist-review-pending'
  return (
    <Badge
      tone={needsAttention ? 'ochre' : 'neutral'}
      glyph={needsAttention ? '!' : '✓'}
      title={REVIEW_STATUS_DEFINITIONS[status]}
    >
      {REVIEW_STATUS_LABELS[status]}
    </Badge>
  )
}

/* ------------------------------------------------------------------ *
 * Article header
 * ------------------------------------------------------------------ */

export function ArticleHeader({
  section,
  readingMinutes,
}: {
  section: CaseSection
  readingMinutes: number
}) {
  const pages = section.originalPages
  const pageRange =
    pages.length > 1
      ? `Approximately pages ${pages[0]} to ${pages[pages.length - 1]}`
      : `Approximately page ${pages[0]}`

  return (
    <header className="article-header mb-8">
      <p className="article-kicker m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
        {section.id} <span aria-hidden="true">·</span> {CASE_GROUP_LABELS[section.group]}
      </p>
      <h1 className="mt-0 mb-4">{section.title}</h1>
      <p className="article-lede m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
        {section.thesis}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <EvidenceRoleBadge section={section} />
        <ReviewStatusBadge status={section.reviewStatus} />
      </div>

      <dl className="article-metadata mt-5 grid gap-x-8 gap-y-2 border-t border-border pt-4 font-sans text-[0.86rem] sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-ink-subtle">Role in the case</dt>
          <dd className="m-0 text-ink">{EVIDENCE_ROLE_LABELS[section.evidenceRole]}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Reading time</dt>
          <dd className="m-0 text-ink">Approximately {readingMinutes} minutes</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Original source</dt>
          <dd className="m-0 text-ink">{pageRange}</dd>
        </div>
        <div>
          <dt className="text-ink-subtle">Last reviewed</dt>
          <dd className="m-0 text-ink">
            {section.lastReviewed ? (
              <time dateTime={section.lastReviewed}>{formatLongDate(section.lastReviewed)}</time>
            ) : (
              'Not yet reviewed'
            )}
          </dd>
        </div>
      </dl>
    </header>
  )
}

/* ------------------------------------------------------------------ *
 * On this page
 * ------------------------------------------------------------------ */

export function OnThisPage({
  headings,
  className,
  titleId = 'on-this-page-title',
}: {
  headings: readonly ExtractedHeading[]
  className?: string
  /**
   * This component is rendered twice on wide screens, once for the sidebar
   * and once inline, so the heading id has to differ between them. A repeated
   * id makes `aria-labelledby` resolve against the hidden copy and leaves the
   * anchor unreachable.
   */
  titleId?: string
}) {
  if (headings.length < 2) return null
  return (
    <nav aria-labelledby={titleId} className={`on-this-page ${className ?? ''}`}>
      <h2
        id={titleId}
        className="mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase"
      >
        On this page
      </h2>
      <ol className="m-0 list-none space-y-1 p-0">
        {headings.map(heading => (
          <li key={heading.id} className={heading.depth === 3 ? 'pl-3' : undefined}>
            <a
              href={`#${heading.id}`}
              className="block py-0.5 font-sans text-[0.85rem] leading-snug text-ink-muted no-underline hover:text-navy hover:underline"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ------------------------------------------------------------------ *
 * Previous / next
 * ------------------------------------------------------------------ */

export function PreviousNextNavigation({
  previous,
  next,
}: {
  previous?: CaseSection
  next?: CaseSection
}) {
  if (!previous && !next) return null
  return (
    <nav
      aria-label="Previous and next sections"
      className="previous-next mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2"
    >
      {previous ? (
        <Link
          href={previous.route}
          rel="prev"
          className="rounded-md border border-border bg-paper-raised p-4 no-underline hover:border-border-strong"
        >
          <span className="block font-sans text-[0.78rem] tracking-wider text-ink-subtle uppercase">
            <span aria-hidden="true">←</span> Previous
          </span>
          <span className="mt-1 block font-sans text-[0.98rem] font-medium text-navy">
            {previous.id}. {previous.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.route}
          rel="next"
          className="rounded-md border border-border bg-paper-raised p-4 text-right no-underline hover:border-border-strong sm:col-start-2"
        >
          <span className="block font-sans text-[0.78rem] tracking-wider text-ink-subtle uppercase">
            Next <span aria-hidden="true">→</span>
          </span>
          <span className="mt-1 block font-sans text-[0.98rem] font-medium text-navy">
            {next.id}. {next.title}
          </span>
        </Link>
      ) : null}
    </nav>
  )
}

/* ------------------------------------------------------------------ *
 * Sources cited
 *
 * The one citation list. Section pages, passage pages and topic pages all
 * render the same ordered list of formatted citations; before this component
 * the three copies had already drifted on heading size.
 * ------------------------------------------------------------------ */

export function SourcesCited({
  sources,
  headingId,
  title,
  divider = true,
}: {
  sources: readonly SourceRecord[]
  headingId: string
  title: string
  /** Pages whose preceding section already drew the divider switch it off. */
  divider?: boolean
}) {
  if (sources.length === 0) return null
  return (
    <section
      aria-labelledby={headingId}
      className={cn('mt-10', divider && 'border-t border-border pt-6')}
    >
      <h2 id={headingId} className="mt-0 mb-3 text-[1.18rem]">
        {title}
      </h2>
      <ol className="m-0 space-y-2 pl-5 font-sans text-[0.9rem] text-ink-muted">
        {sources.map(source => (
          <li key={source.id} id={`source-${source.id}`}>
            {formatCitation(source)}
            {source.url ? (
              <>
                {' '}
                <NewTabLink href={source.url}>
                  View original
                  <span className="sr-only"> of {source.title}</span>
                </NewTabLink>
              </>
            ) : null}{' '}
            <Link href={`/sources/#${source.id}`} className="text-ink-subtle">
              Details
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Section link list
 *
 * A list of case sections as links with their short summaries, shared by the
 * topic and passage templates.
 * ------------------------------------------------------------------ */

export function SectionLinkList({ sections }: { sections: readonly CaseSection[] }) {
  return (
    <ul className="m-0 list-none space-y-2 p-0 font-sans text-[0.95rem]">
      {sections.map(section => (
        <li key={section.id}>
          <Link href={section.route}>
            <span className="text-ink-subtle">{section.id}</span> {section.title}
          </Link>
          <span className="mt-0.5 block text-[0.9rem] text-ink-muted">{section.shortSummary}</span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ *
 * Feedback call to action
 * ------------------------------------------------------------------ */

export function FeedbackCta({ sectionId }: { sectionId?: string }) {
  // The query must precede the fragment, otherwise `section` lands inside the
  // hash and the correction form cannot read it with `useSearchParams`.
  const href = sectionId ? `/corrections/?section=${sectionId}#form` : '/corrections/#form'
  return (
    <section
      aria-labelledby="feedback-title"
      className="feedback-cta mt-10 rounded-md border border-border bg-panel/70 p-5 print:hidden"
    >
      <h2 id="feedback-title" className="mt-0 mb-2 text-[1.12rem]">
        Found an error or have a counterargument?
      </h2>
      <p className="m-0 mb-4 text-[1rem] text-ink-muted">
        This project aims to present the strongest biblical case it can, not to avoid criticism.
        Factual corrections, better sources, serious counterarguments and accessibility reports are
        all welcome.
      </p>
      <Link href={href} className={buttonVariants({ variant: 'primary' })}>
        Submit a correction or counterargument
      </Link>
    </section>
  )
}
