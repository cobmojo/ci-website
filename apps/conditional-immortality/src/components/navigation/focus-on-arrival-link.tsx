'use client'

import Link from 'next/link'
import { type MouseEvent, type ReactNode, useCallback } from 'react'
import { isModifiedClick } from '@/lib/modified-click'

/**
 * A link whose destination is a region of the page it is already on.
 *
 * A query-only navigation is a soft navigation: Next resets the scroll
 * position but leaves focus exactly where it was. That is invisible to a
 * mouse and severe for everyone else. On `/watch/` a reader who activated a
 * transcript timestamp was left focused on that timestamp, twenty-one
 * thousand pixels below the player the page had just scrolled to — a hundred
 * and fifty-eight Shift+Tab presses away from it. On `/search/` a reader who
 * pressed "Next" was told "Page 2 of 4" by the live region and then tabbed
 * straight into the footer, skipping every new result.
 *
 * So focus follows the navigation. The target takes `tabindex="-1"` so it can
 * receive focus without becoming a tab stop of its own, and `preventScroll`
 * leaves the scrolling to the router rather than fighting it.
 *
 * This is not a fragment link and adds no motion: Tier 4 anchor scrolling is
 * untouched.
 */
export function FocusOnArrivalLink({
  href,
  focusId,
  className,
  rel,
  children,
}: {
  href: string
  /** Element to focus once the navigation lands. It needs `tabIndex={-1}`. */
  focusId: string
  className?: string
  rel?: string
  children: ReactNode
}) {
  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // A middle or modified click is opening this somewhere else, and moving
      // focus in the page they are leaving behind would be wrong.
      if (isModifiedClick(event)) return
      const focus = () => document.getElementById(focusId)?.focus({ preventScroll: true })
      // The target is already in the document, so this lands immediately;
      // the second pass covers a subtree that re-rendered on the new params.
      focus()
      requestAnimationFrame(focus)
    },
    [focusId],
  )

  return (
    <Link href={href} rel={rel} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
