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
 * receive focus without becoming a tab stop of its own.
 *
 * The scrolling is the platform's, through a fragment on the href. Leaving it
 * to the router looked right on `/watch/`, where the player sits near the top
 * and the router's scroll to the top of the document lands on it by
 * coincidence. On `/search/` the heading, the form and the filters fill the
 * first 840px, so at 375px wide the results began below the fold: focus went
 * to an element with no pixels in the viewport, taking its focus ring with it,
 * and the only evidence the page had changed — "Page 2 of 4" — was cut in half
 * by the fold.
 *
 * Scrolling the element in by hand does not fix it either: the router resets
 * the scroll position after the navigation commits, so it undoes anything done
 * before that. A fragment is what the router itself honours, it lands on
 * `scroll-padding-top` clear of the sticky header, and it makes the result a
 * reader can link to. Focus then follows with `preventScroll`, so it never
 * fights the scroll the browser has already done.
 *
 * The scroll is instant. Tier 4 anchor scrolling is untouched.
 */
export function FocusOnArrivalLink({
  href,
  focusId,
  className,
  rel,
  children,
  onNavigate,
}: {
  href: string
  /** Element to focus once the navigation lands. It needs `tabIndex={-1}`. */
  focusId: string
  className?: string
  rel?: string
  children: ReactNode
  /**
   * Run when this link is actually followed in place, after the modified-click
   * guard. For a destination that has to do something beyond existing — the
   * video player, which must seek rather than merely be scrolled to.
   */
  onNavigate?: () => void
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
      onNavigate?.()
    },
    [focusId, onNavigate],
  )

  return (
    <Link href={`${href}#${focusId}`} rel={rel} className={className} onClick={onClick}>
      {children}
    </Link>
  )
}
