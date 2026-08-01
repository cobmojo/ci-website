import { afterEach, expect, test, vi } from 'vitest'

/**
 * The engine loader, and the one thing about it that is not obvious.
 *
 * A cached promise is the right shape for a module every pointer pass asks
 * for. A cached *failure* is not, because search cannot run without this and
 * the pane tells the reader to reopen and try again. These pin the difference:
 * a success is fetched once however often it is asked for, and a failure is
 * retried the next time somebody asks.
 */

afterEach(() => {
  vi.resetModules()
  vi.doUnmock('@ci/search')
})

test('the engine is fetched once, however many times search intent arrives', async () => {
  let imports = 0
  vi.doMock('@ci/search', () => {
    imports += 1
    return { search: () => ({ results: [], total: 0 }) }
  })

  const { loadSearchEngine } = await import('../search-engine-client')

  const [first, second, third] = await Promise.all([
    loadSearchEngine(),
    loadSearchEngine(),
    loadSearchEngine(),
  ])

  expect(first).not.toBeNull()
  expect(second).toBe(first)
  expect(third).toBe(first)
  expect(imports, 'three prewarms fetched the engine more than once').toBe(1)
})

test('a failed engine load is retried rather than remembered', async () => {
  let imports = 0
  vi.doMock('@ci/search', () => {
    imports += 1
    // The first attempt is a dropped chunk; the reader reopens search and the
    // second succeeds. Caching the first would leave search broken until the
    // page was reloaded, while the pane went on promising otherwise.
    if (imports === 1) throw new Error('chunk load failed')
    return { search: () => ({ results: [], total: 0 }) }
  })

  const { loadSearchEngine } = await import('../search-engine-client')

  expect(await loadSearchEngine(), 'a dropped chunk must resolve, not reject').toBeNull()
  expect(await loadSearchEngine(), 'the retry was answered from the cached failure').not.toBeNull()
  expect(imports).toBe(2)
})
