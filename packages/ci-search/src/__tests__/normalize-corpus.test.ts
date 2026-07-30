import { describe, expect, it } from 'vitest'
import { buildSearchIndex } from '../build-index'
import { normalize, normalizeWithSourceMap, toGraphemes } from '../normalize-with-source-map'

/**
 * The mapped normaliser against the whole real corpus.
 *
 * `normalize()` is a whole-string pipeline and `normalizeWithSourceMap()` walks
 * grapheme clusters. They are two independent implementations of the same
 * transformation, and ranking is defined by the first one. Running both over
 * every field of every indexed document — 54,000 words of authored prose, the
 * Scripture references, the Greek and Hebrew language notes, the transcript —
 * is what makes "the source map did not move ranking" a checked fact rather
 * than an argument.
 */

const index = buildSearchIndex()

/** Every string the ranker ever normalises, exactly as `fieldsOf` composes it. */
function* corpusStrings(): Generator<{ label: string; text: string }> {
  for (const doc of index.docs) {
    yield { label: `${doc.id}:title`, text: doc.title }
    yield { label: `${doc.id}:id`, text: [doc.sectionId ?? '', ...doc.aliases].join(' ') }
    yield { label: `${doc.id}:summary`, text: doc.summary }
    yield { label: `${doc.id}:headings`, text: doc.headings.join(' · ') }
    yield { label: `${doc.id}:scripture`, text: doc.scriptureRefs.join(' · ') }
    yield { label: `${doc.id}:body`, text: doc.body }
    yield { label: `${doc.id}:notes`, text: doc.notes }
    yield { label: `${doc.id}:breadcrumb`, text: doc.breadcrumb }
  }
}

describe('normalisation over the real content index', () => {
  it('indexes enough documents for this to mean something', () => {
    expect(index.docs.length).toBeGreaterThan(150)
  })

  it('agrees between the whole-string and the mapped implementation on every field', () => {
    const disagreements: string[] = []
    for (const { label, text } of corpusStrings()) {
      if (normalizeWithSourceMap(text).normalized !== normalize(text)) disagreements.push(label)
    }
    expect(disagreements).toEqual([])
  })

  it('keeps every mapped chunk inside its source and on grapheme boundaries', () => {
    const problems: string[] = []
    for (const { label, text } of corpusStrings()) {
      if (!text) continue
      const mapped = normalizeWithSourceMap(text)
      const boundaries = new Set<number>([0])
      let offset = 0
      for (const grapheme of toGraphemes(text)) {
        offset += grapheme.length
        boundaries.add(offset)
      }
      let expectedStart = 0
      for (const chunk of mapped.chunks) {
        if (chunk.normalizedStart !== expectedStart) problems.push(`${label}: gap`)
        if (!boundaries.has(chunk.sourceStart)) problems.push(`${label}: start off grapheme`)
        if (!boundaries.has(chunk.sourceEnd)) problems.push(`${label}: end off grapheme`)
        if (chunk.sourceEnd > text.length) problems.push(`${label}: past end`)
        expectedStart = chunk.normalizedEnd
      }
      if (expectedStart !== mapped.normalized.length) problems.push(`${label}: short`)
    }
    expect(problems.slice(0, 10)).toEqual([])
  })
})
