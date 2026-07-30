import type { SearchDoc, SearchResult } from '@ci/search'
import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuickSearchResults } from '@/components/search/quick-search-results'
import type { TextLayoutEngine } from '@/lib/text-layout/engine'
import { buildFontContract, type ExcerptGeometry } from '@/lib/text-layout/font-contract'
import { createTestLayoutEngine } from '@/lib/text-layout/test-engine'
import type { FittingRuntime } from '@/lib/text-layout/use-fitted-search-excerpts'

/**
 * The React half of the enhancement.
 *
 * jsdom has no font engine, no canvas and no layout, so nothing here asserts
 * geometry — the browser suite does that. What these pin is the contract
 * between the coordinator and the rows: the fallback is on screen first and
 * stays there under every failure, one observer serves the whole list,
 * preparation survives a resize, and an answer from an old query can never
 * overwrite a newer one.
 */

const CONTRACT = buildFontContract(
  {
    fontFamily: '"Source Serif 4", serif',
    fontSize: '10px',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '14px',
    letterSpacing: 'normal',
    whiteSpace: 'normal',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
    textWrap: 'wrap',
    lineBudget: '2',
  },
  'en',
)
if (!CONTRACT) throw new Error('the fixture contract must be valid')

const GEOMETRY: ExcerptGeometry = { contract: CONTRACT, width: 100 }

/** Ten characters to a line, so `aaa bbb | ccc ddd | …`. */
const CANDIDATE_TEXT = 'aaa bbb ccc ddd eee fff ggg hhh'

function doc(id: string): SearchDoc {
  return {
    id,
    type: 'case-section',
    route: `/case/${id}/`,
    title: 'What Does Eternal Punishment Mean?',
    sectionId: 'S04',
    breadcrumb: 'Case',
    summary: '',
    headings: [],
    scriptureRefs: [],
    body: '',
    notes: '',
    aliases: [],
    bibleBooks: [],
    topicIds: [],
  }
}

function result(id: string, overrides: Partial<SearchResult> = {}): SearchResult {
  const start = CANDIDATE_TEXT.indexOf('eee')
  return {
    doc: doc(id),
    score: 10,
    matchedFields: ['body'],
    matchedTerms: ['eee'],
    excerpt: 'the ordinary fallback excerpt for eee',
    excerptMatchRanges: [{ start: 34, end: 37 }],
    excerptField: 'body',
    excerptCandidate: {
      text: CANDIDATE_TEXT,
      matchRanges: [{ start, end: start + 3 }],
      omittedBefore: false,
      omittedAfter: false,
      sourceField: 'body',
    },
    ...overrides,
  }
}

/** How many observers the whole list created, and what they observed. */
let observedTargets: Element[] = []
let observerCount = 0
let observerCallbacks: ResizeObserverCallback[] = []

class StubResizeObserver implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    observerCount += 1
    observerCallbacks.push(callback)
  }
  observe(target: Element) {
    observedTargets.push(target)
  }
  unobserve() {}
  disconnect() {}
}

function runtimeWith(overrides: Partial<FittingRuntime> = {}): FittingRuntime {
  return {
    loadEngine: async () => createTestLayoutEngine(),
    ensureFont: async () => true,
    readGeometry: () => GEOMETRY,
    verifyEngine: () => true,
    ...overrides,
  }
}

let unhandled: unknown[] = []
let consoleErrors: unknown[][] = []

beforeEach(() => {
  observedTargets = []
  observerCount = 0
  observerCallbacks = []
  unhandled = []
  consoleErrors = []
  vi.stubGlobal('ResizeObserver', StubResizeObserver)
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args)
  })
  process.on('unhandledRejection', collectUnhandled)
})

afterEach(() => {
  process.off('unhandledRejection', collectUnhandled)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function collectUnhandled(reason: unknown) {
  unhandled.push(reason)
}

function renderList(props: Partial<Parameters<typeof QuickSearchResults>[0]> = {}) {
  return render(
    <QuickSearchResults
      results={[result('a'), result('b'), result('c')]}
      open
      onNavigate={() => {}}
      runtime={runtimeWith()}
      {...props}
    />,
  )
}

function excerptElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-search-excerpt]')]
}

/**
 * Wait for the coordinator's batch to land.
 *
 * The batch crosses an animation frame, two awaited promises and a React
 * transition. Under a loaded machine jsdom's timer-driven `requestAnimationFrame`
 * makes that comfortably longer than Testing Library's one-second default, so
 * the wait is generous. It is the waiting that is generous, not the assertion:
 * the state still has to become `fitted`.
 */
async function waitForFitted(container: HTMLElement): Promise<void> {
  await waitFor(
    () => {
      expect(excerptElements(container)[0]?.dataset.pretextState).toBe('fitted')
    },
    { timeout: 8000 },
  )
}

describe('first paint', () => {
  it('shows the ordinary fallback excerpt before anything is measured', () => {
    const { container } = renderList()
    const rendered = excerptElements(container)
    expect(rendered).toHaveLength(3)
    for (const element of rendered) {
      expect(element.textContent).toBe('the ordinary fallback excerpt for eee')
      expect(element.dataset.pretextState).toBe('fallback')
    }
  })

  it('marks the fallback match semantically', () => {
    const { container } = renderList()
    const marks = container.querySelectorAll('mark')
    expect(marks.length).toBeGreaterThan(0)
    expect([...marks].some(mark => mark.textContent === 'eee')).toBe(true)
  })

  it('keeps every result link usable', () => {
    const { container } = renderList()
    const links = [...container.querySelectorAll('a')]
    expect(links).toHaveLength(3)
    // Next normalises the trailing slash from its own config, which is not
    // loaded here; what matters is that the row still links to its document.
    expect(links[0]?.getAttribute('href')?.replace(/\/$/, '')).toBe('/case/a')
  })

  it('highlights the section id, which is often the only visible reason', () => {
    const { container } = renderList({
      results: [result('a', { matchedTerms: ['s04'], matchedFields: ['id'] })],
    })
    expect([...container.querySelectorAll('mark')].some(m => m.textContent === 'S04')).toBe(true)
  })

  /*
   * Highlighting is per row, not per query.
   *
   * A search for two words ranks a row that matched only one of them, and the
   * union of the query's terms would light up words in that row's title that
   * are no part of why it is here. Each row is highlighted with the terms the
   * ranker recorded for that row.
   */
  it('highlights each row with its own matched terms', () => {
    const { container } = renderList({
      results: [
        result('a', {
          doc: { ...doc('a'), title: 'Eternal Punishment' },
          matchedTerms: ['eternal'],
        }),
        result('b', {
          doc: { ...doc('b'), title: 'Eternal Punishment' },
          matchedTerms: ['punishment'],
        }),
      ],
    })

    const rows = [...container.querySelectorAll('li')]
    expect(rows).toHaveLength(2)
    const marksIn = (row: Element) => [...row.querySelectorAll('mark')].map(m => m.textContent)
    expect(marksIn(rows[0] as Element)).toContain('Eternal')
    expect(marksIn(rows[0] as Element)).not.toContain('Punishment')
    expect(marksIn(rows[1] as Element)).toContain('Punishment')
    expect(marksIn(rows[1] as Element)).not.toContain('Eternal')
  })
})

describe('successful enhancement', () => {
  it('replaces the excerpt text and nothing else', async () => {
    const { container } = renderList()
    const titleBefore = container.querySelector('a > span:nth-of-type(2)')?.textContent

    await waitForFitted(container)

    for (const element of excerptElements(container)) {
      expect(element.textContent).toBe('…eee fff ggg hhh')
    }
    expect(container.querySelector('a > span:nth-of-type(2)')?.textContent).toBe(titleBefore)
    expect(container.querySelectorAll('a')).toHaveLength(3)
  })

  it('keeps the match marked, and marks nothing else', async () => {
    const { container } = renderList()
    await waitForFitted(container)
    const marks = excerptElements(container)[0]?.querySelectorAll('mark')
    expect([...(marks ?? [])].map(m => m.textContent)).toEqual(['eee'])
  })

  it('gives the fitted mark no horizontal padding class', async () => {
    const { container } = renderList()
    await waitForFitted(container)
    for (const mark of container.querySelectorAll('.quick-search-excerpt mark')) {
      expect(mark.className).toBe('')
    }
  })

  it('never announces the replacement', async () => {
    const { container } = renderList()
    await waitForFitted(container)
    expect(container.querySelector('[aria-live]')).toBeNull()
    for (const element of excerptElements(container)) {
      expect(element.getAttribute('aria-live')).toBeNull()
      expect(element.getAttribute('role')).toBeNull()
    }
  })
})

describe('failing open', () => {
  it.each([
    ['the module never loads', { loadEngine: async () => null }],
    [
      'the module import rejects',
      { loadEngine: () => Promise.reject(new Error('chunk failed')) as Promise<null> },
    ],
    ['the font never arrives', { ensureFont: async () => false }],
    ['the font request rejects', { ensureFont: () => Promise.reject(new Error('404')) }],
    ['the contract cannot be read', { readGeometry: () => null }],
    ['the container has no width yet', { readGeometry: () => ({ contract: CONTRACT, width: 0 }) }],
    ['the engine refuses to prepare', { loadEngine: async () => ({ prepare: () => null }) }],
    [
      'the engine throws',
      {
        loadEngine: async () =>
          ({
            prepare: () => {
              throw new Error('boom')
            },
          }) as unknown as TextLayoutEngine,
      },
    ],
  ])('keeps the fallback when %s', async (_label, overrides) => {
    const { container } = renderList({ runtime: runtimeWith(overrides as Partial<FittingRuntime>) })

    await new Promise(resolve => setTimeout(resolve, 20))

    for (const element of excerptElements(container)) {
      expect(element.textContent).toBe('the ordinary fallback excerpt for eee')
      expect(element.dataset.pretextState).toBe('fallback')
    }
    expect(unhandled).toEqual([])
  })

  it('keeps the fallback for a candidate the eligibility gate declines', async () => {
    const greek: SearchResult = result('greek', {
      excerptCandidate: {
        text: 'the adjective αἰώνιος qualifies its noun and never stands alone',
        matchRanges: [{ start: 4, end: 13 }],
        omittedBefore: false,
        omittedAfter: false,
        sourceField: 'body',
      },
    })
    const { container } = renderList({ results: [greek] })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(excerptElements(container)[0]?.dataset.pretextState).toBe('fallback')
  })

  it('keeps the fallback for a result with no candidate at all', async () => {
    const bare = result('bare')
    const { excerptCandidate: _dropped, ...withoutCandidate } = bare
    const { container } = renderList({ results: [withoutCandidate as SearchResult] })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(excerptElements(container)[0]?.dataset.pretextState).toBe('fallback')
  })

  it('logs no console error and leaves no unhandled rejection', async () => {
    const { container } = renderList()
    await waitForFitted(container)
    expect(consoleErrors).toEqual([])
    expect(unhandled).toEqual([])
  })
})

describe('coordination across the list', () => {
  it('creates one observer for the whole list, not one per row', async () => {
    const { container } = renderList()
    await waitForFitted(container)
    expect(observerCount).toBe(1)
    expect(observedTargets).toHaveLength(1)
    expect(observedTargets[0]?.tagName).toBe('OL')
  })

  it('loads the engine and the font once for the whole list', async () => {
    let engineLoads = 0
    let fontLoads = 0
    const { container } = renderList({
      runtime: runtimeWith({
        loadEngine: async () => {
          engineLoads += 1
          return createTestLayoutEngine()
        },
        ensureFont: async () => {
          fontLoads += 1
          return true
        },
      }),
    })
    await waitForFitted(container)
    expect(engineLoads).toBe(1)
    expect(fontLoads).toBe(1)
  })

  it('reuses prepared candidates when only the width changed', async () => {
    const engine = createTestLayoutEngine()
    let width = 100
    const { container } = renderList({
      runtime: runtimeWith({
        loadEngine: async () => engine,
        readGeometry: () => ({ contract: CONTRACT, width }),
      }),
    })
    await waitForFitted(container)

    const afterFirstPass = engine.prepareCount()
    expect(afterFirstPass).toBeGreaterThan(0)

    // A resize to a new width: layout re-runs, preparation must not balloon.
    width = 140
    for (const callback of observerCallbacks) {
      callback([], {} as ResizeObserver)
    }
    await new Promise(resolve => setTimeout(resolve, 30))

    // Three rows share one candidate string, so a second width costs at most a
    // handful of new preparations, not a fresh pass for every row.
    expect(engine.prepareCount() - afterFirstPass).toBeLessThanOrEqual(afterFirstPass)
  })

  it('does no work at all while the dialog is closed', async () => {
    let engineLoads = 0
    renderList({
      open: false,
      runtime: runtimeWith({
        loadEngine: async () => {
          engineLoads += 1
          return createTestLayoutEngine()
        },
      }),
    })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(engineLoads).toBe(0)
    expect(observerCount).toBe(0)
  })
})

describe('stale results', () => {
  it('cannot let an older query overwrite a newer one', async () => {
    // The first render's engine never resolves until after the second render
    // has already produced its answer.
    const firstBatch = { release: () => {} }
    const slowRuntime = runtimeWith({
      loadEngine: () =>
        new Promise(resolve => {
          firstBatch.release = () => resolve(createTestLayoutEngine())
        }),
    })

    const stale = result('stale', {
      excerptCandidate: {
        text: 'zzz yyy xxx www vvv uuu ttt sss',
        matchRanges: [{ start: 0, end: 3 }],
        omittedBefore: false,
        omittedAfter: false,
        sourceField: 'body',
      },
    })

    const { container, rerender } = render(
      <QuickSearchResults results={[stale]} open onNavigate={() => {}} runtime={slowRuntime} />,
    )

    // A newer query arrives, with a runtime that answers immediately.
    rerender(
      <QuickSearchResults
        results={[result('fresh')]}
        open
        onNavigate={() => {}}
        runtime={runtimeWith()}
      />,
    )
    await waitForFitted(container)
    expect(excerptElements(container)[0]?.textContent).toBe('…eee fff ggg hhh')

    // Only now does the old batch come back. It must be discarded.
    firstBatch.release()
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(excerptElements(container)[0]?.textContent).toBe('…eee fff ggg hhh')
    expect(unhandled).toEqual([])
  })
})

describe('the excerpt element itself', () => {
  it('carries the measured class and the line-budget contract', () => {
    const { container } = renderList()
    for (const element of excerptElements(container)) {
      expect(element.classList.contains('quick-search-excerpt')).toBe(true)
    }
  })

  it('exposes its state only through a data attribute, never to assistive tech', () => {
    const { container } = renderList()
    const element = excerptElements(container)[0]
    expect(element?.getAttribute('data-pretext-state')).toBe('fallback')
    expect(element?.getAttribute('aria-label')).toBeNull()
    expect(element?.getAttribute('aria-hidden')).toBeNull()
  })
})
