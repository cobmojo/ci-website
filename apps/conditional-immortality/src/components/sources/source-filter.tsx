'use client'

import { buttonVariants } from '@ci/ui'
import { useEffect, useId, useState } from 'react'

/**
 * Progressive enhancement for the source library.
 *
 * The library is server rendered in full. This component adds two selects that
 * hide non-matching entries by injecting a stylesheet, and it renders nothing
 * before it has mounted, so a reader without JavaScript gets the complete list
 * and no controls that do nothing.
 */

export interface FilterOption {
  readonly value: string
  readonly label: string
}

/** Values come from our own option lists, but they are still checked before use. */
function isSafeValue(value: string): boolean {
  return /^[a-z0-9-]+$/.test(value)
}

export function SourceFilter({
  types,
  perspectives,
  total,
}: {
  types: readonly FilterOption[]
  perspectives: readonly FilterOption[]
  total: number
}) {
  const [mounted, setMounted] = useState(false)
  const [type, setType] = useState('')
  const [perspective, setPerspective] = useState('')
  const [shown, setShown] = useState(total)

  const typeFieldId = useId()
  const perspectiveFieldId = useId()

  useEffect(() => setMounted(true), [])

  const safeType = types.some(option => option.value === type) && isSafeValue(type) ? type : ''
  const safePerspective =
    perspectives.some(option => option.value === perspective) && isSafeValue(perspective)
      ? perspective
      : ''

  const typeSelector = safeType ? `[data-source-type="${safeType}"]` : ''
  const perspectiveSelector = safePerspective
    ? `[data-source-perspective="${safePerspective}"]`
    : ''
  const active = Boolean(typeSelector || perspectiveSelector)

  const rules: string[] = []
  if (typeSelector) rules.push(`[data-source-entry]:not(${typeSelector}){display:none}`)
  if (perspectiveSelector) {
    rules.push(`[data-source-entry]:not(${perspectiveSelector}){display:none}`)
  }
  const css = rules.join('')

  useEffect(() => {
    if (!active) {
      setShown(total)
      return
    }
    const selector = `[data-source-entry]${typeSelector}${perspectiveSelector}`
    try {
      setShown(document.querySelectorAll(selector).length)
    } catch {
      setShown(total)
    }
  }, [active, typeSelector, perspectiveSelector, total])

  if (!mounted) return null

  return (
    <section
      aria-labelledby="source-filter-title"
      // Fades in on mount, for the same reason as the Scripture index filter.
      className="mount-reveal mt-8 rounded-md border border-border bg-paper-raised p-4 print:hidden"
    >
      {css ? <style>{css}</style> : null}

      <h2
        id="source-filter-title"
        className="mt-0 mb-3 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase"
      >
        Narrow the library
      </h2>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0">
          <label
            htmlFor={typeFieldId}
            className="mb-1 block font-sans text-[0.85rem] text-ink-muted"
          >
            Kind of source
          </label>
          <select
            id={typeFieldId}
            value={type}
            onChange={event => setType(event.target.value)}
            className="min-h-11 w-full max-w-[18rem] rounded-md border border-border-control bg-paper px-3 font-sans text-[1rem] text-ink"
          >
            <option value="">Every kind</option>
            {types.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor={perspectiveFieldId}
            className="mb-1 block font-sans text-[0.85rem] text-ink-muted"
          >
            Perspective
          </label>
          <select
            id={perspectiveFieldId}
            value={perspective}
            onChange={event => setPerspective(event.target.value)}
            className="min-h-11 w-full max-w-[18rem] rounded-md border border-border-control bg-paper px-3 font-sans text-[1rem] text-ink"
          >
            <option value="">Every perspective</option>
            {perspectives.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setType('')
            setPerspective('')
          }}
          className={buttonVariants({ variant: 'secondary' })}
        >
          Show every source
        </button>
      </div>

      <p
        aria-live="polite"
        className="m-0 mt-3 font-sans text-[0.88rem] text-ink-subtle tabular-nums"
      >
        {active
          ? `Showing ${shown} of ${total} sources.`
          : `Showing all ${total} sources. Filtering only hides entries; nothing is removed from the page.`}
      </p>
    </section>
  )
}
