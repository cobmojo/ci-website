import {
  caseSections,
  caseSectionsByGroup,
  ESSENTIAL_PATH,
  getSection,
  PRINCIPAL_CLAIMS,
} from '@ci/content/case'
import type { CaseGroup, CaseSection } from '@ci/content-schema'
import Link from 'next/link'
import {
  Breadcrumbs,
  type Crumb,
  EvidenceRoleBadge,
  ReviewStatusBadge,
} from '@/components/article/article-chrome'
import { PrintButton } from '@/components/case/print-button'
import { ReadingProgress } from '@/components/case/reading-progress'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { loadSection } from '@/lib/sections'

/**
 * The case hub.
 *
 * This page is a map, not an essay. It states how the argument is put together,
 * names the six claims the whole thing rests on, offers a short path for a
 * reader who does not want to read all forty parts, and then lists every part
 * with enough information to choose between them.
 *
 * Reading times are computed from the MDX bodies at build time, so they cannot
 * drift away from what a page actually contains.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/case/', label: 'The Case' },
]

export const metadata = pageMetadata({
  title: 'The Case',
  description:
    'A map of the cumulative biblical case for conditional immortality: the method, the six principal claims, a twelve page essential path, and all forty parts grouped by the work they do.',
  route: '/case/',
})

/** Reading time for every part, read once from the MDX bodies at build time. */
const READING_MINUTES: ReadonlyMap<string, number> = new Map(
  caseSections.map(section => [section.id, loadSection(section).readingMinutes]),
)

function readingMinutesFor(section: CaseSection): number {
  return READING_MINUTES.get(section.id) ?? 1
}

/** One line on what each group of parts is for. */
const GROUP_PURPOSE: Record<CaseGroup, string> = {
  preface: 'Why the question is worth the work, and what this document is.',
  roadblock:
    'Three things that stop the biblical argument getting a hearing before it has even been made.',
  'key-text':
    'The passages most often cited for eternal conscious torment, each read in full and in context.',
  'biblical-language':
    'The vocabulary Scripture actually uses for the fate of the wicked, and what that vocabulary carries.',
  'biblical-pattern':
    'Judgment as Scripture shows it happening, rather than as it is described in the abstract.',
  'final-destiny':
    'What the two destinies are said to be, and how they are set against each other.',
  'further-reasoning':
    'Considerations that follow from the case. They support it rather than establish it.',
  objection:
    'The strongest objections to conditional immortality, each stated before it is answered.',
  appendix: 'Supporting material that sits alongside the case rather than inside it.',
}

const ESSENTIAL_SECTIONS: readonly CaseSection[] = ESSENTIAL_PATH.map(id => getSection(id)).filter(
  (section): section is CaseSection => Boolean(section),
)

export default function CaseHubPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <header className="max-w-[var(--spacing-measure)]">
          <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
            The argument in full
          </p>
          <h1 className="mt-0 mb-4">The Case</h1>
          <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
            Three roadblocks and thirty-four numbered arguments make up the thirty-seven parts of
            the case, with a preface and two appendices alongside them. You can read them in order,
            follow the essential path below, or go straight to the part you came for.
          </p>
        </header>

        <nav
          aria-label="Jump to a group of parts"
          className="mt-8 rounded-md border border-border bg-paper-raised p-4 print:hidden"
        >
          <h2 className="mt-0 mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
            Jump to a group
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 font-sans text-[0.9rem]">
            {caseSectionsByGroup.map(bucket => (
              <li key={bucket.group}>
                <a href={`#${bucket.group}`}>
                  {bucket.label} ({bucket.sections.length})
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="cumulative-method"
          className="mt-12 max-w-[var(--spacing-measure)]"
        >
          <h2 id="cumulative-method" className="mt-0 mb-3 text-[1.35rem]">
            How the case is built
          </h2>
          <div className="space-y-4 text-[1.05rem] leading-[1.65]">
            <p className="m-0">
              The argument is cumulative. No single part is asked to carry the conclusion on its
              own, and none of them claims to. Each one establishes something modest, states plainly
              what it does not establish, and the weight is meant to be felt across the whole rather
              than at any one point.
            </p>
            <p className="m-0">
              That method has a cost worth naming. A cumulative case cannot be refuted by knocking
              over one part, but it also cannot be proved by one part standing up. So every page
              carries two labels. The evidence role says what kind of argument it is, from a core
              biblical argument down to a further consideration offered as something worth thinking
              about rather than as evidence. The review status says how far the page has been
              checked, including where a claim about Greek or Hebrew still needs review by someone
              with formal training in the language.
            </p>
            <p className="m-0">
              The passages usually cited against this position are not left to the end. They are
              treated in the key texts group near the front, and in each case the traditional
              reading is stated from its own defenders before any answer is given. Where
              conditionalists disagree among themselves, the page says so.
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}

        <section aria-labelledby="principal-claims" className="mt-12">
          <h2 id="principal-claims" className="mt-0 mb-3 text-[1.35rem]">
            The six principal claims
          </h2>
          <p className="m-0 mb-6 text-[1.05rem] text-ink-muted">
            Everything in the forty parts is in service of these six claims. If they hold, the
            conclusion follows. If they do not, the case fails, and the parts that would have to be
            answered are named beside each one.
          </p>
          <ol className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
            {PRINCIPAL_CLAIMS.map(claim => {
              const supporting = claim.sectionIds
                .map(id => getSection(id))
                .filter((section): section is CaseSection => Boolean(section))
              return (
                <li
                  key={claim.id}
                  id={claim.id}
                  className="rounded-md border border-border bg-paper-raised p-5"
                >
                  <h3 className="mt-0 mb-2 text-[1.06rem] leading-snug">
                    <span className="mr-2 font-sans text-[0.85rem] font-semibold text-copper-deep">
                      Claim {claim.number}
                    </span>
                    {claim.title}
                  </h3>
                  <p className="m-0 text-[1rem] text-ink-muted">{claim.summary}</p>
                  <p className="m-0 mt-3 font-sans text-[0.88rem]">
                    <span className="text-ink-subtle">Argued in: </span>
                    {supporting.map((section, index) => (
                      <span key={section.id}>
                        {index > 0 ? <span className="text-ink-subtle">, </span> : null}
                        <Link href={section.route} data-section-id={section.id}>
                          {section.id}
                        </Link>
                      </span>
                    ))}
                  </p>
                </li>
              )
            })}
          </ol>
        </section>

        {/* ---------------------------------------------------------------- */}

        <section aria-labelledby="essential-path" className="mt-12">
          <h2 id="essential-path" className="mt-0 mb-3 text-[1.35rem]">
            The essential reading path
          </h2>
          <p className="m-0 mb-6 text-[1.05rem] text-ink-muted">
            Twelve pages, in this order, meet every load-bearing pillar of the case without reading
            all forty. It is the honest short version rather than a summary, because each page is
            the argument itself rather than a description of it.
          </p>
          <ol className="m-0 list-none space-y-2 p-0">
            {ESSENTIAL_SECTIONS.map((section, index) => (
              <li
                key={section.id}
                data-section-entry={section.id}
                className="flex gap-3 rounded-md border border-border bg-paper-raised p-4"
              >
                <span
                  aria-hidden="true"
                  className="font-sans text-[1.1rem] font-semibold text-ink-subtle"
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <Link
                    href={section.route}
                    data-section-id={section.id}
                    className="font-sans text-[1rem] font-medium"
                  >
                    <span className="text-ink-subtle">{section.id}</span> {section.title}
                  </Link>
                  <span className="mt-0.5 block text-[0.98rem] text-ink-muted">
                    {section.shortSummary}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.82rem] text-ink-subtle">
                    <span>Approximately {readingMinutesFor(section)} minutes</span>
                    <span data-visited-marker className="hidden items-center gap-1 text-ink-muted">
                      <span aria-hidden="true">✓</span> Opened
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------------------- */}

        <ReadingProgress total={caseSections.length} />

        {/* ---------------------------------------------------------------- */}

        <section aria-labelledby="all-parts" className="mt-12">
          <h2 id="all-parts" className="mt-0 mb-3 text-[1.35rem]">
            All {caseSections.length} parts
          </h2>
          <p className="m-0 mb-8 text-[1.05rem] text-ink-muted">
            Grouped by the work each part does. The permanent id beside every title never changes,
            even if a title or a route is revised later, so it is safe to cite.
          </p>

          {caseSectionsByGroup.map(bucket => (
            <section
              key={bucket.group}
              id={bucket.group}
              aria-labelledby={`${bucket.group}-title`}
              className="mt-10 first:mt-0"
            >
              <h3 id={`${bucket.group}-title`} className="mt-0 mb-1 text-[1.15rem]">
                {bucket.label}
                <span className="ml-2 font-sans text-[0.85rem] font-normal text-ink-subtle">
                  {bucket.sections.length} {bucket.sections.length === 1 ? 'part' : 'parts'}
                </span>
              </h3>
              <p className="m-0 mb-4 text-[1rem] text-ink-muted">{GROUP_PURPOSE[bucket.group]}</p>

              <ul className="m-0 grid list-none gap-3 p-0 lg:grid-cols-2">
                {bucket.sections.map(section => (
                  <li
                    key={section.id}
                    data-section-entry={section.id}
                    className="rounded-md border border-border bg-paper-raised p-4"
                  >
                    <h4 className="mt-0 mb-1 text-[1.02rem] leading-snug">
                      <Link href={section.route} data-section-id={section.id} className="font-sans">
                        <span className="text-ink-subtle">{section.id}</span> {section.title}
                      </Link>
                    </h4>
                    <p className="m-0 text-[0.98rem] text-ink-muted">{section.shortSummary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <EvidenceRoleBadge section={section} />
                      <ReviewStatusBadge section={section} />
                    </div>
                    <p className="m-0 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-sans text-[0.82rem] text-ink-subtle">
                      <span>Approximately {readingMinutesFor(section)} minutes</span>
                      <span
                        data-visited-marker
                        className="hidden items-center gap-1 text-ink-muted"
                      >
                        <span aria-hidden="true">✓</span> Opened
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="read-it-all"
          className="mt-12 rounded-md border border-border bg-panel/70 p-5"
        >
          <h2 id="read-it-all" className="mt-0 mb-2 text-[1.18rem]">
            Read or keep the whole case
          </h2>
          <p className="m-0 mb-4 text-[1rem] text-ink-muted">
            Every part is also available as one continuous page for reading offline or on paper, and
            as files you can keep. Printing from here gives you this map rather than the argument.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/full-case/"
              className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 font-sans text-[0.95rem] font-medium text-white no-underline hover:bg-navy-deep"
            >
              Read the full case on one page
            </Link>
            <Link
              href="/download/"
              className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-panel px-4 font-sans text-[0.95rem] font-medium text-navy no-underline hover:bg-panel-strong"
            >
              Download a copy
            </Link>
            <PrintButton label="Print this map" />
          </div>
        </section>
      </div>
    </>
  )
}
