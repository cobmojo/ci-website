import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrintDisclosures } from '@/components/content/print-disclosures'

/**
 * The half of the printed-disclosure fix that CSS cannot do.
 *
 * There is no selector that sets an attribute, and the `open` attribute is the
 * one lever that measures the same in all three engines — Firefox declines
 * `content-visibility` on `::details-content` however it is asked. So this
 * component opens every collapsed disclosure for the print and closes it
 * again afterwards.
 *
 * Everything worth testing here is a rule about *which* disclosures and *when*,
 * and each of the three has a failure behind it: a disclosure the page drops
 * from print must not be sprung open, one the reader opened themselves must
 * not be closed, and a second signal for the same print must not overwrite the
 * record of what to put back.
 */

interface Listeners {
  readonly window: Map<string, EventListener>
  readonly media: Set<(event: MediaQueryListEvent) => void>
}

let listeners: Listeners

beforeEach(() => {
  listeners = { window: new Map(), media: new Set() }

  vi.spyOn(window, 'addEventListener').mockImplementation(((
    type: string,
    handler: EventListener,
  ) => {
    listeners.window.set(type, handler)
  }) as typeof window.addEventListener)
  vi.spyOn(window, 'removeEventListener').mockImplementation(((type: string) => {
    listeners.window.delete(type)
  }) as typeof window.removeEventListener)

  // jsdom has no `matchMedia`, and Safari is the engine this branch exists for.
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) => {
      listeners.media.add(handler)
    },
    removeEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) => {
      listeners.media.delete(handler)
    },
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function disclosure(options: { open?: boolean; printHidden?: boolean } = {}) {
  const element = document.createElement('details')
  if (options.open) element.open = true
  if (options.printHidden) element.classList.add('print:hidden')
  element.innerHTML = '<summary>More</summary><p>The body a reader would lose.</p>'
  document.body.append(element)
  return element
}

const beforeprint = () => listeners.window.get('beforeprint')?.(new Event('beforeprint'))
const afterprint = () => listeners.window.get('afterprint')?.(new Event('afterprint'))
const mediaChange = (matches: boolean) => {
  for (const handler of listeners.media) handler({ matches } as MediaQueryListEvent)
}

describe('PrintDisclosures', () => {
  it('renders nothing', () => {
    const { container } = render(<PrintDisclosures />)
    expect(container.innerHTML).toBe('')
  })

  it('opens a collapsed disclosure for the print and closes it again', () => {
    const closed = disclosure()
    render(<PrintDisclosures />)

    beforeprint()
    expect(closed.open, 'the body would have printed as a summary and nothing else').toBe(true)

    afterprint()
    expect(
      closed.open,
      'a reader who prints and carries on should find the page as they left it',
    ).toBe(false)
  })

  it('leaves a disclosure the page drops from print exactly as it is', () => {
    const hidden = disclosure({ printHidden: true })
    render(<PrintDisclosures />)

    beforeprint()
    expect(hidden.open).toBe(false)
  })

  it('never closes a disclosure the reader opened themselves', () => {
    const readerOpened = disclosure({ open: true })
    render(<PrintDisclosures />)

    beforeprint()
    afterprint()
    expect(readerOpened.open, 'closing what the reader opened is its own defect').toBe(true)
  })

  it('survives a print that fires both signals, which is every real print', () => {
    /*
     * The guard this asserts was added because of a measured failure. Without
     * it the second signal found everything already open, collected nothing,
     * and replaced the record of what to close — so nothing was restored, and
     * the reader's page kept every aside sprung open for the rest of the
     * session, on every print after the first as well.
     */
    const closed = disclosure()
    render(<PrintDisclosures />)

    beforeprint()
    mediaChange(true)
    expect(closed.open).toBe(true)

    afterprint()
    expect(closed.open, 'the second signal overwrote the record of what to put back').toBe(false)
  })

  it('answers the media query on its own, for the engine that sends nothing else', () => {
    const closed = disclosure()
    render(<PrintDisclosures />)

    mediaChange(true)
    expect(closed.open).toBe(true)
    mediaChange(false)
    expect(closed.open).toBe(false)
  })

  it('puts everything back if it is unmounted mid-print', () => {
    const closed = disclosure()
    const { unmount } = render(<PrintDisclosures />)

    beforeprint()
    expect(closed.open).toBe(true)

    unmount()
    expect(closed.open, 'unmounting during a print would strand every disclosure open').toBe(false)
    expect(listeners.window.size, 'listeners outlived the component').toBe(0)
    expect(listeners.media.size).toBe(0)
  })
})
