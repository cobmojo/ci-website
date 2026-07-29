import { cn } from '@ci/ui'
import type { ReactNode } from 'react'

/**
 * A horizontally scrollable region that a keyboard can actually scroll.
 *
 * WCAG 2.1.1 requires that anything a pointer can scroll be operable from the
 * keyboard, and a plain `div` with `overflow-x: auto` is not focusable. Every
 * hand-written scroll wrapper on the site goes through this component so the
 * `tabindex` and the label cannot be forgotten. The MDX pipeline gets the same
 * treatment automatically through `rehypeScrollableTables`.
 *
 * `role="group"` rather than `role="region"`: a labelled group conveys the
 * same grouping to assistive technology without adding a landmark. The
 * Scripture index alone renders forty-eight of these, and forty-eight extra
 * landmarks would make the landmark list useless.
 */
/**
 * The same behaviour as attributes, for wrappers that already exist and carry
 * their own classes. Spread it onto the wrapper:
 *
 * ```tsx
 * <div {...scrollRegionProps('References in Genesis')} className="…">
 * ```
 */
export function scrollRegionProps(label: string) {
  return { tabIndex: 0, role: 'group' as const, 'aria-label': label }
}

export function ScrollRegion({
  label,
  className,
  children,
}: {
  /** Announced when focus enters the region. Say what is inside it. */
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn('overflow-x-auto overscroll-x-contain', className)}
      tabIndex={0}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}
