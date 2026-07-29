/**
 * Canonical Bible book data: order, testament, chapter counts and the alias table
 * used to normalise the many ways a reader might type a reference.
 *
 * Chapter counts follow the 66-book Protestant canon, which is the canon the
 * source document works from.
 */

export type Testament = 'OT' | 'NT'

export interface BibleBook {
  /** Canonical full name used for display and for normalised references. */
  readonly name: string
  /** 1-based position in the Protestant canon (Genesis = 1, Revelation = 66). */
  readonly order: number
  readonly testament: Testament
  readonly chapters: number
  /**
   * Lower-case alternative spellings, abbreviations and OSIS-style codes.
   * Punctuation and whitespace are stripped before matching, so `mt` covers
   * `Mt.` and `matt` covers `Matt.` automatically.
   */
  readonly aliases: readonly string[]
}

export const BIBLE_BOOKS: readonly BibleBook[] = [
  { name: 'Genesis', order: 1, testament: 'OT', chapters: 50, aliases: ['gen', 'ge', 'gn'] },
  { name: 'Exodus', order: 2, testament: 'OT', chapters: 40, aliases: ['exod', 'ex', 'exo'] },
  { name: 'Leviticus', order: 3, testament: 'OT', chapters: 27, aliases: ['lev', 'le', 'lv'] },
  { name: 'Numbers', order: 4, testament: 'OT', chapters: 36, aliases: ['num', 'nu', 'nm', 'nb'] },
  {
    name: 'Deuteronomy',
    order: 5,
    testament: 'OT',
    chapters: 34,
    aliases: ['deut', 'dt', 'de', 'deu'],
  },
  { name: 'Joshua', order: 6, testament: 'OT', chapters: 24, aliases: ['josh', 'jos', 'jsh'] },
  { name: 'Judges', order: 7, testament: 'OT', chapters: 21, aliases: ['judg', 'jdg', 'jg'] },
  { name: 'Ruth', order: 8, testament: 'OT', chapters: 4, aliases: ['rth', 'ru'] },
  {
    name: '1 Samuel',
    order: 9,
    testament: 'OT',
    chapters: 31,
    aliases: ['1sam', '1sa', '1s', 'isam', 'firstsamuel'],
  },
  {
    name: '2 Samuel',
    order: 10,
    testament: 'OT',
    chapters: 24,
    aliases: ['2sam', '2sa', '2s', 'iisam', 'secondsamuel'],
  },
  {
    name: '1 Kings',
    order: 11,
    testament: 'OT',
    chapters: 22,
    aliases: ['1kgs', '1ki', '1k', 'ikings', 'firstkings'],
  },
  {
    name: '2 Kings',
    order: 12,
    testament: 'OT',
    chapters: 25,
    aliases: ['2kgs', '2ki', '2k', 'iikings', 'secondkings'],
  },
  {
    name: '1 Chronicles',
    order: 13,
    testament: 'OT',
    chapters: 29,
    aliases: ['1chr', '1ch', 'ichronicles', 'firstchronicles'],
  },
  {
    name: '2 Chronicles',
    order: 14,
    testament: 'OT',
    chapters: 36,
    aliases: ['2chr', '2ch', 'iichronicles', 'secondchronicles'],
  },
  { name: 'Ezra', order: 15, testament: 'OT', chapters: 10, aliases: ['ezr', 'ez'] },
  { name: 'Nehemiah', order: 16, testament: 'OT', chapters: 13, aliases: ['neh', 'ne'] },
  { name: 'Esther', order: 17, testament: 'OT', chapters: 10, aliases: ['esth', 'est', 'es'] },
  { name: 'Job', order: 18, testament: 'OT', chapters: 42, aliases: ['jb'] },
  {
    name: 'Psalms',
    order: 19,
    testament: 'OT',
    chapters: 150,
    aliases: ['ps', 'psa', 'psalm', 'pss'],
  },
  { name: 'Proverbs', order: 20, testament: 'OT', chapters: 31, aliases: ['prov', 'pr', 'prv'] },
  {
    name: 'Ecclesiastes',
    order: 21,
    testament: 'OT',
    chapters: 12,
    aliases: ['eccl', 'ecc', 'ec', 'qoh'],
  },
  {
    name: 'Song of Solomon',
    order: 22,
    testament: 'OT',
    chapters: 8,
    aliases: ['song', 'sos', 'songofsongs', 'canticles', 'ss'],
  },
  { name: 'Isaiah', order: 23, testament: 'OT', chapters: 66, aliases: ['isa', 'is'] },
  { name: 'Jeremiah', order: 24, testament: 'OT', chapters: 52, aliases: ['jer', 'je', 'jr'] },
  {
    name: 'Lamentations',
    order: 25,
    testament: 'OT',
    chapters: 5,
    aliases: ['lam', 'la', 'lm'],
  },
  { name: 'Ezekiel', order: 26, testament: 'OT', chapters: 48, aliases: ['ezek', 'eze', 'ezk'] },
  { name: 'Daniel', order: 27, testament: 'OT', chapters: 12, aliases: ['dan', 'da', 'dn'] },
  { name: 'Hosea', order: 28, testament: 'OT', chapters: 14, aliases: ['hos', 'ho'] },
  { name: 'Joel', order: 29, testament: 'OT', chapters: 3, aliases: ['joe', 'jl'] },
  { name: 'Amos', order: 30, testament: 'OT', chapters: 9, aliases: ['am', 'amo'] },
  { name: 'Obadiah', order: 31, testament: 'OT', chapters: 1, aliases: ['obad', 'ob'] },
  { name: 'Jonah', order: 32, testament: 'OT', chapters: 4, aliases: ['jon', 'jnh'] },
  { name: 'Micah', order: 33, testament: 'OT', chapters: 7, aliases: ['mic', 'mc'] },
  { name: 'Nahum', order: 34, testament: 'OT', chapters: 3, aliases: ['nah', 'na'] },
  // "hb" is deliberately not an alias: it is used for both Habakkuk and
  // Hebrews in the wild, so resolving it either way would silently misroute a
  // reference. An ambiguous abbreviation must fail to parse instead.
  { name: 'Habakkuk', order: 35, testament: 'OT', chapters: 3, aliases: ['hab'] },
  { name: 'Zephaniah', order: 36, testament: 'OT', chapters: 3, aliases: ['zeph', 'zep', 'zp'] },
  { name: 'Haggai', order: 37, testament: 'OT', chapters: 2, aliases: ['hag', 'hg'] },
  { name: 'Zechariah', order: 38, testament: 'OT', chapters: 14, aliases: ['zech', 'zec', 'zc'] },
  { name: 'Malachi', order: 39, testament: 'OT', chapters: 4, aliases: ['mal', 'ml'] },
  {
    name: 'Matthew',
    order: 40,
    testament: 'NT',
    chapters: 28,
    aliases: ['matt', 'mt', 'mat'],
  },
  { name: 'Mark', order: 41, testament: 'NT', chapters: 16, aliases: ['mk', 'mrk', 'mar'] },
  { name: 'Luke', order: 42, testament: 'NT', chapters: 24, aliases: ['lk', 'luk'] },
  { name: 'John', order: 43, testament: 'NT', chapters: 21, aliases: ['jn', 'joh', 'jhn'] },
  { name: 'Acts', order: 44, testament: 'NT', chapters: 28, aliases: ['ac', 'act'] },
  { name: 'Romans', order: 45, testament: 'NT', chapters: 16, aliases: ['rom', 'ro', 'rm'] },
  {
    name: '1 Corinthians',
    order: 46,
    testament: 'NT',
    chapters: 16,
    aliases: ['1cor', '1co', 'icorinthians', 'firstcorinthians'],
  },
  {
    name: '2 Corinthians',
    order: 47,
    testament: 'NT',
    chapters: 13,
    aliases: ['2cor', '2co', 'iicorinthians', 'secondcorinthians'],
  },
  { name: 'Galatians', order: 48, testament: 'NT', chapters: 6, aliases: ['gal', 'ga'] },
  { name: 'Ephesians', order: 49, testament: 'NT', chapters: 6, aliases: ['eph', 'ep'] },
  { name: 'Philippians', order: 50, testament: 'NT', chapters: 4, aliases: ['phil', 'php', 'pp'] },
  { name: 'Colossians', order: 51, testament: 'NT', chapters: 4, aliases: ['col', 'co'] },
  {
    name: '1 Thessalonians',
    order: 52,
    testament: 'NT',
    chapters: 5,
    aliases: ['1thess', '1th', '1thes', 'ithessalonians', 'firstthessalonians'],
  },
  {
    name: '2 Thessalonians',
    order: 53,
    testament: 'NT',
    chapters: 3,
    aliases: ['2thess', '2th', '2thes', 'iithessalonians', 'secondthessalonians'],
  },
  {
    name: '1 Timothy',
    order: 54,
    testament: 'NT',
    chapters: 6,
    aliases: ['1tim', '1ti', 'itimothy', 'firsttimothy'],
  },
  {
    name: '2 Timothy',
    order: 55,
    testament: 'NT',
    chapters: 4,
    aliases: ['2tim', '2ti', 'iitimothy', 'secondtimothy'],
  },
  { name: 'Titus', order: 56, testament: 'NT', chapters: 3, aliases: ['tit', 'ti'] },
  { name: 'Philemon', order: 57, testament: 'NT', chapters: 1, aliases: ['philem', 'phm', 'pm'] },
  { name: 'Hebrews', order: 58, testament: 'NT', chapters: 13, aliases: ['heb'] },
  { name: 'James', order: 59, testament: 'NT', chapters: 5, aliases: ['jas', 'jm'] },
  {
    name: '1 Peter',
    order: 60,
    testament: 'NT',
    chapters: 5,
    aliases: ['1pet', '1pe', '1pt', 'ipeter', 'firstpeter'],
  },
  {
    name: '2 Peter',
    order: 61,
    testament: 'NT',
    chapters: 3,
    aliases: ['2pet', '2pe', '2pt', 'iipeter', 'secondpeter'],
  },
  {
    name: '1 John',
    order: 62,
    testament: 'NT',
    chapters: 5,
    aliases: ['1jn', '1jo', '1joh', 'ijohn', 'firstjohn'],
  },
  {
    name: '2 John',
    order: 63,
    testament: 'NT',
    chapters: 1,
    aliases: ['2jn', '2jo', '2joh', 'iijohn', 'secondjohn'],
  },
  {
    name: '3 John',
    order: 64,
    testament: 'NT',
    chapters: 1,
    aliases: ['3jn', '3jo', '3joh', 'iiijohn', 'thirdjohn'],
  },
  { name: 'Jude', order: 65, testament: 'NT', chapters: 1, aliases: ['jud', 'jd'] },
  {
    name: 'Revelation',
    order: 66,
    testament: 'NT',
    chapters: 22,
    aliases: ['rev', 're', 'rv', 'apocalypse', 'revelations'],
  },
] as const

/** Strip punctuation/whitespace and lower-case, so `2 Thess.` -> `2thess`. */
export function normaliseBookToken(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '')
}

const BOOK_LOOKUP: ReadonlyMap<string, BibleBook> = (() => {
  const map = new Map<string, BibleBook>()
  for (const book of BIBLE_BOOKS) {
    map.set(normaliseBookToken(book.name), book)
    for (const alias of book.aliases) {
      map.set(normaliseBookToken(alias), book)
    }
  }
  // Roman-numeral and spelled-out forms for the numbered books.
  const numbered: Array<[string, string]> = [
    ['i', '1'],
    ['ii', '2'],
    ['iii', '3'],
    ['first', '1'],
    ['second', '2'],
    ['third', '3'],
  ]
  for (const book of BIBLE_BOOKS) {
    const match = /^([123]) (.+)$/.exec(book.name)
    if (!match) continue
    const [, digit, rest] = match
    for (const [prefix, value] of numbered) {
      if (value !== digit) continue
      map.set(normaliseBookToken(`${prefix}${rest}`), book)
    }
  }
  return map
})()

export function findBook(token: string): BibleBook | undefined {
  return BOOK_LOOKUP.get(normaliseBookToken(token))
}

export interface ParsedReference {
  readonly book: string
  readonly bookOrder: number
  readonly testament: Testament
  readonly chapter: number
  readonly verseStart?: number
  readonly verseEnd?: number
  /** Canonical display form, e.g. `Matthew 10:28` or `Isaiah 66:15-24`. */
  readonly normalized: string
  /** Sortable, URL-safe identity, e.g. `matthew-10-28`. */
  readonly slug: string
}

/**
 * Parse a human-typed Scripture reference.
 *
 * Deliberately tolerant: `Matthew 10:28`, `Matt 10 28`, `Mt. 10:28`,
 * `2 Thess 1:5-10` and `Rev 20` all resolve. Returns `undefined` when the
 * book cannot be identified or the chapter is out of range for that book,
 * so callers can surface a clear validation error instead of guessing.
 */
export function parseReference(input: string): ParsedReference | undefined {
  const cleaned = input
    .trim()
    .replace(/[‒-―−]/g, '-') // en/em dashes -> hyphen
    .replace(/\s+/g, ' ')
  if (!cleaned) return undefined

  // Book name = leading token(s) that are not a bare chapter number.
  const match = /^((?:[123]\s*)?[A-Za-z][A-Za-z\s.']*?)\s*[.\s]\s*(\d.*)$/.exec(cleaned)
  if (!match) return undefined
  const [, rawBook, rest] = match
  if (!rawBook || !rest) return undefined

  const book = findBook(rawBook)
  if (!book) return undefined

  const numbers = /^(\d{1,3})(?:\s*[:.\s]\s*(\d{1,3}))?(?:\s*-\s*(\d{1,3}))?/.exec(rest.trim())
  if (!numbers) return undefined

  let chapter = Number(numbers[1])
  let verseStart = numbers[2] ? Number(numbers[2]) : undefined
  let verseEnd = numbers[3] ? Number(numbers[3]) : undefined

  /**
   * Single-chapter books are cited without a chapter: `Jude 7` means Jude 1:7,
   * and `Jude 12-13` means Jude 1:12-13. Without this, the leading number is
   * read as a chapter and rejected as out of range.
   */
  if (book.chapters === 1 && verseStart === undefined) {
    verseStart = chapter
    verseEnd = numbers[3] ? Number(numbers[3]) : undefined
    chapter = 1
  }

  if (!Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return undefined
  if (verseStart !== undefined && (verseStart < 1 || verseStart > 176)) return undefined
  if (verseEnd !== undefined && verseStart !== undefined && verseEnd < verseStart) return undefined

  return {
    book: book.name,
    bookOrder: book.order,
    testament: book.testament,
    chapter,
    verseStart,
    verseEnd,
    normalized: formatReference(book.name, chapter, verseStart, verseEnd),
    slug: referenceSlug(book.name, chapter, verseStart, verseEnd),
  }
}

export function formatReference(
  book: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number,
): string {
  if (verseStart === undefined) return `${book} ${chapter}`
  if (verseEnd === undefined) return `${book} ${chapter}:${verseStart}`
  return `${book} ${chapter}:${verseStart}-${verseEnd}`
}

export function referenceSlug(
  book: string,
  chapter: number,
  verseStart?: number,
  verseEnd?: number,
): string {
  const base = book
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const parts = [base, String(chapter)]
  if (verseStart !== undefined) parts.push(String(verseStart))
  if (verseEnd !== undefined) parts.push(String(verseEnd))
  return parts.join('-')
}

/** Numeric sort key so references order canonically across books. */
export function referenceSortKey(ref: ParsedReference): number {
  return ref.bookOrder * 1_000_000 + ref.chapter * 1_000 + (ref.verseStart ?? 0)
}
