'use client'

import { Button } from '@ci/ui'
import { useCallback, useEffect, useState } from 'react'

/**
 * Optional reading progress for the case index.
 *
 * The permanent section ids a reader has opened from this page are kept in one
 * `localStorage` key. Nothing is sent anywhere, nothing is required, and the
 * component renders nothing at all until it has mounted, so the server HTML and
 * the first client render agree and a reader without JavaScript simply never
 * sees it.
 *
 * Visited entries are marked by injecting a stylesheet that reveals a marker
 * the server already rendered in each row. That keeps this component a leaf: it
 * never mutates nodes React owns elsewhere on the page.
 */

const STORAGE_KEY = 'ci:case-reading-progress'

/** Permanent ids only. Anything else in storage is discarded rather than trusted. */
const SECTION_ID_PATTERN = /^[A-Z]{1,3}[0-9]{1,2}$/

function readStoredIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (value): value is string => typeof value === 'string' && SECTION_ID_PATTERN.test(value),
    )
  } catch {
    // Storage may be unavailable, disabled or hold something unparseable.
    return []
  }
}

function writeStoredIds(ids: readonly string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Progress is a convenience. Losing it must never interrupt reading.
  }
}

export function ReadingProgress({ total }: { total: number }) {
  const [mounted, setMounted] = useState(false)
  const [visited, setVisited] = useState<readonly string[]>([])

  useEffect(() => {
    setVisited(readStoredIds())
    setMounted(true)
  }, [])

  /**
   * Recorded on the way out. A link on this page carries its permanent id, so
   * following it is what marks the part as opened.
   */
  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      const id = target.closest('a[data-section-id]')?.getAttribute('data-section-id')
      if (!id || !SECTION_ID_PATTERN.test(id)) return
      setVisited(current => {
        if (current.includes(id)) return current
        const next = [...current, id]
        writeStoredIds(next)
        return next
      })
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [])

  const reset = useCallback(() => {
    setVisited([])
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to do: the list is already cleared in memory.
    }
  }, [])

  if (!mounted) return null

  const markerCss = visited
    .map(id => `[data-section-entry="${id}"] [data-visited-marker]{display:inline-flex}`)
    .join('')

  return (
    <section
      aria-labelledby="reading-progress-title"
      // This panel cannot exist until scripting has run, so it necessarily
      // arrives after first paint. `mount-reveal` fades it in over 180ms, which
      // turns a flash of new interface into an arrival. Opacity only, so it is
      // also the reduced-motion variant.
      className="mount-reveal mt-10 rounded-md border border-border bg-paper-raised p-5 print:hidden"
    >
      {markerCss ? <style>{markerCss}</style> : null}

      <h2 id="reading-progress-title" className="mt-0 mb-2 text-[1.12rem]">
        Your reading progress
      </h2>

      <p aria-live="polite" className="m-0 text-[1rem] text-ink-muted">
        {visited.length === 0
          ? `No parts opened yet. Parts you open from this list are marked here, out of ${total}.`
          : `You have opened ${visited.length} of ${total} parts from this list. Each one is marked as Opened below.`}
      </p>

      <p className="m-0 mt-2 font-sans text-[0.88rem] text-ink-subtle">
        This is stored in this browser alone and is never sent anywhere. It records nothing beyond
        the permanent id of each part, and clearing it changes nothing else about the site.
      </p>

      <Button variant="secondary" size="sm" onClick={reset} className="mt-4 min-h-11">
        Reset reading progress
      </Button>
    </section>
  )
}
