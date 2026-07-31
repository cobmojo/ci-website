import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollRegion } from '@/components/content/scroll-region'

/**
 * The conditional tab stop, which is the whole of this component's judgement.
 *
 * WCAG 2.1.1 asks that anything a pointer can scroll be reachable from a
 * keyboard, so a region that overflows has to be a tab stop. The corollary is
 * the part that is easy to get wrong: a region that does *not* overflow is a
 * tab stop with nothing behind it, and `/scripture/` renders forty-four of
 * these. Announcing forty-four empty groups is not accessibility.
 *
 * So the stop is measured rather than assumed, and both directions are worth
 * a test: it must appear when there is something to scroll, and it must go
 * away when there is not — and the starting state has to be the focusable one,
 * because that is what the server renders and what a reader without scripting
 * keeps.
 */

/** Neither jsdom nor happy-dom implements one, and this component observes. */
class StubResizeObserver implements ResizeObserver {
  static instances: StubResizeObserver[] = []
  readonly observed: Element[] = []
  constructor(private readonly callback: ResizeObserverCallback) {
    StubResizeObserver.instances.push(this)
  }
  observe(target: Element) {
    this.observed.push(target)
  }
  unobserve() {}
  disconnect() {}
  /** Drive a re-measurement the way a real resize would. */
  fire() {
    this.callback([], this)
  }
}

/**
 * jsdom reports every box as zero, so overflow has to be stated. These are the
 * two numbers the component subtracts.
 */
function withGeometry(scrollWidth: number, clientWidth: number) {
  for (const property of ['scrollWidth', 'clientWidth'] as const) {
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get() {
        return property === 'scrollWidth' ? scrollWidth : clientWidth
      },
    })
  }
}

beforeEach(() => {
  StubResizeObserver.instances = []
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const property of ['scrollWidth', 'clientWidth']) {
    // biome-ignore lint/performance/noDelete: restoring the prototype is the point
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[property]
  }
})

describe('ScrollRegion', () => {
  it('is a labelled group rather than a landmark', () => {
    withGeometry(0, 0)
    render(<ScrollRegion label="Matthew">table</ScrollRegion>)
    const region = screen.getByRole('group', { name: 'Matthew' })
    expect(region).toBeTruthy()
    // A landmark per cited book would make the landmark list useless: the
    // Scripture index alone renders forty-four of these.
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('keeps the overflow and overscroll classes whatever else the caller passes', () => {
    withGeometry(0, 0)
    render(
      <ScrollRegion label="Mark" className="my-4">
        table
      </ScrollRegion>,
    )
    const region = screen.getByRole('group', { name: 'Mark' })
    expect(region.className).toContain('overflow-x-auto')
    // Every caller of the helper this component replaced forgot this one.
    expect(region.className).toContain('overscroll-x-contain')
    expect(region.className).toContain('my-4')
  })

  it('is a tab stop while it has something to scroll', () => {
    withGeometry(900, 400)
    render(<ScrollRegion label="Luke">table</ScrollRegion>)
    expect(screen.getByRole('group', { name: 'Luke' }).tabIndex).toBe(0)
  })

  it('gives the tab stop up once measurement shows it has nothing to scroll', () => {
    withGeometry(400, 400)
    render(<ScrollRegion label="John">table</ScrollRegion>)
    expect(screen.getByRole('group', { name: 'John' }).tabIndex).toBe(-1)
  })

  it('treats a sub-pixel overflow no reader can reach as no overflow', () => {
    withGeometry(400.4, 400)
    render(<ScrollRegion label="Acts">table</ScrollRegion>)
    expect(screen.getByRole('group', { name: 'Acts' }).tabIndex).toBe(-1)
  })

  it('watches its own contents, not only its box', () => {
    withGeometry(400, 400)
    render(
      <ScrollRegion label="Romans">
        <table>
          <tbody>
            <tr>
              <td>cell</td>
            </tr>
          </tbody>
        </table>
      </ScrollRegion>,
    )
    const observer = StubResizeObserver.instances[0] as StubResizeObserver
    // The box can hold still while a table gains a column or a font swaps in.
    expect(observer.observed.length).toBeGreaterThan(1)
  })

  it('takes the stop back when a resize makes the region scrollable again', () => {
    withGeometry(400, 400)
    render(<ScrollRegion label="Hebrews">table</ScrollRegion>)
    const region = screen.getByRole('group', { name: 'Hebrews' })
    expect(region.tabIndex).toBe(-1)

    // The same tables that fit at 375px do overflow at 320px, so the stop has
    // to come back when it becomes real.
    withGeometry(900, 320)
    const observer = StubResizeObserver.instances[0] as StubResizeObserver
    // Inside `act`: a real observer fires outside React's own scheduling too,
    // and the update it causes has to be flushed before the DOM is read.
    act(() => observer.fire())
    expect(region.tabIndex).toBe(0)
  })
})
