import {
  PERSPECTIVE_LABELS,
  SOURCE_TYPE_LABELS,
  type SourceRecord,
  SourceRecordSchema,
} from '@ci/content-schema'
import { SOURCE_RECORDS } from './sources'

export const sources: readonly SourceRecord[] = SOURCE_RECORDS.map(record => {
  const parsed = SourceRecordSchema.safeParse(record)
  if (!parsed.success) {
    throw new Error(
      `Invalid source "${record.id}":\n${parsed.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }
  return parsed.data
}).sort((a, b) => (a.author ?? a.title).localeCompare(b.author ?? b.title))

const BY_ID = new Map(sources.map(source => [source.id, source]))

export function getSource(id: string): SourceRecord | undefined {
  return BY_ID.get(id)
}

export function requireSource(id: string): SourceRecord {
  const source = BY_ID.get(id)
  if (!source) throw new Error(`Unknown source id: ${id}`)
  return source
}

export function sourcesForSection(sectionId: string): readonly SourceRecord[] {
  return sources.filter(source => source.citedBy.includes(sectionId))
}

/** Formatted citation line, used in bibliographies and footnotes. */
export function formatCitation(source: SourceRecord): string {
  const parts: string[] = []
  if (source.author) parts.push(source.author)
  parts.push(source.title)
  if (source.publication) parts.push(source.publication)
  if (source.edition) parts.push(source.edition)
  if (source.publisher) parts.push(source.publisher)
  if (source.date) parts.push(source.date)
  if (source.locator) parts.push(source.locator)
  return parts.join('. ')
}

/**
 * The name an inline citation marker shows, where the full line will not fit.
 *
 * A modern author is cited by surname, but the classical "X of Y" form names
 * the see or city a father was bishop of, not a family: `Irenaeus of Lyons`
 * cites as Irenaeus. Taking the last word would print "Lyons", which reads as
 * a different person entirely.
 */
export function citationShortName(source: SourceRecord): string {
  if (source.shortName) return source.shortName
  if (!source.author) return source.title.split(' ')[0] ?? source.title
  const [beforePlace, ...place] = source.author.split(' of ')
  if (place.length > 0 && beforePlace) return beforePlace
  const words = source.author.split(' ')
  return words[words.length - 1] ?? source.author
}

/**
 * The full citation for one marker, which may cite a narrower place than the
 * record's own default locator.
 *
 * The marker's locator replaces the record's rather than following it. Most
 * markers pass the same string the record carries, and appending produced
 * "...chapter 34, section 3. Book II, chapter 34, section 3" — the reference
 * twice, in both the tooltip and the link's accessible name.
 */
export function citationLabel(source: SourceRecord, locator?: string): string {
  if (!locator) return formatCitation(source)
  return `${formatCitation({ ...source, locator: undefined })}. ${locator}`
}

export const SOURCE_TYPE_FACETS = SOURCE_TYPE_LABELS
export const PERSPECTIVE_FACETS = PERSPECTIVE_LABELS
export { SOURCE_RECORDS }
