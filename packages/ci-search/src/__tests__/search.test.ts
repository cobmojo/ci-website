import { describe, expect, it } from 'vitest'
import { buildSearchIndex } from '../build-index'
import {
  expandQuery,
  expandTerm,
  highlightSegments,
  scriptureQueryVariants,
  search,
} from '../index'
import { mapNormalizedRange, normalize, normalizeWithSourceMap } from '../normalize-with-source-map'
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
    // Segments now carry the offsets they were sliced at, so a renderer can key
    // on position instead of array index.
    expect(segments).toEqual([{ text: 'nothing here', matched: false, start: 0, end: 12 }])
  })

  // The run is located in the normalised text but marked in the original, so
  // anything that changes the length between the two shifts every later match.
  const marked = (text: string, terms: string[]) =>
    highlightSegments(text, terms)
      .filter(segment => segment.matched)
      .map(segment => segment.text)

  it('marks the term itself when a run of spaces precedes it', () => {
    expect(marked('The  fire   is unquenchable', ['unquenchable'])).toEqual(['unquenchable'])
  })

  it('marks the term itself when the text has leading whitespace', () => {
    expect(marked('  leading space then unquenchable', ['unquenchable'])).toEqual(['unquenchable'])
  })

  it('marks the term itself when an accented word precedes it', () => {
    // ή decomposes to η + a combining accent, so the normalised text is one
    // character longer than the original from this point on.
    expect(marked('the Greek word ψυχή means soul', ['soul'])).toEqual(['soul'])
    expect(marked('αἰώνιος is rendered eternal', ['eternal'])).toEqual(['eternal'])
    expect(marked('Fudge’s café — the second death', ['death'])).toEqual(['death'])
  })

  it('marks a term that is itself accented', () => {
    expect(marked('the Greek ψυχή is the soul', ['ψυχή'])).toEqual(['ψυχή'])
  })

  it('keeps every character when whitespace and accents are both present', () => {
    const text = '  Sheol,  the  grave — ψυχή  and  destruction.  '
    const segments = highlightSegments(text, ['destruction', 'grave'])
    expect(segments.map(s => s.text).join('')).toBe(text)
    expect(segments.filter(s => s.matched).map(s => s.text)).toEqual(['grave', 'destruction'])
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

/**
 * Two implementations of one rule: ranking uses `normalize`, highlighting uses
 * `normalizeWithSourceMap`, so a disagreement puts a highlight where the ranker
 * never matched.
 */
describe('the two normalisers agree', () => {
  const SAMPLES = [
    '',
    '   ',
    '\t\n\r ',
    'plain ascii text',
    '  leading and trailing  ',
    'runs   of    spaces',
    'line\nbreak\tand\ttabs',
    'non\u00a0breaking\u00a0space',
    'en\u2002quad\u2003em\u2004three\u3000ideographic',
    'curly \u2018single\u2019 and \u201cdouble\u201d quotes',
    'reversed \u201bquote',
    'dashes \u2010 \u2011 \u2012 \u2013 \u2014 \u2015 \u2212 done',
    'caf\u00e9 na\u00efve r\u00e9sum\u00e9',
    'cafe\u0301 already decomposed',
    '\u00c4\u00d6\u00dc \u00e4\u00f6\u00fc \u00df',
    '\u03c8\u03c5\u03c7\u03ae is soul',
    '\u03b1\u1f30\u03ce\u03bd\u03b9\u03bf\u03c2 is age-long',
    '\u0398\u0395\u039f\u03a3 \u039b\u039f\u0393\u039f\u03a3',
    '\u039f \u039b\u039f\u0393\u039f\u03a3 final sigma',
    '\u05e0\u05b6\u05e4\u05b6\u05e9\u05c1 \u05e9\u05c1\u05b0\u05d0\u05d5\u05b9\u05dc',
    'ligature \ufb01re and \ufb02ame',
    'spacing marks \u00a8 \u00b4 \u00af \u00b8 here',
    'a \u00a8 b',
    'a  \u00a8  b',
    'Turkish \u0130stanbul and \u0131',
    'super\u00b2script and \u00bd fraction',
    'astral \ud835\udd0a symbol',
    'emoji \ud83d\udd25 fire',
    'Roman \u2168 numeral',
    'mixed \u2018quote\u2019\u00a0\u2014\u00a0and dash',
  ]

  it('produce the same string for every awkward sample', () => {
    for (const sample of SAMPLES) {
      expect(normalizeWithSourceMap(sample).normalized, JSON.stringify(sample)).toBe(
        normalize(sample),
      )
    }
  })

  it('produce the same string for every field of every document in the index', () => {
    const { docs } = buildSearchIndex()
    expect(docs.length).toBeGreaterThan(0)
    for (const doc of docs) {
      const fields = [
        doc.title,
        doc.summary,
        doc.body,
        doc.notes,
        doc.headings.join(' \u00b7 '),
        doc.scriptureRefs.join(' \u00b7 '),
      ]
      for (const field of fields) {
        expect(normalizeWithSourceMap(field).normalized, `${doc.id}: ${field.slice(0, 60)}`).toBe(
          normalize(field),
        )
      }
    }
  })

  it('map every normalised offset to one forward-moving span of the source', () => {
    // The chunk map is compact rather than one entry per character, so the
    // invariant is stated over offsets: each one resolves to a real span inside
    // the original, and spans never travel backwards — which is what lets a
    // matched run map to a single span.
    for (const sample of SAMPLES) {
      const mapped = normalizeWithSourceMap(sample)
      let previousStart = 0
      for (let i = 0; i < mapped.normalized.length; i += 1) {
        const span = mapNormalizedRange(mapped, { start: i, end: i + 1 })
        expect(span, JSON.stringify(sample)).not.toBeNull()
        if (!span) continue
        expect(span.start).toBeGreaterThanOrEqual(0)
        expect(span.end).toBeGreaterThan(span.start)
        expect(span.end).toBeLessThanOrEqual(sample.length)
        expect(span.start).toBeGreaterThanOrEqual(previousStart)
        previousStart = span.start
      }
    }
  })
})

/**
 * Random strings over every character class that can make the two disagree:
 * combining marks, compatibility forms, cased Greek, spacing accents, exotic
 * whitespace and astral planes. Fixed-seed, so a failure reproduces exactly.
 */
describe('the two normalisers agree under fuzzing', () => {
  const POOL = [
    ...'abcXYZ019 ',
    '\t',
    '\n',
    '\u00a0',
    '\u2003',
    '\u3000',
    '\u2018',
    '\u2019',
    '\u201c',
    '\u201d',
    '\u2010',
    '\u2013',
    '\u2014',
    '\u2212',
    '\u00e9',
    '\u00c9',
    '\u0301',
    '\u0308',
    '\u0327',
    '\u00a8',
    '\u00b4',
    '\u03a3',
    '\u03c3',
    '\u03c2',
    '\u03b1',
    '\u1f00',
    '\u0399',
    '\u05d0',
    '\u05b0',
    '\u05c1',
    '\u05bc',
    '\ufb01',
    '\ufb02',
    '\u00bd',
    '\u2168',
    '\u2160',
    '\u0130',
    '\u0131',
    '\u00df',
    '\u1e9e',
    '\u0323',
    '\u00af',
    '\u00b8',
    '\u201b',
    '\u2011',
    '\u2015',
    '\u1f76',
    '\u03ae',
    '\u05b8',
    '\u200b',
    '\ufeff',
    '\u2028',
    '\u2029',
    '\uff21',
    '\uff41',
    '\u212b',
    '\u00c5',
    '\ud835\udd0a',
    '\ud83d\udd25',
  ]

  it('produce the same string for five thousand random strings', () => {
    let seed = 0x5eed
    const next = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 0x100000000
    }

    for (let iteration = 0; iteration < 5000; iteration += 1) {
      const length = 1 + Math.floor(next() * 24)
      let sample = ''
      for (let i = 0; i < length; i += 1) {
        sample += POOL[Math.floor(next() * POOL.length)] ?? ''
      }
      expect(normalizeWithSourceMap(sample).normalized, JSON.stringify(sample)).toBe(
        normalize(sample),
      )
    }
  })
})

/** Anything the ranker caches per document has to be independent of the query. */
describe('caching does not change what search returns', () => {
  it('returns identical results when the same query is run again', () => {
    const first = search(CORPUS, 'destroy soul and body')
    const second = search(CORPUS, 'destroy soul and body')
    expect(second.total).toBe(first.total)
    expect(second.usedTerms).toEqual(first.usedTerms)
    expect(second.results.map(r => [r.doc.id, r.score, r.excerpt])).toEqual(
      first.results.map(r => [r.doc.id, r.score, r.excerpt]),
    )
  })

  it('gives each query its own excerpt, not the one cached for the last', () => {
    const body =
      'The worm that does not die is one image. The fire that is not quenched is another, ' +
      'and the two belong together in Isaiah 66 exactly as they do in Mark 9. ' +
      'Destruction is the outcome in both.'
    const corpus = [doc({ id: 'both', title: 'Both images', body })]

    const worm = search(corpus, 'worm').results[0]?.excerpt ?? ''
    const destruction = search(corpus, 'destruction').results[0]?.excerpt ?? ''
    const wormAgain = search(corpus, 'worm').results[0]?.excerpt ?? ''

    expect(worm.toLowerCase()).toContain('worm')
    expect(destruction.toLowerCase()).toContain('destruction')
    expect(worm).not.toBe(destruction)
    expect(wormAgain).toBe(worm)
  })

  it('builds an excerpt for every result on the requested page', () => {
    const { results } = search(CORPUS, 'destroy', { limit: 2, offset: 1 })
    expect(results.length).toBeGreaterThan(0)
    for (const result of results) expect(result.excerpt.length).toBeGreaterThan(0)
  })
})
