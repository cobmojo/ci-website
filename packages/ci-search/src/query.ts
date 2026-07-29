import { parseReference } from '@ci/content-schema/bible'
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

function normalise(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      // Curly quotes and dashes should match their ASCII equivalents.
      .replace(/[‘’‛]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[‐-―−]/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

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
  return normalise(value)
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
  const variants = new Set<string>([normalise(parsed.normalized)])
  variants.add(normalise(`${parsed.book} ${parsed.chapter}`))
  if (parsed.verseStart !== undefined) {
    variants.add(normalise(`${parsed.book} ${parsed.chapter}:${parsed.verseStart}`))
  }
  return [...variants]
}

interface FieldSource {
  readonly field: MatchField
  readonly text: string
}

function fieldsOf(doc: SearchDoc): readonly FieldSource[] {
  return [
    { field: 'title', text: normalise(doc.title) },
    { field: 'id', text: normalise([doc.sectionId ?? '', ...doc.aliases].join(' ')) },
    { field: 'summary', text: normalise(doc.summary) },
    { field: 'heading', text: normalise(doc.headings.join(' · ')) },
    { field: 'scripture', text: normalise(doc.scriptureRefs.join(' · ')) },
    {
      field: doc.type === 'transcript' ? 'transcript' : 'body',
      text: normalise(doc.body),
    },
    { field: 'notes', text: normalise(doc.notes) },
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

const EXCERPT_RADIUS = 110

function buildExcerpt(body: string, terms: readonly string[]): string {
  const haystack = normalise(body)
  let bestIndex = -1
  let bestTerm = ''
  for (const term of terms) {
    const index = haystack.indexOf(term)
    if (index !== -1 && (bestIndex === -1 || term.length > bestTerm.length)) {
      bestIndex = index
      bestTerm = term
    }
  }

  const source = body.replace(/\s+/g, ' ').trim()
  if (bestIndex === -1) {
    return source.length > EXCERPT_RADIUS * 2
      ? `${source.slice(0, EXCERPT_RADIUS * 2).trimEnd()}…`
      : source
  }

  const start = Math.max(0, bestIndex - EXCERPT_RADIUS)
  const end = Math.min(source.length, bestIndex + bestTerm.length + EXCERPT_RADIUS)
  const slice = source.slice(start, end).trim()
  return `${start > 0 ? '…' : ''}${slice}${end < source.length ? '…' : ''}`
}

export interface SearchOptions {
  readonly filters?: SearchFilters
  readonly limit?: number
  readonly offset?: number
}

export interface SearchOutcome {
  readonly results: readonly SearchResult[]
  readonly total: number
  /** Terms the ranker actually used, for the "why it matched" line. */
  readonly usedTerms: readonly string[]
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

  const query = normalise(rawQuery)
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

  const scored: SearchResult[] = []

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
    if (normalise(doc.title) === phrase) score += 400
    if (doc.sectionId && normalise(doc.sectionId) === phrase) score += 400

    const matchedFields = [...matchedByField.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([field]) => field)

    scored.push({
      doc,
      score,
      matchedFields,
      matchedTerms: [...matchedTerms],
      excerpt: buildExcerpt(doc.body || doc.summary, [...matchedTerms]),
    })
  }

  scored.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))

  return {
    results: scored.slice(offset, offset + limit),
    total: scored.length,
    usedTerms,
  }
}

/**
 * Split an excerpt into plain and matched runs so the renderer can mark hits
 * with `<mark>` without ever injecting HTML from content.
 */
export function highlightSegments(
  text: string,
  terms: readonly string[],
): readonly { text: string; matched: boolean }[] {
  const usable = [...new Set(terms)]
    .filter(term => term.length > 1)
    .sort((a, b) => b.length - a.length)
  if (usable.length === 0) return [{ text, matched: false }]

  const haystack = normalise(text)
  const marks = new Array<boolean>(text.length).fill(false)

  for (const term of usable) {
    let index = haystack.indexOf(term)
    while (index !== -1) {
      for (let i = index; i < Math.min(index + term.length, marks.length); i += 1) marks[i] = true
      index = haystack.indexOf(term, index + term.length)
    }
  }

  const segments: { text: string; matched: boolean }[] = []
  let current = ''
  let currentMatched = marks[0] ?? false
  for (let i = 0; i < text.length; i += 1) {
    const matched = marks[i] ?? false
    if (matched === currentMatched) {
      current += text[i]
    } else {
      if (current) segments.push({ text: current, matched: currentMatched })
      current = text[i] ?? ''
      currentMatched = matched
    }
  }
  if (current) segments.push({ text: current, matched: currentMatched })
  return segments
}
