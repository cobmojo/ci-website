import type { ExtractedHeading } from '@ci/content'
import {
  CASE_GROUP_LABELS,
  type CaseSection,
  EVIDENCE_ROLE_DEFINITIONS,
  EVIDENCE_ROLE_LABELS,
  REVIEW_STATUS_DEFINITIONS,
  REVIEW_STATUS_LABELS,
} from '@ci/content-schema'
import { Badge, buttonVariants } from '@ci/ui'
import Link from 'next/link'
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

export function ReviewStatusBadge({ section }: { section: CaseSection }) {
  const needsAttention =
    section.reviewStatus === 'revision-needed' ||
    section.reviewStatus === 'specialist-review-pending'
  return (
    <Badge
      tone={needsAttention ? 'ochre' : 'neutral'}
      glyph={needsAttention ? '!' : '✓'}
      title={REVIEW_STATUS_DEFINITIONS[section.reviewStatus]}
    >
      {REVIEW_STATUS_LABELS[section.reviewStatus]}
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
        <ReviewStatusBadge section={section} />
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
