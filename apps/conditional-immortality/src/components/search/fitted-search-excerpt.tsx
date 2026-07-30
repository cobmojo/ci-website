'use client'

import type { SearchResult } from '@ci/search'
import { MarkedText } from '@/components/search/highlighted-text'
import type { FittedExcerpt } from '@/lib/text-layout/fit-search-excerpt'
import { EXCERPT_PROBE_ATTRIBUTE } from '@/lib/text-layout/use-fitted-search-excerpts'

/**
 * One result's excerpt, fitted if it could be and ordinary if it could not.
 *
 * There is no loading state and no error state, because there is nothing to
 * wait for: the fallback excerpt is complete, correct and on screen from the
 * first paint. If a fit arrives it swaps the text; if none ever arrives, the
 * reader never learns that one was attempted.
 *
 * The text is ordinary DOM text either way — selectable, copyable, findable by
 * find-in-page, and read by assistive technology as the words it is. Nothing is
 * painted to a canvas.
 */
export function FittedSearchExcerpt({
  result,
  fitted,
}: {
  result: SearchResult
  fitted?: FittedExcerpt
}) {
  const text = fitted?.text ?? result.excerpt
  const ranges = fitted?.matchRanges ?? result.excerptMatchRanges

  return (
    <span
      className="quick-search-excerpt mt-0.5"
      // How the coordinator finds a representative element to measure, and how
      // the browser suite asserts which path a row took. Neither is announced:
      // `data-*` attributes carry no accessible semantics.
      {...{ [EXCERPT_PROBE_ATTRIBUTE]: '' }}
      data-pretext-state={fitted ? 'fitted' : 'fallback'}
    >
      <MarkedText text={text} ranges={ranges} markClassName="" />
    </span>
  )
}
