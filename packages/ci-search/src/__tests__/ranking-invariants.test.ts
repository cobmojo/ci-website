import { describe, expect, it } from 'vitest'
import { buildSearchIndex } from '../build-index'
import { findTermRanges } from '../matches'
import { search } from '../query'
import baseline from './ranking-baseline.json'

/**
 * Ranking, pinned.
 *
 * The source map, the rebuilt excerpts and the opt-in candidate all touch the
 * ranker, and none of them is allowed to move a result. This file holds a
 * snapshot of what the ranker returned for thirty real queries against the real
 * content index before any of that work started — total, used terms, order,
 * score to six decimal places, matched fields in their rendered order, and the
 * matched-term set. If a change moves any of it, this fails and the change is
 * wrong, not the file.
 */

const index = buildSearchIndex()

interface BaselineRow {
  readonly id: string
  readonly score: number
  readonly matchedFields: readonly string[]
  readonly matchedTerms: readonly string[]
}

interface BaselineOutcome {
  readonly total: number
  readonly usedTerms: readonly string[]
  readonly results: readonly BaselineRow[]
}

const outcomes = baseline as unknown as Record<string, BaselineOutcome>
const QUERIES = Object.keys(outcomes).filter(key => !key.startsWith('__'))

function shape(query: string, options: Parameters<typeof search>[2] = { limit: 12 }) {
  const outcome = search(index.docs, query, options)
  return {
    total: outcome.total,
    usedTerms: [...outcome.usedTerms],
    results: outcome.results.map(result => ({
      id: result.doc.id,
      score: Number(result.score.toFixed(6)),
      matchedFields: [...result.matchedFields],
      matchedTerms: [...result.matchedTerms].sort(),
    })),
  }
}

describe('ranking is unchanged', () => {
  it.each(QUERIES)('returns the recorded outcome for %j', query => {
    expect(shape(query)).toEqual(outcomes[query])
  })

  it('keeps filtering and pagination stable', () => {
    expect(
      search(index.docs, 'fire', { filters: { type: ['passage'] }, limit: 5 }).results.map(
        r => r.doc.id,
      ),
    ).toEqual((baseline as unknown as Record<string, string[]>).__filtered)
    expect(search(index.docs, 'fire', { limit: 5, offset: 5 }).results.map(r => r.doc.id)).toEqual(
      (baseline as unknown as Record<string, string[]>).__page2,
    )
  })
})

describe('candidate generation is inert', () => {
  it.each(QUERIES)('does not move anything for %j', query => {
    const withCandidates = shape(query, { limit: 12, includeExcerptCandidate: true })
    expect(withCandidates).toEqual(shape(query, { limit: 12 }))
  })

  it('produces candidates only for the rows that were returned', () => {
    const outcome = search(index.docs, 'unquenchable fire', {
      limit: 3,
      includeExcerptCandidate: true,
    })
    expect(outcome.results).toHaveLength(3)
    expect(outcome.total).toBeGreaterThan(3)
    // Every returned row is eligible for one; nothing beyond the slice exists
    // to carry one, which is the point of building them after the sort.
    expect(outcome.results.every(result => 'excerptCandidate' in result)).toBe(true)
  })

  it('omits the candidate entirely when it was not asked for', () => {
    const outcome = search(index.docs, 'unquenchable fire', { limit: 3 })
    expect(outcome.results.every(result => result.excerptCandidate === undefined)).toBe(true)
  })

  it('keeps filters, totals and pagination identical with candidates on', () => {
    const options = { filters: { type: ['passage'] as const }, limit: 5, offset: 0 }
    const plain = search(index.docs, 'fire', options)
    const enhanced = search(index.docs, 'fire', { ...options, includeExcerptCandidate: true })
    expect(enhanced.total).toBe(plain.total)
    expect(enhanced.results.map(r => r.doc.id)).toEqual(plain.results.map(r => r.doc.id))
  })
})

describe('excerpts on real results', () => {
  it('gives every returned row an excerpt whose ranges slice its own text', () => {
    for (const query of QUERIES) {
      const outcome = search(index.docs, query, { limit: 12, includeExcerptCandidate: true })
      for (const result of outcome.results) {
        for (const range of result.excerptMatchRanges) {
          expect(range.end).toBeGreaterThan(range.start)
          expect(range.end).toBeLessThanOrEqual(result.excerpt.length)
        }
        const candidate = result.excerptCandidate
        if (!candidate) continue
        expect(candidate.matchRanges.length).toBeGreaterThan(0)
        for (const range of candidate.matchRanges) {
          expect(range.end).toBeLessThanOrEqual(candidate.text.length)
        }
        expect(candidate.text).not.toContain('…')
        expect(candidate.text.trim()).toBe(candidate.text)
      }
    }
  })

  it('shows every result why it matched, wherever a quotable match exists', () => {
    /*
     * A reader should never meet a row with no visible reason for being there.
     *
     * The one honest exception is a row matched purely through an alias: the
     * alias list is index metadata and is not rendered anywhere, so there is no
     * source-faithful text to mark. Those rows still explain themselves in
     * words through the "Matched in section id or alias" line, and inventing a
     * highlight for them would mean showing the reader text the page does not
     * contain. So the rule is: a visible mark, or nothing quotable existed.
     */
    const unexplained: string[] = []
    for (const query of QUERIES) {
      const outcome = search(index.docs, query, { limit: 12 })
      for (const result of outcome.results) {
        const visible =
          result.excerptMatchRanges.length > 0 ||
          highlightedSomewhere(result.doc.title, result.matchedTerms) ||
          highlightedSomewhere(result.doc.sectionId ?? '', result.matchedTerms) ||
          highlightedSomewhere(result.doc.breadcrumb, result.matchedTerms)
        if (visible) continue

        const aliasOnly = result.matchedFields.every(field => field === 'id')
        if (!aliasOnly) unexplained.push(`${query} -> ${result.doc.id} (${result.matchedFields})`)
      }
    }
    expect(unexplained).toEqual([])
  })

  it('explains an alias-only row through its matched-fields line', () => {
    // The two rows the rule above exempts, pinned so the exemption cannot widen
    // silently into "some results have no explanation at all".
    const aliasOnly = search(index.docs, 'S04', { limit: 12 }).results.find(
      result => result.doc.id === 'transcript:eternal-punishment',
    )
    expect(aliasOnly?.matchedFields).toEqual(['id'])
    expect(aliasOnly?.doc.aliases).toContain('S04')
    expect(aliasOnly?.excerpt.length).toBeGreaterThan(0)
  })
})

/** Deliberately the same matcher the renderer marks with. */
function highlightedSomewhere(text: string, terms: readonly string[]): boolean {
  return text.length > 0 && findTermRanges(text, terms).length > 0
}
