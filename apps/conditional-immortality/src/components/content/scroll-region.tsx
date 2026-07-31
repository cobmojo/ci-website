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
 *
 * This component is the only owner. An earlier `scrollRegionProps` helper let
 * callers spread the attributes onto their own wrapper and keep their own
 * classes, and every one of those callers then missed `overscroll-x-contain`,
 * so the helper is gone and `className` composes here instead.
 */
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
    // Both rules below fire on the technique described above, so both are
    // suppressed deliberately: a fieldset is a form-control grouping, and the
    // tabindex is what makes the region keyboard-scrollable at all.
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is a form grouping
    <div
      className={cn('overflow-x-auto overscroll-x-contain', className)}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1, see above
      tabIndex={0}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}
