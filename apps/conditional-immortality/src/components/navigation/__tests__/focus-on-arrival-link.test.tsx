import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FocusOnArrivalLink } from '@/components/navigation/focus-on-arrival-link'

/**
 * Where focus goes when the destination is a region of the page you are on.
 *
 * A query-only navigation is a soft navigation: the router resets the scroll
 * position and leaves focus exactly where it was. That is invisible with a
 * mouse and severe with anything else — on `/watch/` a reader who activated a
 * transcript timestamp was left focused twenty-one thousand pixels below the
 * player the page had just scrolled to.
 *
 * Every rule below has a measured failure behind it, so each is tested rather
 * than assumed: a modified click must leave the page alone, the fragment must
 * do the scrolling, focus must not fight the scroll the browser has already
 * done, and the same link pressed twice must still land somewhere visible.
 */

vi.mock('next/link', () => ({
  // The component under test is about the click, not the routing, so the link
  // is a plain anchor here. Its `href` is still asserted: the fragment on it is
  // what does the scrolling.
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    // biome-ignore lint/a11y/useValidAnchor: a stand-in for next/link in a unit test
    <a {...props}>{children}</a>
  ),
}))

let scrolledIntoView: number
let focusedWith: FocusOptions | undefined
let target: HTMLElement

beforeEach(() => {
  scrolledIntoView = 0
  focusedWith = undefined

  target = document.createElement('div')
  target.id = 'video-player'
  target.tabIndex = -1
  target.scrollIntoView = () => {
    scrolledIntoView += 1
  }
  target.focus = (options?: FocusOptions) => {
    focusedWith = options
  }
  document.body.append(target)

  // jsdom never schedules one, and the component uses it for the second pass.
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 0
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

/** jsdom gives every element a zero box, which reads as "out of view". */
function inViewport(inside: boolean) {
  target.getBoundingClientRect = () =>
    ({ top: inside ? 10 : -5000, bottom: inside ? 200 : -4000 }) as DOMRect
}

function renderLink(onNavigate?: () => void) {
  render(
    <FocusOnArrivalLink href="?t=42" focusId="video-player" onNavigate={onNavigate}>
      12:34
    </FocusOnArrivalLink>,
  )
  return screen.getByRole('link', { name: '12:34' })
}

describe('FocusOnArrivalLink', () => {
  it('puts the fragment on the href, because that is what the router honours', () => {
    /*
     * Not a hand-rolled scroll: the router resets the scroll position after
     * the navigation commits and undoes anything done before it. A fragment is
     * also what lands clear of the sticky header, and what makes the
     * destination something a reader can link to.
     */
    expect(renderLink().getAttribute('href')).toBe('?t=42#video-player')
  })

  it('moves focus to the target, without fighting the scroll the browser did', () => {
    inViewport(true)
    fireEvent.click(renderLink())
    expect(focusedWith, 'focus scrolled the page a second time').toEqual({ preventScroll: true })
  })

  it('scrolls the target in when the router has not, which is the same link twice', () => {
    /*
     * Pressing the same timestamp again points at the URL already showing, so
     * the router does nothing at all and focus would land wherever the target
     * happens to be — measured 3,323px above a 900px viewport.
     */
    inViewport(false)
    fireEvent.click(renderLink())
    expect(scrolledIntoView).toBeGreaterThan(0)
  })

  it('leaves the scrolling alone when the target is already on screen', () => {
    inViewport(true)
    fireEvent.click(renderLink())
    expect(scrolledIntoView).toBe(0)
  })

  it('does nothing at all to a page the reader is opening elsewhere', () => {
    inViewport(false)
    const onNavigate = vi.fn()
    fireEvent.click(renderLink(onNavigate), { metaKey: true })
    expect(focusedWith, 'focus moved in the page the reader is leaving behind').toBeUndefined()
    expect(scrolledIntoView).toBe(0)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('runs the destination’s own work after the guard, not before it', () => {
    // `/watch/` needs the player to seek, not merely to be scrolled to.
    inViewport(true)
    const onNavigate = vi.fn()
    fireEvent.click(renderLink(onNavigate))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('is harmless when the target is not on this page', () => {
    target.remove()
    const onNavigate = vi.fn()
    expect(() => fireEvent.click(renderLink(onNavigate))).not.toThrow()
    // The navigation still happens; only the focus move has nothing to do.
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
