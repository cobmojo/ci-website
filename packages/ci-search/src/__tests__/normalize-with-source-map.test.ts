import { describe, expect, it } from 'vitest'
import {
  mapNormalizedRange,
  normalize,
  normalizeWithSourceMap,
  toGraphemes,
} from '../normalize-with-source-map'

/**
 * The oracle.
 *
 * This is the whole-string normalisation the ranker used before the source map
 * existed. `normalize()` has to keep agreeing with it character for character,
 * because the field weights, the phrase bonus and the exact-title boost are all
 * defined in terms of the string it produces. If the two ever diverge, ranking
 * has silently moved.
 */
function legacyNormalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every string the suite normalises, in one place, so both halves see it all. */
const SAMPLES: readonly string[] = [
  '',
  '   ',
  'plain ascii text',
  'Unquenchable Fire',
  'The soul’s destruction',
  '“Eternal punishment” is a result',
  'aionios ‛quoted‛',
  'en–dash and em—dash and ‐hyphen and non‑breaking and −minus and ―bar and ‒figure',
  '  leading and trailing  ',
  'tabs\tand\nnewlines\r\nand\fform feeds',
  'double  spaces   collapse',
  'non breaking spaces',
  'zero​width​space stays',
  'soft­hyphen stays',
  'é precomposed é both',
  'Mañana mañana',
  '﻿bom at the front',
  'emoji 🚀 and 👨‍👩‍👧‍👦 family',
  'astral 𝔄𝔟 letters',
  'ΑΙΩΝΙΟΣ uppercase greek ending in sigma',
  'ΑΣ ΒΣ ΓΣΔ mixed sigma',
  'αἰώνιος lowercase greek',
  'נֶפֶשׁ hebrew',
  'ligature ﬁre and ﬂame',
  'roman Ⅸ numeral',
  'fraction ½ and superscript ²',
  'arabic ligature ﷺ inside',
  'CJK 春天到了 text',
  ',,,,|||\\\\\\ repeated symbols',
  'Matthew 10:28',
  'S04',
  'Sodom',
  'second death',
  '   \t\n   ',
  'x',
  '​',
]

describe('normalize', () => {
  it.each(SAMPLES)('agrees with the legacy whole-string pipeline for %j', sample => {
    expect(normalize(sample)).toBe(legacyNormalise(sample))
  })
})

describe('normalizeWithSourceMap', () => {
  it.each(SAMPLES)('produces the same normalised string as normalize() for %j', sample => {
    expect(normalizeWithSourceMap(sample).normalized).toBe(normalize(sample))
  })

  it('maps a normalised match back to the exact source substring', () => {
    const source = 'The soul’s destruction is final.'
    const mapped = normalizeWithSourceMap(source)
    const start = mapped.normalized.indexOf("soul's")
    expect(start).toBeGreaterThan(-1)

    const range = mapNormalizedRange(mapped, { start, end: start + "soul's".length })
    expect(range).not.toBeNull()
    expect(source.slice(range?.start, range?.end)).toBe('soul’s')
  })

  it('returns null for an empty range and for a range past the end', () => {
    const mapped = normalizeWithSourceMap('anything at all')
    expect(mapNormalizedRange(mapped, { start: 3, end: 3 })).toBeNull()
    expect(mapNormalizedRange(mapped, { start: 5, end: 2 })).toBeNull()
    expect(mapNormalizedRange(mapped, { start: 900, end: 901 })).toBeNull()
    expect(mapNormalizedRange(normalizeWithSourceMap(''), { start: 0, end: 1 })).toBeNull()
  })
})

/** Grapheme boundaries of a string, as a set of offsets that may be sliced at. */
function graphemeBoundaries(source: string): Set<number> {
  const boundaries = new Set<number>([0])
  let offset = 0
  for (const grapheme of toGraphemes(source)) {
    offset += grapheme.length
    boundaries.add(offset)
  }
  return boundaries
}

describe('source-map invariants', () => {
  it.each(SAMPLES)('lands every mapped boundary on a grapheme boundary for %j', sample => {
    const mapped = normalizeWithSourceMap(sample)
    const boundaries = graphemeBoundaries(sample)

    // Every single-character window, and every window from each start to the
    // end, so both edges of the map are exercised at every offset.
    for (let start = 0; start < mapped.normalized.length; start += 1) {
      for (const end of [start + 1, mapped.normalized.length]) {
        const range = mapNormalizedRange(mapped, { start, end })
        if (range === null) continue
        expect(boundaries.has(range.start)).toBe(true)
        expect(boundaries.has(range.end)).toBe(true)
        expect(range.end).toBeGreaterThan(range.start)
        expect(range.end).toBeLessThanOrEqual(sample.length)
      }
    }
  })

  it.each(SAMPLES)('never slices a lone surrogate out of %j', sample => {
    const mapped = normalizeWithSourceMap(sample)
    for (let start = 0; start < mapped.normalized.length; start += 1) {
      const range = mapNormalizedRange(mapped, { start, end: start + 1 })
      if (range === null) continue
      const slice = sample.slice(range.start, range.end)
      expect(slice).toBe(slice.normalize('NFC').length === 0 ? slice : slice)
      for (let i = 0; i < slice.length; i += 1) {
        const code = slice.charCodeAt(i)
        if (code >= 0xd800 && code <= 0xdbff) {
          const next = slice.charCodeAt(i + 1)
          expect(next >= 0xdc00 && next <= 0xdfff).toBe(true)
          i += 1
        } else {
          expect(code >= 0xdc00 && code <= 0xdfff).toBe(false)
        }
      }
    }
  })

  it('keeps chunks sorted, gapless and inside both strings', () => {
    for (const sample of SAMPLES) {
      const mapped = normalizeWithSourceMap(sample)
      let expectedNormalizedStart = 0
      let previousSourceStart = 0
      for (const chunk of mapped.chunks) {
        expect(chunk.normalizedStart).toBe(expectedNormalizedStart)
        expect(chunk.normalizedEnd).toBeGreaterThan(chunk.normalizedStart)
        expect(chunk.sourceEnd).toBeGreaterThan(chunk.sourceStart)
        expect(chunk.sourceStart).toBeGreaterThanOrEqual(previousSourceStart)
        expect(chunk.sourceEnd).toBeLessThanOrEqual(sample.length)
        if (chunk.oneToOne) {
          expect(chunk.sourceEnd - chunk.sourceStart).toBe(
            chunk.normalizedEnd - chunk.normalizedStart,
          )
        }
        expectedNormalizedStart = chunk.normalizedEnd
        previousSourceStart = chunk.sourceStart
      }
      expect(expectedNormalizedStart).toBe(mapped.normalized.length)
    }
  })

  it('maps a collapsed whitespace run back to the whole run', () => {
    const source = 'one \t\n  two'
    const mapped = normalizeWithSourceMap(source)
    expect(mapped.normalized).toBe('one two')
    const range = mapNormalizedRange(mapped, { start: 3, end: 4 })
    expect(source.slice(range?.start, range?.end)).toBe(' \t\n  ')
  })

  it('cannot let trimmed whitespace shift a later offset', () => {
    const source = '   \n Unquenchable fire.   '
    const mapped = normalizeWithSourceMap(source)
    expect(mapped.normalized).toBe('unquenchable fire.')
    const start = mapped.normalized.indexOf('fire')
    const range = mapNormalizedRange(mapped, { start, end: start + 4 })
    expect(source.slice(range?.start, range?.end)).toBe('fire')
  })

  it('maps an NFKD expansion back to the single source grapheme', () => {
    const mapped = normalizeWithSourceMap('the ﬁre')
    expect(mapped.normalized).toBe('the fire')
    // `fi` in the normalised string is one `ﬁ` in the source.
    const range = mapNormalizedRange(mapped, { start: 4, end: 5 })
    expect(mapped.source.slice(range?.start, range?.end)).toBe('ﬁ')
  })

  it('maps a lowercase expansion back to the single source grapheme', () => {
    const mapped = normalizeWithSourceMap('İstanbul')
    // `İ` lowercases to `i` plus a combining dot above.
    const range = mapNormalizedRange(mapped, { start: 0, end: 1 })
    expect(mapped.source.slice(range?.start, range?.end)).toBe('İ')
  })

  it('matches a straight apostrophe against a curly one without corrupting the source', () => {
    const source = 'The soul’s end and the body’s end'
    const mapped = normalizeWithSourceMap(source)
    const offsets: number[] = []
    let at = mapped.normalized.indexOf("'s")
    while (at !== -1) {
      offsets.push(at)
      at = mapped.normalized.indexOf("'s", at + 1)
    }
    expect(offsets).toHaveLength(2)
    for (const offset of offsets) {
      const range = mapNormalizedRange(mapped, { start: offset, end: offset + 2 })
      expect(source.slice(range?.start, range?.end)).toBe('’s')
    }
  })

  it.each([
    ['‐', 'hyphen'],
    ['‑', 'non-breaking hyphen'],
    ['‒', 'figure dash'],
    ['–', 'en dash'],
    ['—', 'em dash'],
    ['―', 'horizontal bar'],
    ['−', 'minus sign'],
  ])('folds %j (%s) to a hyphen and maps it back', dash => {
    const source = `body${dash}soul`
    const mapped = normalizeWithSourceMap(source)
    expect(mapped.normalized).toBe('body-soul')
    const range = mapNormalizedRange(mapped, { start: 4, end: 5 })
    expect(source.slice(range?.start, range?.end)).toBe(dash)
  })

  it('keeps an emoji sequence whole', () => {
    const source = 'family 👨‍👩‍👧‍👦 here'
    const mapped = normalizeWithSourceMap(source)
    const start = mapped.normalized.indexOf('👨')
    const range = mapNormalizedRange(mapped, { start, end: start + 2 })
    expect(source.slice(range?.start, range?.end)).toBe('👨‍👩‍👧‍👦')
  })

  it('treats a precomposed and a decomposed accent as the same normalised text', () => {
    // Same word, spelled two ways: U+00E9, and `e` plus U+0301.
    const precomposed = normalizeWithSourceMap('aionios é')
    const decomposed = normalizeWithSourceMap('aionios é')
    expect(precomposed.normalized).toBe(decomposed.normalized)
    expect(precomposed.normalized.endsWith('é')).toBe(true)

    // The accented character is the last two units of the normalised string.
    const range = { start: precomposed.normalized.length - 2, end: precomposed.normalized.length }
    const fromPrecomposed = mapNormalizedRange(precomposed, range)
    const fromDecomposed = mapNormalizedRange(decomposed, range)
    expect(precomposed.source.slice(fromPrecomposed?.start, fromPrecomposed?.end)).toBe('é')
    expect(decomposed.source.slice(fromDecomposed?.start, fromDecomposed?.end)).toBe('é')
  })
})
