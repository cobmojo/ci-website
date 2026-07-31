'use client'

import type { SearchResult } from '@ci/search'
import { type RefObject, startTransition, useEffect, useRef, useState } from 'react'
import type { TextLayoutEngine } from './engine'
import {
  type FittedExcerpt,
  fitSearchExcerpt,
  MEASUREMENT_SAFETY_MARGIN,
} from './fit-search-excerpt'
import { type ExcerptGeometry, type FontContract, readExcerptGeometry } from './font-contract'
import { ensureMeasuredFont, loadTextLayoutEngine } from './pretext-client'
import { isEligibleExcerptText } from './supported-text'
import { engineAgreesWithBrowser } from './verify-engine'

/**
 * One coordinator for the whole result list.
 *
 * The alternative — every row loading the module, loading the font and
 * observing its own width — would mean twelve import promises, twelve font
 * requests and twelve `ResizeObserver`s competing to re-render the same list.
 * So all of it happens once, here, and rows receive finished results.
 *
 * The rules this enforces:
 *
 *  - The fallback excerpt is already on screen and stays there. Nothing below
 *    can blank it, and nothing below is awaited before it paints.
 *  - A resize re-runs layout, never preparation. `prepare()` is memoised by the
 *    client cache, so the second width costs arithmetic and nothing else.
 *  - A batch that started under an older query can never apply. Every batch
 *    carries a token, and a token that is no longer current is discarded at
 *    each await point rather than at the end.
 *  - State is only replaced when a fitted excerpt actually changed.
 */

/**
 * The pieces of the runtime a test can replace.
 *
 * All three need a real browser to mean anything — a font engine, a canvas, a
 * layout box — so all three are injectable. A component test replaces them and
 * asserts what React does with the answers; the browser suite exercises the
 * real ones against the real fonts.
 */
export interface FittingRuntime {
  loadEngine(locale: string): Promise<TextLayoutEngine | null>
  ensureFont(contract: FontContract, sampleText: string): Promise<boolean>
  readGeometry(element: HTMLElement, locale: string): ExcerptGeometry | null
  /** Does this engine actually agree with this browser? Checked once. */
  verifyEngine(engine: TextLayoutEngine, contract: FontContract): boolean
}

const DEFAULT_RUNTIME: FittingRuntime = {
  loadEngine: loadTextLayoutEngine,
  ensureFont: ensureMeasuredFont,
  readGeometry: readExcerptGeometry,
  verifyEngine: (engine, contract) =>
    engineAgreesWithBrowser(engine, contract, MEASUREMENT_SAFETY_MARGIN),
}

export interface UseFittedSearchExcerptsOptions {
  readonly results: readonly SearchResult[]
  /** The element wrapping the rows; also the resize container. */
  readonly containerRef: RefObject<HTMLElement | null>
  /** False while the dialog is closed, so nothing is measured off-screen. */
  readonly enabled: boolean
  readonly locale?: string
  readonly runtime?: FittingRuntime
}

export type FittedExcerpts = ReadonlyMap<string, FittedExcerpt>

const EMPTY: FittedExcerpts = new Map()
const NO_RESULTS: readonly SearchResult[] = []

/**
 * Fits, and the exact result set they were computed for.
 *
 * The pairing is the point. Fits are keyed by document id, and consecutive
 * queries routinely return the same document, so a bare map would happily hand
 * the previous query's excerpt — and its highlight — to the new query's row.
 * Carrying the identity alongside lets that be *derived* away on read instead
 * of corrected a task later by an effect, which is too late: an effect runs
 * after the commit that already painted it.
 */
interface FittedState {
  readonly forResults: readonly SearchResult[]
  readonly map: FittedExcerpts
}

/** The attribute the coordinator finds a representative excerpt element by. */
export const EXCERPT_PROBE_ATTRIBUTE = 'data-search-excerpt'

export function useFittedSearchExcerpts({
  results,
  containerRef,
  enabled,
  locale = 'en',
  runtime = DEFAULT_RUNTIME,
}: UseFittedSearchExcerptsOptions): FittedExcerpts {
  const [fitted, setFitted] = useState<FittedState>({ forResults: NO_RESULTS, map: EMPTY })

  /** Monotonic: only the newest batch may apply its results. */
  const tokenRef = useRef(0)
  const frameRef = useRef(0)
  const geometryRef = useRef<ExcerptGeometry | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!enabled || !container || results.length === 0) {
      tokenRef.current += 1
      geometryRef.current = null
      // Fitting stops, but what is already fitted stays on screen. Dropping
      // the map here would rewrite every excerpt back to its fallback text
      // while the panel is still painted through its exit fade, so the reader
      // would watch the words change as the dialog leaves. A later open
      // re-measures and replaces them anyway.
      if (results.length > 0) return
      setFitted(previous =>
        previous.map === EMPTY ? previous : { forResults: NO_RESULTS, map: EMPTY },
      )
      return
    }

    let cancelled = false

    /**
     * Measure the excerpt element the reader is actually looking at.
     *
     * A dedicated off-screen probe would be a second thing to keep in step with
     * the first; the rendered row is the ground truth by definition.
     */
    const readGeometry = (): ExcerptGeometry | null => {
      const probe = container.querySelector<HTMLElement>(`[${EXCERPT_PROBE_ATTRIBUTE}]`)
      return probe ? runtime.readGeometry(probe, locale) : null
    }

    /**
     * One batch.
     *
     * Wrapped whole in a `try`. The production runtime already swallows its own
     * failures, but this must hold even when it does not: a rejected chunk
     * request or an engine that throws mid-batch has to end as "the reader
     * keeps the fallback", never as an unhandled rejection in a page whose
     * search is otherwise working perfectly.
     */
    const run = async (geometry: ExcerptGeometry, token: number) => {
      try {
        // The font request should ask for the subset these rows actually use,
        // and the two loads are independent, so they go together.
        const sample = results
          .map(result => result.excerptCandidate?.text ?? '')
          .join(' ')
          .slice(0, 400)

        const [engine, fontReady] = await Promise.all([
          runtime.loadEngine(locale),
          runtime.ensureFont(geometry.contract, sample),
        ])
        if (cancelled || token !== tokenRef.current) return
        if (!engine || !fontReady) return
        // The last gate, and the only one that checks an answer rather than an
        // input: does this engine's prediction match what this browser did?
        if (!runtime.verifyEngine(engine, geometry.contract)) return

        const next = new Map<string, FittedExcerpt>()
        for (const result of results) {
          const candidate = result.excerptCandidate
          if (!candidate || candidate.matchRanges.length === 0) continue
          if (!isEligibleExcerptText(candidate.text)) continue
          const excerpt = fitSearchExcerpt(candidate, geometry.contract, geometry.width, engine)
          if (excerpt) next.set(result.doc.id, excerpt)
        }

        if (cancelled || token !== tokenRef.current) return
        // Replacing an excerpt is a refinement, never something the reader is
        // waiting on, so it goes in as a transition.
        startTransition(() => {
          setFitted(previous =>
            previous.forResults === results && sameFits(previous.map, next)
              ? previous
              : { forResults: results, map: next },
          )
        })
      } catch {
        // Nothing to report and nothing to retry: the fallback is already right.
      }
    }

    const schedule = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0
        const geometry = readGeometry()
        if (!geometry) return
        if (sameGeometry(geometryRef.current, geometry)) return
        geometryRef.current = geometry
        tokenRef.current += 1
        void run(geometry, tokenRef.current)
      })
    }

    /*
     * A new result set invalidates anything in flight. What is already applied
     * needs no invalidating here: the hook's return value is derived from the
     * result identity, so a map computed for the previous query is never
     * readable under this one. Resetting it in this effect would be a task too
     * late — the commit that rendered the new results has already painted.
     */
    tokenRef.current += 1
    geometryRef.current = null
    schedule()

    const observer =
      typeof ResizeObserver === 'function' ? new ResizeObserver(() => schedule()) : null
    observer?.observe(container)

    return () => {
      cancelled = true
      tokenRef.current += 1
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
      observer?.disconnect()
    }
  }, [results, containerRef, enabled, locale, runtime])

  // Fits belong to the result set they were measured for, and to no other.
  return fitted.forResults === results ? fitted.map : EMPTY
}

function sameGeometry(a: ExcerptGeometry | null, b: ExcerptGeometry | null): boolean {
  if (a === null || b === null) return a === b
  return (
    Math.abs(a.width - b.width) < 0.5 &&
    a.contract.font === b.contract.font &&
    a.contract.lineHeight === b.contract.lineHeight &&
    a.contract.lineBudget === b.contract.lineBudget &&
    a.contract.letterSpacing === b.contract.letterSpacing
  )
}

function sameFits(a: FittedExcerpts, b: FittedExcerpts): boolean {
  if (a.size !== b.size) return false
  for (const [id, excerpt] of b) {
    const previous = a.get(id)
    if (!previous || previous.text !== excerpt.text) return false
    if (previous.matchRanges.length !== excerpt.matchRanges.length) return false
    for (let i = 0; i < excerpt.matchRanges.length; i += 1) {
      const left = previous.matchRanges[i]
      const right = excerpt.matchRanges[i]
      if (left?.start !== right?.start || left?.end !== right?.end) return false
    }
  }
  return true
}
