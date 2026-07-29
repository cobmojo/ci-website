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

const SINGLE_QUOTE = /[‘’‛]/
const DOUBLE_QUOTE = /[“”]/
const DASH = /[‐-―−]/
const WHITESPACE = /\s/

export function normalise(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      // Curly quotes and dashes should match their ASCII equivalents.
      .replace(SINGLE_QUOTE_ALL, "'")
      .replace(DOUBLE_QUOTE_ALL, '"')
      .replace(DASH_ALL, '-')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

const SINGLE_QUOTE_ALL = /[‘’‛]/g
const DOUBLE_QUOTE_ALL = /[“”]/g
const DASH_ALL = /[‐-―−]/g

/**
 * A normalised string, plus where each of its characters came from.
 *
 * Matching happens on normalised text but has to be *displayed* on the
 * original, and the two are not the same length. Collapsing a run of spaces
 * shortens it, trimming shifts it, and NFKD lengthens it — `ή` decomposes into
 * `η` plus a combining accent, so one Greek word early in a paragraph moved
 * every highlight after it by one character. Highlights landed mid-word.
 *
 * `start[i]` and `end[i]` bound, in the original string, the character that
 * produced `value[i]`. There is one entry per UTF-16 unit of `value`, so an
 * index returned by `value.indexOf()` can be used directly.
 */
export interface NormalisedText {
  readonly value: string
  readonly start: readonly number[]
  readonly end: readonly number[]
}

const CASED = /\p{Cased}/u
const CASE_IGNORABLE = /\p{Case_Ignorable}/u
const MARK = /\p{M}/u

/** A base character together with the combining marks that belong to it. */
interface Cluster {
  readonly text: string
  readonly start: number
  readonly end: number
}

/**
 * Split text into clusters of one base character plus its combining marks.
 *
 * The unit has to be the cluster, not the character. NFKD does not only
 * decompose, it also reorders combining marks into canonical order, and that
 * reordering happens across the marks that follow a base character — Hebrew
 * pointing and Greek breathing marks both trigger it. Normalising one
 * character at a time cannot reorder anything, so it produced a different
 * string from `normalise` wherever the source marks were not already in
 * canonical order.
 *
 * Reordering never crosses a base character, so normalising cluster by cluster
 * gives exactly the same result as normalising the whole string at once.
 */
function toClusters(text: string): Cluster[] {
  const clusters: Cluster[] = []
  let current = ''
  let start = 0
  let offset = 0
  for (const char of text) {
    if (current !== '' && MARK.test(char)) {
      current += char
    } else {
      if (current !== '') clusters.push({ text: current, start, end: offset })
      current = char
      start = offset
    }
    offset += char.length
  }
  if (current !== '') clusters.push({ text: current, start, end: offset })
  return clusters
}

/**
 * Does this capital sigma end a word?
 *
 * Greek is the one place where lowercasing depends on context: Σ becomes ς at
 * the end of a word and σ everywhere else, so `ΛΟΓΟΣ` lowercases to `λογος`.
 * `String.prototype.toLowerCase` applies this to a whole string, but a walk
 * that lowercases one character at a time cannot see the neighbours and always
 * produced σ — the one thing that made the two normalisers disagree, on a site
 * that quotes Greek throughout.
 *
 * This is the Unicode `Final_Sigma` condition: preceded by a cased letter,
 * ignoring case-ignorable characters, and not followed by one.
 */
function isFinalSigma(clusters: readonly Cluster[], position: number): boolean {
  const base = (cluster: Cluster | undefined) => (cluster ? [...cluster.text][0] : undefined)

  let precededByCased = false
  for (let i = position - 1; i >= 0; i -= 1) {
    const char = base(clusters[i])
    if (char === undefined || CASE_IGNORABLE.test(char)) continue
    precededByCased = CASED.test(char)
    break
  }
  if (!precededByCased) return false

  for (let i = position + 1; i < clusters.length; i += 1) {
    const char = base(clusters[i])
    if (char === undefined || CASE_IGNORABLE.test(char)) continue
    return !CASED.test(char)
  }
  return true
}

/** The normalisation of one cluster, matching `normalise` step for step. */
function normaliseCluster(clusters: readonly Cluster[], position: number): string {
  const text = clusters[position]?.text ?? ''
  const base = [...text][0] ?? ''

  // Only the base character is substituted. Any combining marks it carries
  // still have to come through, or a cedilla trailing a curly quote is
  // silently dropped and the two normalisers part company.
  const marks = text.slice(base.length).toLowerCase().normalize('NFKD')
  if (SINGLE_QUOTE.test(base)) return `'${marks}`
  if (DOUBLE_QUOTE.test(base)) return `"${marks}`
  if (DASH.test(base)) return `-${marks}`

  const lowered =
    base === 'Σ'
      ? (isFinalSigma(clusters, position) ? 'ς' : 'σ') + text.slice(base.length).toLowerCase()
      : text.toLowerCase()
  return lowered.normalize('NFKD')
}

/**
 * `normalise`, done character by character so each output position can be
 * traced back to the input.
 *
 * This is the slower of the two and is used only where the mapping is needed —
 * highlighting and excerpting, which run over a page of results rather than
 * the whole corpus. `normalise` stays a handful of native string operations
 * for the ranking loop. A test asserts the two agree on every field of every
 * document in the index, so they cannot drift apart unnoticed.
 */
export function normaliseWithMap(text: string): NormalisedText {
  let value = ''
  const start: number[] = []
  const end: number[] = []

  // Whitespace is collapsed to one space, and only once a non-space has been
  // seen — which is what `.trim()` did to the leading run.
  let spaceStart = -1
  let spaceEnd = -1
  let seenNonSpace = false

  const clusters = toClusters(text)

  for (let position = 0; position < clusters.length; position += 1) {
    const cluster = clusters[position]
    if (!cluster) continue

    // A cluster can normalise to several characters — `ﬁ` to `fi`, `¨` to a
    // space and a combining diaeresis — so the whitespace check is on the
    // output, not the input, exactly as it is in `normalise`.
    for (const unit of normaliseCluster(clusters, position)) {
      if (WHITESPACE.test(unit)) {
        if (spaceStart === -1) spaceStart = cluster.start
        spaceEnd = cluster.end
        continue
      }
      if (spaceStart !== -1) {
        if (seenNonSpace) {
          value += ' '
          start.push(spaceStart)
          end.push(spaceEnd)
        }
        spaceStart = -1
      }
      seenNonSpace = true
      value += unit
      for (let k = 0; k < unit.length; k += 1) {
        start.push(cluster.start)
        end.push(cluster.end)
      }
    }
  }

  // A trailing run of whitespace is simply never emitted, which is the other
  // half of `.trim()`.
  return { value, start, end }
}

/** The span of the original text that produced `value[from]` through `value[to - 1]`. */
function sourceSpan(
  map: NormalisedText,
  from: number,
  to: number,
  fallbackEnd: number,
): { from: number; to: number } | undefined {
  const last = Math.min(to, map.start.length) - 1
  if (last < from) return undefined
  return { from: map.start[from] ?? 0, to: map.end[last] ?? fallbackEnd }
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

interface DocFields {
  readonly sources: readonly FieldSource[]
  readonly title: string
  readonly sectionId: string
}

/**
 * Normalised fields for one document.
 *
 * The index is static for the life of the page, so normalising it once and
 * keeping the result is safe. Doing it per query was not cheap: the ranker
 * walked every field of every document on each keystroke, which is around half
 * a megabyte of text through a lowercase, an NFKD and five regexes — and the
 * search dialog runs a query per keystroke, so typing a short phrase paid for
 * it seventeen times over.
 *
 * A `WeakMap` rather than a `Map` so that replacing the index — or navigating
 * away from it — does not pin the old documents in memory.
 */
const FIELD_CACHE = new WeakMap<SearchDoc, DocFields>()

function fieldsOf(doc: SearchDoc): DocFields {
  const cached = FIELD_CACHE.get(doc)
  if (cached) return cached

  const title = normalise(doc.title)
  const fields: DocFields = {
    title,
    sectionId: doc.sectionId ? normalise(doc.sectionId) : '',
    sources: [
      { field: 'title', text: title },
      { field: 'id', text: normalise([doc.sectionId ?? '', ...doc.aliases].join(' ')) },
      { field: 'summary', text: normalise(doc.summary) },
      { field: 'heading', text: normalise(doc.headings.join(' · ')) },
      { field: 'scripture', text: normalise(doc.scriptureRefs.join(' · ')) },
      {
        field: doc.type === 'transcript' ? 'transcript' : 'body',
        text: normalise(doc.body),
      },
      { field: 'notes', text: normalise(doc.notes) },
    ],
  }

  FIELD_CACHE.set(doc, fields)
  return fields
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

/**
 * Cached offset maps for excerpting.
 *
 * `normaliseWithMap` walks cluster by cluster and is an order of magnitude
 * slower than `normalise`. Excerpts are only built for the page of results
 * actually returned, and the same documents come back on every keystroke, so
 * the map is worth keeping.
 */
const EXCERPT_MAP_CACHE = new WeakMap<SearchDoc, NormalisedText>()

function excerptMap(doc: SearchDoc, body: string): NormalisedText {
  const cached = EXCERPT_MAP_CACHE.get(doc)
  if (cached) return cached
  const map = normaliseWithMap(body)
  EXCERPT_MAP_CACHE.set(doc, map)
  return map
}

function buildExcerpt(map: NormalisedText, body: string, terms: readonly string[]): string {
  let bestIndex = -1
  let bestTerm = ''
  for (const term of terms) {
    const index = map.value.indexOf(term)
    if (index !== -1 && (bestIndex === -1 || term.length > bestTerm.length)) {
      bestIndex = index
      bestTerm = term
    }
  }

  if (bestIndex === -1) {
    const source = body.replace(/\s+/g, ' ').trim()
    return source.length > EXCERPT_RADIUS * 2
      ? `${source.slice(0, EXCERPT_RADIUS * 2).trimEnd()}…`
      : source
  }

  // The window is measured on the original text, not the normalised one, so
  // the match sits in the middle of what the reader is actually shown.
  const span = sourceSpan(map, bestIndex, bestIndex + bestTerm.length, body.length)
  const start = Math.max(0, (span?.from ?? 0) - EXCERPT_RADIUS)
  const end = Math.min(body.length, (span?.to ?? body.length) + EXCERPT_RADIUS)
  const slice = body.slice(start, end).replace(/\s+/g, ' ').trim()
  return `${start > 0 ? '…' : ''}${slice}${end < body.length ? '…' : ''}`
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

  /** A result before its excerpt is built — see the note by the slice below. */
  const scored: Omit<SearchResult, 'excerpt'>[] = []

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

    for (const { field, text } of fields.sources) {
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
    if (fields.title === phrase) score += 400
    if (fields.sectionId && fields.sectionId === phrase) score += 400

    const matchedFields = [...matchedByField.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([field]) => field)

    scored.push({ doc, score, matchedFields, matchedTerms: [...matchedTerms] })
  }

  scored.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title))

  // Excerpts are built last, for the page being returned rather than for every
  // document that matched. A one-letter query matches nearly the whole index
  // and shows twenty-five of them, so building all of them threw away most of
  // the work — and excerpting is the most expensive step per document.
  const results = scored.slice(offset, offset + limit).map(result => {
    const body = result.doc.body || result.doc.summary
    return {
      ...result,
      excerpt: buildExcerpt(excerptMap(result.doc, body), body, result.matchedTerms),
    }
  })

  return { results, total: scored.length, usedTerms }
}

/**
 * Split an excerpt into plain and matched runs so the renderer can mark hits
 * with `<mark>` without ever injecting HTML from content.
 */
export function highlightSegments(
  text: string,
  terms: readonly string[],
): readonly { text: string; matched: boolean }[] {
  // The ranker hands back terms it has already normalised, but this is also
  // called directly with a reader's own wording. Normalising here is
  // idempotent, and without it a composed `ψυχή` cannot match the decomposed
  // form that NFKD leaves in the haystack.
  const usable = [...new Set(terms.map(normalise))]
    .filter(term => term.length > 1)
    .sort((a, b) => b.length - a.length)
  if (usable.length === 0) return [{ text, matched: false }]

  const map = normaliseWithMap(text)
  const haystack = map.value
  const marks = new Array<boolean>(text.length).fill(false)

  for (const term of usable) {
    let index = haystack.indexOf(term)
    while (index !== -1) {
      const span = sourceSpan(map, index, index + term.length, text.length)
      if (span) for (let i = span.from; i < span.to; i += 1) marks[i] = true
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
