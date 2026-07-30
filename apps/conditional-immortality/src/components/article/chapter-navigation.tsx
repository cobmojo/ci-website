import { caseSectionsByGroup } from '@ci/content/case'
import Link from 'next/link'

/**
 * The full chapter list.
 *
 * Rendered as a plain nested list of links, so it works with scripting
 * disabled and reads correctly as a document outline. On wide screens it sits
 * in the left column; on narrow screens the mobile sheet carries it instead.
 */
export function CaseChapterNavigation({
  currentId,
  className,
}: {
  currentId?: string
  className?: string
}) {
  return (
    <nav aria-label="Case chapters" className={`chapter-navigation ${className ?? ''}`}>
      <h2 className="mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
        Case contents
      </h2>
      <ol className="m-0 list-none space-y-4 p-0">
        {caseSectionsByGroup.map(bucket => (
          <li key={bucket.group}>
            <h3 className="mb-1 font-sans text-[0.8rem] font-semibold text-navy">{bucket.label}</h3>
            <ol className="m-0 list-none space-y-0.5 p-0">
              {bucket.sections.map(section => {
                const isCurrent = section.id === currentId
                return (
                  <li key={section.id}>
                    <Link
                      href={section.route}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`block rounded py-1 pl-2 font-sans text-[0.83rem] leading-snug no-underline ${
                        isCurrent
                          ? 'border-l-2 border-copper bg-panel font-medium text-navy'
                          : 'border-l-2 border-transparent text-ink-muted hover:bg-panel hover:text-navy'
                      }`}
                    >
                      <span className="text-ink-subtle">{section.id}</span> {section.title}
                    </Link>
                  </li>
                )
              })}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Narrow-screen equivalent.
 *
 * A `<details>` disclosure rather than a dialog, because it needs no
 * JavaScript at all and the browser handles the expanded state natively.
 */
export function CaseChapterDisclosure({ currentId }: { currentId?: string }) {
  return (
    <details className="mb-6 rounded-md border border-border bg-paper-raised px-4 py-3 lg:hidden print:hidden">
      {/* Negative margin + matching padding: the visible layout is unchanged
          while the summary's hit area reaches the 44px floor. */}
      <summary className="-my-3 cursor-pointer py-3 font-sans text-[0.92rem] font-medium text-navy">
        Case contents
      </summary>
      <div className="mt-3 max-h-[60vh] overflow-y-auto">
        <CaseChapterNavigation currentId={currentId} />
      </div>
    </details>
  )
}
