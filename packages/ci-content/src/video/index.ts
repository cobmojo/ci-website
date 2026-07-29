import { type VideoRecord, VideoRecordSchema } from '@ci/content-schema'
import { VIDEO_CHAPTERS } from './chapters'
import { TRANSCRIPT_CUES } from './transcript'

/**
 * The featured video.
 *
 * The transcript is the author's own manually created English caption track,
 * retrieved from YouTube rather than machine-generated, and then proofread
 * against the source document for Scripture references and theological terms.
 * Timestamps are the caption cue times, not estimates.
 *
 * Chapters were assigned by matching the narration to the permanent section
 * ids. A chapter covers more than one section where the video treats them
 * together; only exact correspondences are recorded in `sectionIds`.
 */
const record = {
  youtubeId: '9fevXbKUKmE',
  originalTitle:
    "37 Reasons Hell Isn't/Is Forever - Conditional Immortality Is Biblical Not Eternal Conscious Torment",
  siteTitle: 'The Case for Conditional Immortality in 28 Minutes',
  description:
    'Phil Welch walks through the whole cumulative case in a single sitting: the three roadblocks, the passages usually cited for eternal conscious torment, the language Scripture uses for the fate of the wicked, the patterns of judgment, and the common objections.',
  durationSeconds: 1712,
  publishedAt: '2025-03-06',
  transcriptSource:
    'Author-supplied English caption track published with the video on YouTube, retrieved via the public timed-text endpoint and proofread against the source document.',
  transcriptRetrievedAt: '2026-07-29',
  sourceIds: ['welch-video-overview'],
  chapters: VIDEO_CHAPTERS,
  cues: TRANSCRIPT_CUES,
}

export const video: VideoRecord = (() => {
  const parsed = VideoRecordSchema.safeParse(record)
  if (!parsed.success) {
    throw new Error(
      `Invalid video record:\n${parsed.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }
  return parsed.data
})()

export { TRANSCRIPT_CUES, VIDEO_CHAPTERS }

/** Cues that fall inside a chapter, for rendering the transcript in sections. */
export function cuesForChapter(chapterId: string) {
  const chapter = video.chapters.find(c => c.id === chapterId)
  if (!chapter) return []
  return video.cues.filter(cue => cue.start >= chapter.start && cue.start < chapter.end)
}

/** Chapters that link to a given permanent section id. */
export function chaptersForSection(sectionId: string) {
  return video.chapters.filter(chapter => chapter.sectionIds.includes(sectionId))
}

/** Deep link into the video at a given second, on the privacy-enhanced host. */
export function videoTimestampUrl(seconds: number): string {
  return `https://youtu.be/${video.youtubeId}?t=${Math.max(0, Math.floor(seconds))}`
}
