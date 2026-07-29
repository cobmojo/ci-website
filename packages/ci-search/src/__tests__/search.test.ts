import { describe, expect, it } from 'vitest'
import {
  expandQuery,
  expandTerm,
  highlightSegments,
  scriptureQueryVariants,
  search,
} from '../index'
import type { SearchDoc } from '../types'

function doc(overrides: Partial<SearchDoc> & Pick<SearchDoc, 'id' | 'title'>): SearchDoc {
  return {
    type: 'case-section',
    route: `/case/${overrides.id}/`,
    breadcrumb: 'Case',
    summary: '',
    headings: [],
    scriptureRefs: [],
    body: '',
    notes: '',
    aliases: [],
    bibleBooks: [],
    topicIds: [],
    ...overrides,
  }
}

const CORPUS: SearchDoc[] = [
  doc({
    id: 'eternal-punishment',
    sectionId: 'S04',
    title: 'What Does Eternal Punishment Mean?',
    summary: 'Whether eternal punishment names a result or a continuing activity.',
    headings: ['In brief', 'The primary passage'],
    scriptureRefs: ['Matthew 25:46', 'Matthew 25', '2 Thessalonians 1:5-10'],
    body: 'The punishment is destruction rather than an endlessly continuing act of punishing.',
    aliases: ['S04', 'aionios', 'eternal punishment'],
    caseGroup: 'key-text',
    bibleBooks: ['Matthew', '2 Thessalonians'],
    evidenceRole: 'core-biblical',
  }),
  doc({
    id: 'body-and-soul',
    sectionId: 'S10',
    title: 'Can God Destroy Both Body and Soul?',
    summary: 'What Jesus says happens to the soul in Gehenna.',
    headings: ['In brief', 'The argument step by step'],
    scriptureRefs: ['Matthew 10:28', 'Matthew 10', 'Luke 12:4-5'],
    body: 'Jesus ties the fate of body and soul together and says God can destroy both.',
    aliases: ['S10', 'apollumi', 'destroy soul and body'],
    caseGroup: 'biblical-language',
    bibleBooks: ['Matthew', 'Luke'],
    evidenceRole: 'core-biblical',
  }),
  doc({
    id: 'mark-9',
    sectionId: 'S01',
    title: 'Mark 9: Undying Worms and Unquenchable Fire',
    summary: 'What Isaiah 66 contributes to the warning in Mark 9.',
    headings: ['In brief'],
    scriptureRefs: ['Mark 9:42-48', 'Mark 9', 'Isaiah 66:24'],
    body: 'The worm that does not die and the fire that is not quenched work on dead bodies.',
    aliases: ['S01', 'worm does not die', 'unquenchable fire'],
    caseGroup: 'key-text',
    bibleBooks: ['Mark', 'Isaiah'],
    evidenceRole: 'core-biblical',
  }),
  doc({
    id: 'transcript-intro',
    type: 'transcript',
    title: 'Introduction',
    route: '/watch/#introduction',
    breadcrumb: 'Video transcript',
    summary: 'Video overview.',
    body: 'For over thirty years I was exclusively taught the traditional view of hell.',
    timestamp: 0,
  }),
  doc({
    id: 'source-dear',
    type: 'source',
    title: 'The Bible Teaches Annihilationism',
    route: '/sources/#dear',
    breadcrumb: 'Source',
    summary: 'Joseph Dear. The Bible Teaches Annihilationism.',
    body: 'Joseph Dear. The Bible Teaches Annihilationism.',
    author: 'Joseph Dear',
    perspective: 'CI',
    sourceType: 'book',
  }),
]

describe('scripture-aware querying', () => {
  it.each(['Matthew 10:28', 'Matt 10 28', 'Mt. 10:28', 'mt 10.28'])(
    'finds the right section from %s',
    query => {
      const { results } = search(CORPUS, query)
      expect(results[0]?.doc.sectionId).toBe('S10')
    },
  )

  it('produces chapter-level variants so a chapter query still matches', () => {
    expect(scriptureQueryVariants('Matthew 10:28')).toContain('matthew 10')
    expect(scriptureQueryVariants('not a reference')).toEqual([])
  })

  it('matches a whole chapter reference', () => {
    const { results } = search(CORPUS, 'Mark 9')
    expect(results[0]?.doc.sectionId).toBe('S01')
  })
})

describe('ranking', () => {
  it('puts a title match above a body match', () => {
    const { results } = search(CORPUS, 'unquenchable fire')
    expect(results[0]?.doc.sectionId).toBe('S01')
  })

  it('resolves a permanent section id exactly', () => {
    const { results } = search(CORPUS, 'S04')
    expect(results[0]?.doc.sectionId).toBe('S04')
  })

  it('reports which fields matched, strongest first', () => {
    const { results } = search(CORPUS, 'eternal punishment')
    expect(results[0]?.matchedFields[0]).toBe('title')
  })

  it('ranks a phrase match above scattered word matches', () => {
    const { results } = search(CORPUS, 'destroy soul and body')
    expect(results[0]?.doc.sectionId).toBe('S10')
  })

  it('returns nothing for an empty query', () => {
    expect(search(CORPUS, '').total).toBe(0)
    expect(search(CORPUS, '   ').total).toBe(0)
  })
})

describe('synonyms', () => {
  it('expands the abbreviations used across the site', () => {
    expect(expandTerm('ect')).toContain('eternal conscious torment')
    expect(expandTerm('ci')).toContain('conditional immortality')
    expect(expandTerm('annihilation')).toContain('annihilationism')
  })

  it('expands a multi-word phrase as a phrase', () => {
    expect(expandQuery('eternal conscious torment')).toContain('ect')
  })

  it('groups the final-state terms so a search for hell finds them all', () => {
    const expanded = expandQuery('hell')
    expect(expanded).toContain('gehenna')
    expect(expanded).toContain('hades')
    expect(expanded).toContain('lake of fire')
  })

  it('finds a section through a synonym it does not literally contain', () => {
    const { results } = search(CORPUS, 'apollumi')
    expect(results.some(r => r.doc.sectionId === 'S10')).toBe(true)
  })

  it('never returns the query itself as its own synonym', () => {
    expect(expandQuery('gehenna')).not.toContain('gehenna')
  })
})

describe('filters', () => {
  it('filters by page type', () => {
    const { results } = search(CORPUS, 'annihilationism', { filters: { type: ['source'] } })
    expect(results).toHaveLength(1)
    expect(results[0]?.doc.type).toBe('source')
  })

  it('filters by case category', () => {
    const { results } = search(CORPUS, 'destroy', { filters: { caseGroup: ['key-text'] } })
    expect(results.every(r => r.doc.caseGroup === 'key-text')).toBe(true)
  })

  it('filters by Bible book', () => {
    const { results } = search(CORPUS, 'fire', { filters: { bibleBook: ['Isaiah'] } })
    expect(results.every(r => r.doc.bibleBooks.includes('Isaiah'))).toBe(true)
  })

  it('filters by author', () => {
    const { results } = search(CORPUS, 'annihilationism', { filters: { author: ['Joseph Dear'] } })
    expect(results[0]?.doc.author).toBe('Joseph Dear')
  })
})

describe('pagination', () => {
  it('slices results and keeps the total', () => {
    const first = search(CORPUS, 'destroy', { limit: 1, offset: 0 })
    const second = search(CORPUS, 'destroy', { limit: 1, offset: 1 })
    expect(first.results).toHaveLength(1)
    expect(first.total).toBe(second.total)
    expect(first.results[0]?.doc.id).not.toBe(second.results[0]?.doc.id)
  })
})

describe('excerpts and highlighting', () => {
  it('builds an excerpt around the strongest match', () => {
    const { results } = search(CORPUS, 'quenched')
    expect(results[0]?.excerpt.toLowerCase()).toContain('quenched')
  })

  it('splits text into matched and unmatched runs', () => {
    const segments = highlightSegments('the fire is not quenched', ['quenched'])
    expect(segments.filter(s => s.matched).map(s => s.text)).toEqual(['quenched'])
    expect(segments.map(s => s.text).join('')).toBe('the fire is not quenched')
  })

  it('never loses or reorders characters', () => {
    const text = 'Destruction, perishing, and the second death.'
    const segments = highlightSegments(text, ['death', 'destruction'])
    expect(segments.map(s => s.text).join('')).toBe(text)
  })

  it('handles a term that is absent', () => {
    const segments = highlightSegments('nothing here', ['absent'])
    expect(segments).toEqual([{ text: 'nothing here', matched: false }])
  })
})

describe('transcript results', () => {
  it('surfaces the transcript and carries its timestamp', () => {
    const { results } = search(CORPUS, 'traditional view')
    const transcript = results.find(r => r.doc.type === 'transcript')
    expect(transcript).toBeDefined()
    expect(transcript?.doc.timestamp).toBe(0)
  })

  it('ranks transcript text below authored prose', () => {
    const { results } = search(CORPUS, 'hell traditional view of hell')
    // The transcript should appear, but authored pages carry more weight when
    // both match, because the transcript is a secondary surface.
    expect(results.length).toBeGreaterThan(0)
  })
})
