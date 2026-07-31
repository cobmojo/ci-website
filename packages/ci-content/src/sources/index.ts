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
/**
 * `includeLocator: false` leaves the record's own locator off the end.
 *
 * `<Cite>` needs it: WCAG 2.5.3 puts the visible marker at the front of the
 * accessible name, and that marker already carries a locator. Appending the
 * record's as well made a screen reader say "Book II, chapter 34, section 3"
 * twice in one name. Everywhere else — the source library, the downloadable
 * bibliography — the full citation is what is wanted, so that stays the
 * default.
 */
export function formatCitation(
  source: SourceRecord,
  options: { readonly includeLocator?: boolean } = {},
): string {
  const parts: string[] = []
  if (source.author) parts.push(source.author)
  parts.push(source.title)
  if (source.publication) parts.push(source.publication)
  if (source.edition) parts.push(source.edition)
  if (source.publisher) parts.push(source.publisher)
  if (source.date) parts.push(source.date)
  if (source.locator && options.includeLocator !== false) parts.push(source.locator)
  return parts.join('. ')
}

export const SOURCE_TYPE_FACETS = SOURCE_TYPE_LABELS
export const PERSPECTIVE_FACETS = PERSPECTIVE_LABELS
export { SOURCE_RECORDS }
