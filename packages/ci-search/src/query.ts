import { parseReference } from '@ci/content-schema/bible'
import { buildExcerpts, excerptSources } from './excerpt'
import { normalize } from './normalize-with-source-map'
import { expandQuery } from './synonyms'
import type { MatchField, SearchDoc, SearchFilters, SearchResult } from './types'

/**
 * Field weights, highest first. These implement the documented ranking order:
 * title, then stable id/aliases, then summary, headings, Scripture references,
 * body, transcript, and finally source notes.
 */
const FIELD_WEIGHTS: Record<MatchField, number> = {
  title: 100,
  id: 60,
  summary: 34,
  heading: 22,
  scripture: 18,
  body: 8,
  transcript: 5,
  notes: 3,
}

/** A synonym-expanded hit counts for less than the reader's own wording. */
const SYNONYM_FACTOR = 0.45
/** Whole-phrase hits count for more than individual word hits. */
const PHRASE_BONUS = 1.9

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'of',
  'to',
  'in',
  'is',
  'it',
  'for',
  'on',
  'that',
  'this',
  'was',
  'are',
  'be',
  'as',
  'at',
  'by',
  'with',
  'from',
  'but',
  'not',
  'do',
  'does',
])

function tokenise(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9':]+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    count += 1
    index = haystack.indexOf(needle, index + needle.length)
  }
  return count
}

/**
 * Detect whether the query is (or contains) a Scripture reference, so that
 * `Mt 10 28`, `Matt. 10:28` and `Matthew 10:28` all resolve to the same
 * normalised reference before matching.
 */
export function scriptureQueryVariants(query: string): readonly string[] {
  const parsed = parseReference(query)
  if (!parsed) return []
  const variants = new Set<string>([normalize(parsed.normalized)])
  variants.add(normalize(`${parsed.book} ${parsed.chapter}`))
  if (parsed.verseStart !== undefined) {
    variants.add(normalize(`${parsed.book} ${parsed.chapter}:${parsed.verseStart}`))
  }
  return [...variants]
}

interface FieldSource {
  readonly field: MatchField
  readonly text: string
}

/**
 * Normalised fields, computed once per document.
 *
 * A search normalises every field of every document, which is 438,000
 * characters of lowercasing, NFKD and folding — on every keystroke, for a
 * corpus that was built at deploy time and cannot change while the page is
 * open. Keyed weakly on the document, so an index that is replaced is
 * collected with its entries.
 *
 * This is a memo, not a behaviour change: the ranking snapshot proves the
 * scores are identical.
 */
const normalisedFields = new WeakMap<SearchDoc, readonly FieldSource[]>()

function fieldsOf(doc: SearchDoc): readonly FieldSource[] {
  const cached = normalisedFields.get(doc)
  if (cached) return cached
  const fields = computeFields(doc)
  normalisedFields.set(doc, fields)
  return fields
}

function computeFields(doc: SearchDoc): readonly FieldSource[] {
  return [
    { field: 'title', text: normalize(doc.title) },
    { field: 'id', text: normalize([doc.sectionId ?? '', ...doc.aliases].join(' ')) },
    { field: 'summary', text: normalize(doc.summary) },
    { field: 'heading', text: normalize(doc.headings.join(' · ')) },
    { field: 'scripture', text: normalize(doc.scriptureRefs.join(' · ')) },
    {
      field: doc.type === 'transcript' ? 'transcript' : 'body',
      text: normalize(doc.body),
    },
    { field: 'notes', text: normalize(doc.notes) },
  ]
}

function matchesFilters(doc: SearchDoc, filters: SearchFilters): boolean {
  const check = (selected: readonly string[] | undefined, value: string | undefined): boolean =>
    !selected || selected.length === 0 || (value !== undefined && selected.includes(value))

  const checkMany = (selected: readonly string[] | undefined, values: readonly string[]): boolean =>
    !selected || selected.length === 0 || selected.some(candidate => values.includes(candidate))

  return (
    check(filters.type, doc.type) &&
    check(filters.caseGroup, doc.caseGroup) &&
    check(filters.sourceType, doc.sourceType) &&
    check(filters.author, doc.author) &&
    check(filters.perspective, doc.perspective) &&
    check(filters.evidenceRole, doc.evidenceRole) &&
    checkMany(filters.bibleBook, doc.bibleBooks) &&
    checkMany(filters.topicId, doc.topicIds)
  )
}

export interface SearchOptions {
  readonly filters?: SearchFilters
  readonly limit?: number
  readonly offset?: number
  /**
   * Also build a larger, ellipsis-free excerpt candidate for each returned row.
   *
   * Opt-in because it costs a grapheme-level pass over the quoted field, and
   * only the browser-side fitter in the quick-search dialog has any use for it.
   * The server-rendered search page deliberately leaves it off.
   */
  readonly includeExcerptCandidate?: boolean
  /**
   * The excerpt will be shown in a fixed two- or three-line box, so keep the
   * match near the start of it rather than centred. The quick dialog reserves
   * exactly that box; the server-rendered page does not and leaves this off.
   */
  readonly compactExcerpt?: boolean
}

export interface SearchOutcome {
  readonly results: readonly SearchResult[]
  readonly total: number
  /** Terms the ranker actually used, for the "why it matched" line. */
  readonly usedTerms: readonly string[]
}

/**
 * A document that scored, before any excerpt work has been done.
 *
 * Scoring runs over every candidate document; excerpts run over the handful
 * that are actually returned. Keeping them apart is what stops a twelve-row
 * dialog from quoting two hundred documents on every keystroke.
 */
interface ScoredDoc {
  readonly doc: SearchDoc
  readonly score: number
  readonly matchedFields: readonly MatchField[]
  readonly matchedTerms: readonly string[]
}

/**
 * Rank documents against a query.
 *
 * Deliberately a plain scorer over a prebuilt index rather than a hosted
 * search service: the index is a few hundred kilobytes, it ships as a static
 * asset, and no query ever leaves the reader's browser.
 */
export function search(
  docs: readonly SearchDoc[],
  rawQuery: string,
  options: SearchOptions = {},
): SearchOutcome {
  const filters = options.filters ?? {}
  const limit = options.limit ?? 25
  const offset = options.offset ?? 0

  const query = normalize(rawQuery)
  const candidates = docs.filter(doc => matchesFilters(doc, filters))

  if (!query) {
    return { results: [], total: 0, usedTerms: [] }
  }

  const phrase = query
  const words = tokenise(query)
  const scriptureVariants = scriptureQueryVariants(rawQuery)
  const synonyms = expandQuery(rawQuery)

  // Primary terms are the reader's own wording; secondary are expansions.
  const primary: string[] = [phrase, ...words, ...scriptureVariants]
  const usedTerms = [...new Set([...primary, ...synonyms])].filter(Boolean)

  const scored: ScoredDoc[] = []

  for (const doc of candidates) {
    const fields = fieldsOf(doc)
    let score = 0
    const matchedByField = new Map<MatchField, number>()
    const matchedTerms = new Set<string>()

    const applyHit = (field: MatchField, term: string, hits: number, factor: number) => {
      if (hits === 0) return
      const isPhrase = term.includes(' ') || term === phrase
      const weight = FIELD_WEIGHTS[field] * factor * (isPhrase ? PHRASE_BONUS : 1)
      // Diminishing returns: the second mention matters far less than the first.
      const value = weight * (1 + Math.log2(hits))
      score += value
      matchedByField.set(field, (matchedByField.get(field) ?? 0) + value)
      matchedTerms.add(term)
    }

    for (const { field, text } of fields) {
      if (!text) continue
      for (const term of new Set(primary)) {
        applyHit(field, term, countOccurrences(text, term), 1)
      }
      for (const term of synonyms) {
        applyHit(field, term, countOccurrences(text, term), SYNONYM_FACTOR)
      }
    }

    if (score === 0) continue

    // Exact whole-title match should always float to the top.
    if (normalize(doc.title) === phrase) score += 400
    if (doc.sectionId && normalize(doc.sectionId) === phrase) score += 400

    const matchedFields = [...matchedByField.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([field]) => field)

    scored.push({ doc, score, matchedFields, matchedTerms: [...matchedTerms] })
  }

  scored.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))

  // Excerpts are built only for the rows that are actually returned. Scoring
  // touches every document; quoting touches twelve.
  const page = scored.slice(offset, offset + limit)
  const results: SearchResult[] = page.map(entry => {
    const { excerpt, candidate } = buildExcerpts(excerptSources(entry.doc), entry.matchedTerms, {
      candidate: options.includeExcerptCandidate === true,
      compact: options.compactExcerpt === true,
    })

    return {
      doc: entry.doc,
      score: entry.score,
      matchedFields: entry.matchedFields,
      matchedTerms: entry.matchedTerms,
      excerpt: excerpt.text,
      excerptMatchRanges: excerpt.matchRanges,
      excerptField: excerpt.sourceField,
      ...(candidate ? { excerptCandidate: candidate } : {}),
    }
  })

  return { results, total: scored.length, usedTerms }
}
