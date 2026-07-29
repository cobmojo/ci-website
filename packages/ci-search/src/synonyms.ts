/**
 * Query expansion.
 *
 * Each group is a set of terms a reader might use for the same idea. Typing
 * any member of a group also searches the others, at a reduced weight so an
 * exact match still outranks an expanded one.
 *
 * Hades, Sheol, Gehenna and the lake of fire are grouped so that a reader
 * searching "hell" finds all four, but the site's prose keeps them distinct
 * and the glossary explains the difference.
 */
export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ['ci', 'conditionalism', 'conditional immortality', 'evangelical conditionalism'],
  ['annihilation', 'annihilationism', 'annihilationist'],
  ['ect', 'eternal conscious torment', 'eternal torment', 'traditional view', 'traditionalism'],
  ['universalism', 'universal reconciliation', 'universalist'],
  ['hell', 'hades', 'sheol', 'gehenna', 'lake of fire'],
  ['perish', 'destroy', 'destruction', 'consume', 'extinction', 'destroyed', 'perishing'],
  ['eternal', 'everlasting', 'permanent', 'age to come', 'aionios'],
  ['body', 'soul', 'spirit', 'anthropology'],
  ['second death', 'lake of fire'],
  ['worm does not die', 'undying worm', 'their worm'],
  ['unquenchable fire', 'fire that never goes out', 'not quenched'],
  ['smoke rises forever', 'smoke of their torment'],
  ['weeping and gnashing of teeth', 'gnashing', 'weeping'],
  ['outer darkness', 'blackest darkness'],
  ['immortality', 'immortal', 'imperishable'],
  ['resurrection', 'raised', 'rise again'],
  ['judgment', 'judgement', 'day of judgment', 'last judgment', 'final judgment'],
  ['punishment', 'punished', 'penalty'],
  ['apollumi', 'destroy', 'perish'],
  ['tree of life', 'garden of eden'],
  ['sodom and gomorrah', 'sodom'],
  ['intermediate state', 'rich man and lazarus'],
  ['image of god', 'imago dei', 'image bearer'],
]

const EXPANSION_MAP: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>()
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      const key = term.toLowerCase()
      const existing = map.get(key) ?? []
      for (const other of group) {
        if (other.toLowerCase() !== key && !existing.includes(other.toLowerCase())) {
          existing.push(other.toLowerCase())
        }
      }
      map.set(key, existing)
    }
  }
  return map
})()

/** Synonyms for a single term or phrase, or an empty array. */
export function expandTerm(term: string): readonly string[] {
  return EXPANSION_MAP.get(term.toLowerCase().trim()) ?? []
}

/**
 * Expand a whole query: matches the longest phrase first, so
 * "eternal conscious torment" expands as a phrase rather than three words.
 */
export function expandQuery(query: string): readonly string[] {
  const lower = query.toLowerCase().trim()
  const out = new Set<string>()

  const phrase = EXPANSION_MAP.get(lower)
  if (phrase) for (const t of phrase) out.add(t)

  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      if (term.includes(' ') && lower.includes(term)) {
        for (const other of group) {
          if (other !== term) out.add(other)
        }
      }
    }
  }

  for (const word of lower.split(/\s+/).filter(w => w.length > 2)) {
    for (const t of expandTerm(word)) out.add(t)
  }

  out.delete(lower)
  return [...out]
}
