/**
 * The search engine, fetched on search intent rather than on every page load.
 *
 * `search` reaches the query parser, the excerpt builder, the matcher, the
 * synonym table and — through `parseReference` — the whole book-and-alias table
 * of `@ci/content-schema/bible`. None of it can do anything until the 610 kB
 * index has arrived, and that is already fetched lazily, so carrying it in the
 * chunk every one of the site's routes loads bought nothing.
 *
 * Started by the same `prewarm` that starts the index and the text-layout
 * runtime, so it is in flight long before the fetch it depends on has settled.
 * The promise is cached and its failure is cached as `null`, exactly as
 * `loadTextLayoutEngine` does: hovering the trigger repeatedly costs one
 * request, and a load that fails can never reject into an unhandled rejection.
 */
export type SearchFn = typeof import('@ci/search').search

let enginePromise: Promise<SearchFn | null> | null = null

export function loadSearchEngine(): Promise<SearchFn | null> {
  enginePromise ??= import('@ci/search').then(module => module.search).catch(() => null)
  return enginePromise
}
