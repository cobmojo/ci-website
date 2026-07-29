/** Page families that appear in search results. */
export const SEARCH_DOC_TYPES = [
  'case-section',
  'objection',
  'appendix',
  'passage',
  'topic',
  'glossary',
  'source',
  'language-note',
  'transcript',
  'page',
] as const

export type SearchDocType = (typeof SEARCH_DOC_TYPES)[number]

export const SEARCH_DOC_TYPE_LABELS: Record<SearchDocType, string> = {
  'case-section': 'Case section',
  objection: 'Objection',
  appendix: 'Appendix',
  passage: 'Key passage',
  topic: 'Topic',
  glossary: 'Glossary',
  source: 'Source',
  'language-note': 'Language note',
  transcript: 'Video transcript',
  page: 'Page',
}

/**
 * One indexed document.
 *
 * Fields are stored separately rather than concatenated so the ranker can
 * weight a title match above a body match, and so results can explain which
 * field matched.
 */
export interface SearchDoc {
  readonly id: string
  readonly type: SearchDocType
  readonly route: string
  readonly title: string
  /** Permanent section id (S04, RB2, APP1) where one applies. */
  readonly sectionId?: string
  readonly breadcrumb: string
  /** Thesis or short summary. */
  readonly summary: string
  readonly headings: readonly string[]
  /** Normalised Scripture references mentioned on the page. */
  readonly scriptureRefs: readonly string[]
  readonly body: string
  readonly notes: string
  readonly aliases: readonly string[]
  readonly caseGroup?: string
  readonly bibleBooks: readonly string[]
  readonly topicIds: readonly string[]
  readonly sourceType?: string
  readonly author?: string
  readonly perspective?: string
  readonly evidenceRole?: string
  /** Seconds into the video, for transcript documents. */
  readonly timestamp?: number
}

export interface SearchIndex {
  readonly builtAt: string
  readonly docs: readonly SearchDoc[]
}

export interface SearchFilters {
  readonly type?: readonly SearchDocType[]
  readonly caseGroup?: readonly string[]
  readonly bibleBook?: readonly string[]
  readonly topicId?: readonly string[]
  readonly sourceType?: readonly string[]
  readonly author?: readonly string[]
  readonly perspective?: readonly string[]
  readonly evidenceRole?: readonly string[]
}

export type MatchField =
  | 'title'
  | 'id'
  | 'summary'
  | 'heading'
  | 'scripture'
  | 'body'
  | 'transcript'
  | 'notes'

export const MATCH_FIELD_LABELS: Record<MatchField, string> = {
  title: 'page title',
  id: 'section id or alias',
  summary: 'summary',
  heading: 'heading',
  scripture: 'Scripture reference',
  body: 'body text',
  transcript: 'transcript',
  notes: 'source notes',
}

export interface SearchResult {
  readonly doc: SearchDoc
  readonly score: number
  /** Which fields matched, best first. Rendered as "why it matched". */
  readonly matchedFields: readonly MatchField[]
  /** Body excerpt around the strongest match, with `[[` `]]` marking terms. */
  readonly excerpt: string
  readonly matchedTerms: readonly string[]
}
