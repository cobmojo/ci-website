import { describe, expect, it } from 'vitest'
import {
  BIBLE_BOOKS,
  findBook,
  formatReference,
  parseReference,
  referenceSlug,
  referenceSortKey,
} from '../bible'
import { LONGEST_CHAPTER, VERSE_COUNTS } from '../versification'

describe('the canon', () => {
  it('has all sixty-six books in order', () => {
    expect(BIBLE_BOOKS).toHaveLength(66)
    expect(BIBLE_BOOKS.map(book => book.order)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1))
    expect(BIBLE_BOOKS[0]?.name).toBe('Genesis')
    expect(BIBLE_BOOKS[65]?.name).toBe('Revelation')
  })

  it('splits the testaments at Malachi and Matthew', () => {
    expect(BIBLE_BOOKS.filter(book => book.testament === 'OT')).toHaveLength(39)
    expect(BIBLE_BOOKS.filter(book => book.testament === 'NT')).toHaveLength(27)
  })

  it('has no duplicate aliases across books', () => {
    const seen = new Map<string, string>()
    for (const book of BIBLE_BOOKS) {
      for (const alias of book.aliases) {
        const existing = seen.get(alias)
        expect(
          existing,
          `alias "${alias}" is shared by ${existing} and ${book.name}`,
        ).toBeUndefined()
        seen.set(alias, book.name)
      }
    }
  })
})

describe('the versification table', () => {
  it('covers every book, with the chapter count the canon declares', () => {
    for (const book of BIBLE_BOOKS) {
      const counts = VERSE_COUNTS[book.name]
      expect(counts, `${book.name} is missing from the table`).toBeDefined()
      expect(counts, book.name).toHaveLength(book.chapters)
    }
    expect(Object.keys(VERSE_COUNTS)).toHaveLength(66)
  })

  it('gives every chapter a positive verse count', () => {
    for (const [book, counts] of Object.entries(VERSE_COUNTS)) {
      counts.forEach((count, index) => {
        expect(Number.isInteger(count), `${book} ${index + 1}`).toBe(true)
        expect(count, `${book} ${index + 1}`).toBeGreaterThan(0)
      })
    }
  })

  it('totals the 1,189 chapters of the Protestant canon', () => {
    const chapters = Object.values(VERSE_COUNTS).reduce((sum, c) => sum + c.length, 0)
    expect(chapters).toBe(1189)
  })

  it('names Psalm 119 as the longest chapter', () => {
    const longest = Math.max(...Object.values(VERSE_COUNTS).flatMap(counts => [...counts]))
    expect(longest).toBe(LONGEST_CHAPTER)
    expect(LONGEST_CHAPTER).toBe(176)
    expect(VERSE_COUNTS.Psalms?.[118]).toBe(176)
  })
})

describe('book lookup', () => {
  it.each([
    ['Matthew', 'Matthew'],
    ['matt', 'Matthew'],
    ['Mt.', 'Matthew'],
    ['MT', 'Matthew'],
    ['1 Cor', '1 Corinthians'],
    ['1Cor', '1 Corinthians'],
    ['I Corinthians', '1 Corinthians'],
    ['First Corinthians', '1 Corinthians'],
    ['2 Thess', '2 Thessalonians'],
    ['Psalm', 'Psalms'],
    ['Ps', 'Psalms'],
    ['Revelations', 'Revelation'],
    ['Song of Songs', 'Song of Solomon'],
  ])('resolves %s to %s', (input, expected) => {
    expect(findBook(input)?.name).toBe(expected)
  })

  it('returns undefined for something that is not a book', () => {
    expect(findBook('Hezekiah')).toBeUndefined()
    expect(findBook('')).toBeUndefined()
  })
})

describe('reference parsing', () => {
  it.each([
    ['Matthew 10:28', 'Matthew 10:28'],
    ['Matt 10 28', 'Matthew 10:28'],
    ['Mt. 10:28', 'Matthew 10:28'],
    ['mt 10.28', 'Matthew 10:28'],
    ['2 Thessalonians 1:5-10', '2 Thessalonians 1:5-10'],
    ['2 Thess 1:5-10', '2 Thessalonians 1:5-10'],
    ['Revelation 20:10-15', 'Revelation 20:10-15'],
    ['Rev 20', 'Revelation 20'],
    ['Psalm 119', 'Psalms 119'],
    ['1 Cor 15', '1 Corinthians 15'],
    ['Isaiah 66:15-24', 'Isaiah 66:15-24'],
  ])('normalises %s to %s', (input, expected) => {
    expect(parseReference(input)?.normalized).toBe(expected)
  })

  it('handles en and em dashes in verse ranges', () => {
    expect(parseReference('Isaiah 66:15–24')?.normalized).toBe('Isaiah 66:15-24')
    expect(parseReference('Isaiah 66:15—24')?.normalized).toBe('Isaiah 66:15-24')
  })

  it('reads a bare number in a single-chapter book as a verse', () => {
    const jude = parseReference('Jude 7')
    expect(jude?.normalized).toBe('Jude 1:7')
    expect(jude?.chapter).toBe(1)
    expect(jude?.verseStart).toBe(7)

    expect(parseReference('Obadiah 15-18')?.normalized).toBe('Obadiah 1:15-18')
    expect(parseReference('Philemon 6')?.normalized).toBe('Philemon 1:6')
  })

  it('rejects a chapter beyond the end of the book', () => {
    expect(parseReference('Jude 2:1')).toBeUndefined()
    expect(parseReference('Matthew 29:1')).toBeUndefined()
    expect(parseReference('Revelation 23:1')).toBeUndefined()
  })

  it('rejects a reversed verse range', () => {
    expect(parseReference('Matthew 10:28-20')).toBeUndefined()
  })

  it('reads a range with no colon as a range of chapters', () => {
    const range = parseReference('Revelation 20-22')
    expect(range?.chapter).toBe(20)
    expect(range?.chapterEnd).toBe(22)
    expect(range?.verseStart).toBeUndefined()
    expect(range?.verseEnd).toBeUndefined()
    expect(range?.normalized).toBe('Revelation 20-22')
  })

  it('keeps a chapter range and a verse distinct when the numbers match', () => {
    // "Genesis 1-3" used to normalise to "Genesis 1" — dropping the 3
    // entirely — and slug to "genesis-1-3", which is the slug for Genesis 1:3.
    // Two different passages, one identity.
    const chapters = parseReference('Genesis 1-3')
    const verse = parseReference('Genesis 1:3')
    expect(chapters?.normalized).toBe('Genesis 1-3')
    expect(verse?.normalized).toBe('Genesis 1:3')
    expect(chapters?.slug).not.toBe(verse?.slug)
    expect(verse?.slug).toBe('genesis-1-3')
  })

  it('rejects a verse beyond the end of its own chapter', () => {
    // The bound used to be the length of the longest chapter in the Bible
    // (Psalm 119), so any verse number up to 176 passed in any chapter.
    expect(parseReference('Matthew 10:100')).toBeUndefined()
    expect(parseReference('Genesis 1:32')).toBeUndefined()
    expect(parseReference('Psalm 23:7')).toBeUndefined()
    expect(parseReference('Revelation 22:22')).toBeUndefined()
    expect(parseReference('Jude 26')).toBeUndefined()
  })

  it('accepts the last verse of a chapter', () => {
    expect(parseReference('Matthew 10:42')?.normalized).toBe('Matthew 10:42')
    expect(parseReference('Genesis 1:31')?.normalized).toBe('Genesis 1:31')
    expect(parseReference('Psalm 23:6')?.normalized).toBe('Psalms 23:6')
    expect(parseReference('Psalm 119:176')?.normalized).toBe('Psalms 119:176')
    expect(parseReference('Revelation 22:21')?.normalized).toBe('Revelation 22:21')
    expect(parseReference('Jude 25')?.normalized).toBe('Jude 1:25')
  })

  it('bounds the end of a verse range by the chapter too', () => {
    expect(parseReference('Psalm 23:1-6')?.normalized).toBe('Psalms 23:1-6')
    expect(parseReference('Psalm 23:1-7')).toBeUndefined()
  })

  it('rejects prose that is not a reference', () => {
    expect(parseReference('destroy soul and body')).toBeUndefined()
    expect(parseReference('unquenchable fire')).toBeUndefined()
    expect(parseReference('')).toBeUndefined()
    expect(parseReference('12345')).toBeUndefined()
  })

  it('records testament and canonical order', () => {
    const parsed = parseReference('Isaiah 66:24')
    expect(parsed?.testament).toBe('OT')
    expect(parsed?.bookOrder).toBe(23)

    const nt = parseReference('Revelation 20:14')
    expect(nt?.testament).toBe('NT')
    expect(nt?.bookOrder).toBe(66)
  })
})

describe('formatting and sorting', () => {
  it('formats chapter, verse and range forms', () => {
    expect(formatReference({ book: 'Mark', chapter: 9 })).toBe('Mark 9')
    expect(formatReference({ book: 'Mark', chapter: 9, verseStart: 48 })).toBe('Mark 9:48')
    expect(formatReference({ book: 'Mark', chapter: 9, verseStart: 42, verseEnd: 48 })).toBe(
      'Mark 9:42-48',
    )
    expect(formatReference({ book: 'Mark', chapter: 9, chapterEnd: 11 })).toBe('Mark 9-11')
  })

  it('builds url-safe slugs', () => {
    expect(
      referenceSlug({ book: '1 Corinthians', chapter: 15, verseStart: 42, verseEnd: 44 }),
    ).toBe('1-corinthians-15-42-44')
    expect(referenceSlug({ book: 'Song of Solomon', chapter: 8, verseStart: 6 })).toBe(
      'song-of-solomon-8-6',
    )
    expect(referenceSlug({ book: 'Mark', chapter: 9, chapterEnd: 11 })).toBe('mark-9-to-11')
  })

  it('sorts canonically across books', () => {
    const refs = ['Revelation 20:10', 'Genesis 2:17', 'Matthew 10:28', 'Isaiah 66:24']
      .map(r => parseReference(r))
      .filter(r => r !== undefined)
      .sort((a, b) => referenceSortKey(a) - referenceSortKey(b))
      .map(r => r.normalized)

    expect(refs).toEqual(['Genesis 2:17', 'Isaiah 66:24', 'Matthew 10:28', 'Revelation 20:10'])
  })
})
