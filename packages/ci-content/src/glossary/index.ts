import { type GlossaryTerm, GlossaryTermSchema } from '@ci/content-schema'
import { GLOSSARY_TERMS } from './glossary'

export const glossary: readonly GlossaryTerm[] = GLOSSARY_TERMS.map(term => {
  const parsed = GlossaryTermSchema.safeParse(term)
  if (!parsed.success) {
    throw new Error(
      `Invalid glossary term "${term.id}":\n${parsed.error.issues
        .map(issue => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }
  return parsed.data
}).sort((a, b) => a.term.localeCompare(b.term))

const BY_ID = new Map(glossary.map(term => [term.id, term]))

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return BY_ID.get(id)
}

/** Terms grouped by initial letter, for the A-Z listing. */
export const glossaryByLetter: readonly { letter: string; terms: readonly GlossaryTerm[] }[] =
  (() => {
    const groups = new Map<string, GlossaryTerm[]>()
    for (const term of glossary) {
      const letter = term.term.charAt(0).toUpperCase()
      const bucket = groups.get(letter)
      if (bucket) bucket.push(term)
      else groups.set(letter, [term])
    }
    return [...groups.entries()]
      .map(([letter, terms]) => ({ letter, terms }))
      .sort((a, b) => a.letter.localeCompare(b.letter))
  })()

export { GLOSSARY_TERMS }
