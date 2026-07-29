import { type LanguageNote, LanguageNoteSchema } from '@ci/content-schema'
import { LANGUAGE_NOTES } from './language-notes'

export const languageNotes: readonly LanguageNote[] = LANGUAGE_NOTES.map(note => {
  const parsed = LanguageNoteSchema.safeParse(note)
  if (!parsed.success) {
    throw new Error(
      `Invalid language note "${note.id}":\n${parsed.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }
  return parsed.data
}).sort((a, b) => a.transliteration.localeCompare(b.transliteration))

const BY_ID = new Map(languageNotes.map(note => [note.id, note]))

export function getLanguageNote(id: string): LanguageNote | undefined {
  return BY_ID.get(id)
}

export function languageNotesForSection(sectionId: string): readonly LanguageNote[] {
  return languageNotes.filter(note => note.relatedSections.includes(sectionId))
}

export { LANGUAGE_NOTES }
