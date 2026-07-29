import { getSection } from '@ci/content/case'
import { revisedSectionIds, revisionsForSection } from '@ci/content/revisions'
import { REVISION_TYPE_LABELS } from '@ci/content-schema'
import { Badge } from '@ci/ui'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { formatLongDate, pluralise } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * Per-part changelog.
 *
 * The permanent section ids are upper case (S04, RB1, APP1) but routes on this
 * site are lower case throughout, so the parameter is lowered when the routes
 * are generated and resolved case-insensitively when a page is rendered.
 */

export const dynamicParams = false

export function generateStaticParams() {
  return revisedSectionIds.map(id => ({ sectionId: id.toLowerCase() }))
}

function resolveSectionId(parameter: string): string | undefined {
  const wanted = parameter.toLowerCase()
  return revisedSectionIds.find(id => id.toLowerCase() === wanted)
}

function crumbsFor(sectionId: string, title: string): readonly Crumb[] {
  return [
    { href: '/', label: 'Home' },
    { href: '/changelog/', label: 'Changelog' },
    { href: `/changelog/${sectionId.toLowerCase()}/`, label: title },
  ]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sectionId: string }>
}): Promise<Metadata> {
  const { sectionId } = await params
  const resolved = resolveSectionId(sectionId)
  const section = resolved ? getSection(resolved) : undefined
  if (!resolved || !section) return {}

  return pageMetadata({
    title: `Changelog for ${resolved}: ${section.title}`,
    description: `Every recorded editorial change to ${resolved}, ${section.title}, with the issue raised and the decision taken.`,
    route: `/changelog/${resolved.toLowerCase()}/`,
    category: resolved,
  })
}

export default async function SectionChangelogPage({
  params,
}: {
  params: Promise<{ sectionId: string }>
}) {
  const { sectionId } = await params
  const resolved = resolveSectionId(sectionId)
  const section = resolved ? getSection(resolved) : undefined
  if (!resolved || !section) notFound()

  const entries = revisionsForSection(resolved)
  const crumbs = crumbsFor(resolved, `${resolved} changes`)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={crumbs} />

        <div className="max-w-[52rem]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              Changelog <span aria-hidden="true">·</span> {resolved}
            </p>
            <h1 className="mt-0 mb-4">Changes to {section.title}</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              {entries.length} recorded {pluralise(entries.length, 'change')} to part {resolved},
              newest first. Each entry names the problem and the decision taken.
            </p>
            <p className="m-0 mt-4 font-sans text-[0.95rem]">
              <Link href={section.route}>Read {resolved} in full</Link>
              <span aria-hidden="true" className="text-ink-subtle">
                {' '}
                ·{' '}
              </span>
              <Link href="/changelog/">Every change across the site</Link>
            </p>
          </header>

          <ol className="m-0 list-none space-y-6 p-0">
            {entries.map(revision => (
              <li
                key={revision.id}
                id={revision.id}
                className="rounded-md border border-border bg-paper-raised p-5"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-[0.86rem] text-ink-subtle">
                  <time dateTime={revision.date}>{formatLongDate(revision.date)}</time>
                  <Badge tone="neutral">{REVISION_TYPE_LABELS[revision.type]}</Badge>
                </div>

                <h2 className="mt-2.5 mb-3 text-[1.12rem]">{revision.summary}</h2>

                <dl className="m-0 space-y-3 text-[1.01rem]">
                  <div>
                    <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                      Issue raised
                    </dt>
                    <dd className="m-0 mt-1 text-ink-muted">{revision.issue}</dd>
                  </div>
                  <div>
                    <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                      Decision taken
                    </dt>
                    <dd className="m-0 mt-1 text-ink-muted">{revision.decision}</dd>
                  </div>
                  {revision.details ? (
                    <div>
                      <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                        Further detail
                      </dt>
                      <dd className="m-0 mt-1 text-ink-muted">{revision.details}</dd>
                    </div>
                  ) : null}
                  {/* Only ever rendered where an explicit credit was given. */}
                  {revision.creditedTo ? (
                    <div>
                      <dt className="font-sans text-[0.8rem] font-semibold tracking-wider text-ink-subtle uppercase">
                        Credit
                      </dt>
                      <dd className="m-0 mt-1 text-ink-muted">
                        Raised by {revision.creditedTo}, with permission to publish the name.
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ol>

          <nav
            aria-label="Related pages"
            className="mt-12 border-t border-border pt-6 font-sans text-[0.95rem] print:hidden"
          >
            <ul className="m-0 list-none space-y-2 p-0">
              <li>
                <Link href={section.route}>
                  {resolved}. {section.title}
                </Link>
              </li>
              <li>
                <Link href="/changelog/">The full changelog</Link>
              </li>
              <li>
                <Link href={`/corrections/?section=${resolved}#form`}>
                  Send a correction about this part
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
