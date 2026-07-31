import { cuesForChapter, video } from '@ci/content/video'
import type { TranscriptCue, VideoChapter } from '@ci/content-schema'
import { formatTimestamp } from '@/lib/format'

/**
 * The transcript, cut into the pieces that are actually rendered.
 *
 * Chapters are editorial: they exist where the narration lines up with a
 * permanent section id. The caption track runs past the last chapter, so any
 * cue that no chapter covers is kept in its own segment rather than dropped.
 * The published transcript is therefore complete, on the page and in the
 * downloadable text file, which both read this function.
 */
export interface TranscriptSegment {
  readonly id: string
  readonly title: string
  readonly start: number
  readonly end: number
  /** Present when the segment is a real chapter rather than a gap. */
  readonly chapter?: VideoChapter
  readonly cues: readonly TranscriptCue[]
}

function chapterCovering(start: number): VideoChapter | undefined {
  return video.chapters.find(chapter => start >= chapter.start && start < chapter.end)
}

export function transcriptSegments(): readonly TranscriptSegment[] {
  const segments: TranscriptSegment[] = video.chapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    start: chapter.start,
    end: chapter.end,
    chapter,
    cues: cuesForChapter(chapter.id),
  }))

  const runs: TranscriptCue[][] = []
  let current: TranscriptCue[] | null = null
  for (const cue of video.cues) {
    if (chapterCovering(cue.start)) {
      current = null
      continue
    }
    if (!current) {
      current = []
      runs.push(current)
    }
    current.push(cue)
  }

  for (const run of runs) {
    const first = run[0]
    const last = run[run.length - 1]
    if (!first || !last) continue
    const start = Math.floor(first.start)
    const end = Math.min(video.durationSeconds, Math.ceil(last.start + last.duration))
    segments.push({
      id: `transcript-from-${start}`,
      title: `Continuing from ${formatTimestamp(start)}`,
      start,
      end,
      cues: run,
    })
  }

  return segments.sort((a, b) => a.start - b.start)
}

/**
 * Split on sentence ends, and only on sentence ends.
 *
 * Matching "anything up to a full stop" treats every full stop as a boundary,
 * including the ones inside numbers and domain names. The transcript said so
 * itself — "the cue times and wording are the published ones; only whitespace
 * was normalised" — while rendering the speaker's "about 0.00001%" as a
 * paragraph ending "about 0." followed by an orphan "00001%,", and "rethinking
 * hell.com" as "rethinking hell. com".
 *
 * A sentence ends where terminal punctuation is followed by space and then
 * something that starts a sentence. A decimal point has no space after it, and
 * neither does a dotted domain, so both survive.
 */
function splitSentences(text: string): string[] {
  const sentences = text.split(/(?<=[.!?]["')\]]*)\s+(?=["'([]*[A-Z0-9])/)
  return sentences.map(sentence => sentence.trim()).filter(Boolean)
}

/**
 * Cue text joined into readable paragraphs.
 *
 * Caption cues break on timing, not on sense, so a cue almost never ends at a
 * sentence boundary. Joining consecutive cues until a sentence closes gives
 * paragraphs a reader can follow without changing a single word.
 */
export function cuesToParagraphs(
  cues: readonly TranscriptCue[],
  sentencesPerParagraph = 3,
): readonly string[] {
  const text = cues
    .map(cue => cue.text.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return []

  const sentences = splitSentences(text)
  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    const chunk = sentences
      .slice(i, i + sentencesPerParagraph)
      .map(sentence => sentence.trim())
      .join(' ')
    if (chunk) paragraphs.push(chunk)
  }

  /*
   * A chapter's captions can stop mid-sentence, because the boundary is a
   * timestamp rather than a full stop. That trailing fragment belongs to the
   * sentence it came from, not to a paragraph of its own: one chapter ends on
   * the single word "The", which read as a mistake standing alone. Joined, not
   * dropped — the words are the published ones.
   */
  const last = paragraphs.at(-1)
  if (paragraphs.length > 1 && last && !/[.!?]["')\]]*$/.test(last)) {
    paragraphs.splice(-2, 2, `${paragraphs.at(-2)} ${last}`)
  }

  return paragraphs
}
