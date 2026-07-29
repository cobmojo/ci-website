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

  const sentences = text.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) ?? [text]
  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
    const chunk = sentences
      .slice(i, i + sentencesPerParagraph)
      .map(sentence => sentence.trim())
      .join(' ')
    if (chunk) paragraphs.push(chunk)
  }
  return paragraphs
}
