'use client'

import { buttonVariants } from '@ci/ui'
import { useEffect, useId, useState } from 'react'

/**
 * Progressive enhancement for the Scripture index.
 *
 * The index itself is server rendered in full and is never touched by this
 * component. Filtering works by injecting a stylesheet that hides rows which do
 * not match, so with scripting disabled the controls never appear and the whole
 * index remains on the page. Clearing the filter restores everything, because
 * nothing was ever removed.
 */

/** Everything a reader could reasonably type into a reference box, and nothing else. */
function sanitiseQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:.\- ]/g, '')
    .trim()
}

export function ScriptureFilter({ books, total }: { books: readonly string[]; total: number }) {
  const [mounted, setMounted] = useState(false)
  const [book, setBook] = useState('')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(total)

  const bookFieldId = useId()
  const queryFieldId = useId()

  useEffect(() => setMounted(true), [])

  const safeBook = books.includes(book) ? book : ''
  const safeQuery = sanitiseQuery(query)

  const bookSelector = safeBook ? `[data-book="${safeBook}"]` : ''
  const querySelector = safeQuery ? `[data-search*="${safeQuery}"]` : ''
  const active = Boolean(bookSelector || querySelector)

  const rules: string[] = []
  if (bookSelector) rules.push(`[data-scripture-row]:not(${bookSelector}){display:none}`)
  if (querySelector) rules.push(`[data-scripture-row]:not(${querySelector}){display:none}`)
  if (active) {
    rules.push(
      `[data-book-group]:not(:has([data-scripture-row]${bookSelector}${querySelector})){display:none}`,
    )
  }
  const css = rules.join('')

  /** Read-only measurement of the server-rendered rows, for the status line. */
  useEffect(() => {
    if (!active) {
      setShown(total)
      return
    }
    const selector = `[data-scripture-row]${bookSelector}${querySelector}`
    try {
      setShown(document.querySelectorAll(selector).length)
    } catch {
      setShown(total)
    }
  }, [active, bookSelector, querySelector, total])

  if (!mounted) return null

  return (
    <section
      aria-labelledby="scripture-filter-title"
      // Fades in on mount rather than popping: these controls only exist once
      // scripting has run. The status line below is deliberately not animated —
      // it changes on every keystroke.
      className="mount-reveal mt-8 rounded-md border border-border bg-paper-raised p-4 print:hidden"
    >
      {css ? <style>{css}</style> : null}

      <h2
        id="scripture-filter-title"
        className="mt-0 mb-3 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase"
      >
        Narrow the index
      </h2>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <label
            htmlFor={bookFieldId}
            className="mb-1 block font-sans text-[0.85rem] text-ink-muted"
          >
            Book
          </label>
          <select
            id={bookFieldId}
            value={book}
            onChange={event => setBook(event.target.value)}
            className="min-h-11 w-full max-w-[16rem] rounded-md border border-border bg-paper px-3 font-sans text-[1rem] text-ink"
          >
            <option value="">Every book</option>
            {books.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor={queryFieldId}
            className="mb-1 block font-sans text-[0.85rem] text-ink-muted"
          >
            Reference contains
          </label>
          <input
            id={queryFieldId}
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            autoComplete="off"
            placeholder="For example, Matthew 10"
            className="min-h-11 w-full max-w-[18rem] rounded-md border border-border bg-paper px-3 font-sans text-[1rem] text-ink"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setBook('')
            setQuery('')
          }}
          className={buttonVariants({ variant: 'secondary' })}
        >
          Show every reference
        </button>
      </div>

      <p
        aria-live="polite"
        className="m-0 mt-3 font-sans text-[0.88rem] text-ink-subtle tabular-nums"
      >
        {active
          ? `Showing ${shown} of ${total} references.`
          : `Showing all ${total} references. Filtering only hides rows; nothing is removed from the page.`}
      </p>
    </section>
  )
}
