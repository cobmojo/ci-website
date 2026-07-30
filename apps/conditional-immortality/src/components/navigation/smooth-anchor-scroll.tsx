'use client'

import { useEffect } from 'react'

/**
 * Tier 4 of `docs/motion-brief.md`: smooth scrolling for in-page anchors, and
 * for nothing else.
 *
 * `scroll-behavior: smooth` on the document is the usual way to do this and it
 * cannot be used here. It also captures the App Router's scroll-to-top on
 * client navigation, and measured in Chromium 148 the result is that the scroll
 * position survives a route change untouched: a reader who follows "Next
 * section" from two thousand pixels down an article arrives two thousand pixels
 * down the next one. With the behaviour left at `auto` the same navigation
 * correctly returns to the top.
 *
 * So the behaviour is switched on for the duration of one fragment navigation
 * and switched off again. Two properties of this approach matter:
 *
 * 1. The navigation itself is left to the browser. Nothing is prevented, no
 *    hash is pushed by hand, and no element is scrolled by hand. That is what
 *    keeps the platform semantics: the browser sets the sequential focus
 *    navigation starting point at the target, so the next Tab press continues
 *    from the heading a reader jumped to rather than from the top of the
 *    document. A hand-rolled `scrollIntoView` plus `pushState` loses that, and
 *    on this site that would be a real regression.
 * 2. Without scripting, nothing happens and anchors jump instantly, which is
 *    exactly what they did before. This is an enhancement, not a dependency.
 *
 * The reduced-motion preference is read at the moment of the click rather than
 * once on mount, so a reader who changes it mid-session is honoured without a
 * listener.
 */

/** Long enough for any in-document scroll, short enough to never span a route change. */
const RELEASE_AFTER_MS = 1000

export function SmoothAnchorScroll() {
  useEffect(() => {
    const root = document.documentElement
    let timer: number | undefined

    function release() {
      window.clearTimeout(timer)
      root.style.removeProperty('scroll-behavior')
    }

    function isSameDocumentFragment(link: HTMLAnchorElement): boolean {
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return false
      if (url.pathname !== window.location.pathname) return false
      if (url.search !== window.location.search) return false
      const id = url.hash.slice(1)
      if (id.length === 0) return false
      // A fragment that points at nothing scrolls nowhere, so there is nothing
      // to smooth. `decodeURIComponent` because heading slugs may be escaped.
      try {
        return document.getElementById(decodeURIComponent(id)) !== null
      } catch {
        return document.getElementById(id) !== null
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target
      const link = target instanceof Element ? target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement)) return

      if (!isSameDocumentFragment(link)) {
        // Any click on any other link hands the behaviour back *now*. A reader
        // who clicks an anchor and then a route link inside the release window
        // would otherwise carry `smooth` into the router's scroll-to-top, which
        // is exactly the stranded-mid-article regression this component exists
        // to prevent. This runs before the guards below on purpose: the router
        // calls `preventDefault` on its links before the event reaches this
        // listener, so a prevented click is the *normal* shape of a route
        // navigation here. Releasing is idempotent, only affects how a future
        // scroll starts, and never touches the navigation itself.
        release()
        return
      }

      // A fragment click sets the behaviour only when the browser is about to
      // perform it: a prevented click has been handled by a component, and a
      // modified or non-primary click opens a tab instead of scrolling.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (link.target && link.target !== '_self') return

      if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return

      root.style.scrollBehavior = 'smooth'
      // Released on `scrollend` where the browser has it, and on the timer
      // regardless, so the behaviour cannot stay switched on if neither the
      // event nor a later navigation click arrives.
      timer = window.setTimeout(release, RELEASE_AFTER_MS)
    }

    document.addEventListener('click', onClick)
    window.addEventListener('scrollend', release)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('scrollend', release)
      release()
    }
  }, [])

  return null
}
