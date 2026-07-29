import type { SearchIndex } from '@ci/search'
import { buildSearchIndex } from '@ci/search/build'

/**
 * The search index, built once per process.
 *
 * Server components read it directly. The client dialog fetches the same data
 * as a static JSON asset the first time it is opened, so the index costs
 * nothing on pages where the reader never searches.
 */
let cached: SearchIndex | null = null

export function searchIndex(): SearchIndex {
  if (!cached) cached = buildSearchIndex()
  return cached
}
