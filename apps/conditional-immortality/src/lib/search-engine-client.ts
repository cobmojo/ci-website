/**
 * The search engine, fetched on search intent rather than on every page load.
 *
 * `search` reaches the query parser, the excerpt builder, the matcher, the
 * synonym table and — through `parseReference` — the whole book-and-alias table
 * of `@ci/content-schema/bible`. None of it can do anything until the 610 kB
 * index has arrived, and that is already fetched lazily, so carrying it in the
 * chunk every one of the site's routes loads bought nothing.
 *
 * Started by the same `prewarm` that starts the index, so it is in flight long
 * before the fetch it depends on has settled. Hovering the trigger repeatedly
 * costs one request, and a load that fails resolves to `null` rather than
 * rejecting, so it can never surface as an unhandled rejection.
 *
 * The *success* is cached; the failure is not. `loadTextLayoutEngine` caches
 * both, and it is right to: an excerpt that is never fitted is still an
 * excerpt, so retrying buys nothing. Search cannot run without this one. The
 * pane tells a reader whose load failed to reopen search and try again, and
 * `loadIndex` releases its own guard so they can — holding a resolved `null`
 * here would make that promise a lie for the rest of the session, and the only
 * way back would be reloading the page.
 */
export type SearchFn = typeof import('@ci/search').search

let enginePromise: Promise<SearchFn | null> | null = null

export function loadSearchEngine(): Promise<SearchFn | null> {
  enginePromise ??= import('@ci/search')
    .then(module => module.search)
    .catch(() => {
      // Cleared before the `null` is handed back, so the next call — which can
      // only come from a reader asking again — starts a fresh import.
      enginePromise = null
      return null
    })
  return enginePromise
}
