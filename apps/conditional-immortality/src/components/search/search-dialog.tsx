'use client'

import type { SearchIndex } from '@ci/search'
import { usePathname } from 'next/navigation'
import {
  lazy,
  type MouseEvent,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DialogCloseButton } from '@/components/navigation/dialog-close-button'
import { Link } from '@/components/navigation/link'
import { pluralise } from '@/lib/format'
import { isModifiedClick } from '@/lib/modified-click'
import { loadSearchEngine, type SearchFn } from '@/lib/search-engine-client'

/**
 * The result list, and everything it reaches — the label tables, the excerpt
 * fitter, the text-layout contract — on the same terms as the engine and the
 * index: fetched when a reader shows an interest in searching, never on a page
 * load. `importResults` is called directly from `prewarm` as well, because
 * `lazy` alone would not start the request until the first result was already
 * waiting to be drawn.
 */
const importResults = () => import('@/components/search/quick-search-results')
const QuickSearchResults = lazy(() =>
  importResults().then(module => ({ default: module.QuickSearchResults })),
)

/**
 * The text-layout runtime's *loader*, deferred along with everything else.
 *
 * `loadTextLayoutEngine` already fetched the engine itself lazily, but the
 * module holding it — the font contract, the prepared-text cache and the
 * loader — was reached by a static import from here, which put 3,586 bytes of
 * it in the chunk every route loads. Its only caller on that path is `prewarm`
 * below; the excerpt fitter reaches it again from inside the result list, which
 * is already lazy, so nothing waits on this that was not already waiting.
 *
 * Failures are swallowed here as well as inside `loadTextLayoutEngine`, because
 * the chunk fetch is now part of what can fail, and this is called without
 * being awaited.
 */
const startTextLayoutEngine = () =>
  import('@/lib/text-layout/pretext-client')
    .then(module => module.loadTextLayoutEngine())
    .catch(() => null)

/**
 * Site search, as a dialog.
 *
 * The trigger is a real link to `/search/`. With scripting disabled it simply
 * navigates there, where a server-rendered form does the same job. With
 * scripting available the link opens a dialog instead, and the index, the
 * engine and the result list are all fetched lazily on first sign of search
 * intent, so pages that are never searched pay nothing for any of them.
 *
 * Searching in this panel runs entirely in the browser: the index is a static
 * file and what a reader types here is never transmitted. The `/search/` page
 * it falls back to is server-rendered, so a term reaching that page travels in
 * the URL — `/privacy/` states the distinction.
 *
 * The text-layout runtime that fits excerpts is fetched on the same trigger and
 * is never waited on: an excerpt appears unfitted and is refined in place. The
 * engine is the one exception, awaited beside the index because there is
 * nothing to draw without it, and it is a fraction of the index's size.
 */
export function SearchDialogTrigger() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogId = useId()
  const statusId = useId()
  const backdropPressRef = useRef(false)

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [engine, setEngine] = useState<SearchFn | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const pathname = usePathname()

  /** Set the moment a load begins, where `loading` state lags by a render. */
  const loadStarted = useRef(false)

  useEffect(() => setMounted(true), [])

  const loadIndex = useCallback(async () => {
    // A ref, not the `loading` state: two prewarm calls can arrive inside one
    // gesture — `pointerenter` then the anchor's `focus`, 8ms apart on a tap —
    // and React has not committed the state between them, so both passed the
    // guard and the 610kB index was fetched twice. Every touch tap and every
    // Ctrl+K paid it.
    if (index || loadStarted.current) return
    loadStarted.current = true
    setLoading(true)
    setFailed(false)
    try {
      /*
       * The engine is fetched beside the index rather than after it, and the
       * index is only published once both have arrived. That keeps `loading`
       * and `failed` describing the whole of "search is not usable yet", so
       * every state this pane can show still turns on `index` alone — there is
       * no window where the index is present, the engine is not, and the pane
       * has nothing to say. The engine is a fraction of the index's 610 kB and
       * has been in flight since the first sign of search intent, so waiting
       * for it costs nothing measurable.
       */
      const [response, loaded] = await Promise.all([
        fetch('/search-index.json'),
        loadSearchEngine(),
        /*
         * The result list is awaited here too, and for a sharper reason than
         * tidiness: `lazy` throws to the nearest error boundary if its import
         * rejects, and the nearest one here is the route's, so a dropped chunk
         * would replace the page with the error document rather than the
         * "search could not load" line three lines below. Awaiting it means a
         * failure lands in the same `catch` as the other two, and by the time
         * anything renders `QuickSearchResults` the module is already resolved.
         */
        importResults(),
      ])
      if (!response.ok) throw new Error(`search index ${response.status}`)
      if (!loaded) throw new Error('search engine')
      // Wrapped: `setEngine(fn)` would run `fn` as a state updater.
      setEngine(() => loaded)
      setIndex((await response.json()) as SearchIndex)
    } catch {
      // A dropped connection must not surface as an unhandled rejection and a
      // silently blank pane. The failure line below names the recovery path,
      // and the next open or keystroke of search intent retries — which needs
      // the guard released, or one dropped request ends search for the whole
      // session while the pane tells the reader to reopen and try again.
      // Releasing here cannot bring the double fetch back: the two prewarm
      // calls arrive about 8ms apart while the request is still in flight, and
      // this runs only once it has settled.
      loadStarted.current = false
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [index])

  /**
   * Search intent: hovering or focusing the trigger.
   *
   * Everything search needs is started here and nothing is awaited.
   * `loadIndex` owns the index, the engine and the result list, and reports
   * their failure as one. `startTextLayoutEngine` is the one that is genuinely
   * fire-and-forget: an excerpt appears unfitted and is refined in place, so
   * nothing is ever waiting on it. Both cache their promise and swallow their
   * own failures, so a reader sweeping the pointer across the trigger costs one
   * set of requests in total and neither call can reject.
   */
  const prewarm = useCallback(() => {
    void loadIndex()
    void startTextLayoutEngine()
  }, [loadIndex])

  const openDialog = useCallback(() => {
    // Opening always starts the loads, whether or not prewarming happened.
    prewarm()
    dialogRef.current?.showModal()
    setOpen(true)
    // Focus the field after the dialog is painted.
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [prewarm])

  const closeDialog = useCallback(() => {
    dialogRef.current?.close()
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  /**
   * Following a link out of the dialog closes it, but a modified click is not
   * following anything: it opens a new tab and leaves this one where it was,
   * so the dialog, the query and the results have to survive it.
   */
  const onLinkClick = useCallback(
    (event: MouseEvent) => {
      if (!isModifiedClick(event)) closeDialog()
    },
    [closeDialog],
  )

  // Close on route change, exactly as the navigation sheet does: without this
  // the dialog survives browser Back and Forward and stays modally open over
  // the page the reader just navigated to.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reacting to pathname is the point
  useEffect(() => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
      setOpen(false)
    }
  }, [pathname])

  /**
   * Keyboard shortcut. Deliberately requires a modifier, so it cannot swallow
   * a plain keystroke a screen reader or voice control user is typing. While
   * the dialog is open it always toggles closed, because the dialog focuses
   * its own text field on open and the field must not eat the shortcut; while
   * it is closed, focus in any other text field suppresses it, and so does
   * any other open modal: opening search over the navigation sheet would
   * stack two modals and strand focus between them.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return
      if (dialogRef.current?.open) {
        event.preventDefault()
        closeDialog()
        return
      }
      if (document.querySelector('dialog[open]')) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      openDialog()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openDialog, closeDialog])

  const outcome = useMemo(() => {
    if (!index || !engine || query.trim().length < 2) return null
    // Candidates are requested here and nowhere else: the server-rendered
    // search page has no fitter to feed and does not pay for them.
    return engine(index.docs, query, {
      limit: 12,
      includeExcerptCandidate: true,
      // The rows show their excerpt in a fixed box, so the fallback has to put
      // its match where a reader can see it without waiting for a fit.
      compactExcerpt: true,
    })
  }, [index, engine, query])

  return (
    <>
      <a
        ref={triggerRef}
        href="/search/"
        aria-haspopup={mounted ? 'dialog' : undefined}
        aria-expanded={mounted ? open : undefined}
        aria-controls={mounted ? dialogId : undefined}
        className="search-trigger pressable inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[0.88rem] text-ink-muted no-underline hover:border-navy hover:text-navy"
        onPointerEnter={() => {
          if (mounted) prewarm()
        }}
        onFocus={() => {
          if (mounted) prewarm()
        }}
        onClick={event => {
          // A modified click is a request for the real link: open `/search/`
          // in a new tab or window rather than swallowing it into a dialog
          // the reader cannot put anywhere.
          if (!mounted || isModifiedClick(event)) return
          event.preventDefault()
          openDialog()
        }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" focusable="false">
          <circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        Search
      </a>

      {mounted ? (
        <dialog
          ref={dialogRef}
          id={dialogId}
          aria-labelledby={`${dialogId}-title`}
          onClose={() => {
            setOpen(false)
            triggerRef.current?.focus()
          }}
          onPointerDown={event => {
            // A click whose press and release land on different elements is
            // retargeted to their common ancestor, so either half of a drag
            // between the panel and the backdrop would otherwise read as a
            // backdrop click. Dismissal requires both ends on the backdrop.
            backdropPressRef.current = event.target === dialogRef.current
          }}
          onPointerUp={event => {
            if (event.target !== dialogRef.current) backdropPressRef.current = false
          }}
          onClick={event => {
            if (event.target === dialogRef.current && backdropPressRef.current) closeDialog()
          }}
          // `overlay-panel` carries the enter and exit, and the backdrop wash
          // that used to be a utility class here: the panel and its backdrop
          // have to share one duration and one curve to read as one object.
          className="overlay-panel m-0 mx-auto mt-[6vh] w-[min(42rem,calc(100vw-2rem))] max-w-none rounded-md border border-border bg-paper p-0"
        >
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <h2 id={`${dialogId}-title`} className="sr-only">
              Search this site
            </h2>
            <label htmlFor={`${dialogId}-input`} className="sr-only">
              Search terms
            </label>
            <input
              ref={inputRef}
              id={`${dialogId}-input`}
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              onFocus={prewarm}
              /**
               * Escape closes the dialog, as it does from anywhere else in it.
               *
               * A `type="search"` field consumes the first Escape to clear
               * itself, so a reader who had typed something lost the query and
               * kept the panel: two losses from one keypress, and a second
               * press needed to leave. With the field empty it closed on the
               * first press, so the control changed behaviour exactly when
               * there was something to lose.
               */
              onKeyDown={event => {
                if (event.key !== 'Escape') return
                event.preventDefault()
                closeDialog()
              }}
              placeholder="Search passages, sections, topics, sources"
              autoComplete="off"
              aria-describedby={statusId}
              className="min-h-11 w-full rounded-md border border-border-control bg-paper-raised px-3 font-sans text-[1rem] text-ink"
            />
            <DialogCloseButton label="Close search" onClick={closeDialog} />
          </div>

          <div className="max-h-[62vh] overflow-y-auto px-4 py-3">
            {/*
              Result counts are announced; excerpt fitting is not. Replacing an
              excerpt with a better-fitting substring says nothing new about the
              results, and announcing every one of them would turn a refinement
              into a stream of interruptions.
            */}
            <p id={statusId} aria-live="polite" className="sr-only">
              {loading
                ? 'Loading the search index.'
                : outcome
                  ? `${outcome.total} ${pluralise(outcome.total, 'result')} for ${query}.`
                  : ''}
            </p>

            {!index && loading ? (
              <p className="py-4 font-sans text-[0.92rem] text-ink-subtle">Loading search…</p>
            ) : null}

            {/*
              The failure is announced by being written into a region that is
              already in the accessibility tree, which is how the correction
              form reports its own results too. One channel, not two: the
              visible text is the announced text, so the recovery link inside
              it stays reachable by keyboard and readable in browse mode. An
              `aria-hidden` twin would have made that link a silent tab stop.
            */}
            <div aria-live="polite">
              {!index && !loading && failed ? (
                <p className="py-4 font-sans text-[0.92rem] text-ink-muted">
                  Search could not load, which usually means the connection dropped. Reopen search
                  to try again, or use the{' '}
                  <Link href="/search/" onClick={onLinkClick}>
                    full search page
                  </Link>
                  .
                </p>
              ) : null}
            </div>

            {outcome && outcome.results.length > 0 ? (
              /*
                The fallback is `null` and never shows: the list is only
                rendered once the index has resolved, and the index cannot
                resolve before this chunk, which was requested beside it and is
                a fraction of its size. Nothing already on screen is withheld
                by it.
              */
              <Suspense fallback={null}>
                <QuickSearchResults
                  results={outcome.results}
                  open={open}
                  onNavigate={onLinkClick}
                />
              </Suspense>
            ) : null}

            {outcome && outcome.results.length === 0 ? (
              <p className="py-4 text-[0.95rem] text-ink-muted">
                Nothing matched. Try a Scripture reference such as Matthew 10:28, a phrase such as
                unquenchable fire, or a section id such as S04.
              </p>
            ) : null}

            {index && query.trim().length < 2 ? (
              <p className="py-4 font-sans text-[0.9rem] text-ink-subtle">
                Type at least two characters. Searching happens in your browser, so nothing you type
                is sent anywhere.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-1 font-sans text-[0.82rem] text-ink-subtle">
            {/* Tabular figures: the count re-renders on every keystroke and
                proportional digits would make the line quiver. */}
            <span className="tabular-nums">
              {outcome && outcome.total > outcome.results.length
                ? `Showing ${outcome.results.length} of ${outcome.total}`
                : 'Search runs locally in your browser'}
            </span>
            <Link
              href={query ? `/search/?q=${encodeURIComponent(query)}` : '/search/'}
              onClick={onLinkClick}
              className="inline-flex min-h-11 items-center"
            >
              Full search page
            </Link>
          </div>
        </dialog>
      ) : null}
    </>
  )
}
