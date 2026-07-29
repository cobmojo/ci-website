import { formatCitation, sources } from '@ci/content/sources'
import {
  type LinkStatus,
  PERSPECTIVE_LABELS,
  type RightsStatus,
  SOURCE_TYPE_LABELS,
  type SourceType,
  sourceTypes,
} from '@ci/content-schema'
import { formatLongDate } from '@/lib/format'
import { TEXT_WIDTH, wrapText } from '@/lib/plain-text'
import { absoluteUrl, siteConfig } from '@/lib/site-config'

/**
 * The whole source library as a plain text bibliography.
 *
 * Grouped by kind of source, in the same order the site uses, and generated
 * from the same records the pages cite. Rights status is included because the
 * site quotes some of these sources and only links others, and a reader
 * checking the argument should be able to see which is which.
 */
export const dynamic = 'force-static'

const RIGHTS_STATUS_NOTES: Record<RightsStatus, string> = {
  'public-domain': 'public domain, quoted freely with attribution',
  cleared: 'cleared for use by the author of this site',
  'permission-needed': 'permission would be required to quote at length, so it is paraphrased',
  'quoted-briefly': 'quoted only briefly, with attribution',
  paraphrased: 'paraphrased rather than quoted',
  'link-only': 'linked rather than quoted',
}

const LINK_STATUS_NOTES: Record<LinkStatus, string> = {
  live: 'link live when last checked',
  redirected: 'link redirects to a new location',
  'archived-only': 'original is gone, archived copy only',
  dead: 'link no longer resolves',
  'not-checked': 'link not checked',
}

const ENTRY_INDENT = ' '.repeat(5)

function labelled(label: string, value: string): string[] {
  const padded = `${label}:`.padEnd(15, ' ')
  const wrapped = wrapText(value, TEXT_WIDTH - padded.length - ENTRY_INDENT.length)
  return wrapped.map(
    (line, index) => `${ENTRY_INDENT}${index === 0 ? padded : ' '.repeat(padded.length)}${line}`,
  )
}

function buildBibliography(): string {
  const lines: string[] = []
  const rule = '='.repeat(TEXT_WIDTH)
  const thin = '-'.repeat(TEXT_WIDTH)

  lines.push(rule)
  lines.push('BIBLIOGRAPHY')
  lines.push(...wrapText(siteConfig.name.toUpperCase()))
  lines.push(rule)
  lines.push('')
  lines.push(`Site:      ${siteConfig.url}`)
  lines.push(`Sources:   ${absoluteUrl('/sources/')}`)
  lines.push(`Entries:   ${sources.length}`)
  lines.push(`Generated: ${formatLongDate(siteConfig.lastSubstantivelyUpdated)}`)
  lines.push('')
  lines.push(
    ...wrapText(
      'Every source used anywhere on the site, whether it argues for conditional immortality, against it, or neither. Sources are grouped by kind and then listed by author, or by title where there is no named author.',
    ),
  )
  lines.push('')

  let counter = 0
  for (const type of sourceTypes as readonly SourceType[]) {
    const group = sources.filter(source => source.type === type)
    if (group.length === 0) continue

    lines.push(thin)
    lines.push(`${SOURCE_TYPE_LABELS[type].toUpperCase()} (${group.length})`)
    lines.push(thin)
    lines.push('')

    for (const source of group) {
      counter += 1
      const number = `${counter}.`.padEnd(ENTRY_INDENT.length, ' ')
      const citation = wrapText(formatCitation(source), TEXT_WIDTH - number.length)
      citation.forEach((line, index) => {
        lines.push(`${index === 0 ? number : ' '.repeat(number.length)}${line}`)
      })

      if (source.perspective) {
        lines.push(...labelled('Perspective', PERSPECTIVE_LABELS[source.perspective]))
      }
      if (source.url) lines.push(...labelled('URL', source.url))
      if (source.archiveUrl) lines.push(...labelled('Archived', source.archiveUrl))
      if (source.sourceDocumentUrl && source.sourceDocumentUrl !== source.url) {
        lines.push(...labelled('Original link', source.sourceDocumentUrl))
      }
      if (source.accessedAt) {
        lines.push(
          ...labelled(
            'Accessed',
            `${formatLongDate(source.accessedAt)}, ${LINK_STATUS_NOTES[source.linkStatus]}`,
          ),
        )
      } else {
        lines.push(...labelled('Link', LINK_STATUS_NOTES[source.linkStatus]))
      }
      lines.push(...labelled('Rights', RIGHTS_STATUS_NOTES[source.rightsStatus]))
      if (source.citedBy.length > 0) {
        lines.push(...labelled('Cited by', source.citedBy.join(', ')))
      }
      if (source.note) lines.push(...labelled('Note', source.note))
      lines.push('')
    }
  }

  lines.push(rule)
  lines.push(
    ...wrapText(`The current version of this list is always at ${absoluteUrl('/sources/')}`),
  )
  lines.push(...wrapText(`Corrections and better sources: ${absoluteUrl('/corrections/')}`))
  lines.push(rule)
  lines.push('')

  return lines.join('\n')
}

export function GET(): Response {
  return new Response(buildBibliography(), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'content-disposition': 'inline; filename="conditional-immortality-bibliography.txt"',
    },
  })
}
