import {
  type PassageRecord,
  PassageRecordSchema,
  parseReference,
  referenceSortKey,
} from '@ci/content-schema'
import { caseSections } from '../case/index'
import { hasScripture } from '../scripture/web-text'
import { PASSAGE_RECORDS } from './passages'

export const passages: readonly PassageRecord[] = PASSAGE_RECORDS.map(record => {
  const parsed = PassageRecordSchema.safeParse(record)
  if (!parsed.success) {
    throw new Error(
      `Invalid passage "${record.id}":\n${parsed.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }
  for (const quotation of parsed.data.quotations) {
    if (!hasScripture(quotation.reference)) {
      throw new Error(
        `Passage "${record.id}" quotes "${quotation.reference}", which is not in the verified ` +
          'Scripture corpus. Add it to ADDITIONAL_REFERENCES in ' +
          'scripts/conditional-immortality/fetch-scripture.ts.',
      )
    }
  }
  return parsed.data
}).sort(
  (a, b) =>
    a.bookOrder - b.bookOrder || a.chapter - b.chapter || (a.verseStart ?? 0) - (b.verseStart ?? 0),
)

const BY_SLUG = new Map(passages.map(passage => [passage.slug, passage]))
const BY_REFERENCE = new Map<string, PassageRecord>()
for (const passage of passages) {
  BY_REFERENCE.set(passage.normalizedReference, passage)
  for (const extra of passage.additionalReferences) BY_REFERENCE.set(extra, passage)
}

export function getPassage(slug: string): PassageRecord | undefined {
  return BY_SLUG.get(slug)
}

export function passageRoute(passage: PassageRecord): string {
  return `/passages/${passage.slug}/`
}

/** Resolve a page for a reference, tolerating chapter-level near matches. */
export function findPassageByReference(reference: string): PassageRecord | undefined {
  const direct = BY_REFERENCE.get(reference.trim())
  if (direct) return direct

  const parsed = parseReference(reference)
  if (!parsed) return undefined

  return passages.find(passage => {
    if (passage.book !== parsed.book || passage.chapter !== parsed.chapter) return false
    if (parsed.verseStart === undefined || passage.verseStart === undefined) return true
    const end = passage.verseEnd ?? passage.verseStart
    return parsed.verseStart >= passage.verseStart && parsed.verseStart <= end
  })
}

/* ------------------------------------------------------------------ *
 * Scripture index
 *
 * Built by walking the registry rather than being maintained by hand, so a
 * reference added to a section appears in the index automatically.
 * ------------------------------------------------------------------ */

export interface ScriptureIndexEntry {
  readonly reference: string
  readonly book: string
  readonly bookOrder: number
  readonly testament: 'OT' | 'NT'
  readonly chapter: number
  readonly verseStart?: number
  readonly sortKey: number
  readonly uses: readonly { sectionId: string; primary: boolean }[]
  readonly useCount: number
  readonly passageSlug?: string
}

export const scriptureIndex: readonly ScriptureIndexEntry[] = (() => {
  const map = new Map<
    string,
    {
      entry: Omit<ScriptureIndexEntry, 'uses' | 'useCount' | 'passageSlug'>
      uses: { sectionId: string; primary: boolean }[]
    }
  >()

  const add = (reference: string, sectionId: string, primary: boolean) => {
    const parsed = parseReference(reference)
    if (!parsed) {
      throw new Error(
        `Section ${sectionId} references "${reference}", which cannot be normalised as a ` +
          'Scripture reference. Fix the reference in packages/ci-content/src/case/sections.ts.',
      )
    }
    const key = parsed.normalized
    let bucket = map.get(key)
    if (!bucket) {
      bucket = {
        entry: {
          reference: key,
          book: parsed.book,
          bookOrder: parsed.bookOrder,
          testament: parsed.testament,
          chapter: parsed.chapter,
          verseStart: parsed.verseStart,
          sortKey: referenceSortKey(parsed),
        },
        uses: [],
      }
      map.set(key, bucket)
    }
    const existing = bucket.uses.find(use => use.sectionId === sectionId)
    if (existing) {
      if (primary) existing.primary = true
    } else {
      bucket.uses.push({ sectionId, primary })
    }
  }

  for (const section of caseSections) {
    for (const reference of section.primaryPassages) add(reference, section.id, true)
    for (const reference of section.relatedPassages) add(reference, section.id, false)
  }

  return [...map.values()]
    .map(({ entry, uses }) => ({
      ...entry,
      uses,
      useCount: uses.length,
      passageSlug: findPassageByReference(entry.reference)?.slug,
    }))
    .sort((a, b) => a.sortKey - b.sortKey)
})()

export const scriptureIndexByTestament = {
  OT: scriptureIndex.filter(entry => entry.testament === 'OT'),
  NT: scriptureIndex.filter(entry => entry.testament === 'NT'),
} as const

/** Distinct books referenced anywhere in the case, in canonical order. */
export const referencedBooks: readonly { book: string; order: number; count: number }[] = (() => {
  const counts = new Map<string, { order: number; count: number }>()
  for (const entry of scriptureIndex) {
    const existing = counts.get(entry.book)
    if (existing) existing.count += entry.useCount
    else counts.set(entry.book, { order: entry.bookOrder, count: entry.useCount })
  }
  return [...counts.entries()]
    .map(([book, value]) => ({ book, ...value }))
    .sort((a, b) => a.order - b.order)
})()

export { PASSAGE_RECORDS }
