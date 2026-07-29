import { video } from '@ci/content/video'
import { formatLongDate, formatTimestamp } from '@/lib/format'
import { TEXT_WIDTH, wrapText } from '@/lib/plain-text'
import { absoluteUrl, siteConfig } from '@/lib/site-config'
import { cuesToParagraphs, transcriptSegments } from '@/lib/transcript'

/**
 * The transcript as a plain text file.
 *
 * Built from the same segments the watch page renders, so the download and the
 * page can never disagree. Hard wrapped at 78 columns and generated at build
 * time; this route makes no request to anything.
 */
export const dynamic = 'force-static'

function buildTranscript(): string {
  const lines: string[] = []
  const rule = '='.repeat(TEXT_WIDTH)

  lines.push(rule)
  lines.push(...wrapText(video.siteTitle.toUpperCase()))
  lines.push(rule)
  lines.push('')
  lines.push(...wrapText(`Published as: ${video.originalTitle}`))
  lines.push(`Video:        ${siteConfig.video.watchUrl}`)
  lines.push(`Transcript:   ${absoluteUrl('/watch/')}`)
  lines.push(`Site:         ${siteConfig.url}`)
  lines.push(
    `Duration:     ${formatTimestamp(video.durationSeconds)} (${video.durationSeconds} seconds)`,
  )
  lines.push(`Published:    ${formatLongDate(video.publishedAt)}`)
  lines.push(`Author:       ${siteConfig.author.name}`)
  lines.push('')
  lines.push(...wrapText(video.transcriptSource))
  lines.push('')
  lines.push(...wrapText(`Retrieved ${formatLongDate(video.transcriptRetrievedAt)}.`))
  lines.push('')
  lines.push(
    ...wrapText(
      'Timestamps are the published caption cue times, not estimates. Chapter headings were added for this edition by matching the narration to the numbered sections of the written case.',
    ),
  )
  lines.push('')
  lines.push(rule)
  lines.push('')

  for (const segment of transcriptSegments()) {
    lines.push(`[${formatTimestamp(segment.start)}] ${segment.title}`)
    lines.push('')

    if (segment.chapter?.visualDescription) {
      lines.push(...wrapText(`Shown on screen, not spoken: ${segment.chapter.visualDescription}`))
      lines.push('')
    }

    for (const paragraph of cuesToParagraphs(segment.cues)) {
      lines.push(...wrapText(paragraph))
      lines.push('')
    }
  }

  lines.push(rule)
  lines.push(
    ...wrapText(`End of transcript. The current version is always at ${absoluteUrl('/watch/')}`),
  )
  lines.push(...wrapText(`Corrections: ${absoluteUrl('/corrections/')}`))
  lines.push(rule)
  lines.push('')

  return lines.join('\n')
}

export function GET(): Response {
  return new Response(buildTranscript(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'content-disposition': 'inline; filename="conditional-immortality-transcript.txt"',
    },
  })
}
