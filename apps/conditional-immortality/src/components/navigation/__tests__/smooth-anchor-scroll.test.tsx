import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SmoothAnchorScroll } from '@/components/navigation/smooth-anchor-scroll'

/**
 * The scoping is the whole point of this component, so it is what is tested.
 *
 * `scroll-behavior: smooth` may be switched on for a same-document fragment
 * navigation and for nothing else. Every case below that leaves it unset is a
 * case where switching it on would either animate a scroll the reader did not
 * ask for, or leave the behaviour switched on for the router's next
 * scroll-to-top, which is the regression this component exists to avoid.
 */

const root = () => document.documentElement

function setPreference(prefersReduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        media: query,
        matches: query.includes('no-preference') ? !prefersReduced : prefersReduced,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  )
}

/** A link in the document, clicked the way a reader clicks it. */
function clickLink(href: string, init: MouseEventInit = {}): void {
  const link = document.createElement('a')
  link.href = href
  link.textContent = 'link'
  document.body.append(link)
  link.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, ...init }))
}

/**
 * jsdom has no navigation and warns when a click on a real anchor tries to
 * perform one. Prevented on `window`, the last step of the bubble path, so the
 * component has already seen an unprevented event by the time this runs. jsdom
 * still logs the warning for cross-document hrefs; it is noise, not a failure.
 */
function swallowNavigation(event: MouseEvent) {
  event.preventDefault()
}

beforeEach(() => {
  setPreference(false)
  document.body.innerHTML = ''
  root().style.removeProperty('scroll-behavior')
  window.addEventListener('click', swallowNavigation)
  // A real target for the fragment to point at. Without one there is nothing to
  // scroll to and the component correctly does nothing.
  const heading = document.createElement('h2')
  heading.id = 'in-brief'
  document.body.append(heading)
})

afterEach(() => {
  // Explicit, because this project does not enable Vitest globals and so
  // Testing Library's automatic cleanup never runs. Without it every rendered
  // component stays mounted and listening, and the assertions about a component
  // that has been unmounted are satisfied by one of its predecessors.
  cleanup()
  window.removeEventListener('click', swallowNavigation)
  vi.unstubAllGlobals()
  vi.useRealTimers()
  root().style.removeProperty('scroll-behavior')
})

describe('SmoothAnchorScroll', () => {
  it('smooths a same-document fragment navigation', () => {
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('smooth')
  })

  it('smooths a fragment written as a full path on the same page', () => {
    render(<SmoothAnchorScroll />)
    clickLink(`${window.location.pathname}#in-brief`)
    expect(root().style.scrollBehavior).toBe('smooth')
  })

  it('leaves a navigation to another page alone', () => {
    // The case that matters: were the behaviour switched on here, the router's
    // scroll-to-top would be suppressed and the reader would land mid-article.
    render(<SmoothAnchorScroll />)
    clickLink('/case/key-texts/lake-of-fire/#in-brief')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('leaves a plain link to another page alone', () => {
    render(<SmoothAnchorScroll />)
    clickLink('/glossary/')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('leaves an external link alone', () => {
    render(<SmoothAnchorScroll />)
    clickLink('https://example.org/#in-brief')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('leaves a fragment that points at nothing alone', () => {
    render(<SmoothAnchorScroll />)
    clickLink('#no-such-heading')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('leaves an empty fragment alone', () => {
    render(<SmoothAnchorScroll />)
    clickLink('#')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('leaves a modified click alone, because it opens a tab', () => {
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief', { metaKey: true })
    expect(root().style.scrollBehavior).toBe('')
    clickLink('#in-brief', { ctrlKey: true })
    expect(root().style.scrollBehavior).toBe('')
  })

  it('leaves a middle click alone', () => {
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief', { button: 1 })
    expect(root().style.scrollBehavior).toBe('')
  })

  it('does nothing when the reader prefers reduced motion', () => {
    setPreference(true)
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('reads the preference at click time, not at mount time', () => {
    // A reader who turns the preference on mid-session is honoured without the
    // component having to listen for the change.
    render(<SmoothAnchorScroll />)
    setPreference(true)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('releases the behaviour when a route link is clicked inside the window', () => {
    // The ordering the release window cannot cover on its own: anchor click,
    // then a route click before `scrollend` or the timer. Carrying `smooth`
    // into the router's scroll-to-top strands the reader mid-article.
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('smooth')

    clickLink('/case/key-texts/lake-of-fire/')
    expect(root().style.scrollBehavior).toBe('')
  })

  it('releases on a route click even when the router prevented it', () => {
    // The router's links call preventDefault before the event bubbles to the
    // document, so a prevented click is the normal shape of a client
    // navigation — it must still release.
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('smooth')

    const link = document.createElement('a')
    link.href = '/glossary/'
    link.textContent = 'route'
    link.addEventListener('click', event => event.preventDefault())
    document.body.append(link)
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, cancelable: true }))
    expect(root().style.scrollBehavior).toBe('')
  })

  it('does not release for a click that is not on a link', () => {
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('smooth')

    const button = document.createElement('button')
    button.textContent = 'not a link'
    document.body.append(button)
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
    expect(root().style.scrollBehavior).toBe('smooth')
  })

  it('releases the behaviour when the scroll ends', () => {
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('smooth')

    window.dispatchEvent(new Event('scrollend'))
    expect(root().style.scrollBehavior).toBe('')
  })

  it('releases the behaviour on a timer even without scrollend', () => {
    // Not every engine fires `scrollend`. The behaviour must never still be on
    // when the router next asks the document to scroll.
    vi.useFakeTimers()
    render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('smooth')

    vi.advanceTimersByTime(1000)
    expect(root().style.scrollBehavior).toBe('')
  })

  it('releases the behaviour when unmounted mid-scroll', () => {
    const view = render(<SmoothAnchorScroll />)
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('smooth')

    view.unmount()
    expect(root().style.scrollBehavior).toBe('')
  })

  it('stops listening once unmounted', () => {
    render(<SmoothAnchorScroll />).unmount()
    clickLink('#in-brief')
    expect(root().style.scrollBehavior).toBe('')
  })
})
