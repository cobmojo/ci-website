'use client'

import { cn } from '@ci/ui'
import { type ReactNode, useEffect, useRef, useState } from 'react'

/**
 * A horizontally scrollable region that a keyboard can actually scroll.
 *
 * WCAG 2.1.1 requires that anything a pointer can scroll be operable from the
 * keyboard, and a plain `div` with `overflow-x: auto` is not focusable. Every
 * hand-written scroll wrapper on the site goes through this component so the
 * `tabindex` and the label cannot be forgotten. Tables written in MDX are
 * wrapped automatically by `rehypeScrollableTables`, which produces the same
 * markup with one difference noted at the end of this comment.
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
 *
 * The `tabindex` is conditional, because the rule behind it is conditional.
 * WCAG asks for a tab stop while a region scrolls; where it cannot scroll, the
 * stop has nothing behind it. `/scripture/` wraps forty-four tables that fit
 * at every width from 375px up, which put forty-four of that page's four
 * hundred and eighteen tab stops — better than one in ten — in the way of
 * every keyboard and switch user, each announced as a group with nothing to do
 * inside it. It is measured rather than assumed, because the same tables do
 * overflow at 320px and the stop has to come back when it is real.
 *
 * That measurement is the one difference from `rehypeScrollableTables`, whose
 * `tabindex` stays unconditional: a rehype pass emits HTML, not a component
 * that can observe itself. The corpus holds one markdown table, of five
 * columns, which does overflow at the widths that matter. If that stops being
 * true, the pass needs to emit a marker something on the client can measure.
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
  const ref = useRef<HTMLDivElement>(null)
  /**
   * Focusable until measured otherwise. That is what the server renders, so it
   * is also what a reader without scripting keeps, and measuring can only ever
   * take the stop away from a region that had nothing to scroll.
   */
  const [scrollable, setScrollable] = useState(true)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Sub-pixel layout can leave a fraction of overflow no reader can reach,
    // so a whole pixel is the threshold.
    const measure = () => setScrollable(node.scrollWidth - node.clientWidth >= 1)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(node)
    // The box can hold still while its contents reflow — a table gaining a
    // column, a font swapping in — so watch what is inside it too.
    for (const child of node.children) observer.observe(child)
    return () => observer.disconnect()
  }, [])

  return (
    // Suppressed deliberately: the rule wants a semantic element, and a
    // fieldset is a form-control grouping, which this is not.
    // biome-ignore lint/a11y/useSemanticElements: a fieldset is a form grouping
    <div
      ref={ref}
      className={cn('overflow-x-auto overscroll-x-contain', className)}
      // `noNoninteractiveTabindex` needs no suppression here: it fires on a
      // literal 0, and this is measured. The tab stop is still the point —
      // WCAG 2.1.1 — it is just conditional on there being something to scroll.
      tabIndex={scrollable ? 0 : -1}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}
