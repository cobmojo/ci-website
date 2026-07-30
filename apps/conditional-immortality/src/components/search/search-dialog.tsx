'use client'

import { type SearchIndex, search } from '@ci/search'
import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { QuickSearchResults } from '@/components/search/quick-search-results'
import { loadTextLayoutEngine } from '@/lib/text-layout/pretext-client'

/**
 * Site search, as a dialog.
 *
 * The trigger is a real link to `/search/`. With scripting disabled it simply
 * navigates there, where a server-rendered form does the same job. With
 * scripting available the link opens a dialog instead, and the index is
 * fetched lazily on first open so pages that are never searched pay nothing.
 *
 * Searching runs entirely in the browser. No query is ever sent to a server.
 *
 * The text-layout runtime that fits excerpts follows the same rule as the
 * index: nothing is fetched until a reader shows an interest in searching, and
 * neither fetch is ever waited on before results appear.
 */
export function SearchDialogTrigger() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogId = useId()
  const statusId = useId()

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => setMounted(true), [])

  const loadIndex = useCallback(async () => {
    if (index || loading) return
    setLoading(true)
    try {
      const response = await fetch('/search-index.json')
      if (response.ok) setIndex((await response.json()) as SearchIndex)
    } finally {
      setLoading(false)
    }
  }, [index, loading])

  /**
   * Search intent: hovering or focusing the trigger.
   *
   * Both fetches are started and neither is awaited. `loadTextLayoutEngine`
   * caches its own promise and swallows its own failures, so calling it on
   * every pointer pass costs one request in total and can never reject.
   */
  const prewarm = useCallback(() => {
    void loadIndex()
    void loadTextLayoutEngine()
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
   * Keyboard shortcut. Deliberately requires a modifier, so it cannot swallow
   * a plain keystroke a screen reader or voice control user is typing, and it
   * is ignored while focus is in any text field.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      if (dialogRef.current?.open) closeDialog()
      else openDialog()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openDialog, closeDialog])

  const outcome = useMemo(() => {
    if (!index || query.trim().length < 2) return null
    // Candidates are requested here and nowhere else: the server-rendered
    // search page has no fitter to feed and does not pay for them.
    return search(index.docs, query, { limit: 12, includeExcerptCandidate: true })
  }, [index, query])

  return (
    <>
      <a
        ref={triggerRef}
        href="/search/"
        aria-haspopup={mounted ? 'dialog' : undefined}
        aria-controls={mounted ? dialogId : undefined}
        className="search-trigger inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[0.88rem] text-ink-muted no-underline hover:border-navy hover:text-navy"
        onPointerEnter={() => {
          if (mounted) prewarm()
        }}
        onFocus={() => {
          if (mounted) prewarm()
        }}
        onClick={event => {
          if (!mounted) return
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
          onClick={event => {
            if (event.target === dialogRef.current) closeDialog()
          }}
          className="m-0 mx-auto mt-[6vh] w-[min(42rem,calc(100vw-2rem))] max-w-none rounded-lg border border-border bg-paper p-0 backdrop:bg-ink/40"
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
              placeholder="Search passages, sections, topics, sources"
              autoComplete="off"
              className="min-h-11 w-full rounded-md border border-border bg-paper-raised px-3 font-sans text-[1rem] text-ink"
            />
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md font-sans text-ink-muted hover:bg-panel"
            >
              <span className="sr-only">Close search</span>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path
                  d="M3.5 3.5l9 9M12.5 3.5l-9 9"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </button>
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
                  ? `${outcome.total} results for ${query}.`
                  : ''}
            </p>

            {!index && loading ? (
              <p className="py-4 font-sans text-[0.92rem] text-ink-subtle">Loading search…</p>
            ) : null}

            {outcome && outcome.results.length > 0 ? (
              <QuickSearchResults
                results={outcome.results}
                terms={outcome.results[0]?.matchedTerms ?? []}
                open={open}
                onNavigate={closeDialog}
              />
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

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 font-sans text-[0.82rem] text-ink-subtle">
            <span>
              {outcome && outcome.total > outcome.results.length
                ? `Showing ${outcome.results.length} of ${outcome.total}`
                : 'Search runs locally in your browser'}
            </span>
            <Link
              href={query ? `/search/?q=${encodeURIComponent(query)}` : '/search/'}
              onClick={closeDialog}
            >
              Full search page
            </Link>
          </div>
        </dialog>
      ) : null}
    </>
  )
}
