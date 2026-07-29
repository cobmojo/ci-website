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

export const SOURCE_TYPE_FACETS = SOURCE_TYPE_LABELS
export const PERSPECTIVE_FACETS = PERSPECTIVE_LABELS
export { SOURCE_RECORDS }
