import type { TranscriptCue } from '@ci/content-schema'
import { describe, expect, it, vi } from 'vitest'
import { cuesToParagraphs, transcriptSegments } from '../transcript'

/**
 * A stand-in for the real video record.
 *
 * The published chapters happen to cover the whole running time with no gaps,
 * so the real data never reaches the branch that rescues uncovered cues. That
 * branch is the whole reason `transcriptSegments` is not just a `map` over the
 * chapters, so the fixture deliberately leaves two stretches uncovered: one
 * between chapters, and one after the last chapter ends.
 */
const fixture = vi.hoisted(() => {
  const chapters = [
    { id: 'opening', start: 0, end: 20, title: 'Opening the case', sectionIds: [] },
    // 20 to 40 belongs to no chapter.
    { id: 'middle', start: 40, end: 60, title: 'The primary passage', sectionIds: ['S04'] },
    // Nothing covers 60 to the end of the video.
  ]

  const cues = [
    { start: 0.5, duration: 5, text: 'One.' },
    { start: 10, duration: 5, text: 'Two.' },
    { start: 22.5, duration: 4, text: 'Three.' },
    { start: 30, duration: 4, text: 'Four.' },
    { start: 45, duration: 5, text: 'Five.' },
    { start: 70, duration: 6, text: 'Six.' },
    // Runs four seconds past the end of the video, as a final cue often does.
    { start: 98, duration: 10, text: 'Seven.' },
  ]

  return { chapters, cues, durationSeconds: 100 }
})

vi.mock('@ci/content/video', () => ({
  video: {
    durationSeconds: fixture.durationSeconds,
    chapters: fixture.chapters,
    cues: fixture.cues,
  },
  cuesForChapter: (chapterId: string) => {
    const chapter = fixture.chapters.find(c => c.id === chapterId)
    if (!chapter) return []
    return fixture.cues.filter(cue => cue.start >= chapter.start && cue.start < chapter.end)
  },
}))

describe('transcriptSegments', () => {
  it('emits one segment per chapter, carrying the chapter itself', () => {
    const chapters = transcriptSegments().filter(segment => segment.chapter !== undefined)
    expect(chapters.map(segment => segment.id)).toEqual(['opening', 'middle'])
    expect(chapters.map(segment => segment.title)).toEqual([
      'Opening the case',
      'The primary passage',
    ])
    expect(chapters[1]?.chapter?.sectionIds).toEqual(['S04'])
  })

  it('gives a chapter segment the cues that fall inside it', () => {
    const opening = transcriptSegments().find(segment => segment.id === 'opening')
    expect(opening?.cues.map(cue => cue.text)).toEqual(['One.', 'Two.'])
  })

  it('rescues cues no chapter covers into a segment of their own', () => {
    const gap = transcriptSegments().find(segment => segment.id === 'transcript-from-22')
    expect(gap?.cues.map(cue => cue.text)).toEqual(['Three.', 'Four.'])
    expect(gap?.chapter).toBeUndefined()
    expect(gap?.title).toBe('Continuing from 0:22')
    expect(gap?.start).toBe(22)
    expect(gap?.end).toBe(34)
  })

  it('starts a separate segment for each run of uncovered cues', () => {
    const gaps = transcriptSegments().filter(segment => segment.chapter === undefined)
    expect(gaps.map(segment => segment.id)).toEqual(['transcript-from-22', 'transcript-from-70'])
  })

  it('clamps a segment end to the running time of the video', () => {
    const trailing = transcriptSegments().find(segment => segment.id === 'transcript-from-70')
    // The last cue ends at 108, past the 100-second video.
    expect(trailing?.end).toBe(fixture.durationSeconds)
    expect(trailing?.title).toBe('Continuing from 1:10')
  })

  it('returns segments in playback order, gaps interleaved with chapters', () => {
    const segments = transcriptSegments()
    expect(segments.map(segment => segment.id)).toEqual([
      'opening',
      'transcript-from-22',
      'middle',
      'transcript-from-70',
    ])
    const starts = segments.map(segment => segment.start)
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  /**
   * The published transcript claims to be complete, on the page and in the
   * downloadable text file. Both read this function, so a dropped cue is a
   * silently incomplete transcript rather than a visible error.
   */
  it('publishes every cue exactly once', () => {
    const published = transcriptSegments().flatMap(segment => segment.cues)
    expect(published).toHaveLength(fixture.cues.length)
    expect(published.map(cue => cue.text)).toEqual(fixture.cues.map(cue => cue.text))
  })
})

describe('cuesToParagraphs', () => {
  const cues = (...texts: string[]): TranscriptCue[] =>
    texts.map((text, index) => ({ start: index, duration: 1, text }))

  it('groups three sentences into a paragraph by default', () => {
    expect(cuesToParagraphs(cues('One. Two.', 'Three. Four.', 'Five. Six. Seven.'))).toEqual([
      'One. Two. Three.',
      'Four. Five. Six.',
      'Seven.',
    ])
  })

  it('joins a sentence that runs across a cue boundary', () => {
    expect(cuesToParagraphs(cues('The wages of', 'sin is death.'))).toEqual([
      'The wages of sin is death.',
    ])
  })

  it('collapses the whitespace the cue timings leave behind', () => {
    expect(cuesToParagraphs(cues('  One   two  ', '\tthree\n four. '))).toEqual([
      'One two three four.',
    ])
  })

  it('closes a sentence on a question mark or a closing quotation', () => {
    expect(cuesToParagraphs(cues('Is it forever? "It is not." He said so.'), 1)).toEqual([
      'Is it forever?',
      '"It is not."',
      'He said so.',
    ])
  })

  it('honours a different paragraph length', () => {
    expect(cuesToParagraphs(cues('A. B. C. D.'), 2)).toEqual(['A. B.', 'C. D.'])
  })

  it('keeps text with no terminal punctuation as a single paragraph', () => {
    expect(cuesToParagraphs(cues('no closing punctuation here'))).toEqual([
      'no closing punctuation here',
    ])
  })

  /** The paragraphs are a re-flow of the captions, never a rewrite of them. */
  it('changes no word and reorders nothing', () => {
    const texts = ['First one. Second', 'one continues. Third one.']
    expect(
      cuesToParagraphs(cues(...texts))
        .join(' ')
        .split(' '),
    ).toEqual(texts.join(' ').split(' '))
  })

  it('returns nothing when there is no text to publish', () => {
    expect(cuesToParagraphs([])).toEqual([])
    expect(cuesToParagraphs(cues('   ', '\n'))).toEqual([])
  })
})
