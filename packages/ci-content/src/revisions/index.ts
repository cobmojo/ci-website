import { type RevisionRecord, RevisionRecordSchema } from '@ci/content-schema'
import { REVISION_RECORDS } from './revisions'

export const revisions: readonly RevisionRecord[] = REVISION_RECORDS.map(record => {
  const parsed = RevisionRecordSchema.safeParse(record)
  if (!parsed.success) {
    throw new Error(
      `Invalid revision "${record.id}":\n${parsed.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }
  return parsed.data
}).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))

export function revisionsForSection(sectionId: string): readonly RevisionRecord[] {
  return revisions.filter(revision => revision.sectionId === sectionId)
}

/** Section ids that have at least one recorded revision. */
export const revisedSectionIds: readonly string[] = [
  ...new Set(
    revisions.map(revision => revision.sectionId).filter((id): id is string => Boolean(id)),
  ),
].sort()

export { REVISION_RECORDS }
