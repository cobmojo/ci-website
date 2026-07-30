import { describe, expect, it } from 'vitest'
import {
  buildExcerpt,
  buildExcerptCandidate,
  CANDIDATE_MAX_LENGTH,
  CANDIDATE_MIN_LENGTH,
  collapseWhitespace,
  type ExcerptSource,
} from '../excerpt'

const WORD = 'destruction '
/** Long enough that a window has to omit text on both sides. */
const FILLER = WORD.repeat(120).trim()

function body(text: string): ExcerptSource[] {
  return [
    { field: 'summary', text: '' },
    { field: 'body', text },
  ]
}

describe('collapseWhitespace', () => {
  it('single-spaces and trims for white-space: normal', () => {
    expect(collapseWhitespace('  a \t\n b \r\n c  ')).toBe('a b c')
  })

  it('leaves already-single-spaced text alone', () => {
    expect(collapseWhitespace('a b c')).toBe('a b c')
  })

  it('leaves a non-breaking space exactly as the author wrote it', () => {
    // CSS does not collapse U+00A0 and does not let a line break at one. It is
    // in JavaScript's whitespace class, so collapsing with that class would
    // quietly turn a reference the author deliberately held together into one
    // a browser may split across two lines.
    const nbsp = String.fromCharCode(0x00a0)
    expect(collapseWhitespace(`Matthew${nbsp}10:28`)).toBe(`Matthew${nbsp}10:28`)
    expect(collapseWhitespace(`a${nbsp}${nbsp}b`)).toBe(`a${nbsp}${nbsp}b`)
    // A collapsible run beside one still collapses; the no-break space stays.
    expect(collapseWhitespace(`a  ${nbsp} b`)).toBe(`a ${nbsp} b`)
  })

  it('leaves the fixed-width spaces alone for the same reason', () => {
    const enQuad = String.fromCharCode(0x2000)
    const ideographic = String.fromCharCode(0x3000)
    expect(collapseWhitespace(`a${enQuad}b`)).toBe(`a${enQuad}b`)
    expect(collapseWhitespace(`a${ideographic}b`)).toBe(`a${ideographic}b`)
  })

  it('collapses every whitespace character CSS does collapse', () => {
    for (const code of [0x20, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x2028, 0x2029]) {
      const ws = String.fromCharCode(code)
      expect(collapseWhitespace(`a${ws}${ws}b`), `U+${code.toString(16)}`).toBe('a b')
      expect(collapseWhitespace(`${ws}a${ws}`), `U+${code.toString(16)}`).toBe('a')
    }
  })

  it('does not orphan a combining mark that follows a space', () => {
    const text = `a ́b`
    expect(collapseWhitespace(text)).toContain('́')
  })

  it('returns an empty string for whitespace only', () => {
    expect(collapseWhitespace('   \n\t ')).toBe('')
  })

  /*
   * A space carrying a combining mark is a single grapheme cluster, so it is
   * not wholly collapsible and cannot be dropped. CSS still collapses the run
   * it belongs to down to one space, keeping the mark on the survivor — and
   * the candidate this produces is measured character for character, so an
   * extra space is a line the browser will not draw where we predicted it.
   */
  it('collapses a run that ends in a space carrying a combining mark', () => {
    expect(collapseWhitespace('alpha  ̈beta')).toBe('alpha ̈beta')
    expect(collapseWhitespace('alpha ̈beta')).toBe('alpha ̈beta')
  })

  it('drops a leading space even when it carries a combining mark', () => {
    // Left in place it becomes a leading space in the excerpt, which the
    // window logic then reads as a word boundary at offset zero.
    expect(collapseWhitespace(' ́word')).toBe('́word')
  })
})

describe('buildExcerpt', () => {
  it('centres on a match near the middle and ellipsises both sides', () => {
    const text = `${FILLER} unquenchable fire ${FILLER}`
    const excerpt = buildExcerpt(body(text), ['unquenchable fire'])
    expect(excerpt.text.startsWith('…')).toBe(true)
    expect(excerpt.text.endsWith('…')).toBe(true)
    expect(excerpt.text).toContain('unquenchable fire')
    expect(excerpt.sourceField).toBe('body')
  })

  it('does not add a leading ellipsis when the match is at the beginning', () => {
    const text = `Unquenchable fire opens this section. ${FILLER}`
    const excerpt = buildExcerpt(body(text), ['unquenchable fire'])
    expect(excerpt.text.startsWith('…')).toBe(false)
    expect(excerpt.text.endsWith('…')).toBe(true)
  })

  it('does not add a trailing ellipsis when the match is at the end', () => {
    const text = `${FILLER} and then unquenchable fire`
    const excerpt = buildExcerpt(body(text), ['unquenchable fire'])
    expect(excerpt.text.startsWith('…')).toBe(true)
    expect(excerpt.text.endsWith('…')).toBe(false)
  })

  it('adds no ellipsis at all when the whole source fits', () => {
    const excerpt = buildExcerpt(body('The fire is not quenched.'), ['fire'])
    expect(excerpt.text).toBe('The fire is not quenched.')
    expect(excerpt.omittedBefore).toBe(false)
    expect(excerpt.omittedAfter).toBe(false)
  })

  it('marks the match at offsets that slice the excerpt text', () => {
    const text = `${FILLER} unquenchable fire ${FILLER}`
    const excerpt = buildExcerpt(body(text), ['unquenchable fire'])
    expect(excerpt.matchRanges.length).toBeGreaterThan(0)
    for (const range of excerpt.matchRanges) {
      expect(excerpt.text.slice(range.start, range.end)).toBe('unquenchable fire')
    }
  })

  it('keeps whole words at both cut points', () => {
    const text = `${FILLER} unquenchable fire ${FILLER}`
    const excerpt = buildExcerpt(body(text), ['unquenchable fire'])
    const inner = excerpt.text.replace(/^…/, '').replace(/…$/, '')
    // Every word in the window is a complete word from the source.
    for (const word of inner.split(' ')) {
      if (word) expect(`${FILLER} unquenchable fire ${FILLER}`).toContain(word)
    }
    expect(inner.startsWith('destruction')).toBe(true)
  })

  it('prefers the summary when the summary is what matched', () => {
    const sources: ExcerptSource[] = [
      { field: 'summary', text: 'Whether eternal punishment names a result or an activity.' },
      { field: 'body', text: FILLER },
    ]
    const excerpt = buildExcerpt(sources, ['eternal punishment'])
    expect(excerpt.sourceField).toBe('summary')
    expect(excerpt.text).toContain('eternal punishment')
  })

  it('falls through to the body when the summary does not match', () => {
    const sources: ExcerptSource[] = [
      { field: 'summary', text: 'A short thesis.' },
      { field: 'body', text: `${FILLER} unquenchable fire ${FILLER}` },
    ]
    expect(buildExcerpt(sources, ['unquenchable fire']).sourceField).toBe('body')
  })

  it('uses the transcript field for a transcript document', () => {
    const sources: ExcerptSource[] = [
      { field: 'summary', text: 'Video overview.' },
      { field: 'transcript', text: 'For thirty years I was taught the traditional view.' },
    ]
    const excerpt = buildExcerpt(sources, ['traditional view'])
    expect(excerpt.sourceField).toBe('transcript')
  })

  it('uses the notes field when only the notes match', () => {
    const sources: ExcerptSource[] = [
      { field: 'summary', text: 'A short thesis.' },
      { field: 'body', text: 'Ordinary prose.' },
      { field: 'notes', text: 'This source is cited for its treatment of apollumi.' },
    ]
    expect(buildExcerpt(sources, ['apollumi']).sourceField).toBe('notes')
  })

  it('uses the Scripture field when only the references match', () => {
    const sources: ExcerptSource[] = [
      { field: 'summary', text: 'A short thesis.' },
      { field: 'body', text: 'Ordinary prose.' },
      { field: 'scripture', text: 'Matthew 10:28 · Luke 12:4-5' },
    ]
    expect(buildExcerpt(sources, ['matthew 10:28']).sourceField).toBe('scripture')
  })

  it('returns a head excerpt with no ranges when nothing in the body matched', () => {
    const excerpt = buildExcerpt(body(FILLER), ['nowhere'])
    expect(excerpt.matchRanges).toEqual([])
    expect(excerpt.text.startsWith('destruction')).toBe(true)
    expect(excerpt.text.endsWith('…')).toBe(true)
    expect(excerpt.omittedBefore).toBe(false)
  })

  it('returns an empty excerpt when there is no source text at all', () => {
    const excerpt = buildExcerpt([{ field: 'body', text: '' }], ['fire'])
    expect(excerpt.text).toBe('')
    expect(excerpt.matchRanges).toEqual([])
    expect(excerpt.sourceField).toBeNull()
  })

  it('never splits a grapheme at a window edge', () => {
    const text = `${'👨‍👩‍👧‍👦 '.repeat(80)}unquenchable fire ${'👨‍👩‍👧‍👦 '.repeat(80)}`
    const excerpt = buildExcerpt(body(text), ['unquenchable fire'])
    expect(excerpt.text).toContain('unquenchable fire')
    // A split family emoji would leave a lone surrogate or a bare ZWJ.
    expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(excerpt.text)).toBe(false)
    expect(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(excerpt.text)).toBe(false)
  })

  /*
   * The whole-word cut is a refinement, not a mandate. When the window holds
   * no space, `lastIndexOf` walks all the way back to offset zero — and in the
   * no-match head path, where the anchor is the empty range at zero, that
   * collapses the window to nothing and leaves an excerpt of one ellipsis.
   */
  it('keeps a head excerpt when the text holds no word boundary to cut on', () => {
    const excerpt = buildExcerpt(body(`A ${'x'.repeat(400)}`), ['nomatchhere'])
    expect(excerpt.text).not.toBe('…')
    expect(excerpt.text.length).toBeGreaterThan(100)
  })

  it('keeps a head excerpt when a leading cluster survives collapsing', () => {
    const excerpt = buildExcerpt(body(` ́${'x'.repeat(400)}`), ['nomatchhere'])
    expect(excerpt.text.length).toBeGreaterThan(100)
  })

  /*
   * The dangling-space trim runs after the grapheme snap, so it has to respect
   * boundaries itself. A space carrying a combining mark is one cluster, and
   * stepping into it strands the mark on the leading ellipsis.
   */
  it('never leaves a combining mark stranded on the leading ellipsis', () => {
    const text = `${'x'.repeat(104)} ́word target-here rest of the sentence continues on`
    const excerpt = buildExcerpt(body(text), ['target-here'])
    expect(excerpt.text).toContain('target-here')
    expect(/^…\p{M}/u.test(excerpt.text)).toBe(false)
  })

  it('single-spaces a source that carries newlines', () => {
    const excerpt = buildExcerpt(body('The worm\n\n  that does not\tdie.'), ['worm'])
    expect(excerpt.text).toBe('The worm that does not die.')
  })

  it('is deterministic', () => {
    const text = `${FILLER} unquenchable fire ${FILLER} unquenchable fire ${FILLER}`
    const first = buildExcerpt(body(text), ['unquenchable fire'])
    const second = buildExcerpt(body(text), ['unquenchable fire'])
    expect(first).toEqual(second)
  })
})

describe('buildExcerptCandidate', () => {
  const longText = `${FILLER} unquenchable fire ${FILLER}`

  it('produces a longer window than the fallback excerpt', () => {
    const fallback = buildExcerpt(body(longText), ['unquenchable fire'])
    const candidate = buildExcerptCandidate(body(longText), ['unquenchable fire'])
    expect(candidate).not.toBeNull()
    expect((candidate?.text.length ?? 0) > fallback.text.length).toBe(true)
  })

  it('stays inside the documented length bounds for ordinary prose', () => {
    const candidate = buildExcerptCandidate(body(longText), ['unquenchable fire'])
    expect(candidate?.text.length).toBeGreaterThanOrEqual(CANDIDATE_MIN_LENGTH)
    expect(candidate?.text.length).toBeLessThanOrEqual(CANDIDATE_MAX_LENGTH)
  })

  it('carries at least one exact mapped match range', () => {
    const candidate = buildExcerptCandidate(body(longText), ['unquenchable fire'])
    expect(candidate?.matchRanges.length).toBeGreaterThan(0)
    for (const range of candidate?.matchRanges ?? []) {
      expect(candidate?.text.slice(range.start, range.end)).toBe('unquenchable fire')
    }
  })

  it('carries no ellipsis in its text, only the omission flags', () => {
    const candidate = buildExcerptCandidate(body(longText), ['unquenchable fire'])
    expect(candidate?.text).not.toContain('…')
    expect(candidate?.omittedBefore).toBe(true)
    expect(candidate?.omittedAfter).toBe(true)
  })

  it('reports no omission when the whole source fits', () => {
    const short = 'The fire is not quenched and the worm does not die.'
    const candidate = buildExcerptCandidate(body(short), ['fire'])
    expect(candidate?.text).toBe(short)
    expect(candidate?.omittedBefore).toBe(false)
    expect(candidate?.omittedAfter).toBe(false)
  })

  it('is single-spaced and trimmed', () => {
    const candidate = buildExcerptCandidate(body(`  The\n\nfire   burns  `), ['fire'])
    expect(candidate?.text).toBe('The fire burns')
  })

  it('returns null when no field carries a match', () => {
    expect(buildExcerptCandidate(body(FILLER), ['nowhere'])).toBeNull()
  })

  it('returns null when there is no source text', () => {
    expect(buildExcerptCandidate([{ field: 'body', text: '' }], ['fire'])).toBeNull()
  })

  it('names the field it came from', () => {
    expect(buildExcerptCandidate(body(longText), ['unquenchable fire'])?.sourceField).toBe('body')
  })

  it('is deterministic', () => {
    const text = `${FILLER} unquenchable fire ${FILLER} unquenchable fire ${FILLER}`
    expect(buildExcerptCandidate(body(text), ['unquenchable fire'])).toEqual(
      buildExcerptCandidate(body(text), ['unquenchable fire']),
    )
  })

  it('stays bounded on a very long body, wherever the match sits in it', () => {
    // A hundred thousand characters, far past any real section. The candidate
    // is the same size and shape whether the match is at the start or the end,
    // which is what "the excerpt does not depend on the length of the article"
    // means in practice.
    const filler = 'destruction and perishing follow. '.repeat(3000)
    const atStart = buildExcerptCandidate(body(`unquenchable fire ${filler}`), [
      'unquenchable fire',
    ])
    const atEnd = buildExcerptCandidate(body(`${filler} unquenchable fire`), ['unquenchable fire'])

    for (const candidate of [atStart, atEnd]) {
      expect(candidate).not.toBeNull()
      expect(candidate?.text.length).toBeLessThanOrEqual(CANDIDATE_MAX_LENGTH)
      expect(candidate?.text).toContain('unquenchable fire')
      const range = candidate?.matchRanges[0]
      expect(candidate?.text.slice(range?.start, range?.end)).toBe('unquenchable fire')
    }
    expect(atStart?.omittedBefore).toBe(false)
    expect(atStart?.omittedAfter).toBe(true)
    expect(atEnd?.omittedBefore).toBe(true)
    expect(atEnd?.omittedAfter).toBe(false)
  })

  it('picks the same field the fallback excerpt picked', () => {
    const sources: ExcerptSource[] = [
      { field: 'summary', text: 'Whether eternal punishment names a result.' },
      { field: 'body', text: `${FILLER} eternal punishment ${FILLER}` },
    ]
    expect(buildExcerptCandidate(sources, ['eternal punishment'])?.sourceField).toBe(
      buildExcerpt(sources, ['eternal punishment']).sourceField,
    )
  })
})
