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
    // Both suppressions below are the point of this component, not an oversight.
    //
    // `noNoninteractiveTabindex` assumes a non-interactive element has no
    // reason to take focus. A region with `overflow-x: auto` does: WCAG 2.1.1
    // requires that anything a pointer can scroll be scrollable from the
    // keyboard, and a browser only gives arrow-key scrolling to an element
    // that can hold focus. Removing `tabIndex` here is the fix Biome offers
    // and it is the exact defect this component exists to prevent.
    //
    // `useSemanticElements` wants `<fieldset>` for `role="group"`. A fieldset
    // is a form-control grouping; these regions hold tables and reference
    // lists. `role="group"` is what gives the focusable div an announced
    // accessible name without adding a landmark — and the Scripture index
    // alone renders forty-eight of these, so landmarks are not an option.
    //
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is a form grouping — see above
    <div
      className={cn('overflow-x-auto overscroll-x-contain', className)}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 — see above
      tabIndex={0}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}
