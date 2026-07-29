'use client'

import {
  highlightSegments,
  MATCH_FIELD_LABELS,
  SEARCH_DOC_TYPE_LABELS,
  type SearchIndex,
  search,
} from '@ci/search'
import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

/**
 * Site search, as a dialog.
 *
 * The trigger is a real link to `/search/`. With scripting disabled it simply
 * navigates there, where a server-rendered form does the same job. With
 * scripting available the link opens a dialog instead, and the index is
 * fetched lazily on first open so pages that are never searched pay nothing.
 *
 * Searching runs entirely in the browser. No query is ever sent to a server.
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

  const openDialog = useCallback(() => {
    void loadIndex()
    dialogRef.current?.showModal()
    setOpen(true)
    // Focus the field after the dialog is painted.
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [loadIndex])

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
    return search(index.docs, query, { limit: 12 })
  }, [index, query])

  return (
    <>
      <a
        ref={triggerRef}
        href="/search/"
        aria-haspopup={mounted ? 'dialog' : undefined}
        aria-controls={mounted ? dialogId : undefined}
        className="search-trigger inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[0.88rem] text-ink-muted no-underline hover:border-navy hover:text-navy"
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
              <ol className="m-0 list-none p-0">
                {outcome.results.map(result => (
                  <li key={result.doc.id} className="border-b border-border py-2.5 last:border-0">
                    <Link
                      href={result.doc.route}
                      onClick={closeDialog}
                      className="block rounded px-1 no-underline hover:bg-panel"
                    >
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-sans text-[0.74rem] tracking-wide text-ink-subtle uppercase">
                          {SEARCH_DOC_TYPE_LABELS[result.doc.type]}
                        </span>
                        {result.doc.sectionId ? (
                          <span className="font-sans text-[0.74rem] text-copper-deep">
                            {result.doc.sectionId}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block font-sans text-[0.98rem] font-medium text-navy">
                        {result.doc.title}
                      </span>
                      <span className="mt-0.5 block text-[0.9rem] leading-snug text-ink-muted">
                        {highlightSegments(result.excerpt, result.matchedTerms).map((segment, i) =>
                          segment.matched ? (
                            // biome-ignore lint/suspicious/noArrayIndexKey: positional by construction
                            <mark key={i} className="rounded-sm bg-ochre-soft px-0.5 text-ink">
                              {segment.text}
                            </mark>
                          ) : (
                            // biome-ignore lint/suspicious/noArrayIndexKey: positional by construction
                            <span key={i}>{segment.text}</span>
                          ),
                        )}
                      </span>
                      <span className="mt-0.5 block font-sans text-[0.76rem] text-ink-subtle">
                        Matched in{' '}
                        {result.matchedFields
                          .slice(0, 2)
                          .map(field => MATCH_FIELD_LABELS[field])
                          .join(', ')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
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

      {open ? null : null}
    </>
  )
}
