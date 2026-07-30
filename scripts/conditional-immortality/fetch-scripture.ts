#!/usr/bin/env bun
/**
 * Regenerate the verified Scripture corpus.
 *
 * To add a passage, put the reference in `ADDITIONAL_REFERENCES` below and run:
 *
 *     bun run scripts/conditional-immortality/fetch-scripture.ts
 *
 * Passages already in the corpus are re-fetched and *checked*, not overwritten:
 * if the live text no longer matches what is committed the script reports every
 * difference and writes nothing, because changing verified Scripture is an
 * editorial decision.
 *
 * The source is the World English Bible as served by getbible.net, the same
 * edition the committed corpus holds — which is what makes that check
 * meaningful rather than noise.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { getScripture, scriptureReferences } from '../../packages/ci-content/src/scripture/web-text'
import {
  BIBLE_BOOKS,
  type ParsedReference,
  parseReference,
} from '../../packages/ci-content-schema/src/bible'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const OUT_FILE = join(REPO_ROOT, 'packages', 'ci-content', 'src', 'scripture', 'web-text.ts')

/**
 * References to add to the corpus. Leave empty once they are in.
 *
 * Anything already committed is picked up automatically, so this list is only
 * ever the new ones.
 */
const ADDITIONAL_REFERENCES: readonly string[] = []

/** Books already downloaded, so a re-run fetches nothing it has seen. */
const CACHE_DIR = join(tmpdir(), 'ci-scripture-cache')

/**
 * Places where the committed text is right and the feed is wrong.
 *
 * getbible strips footnote markers, and in Mark 9:47 it does so without leaving
 * the space: the verse arrives as "cast into the Gehennaof fire". A listed
 * reference is still compared word for word, only the whitespace may differ, so
 * a change to the wording still fails.
 */
const KNOWN_SOURCE_DEFECTS: Record<string, string> = {
  'Mark 9:42-48': 'v47: footnote marker stripped without its space ("Gehennaof fire")',
  'Mark 9:47-48': 'v47: footnote marker stripped without its space ("Gehennaof fire")',
}

/** Same words in the same order, whatever the spacing. */
function sameWords(a: string, b: string): boolean {
  return a.replace(/\s+/g, '') === b.replace(/\s+/g, '')
}

const WEB_VERIFIED_AT = '2026-07-29'

interface GetBibleVerse {
  readonly chapter: number
  readonly verse: number
  readonly text: string
}

interface GetBibleChapter {
  readonly chapter: number
  readonly verses: readonly GetBibleVerse[]
}

interface GetBibleBook {
  readonly name: string
  readonly chapters: readonly GetBibleChapter[]
}

interface Verse {
  readonly verse: number
  readonly text: string
}

/**
 * A reference to fetch. The corpus key is kept verbatim: two of them are not
 * their own normalised form (`Jude 7` normalises to `Jude 1:7`), and rekeying
 * the corpus would break every citation of them.
 */
interface Wanted {
  readonly reference: string
  readonly parsed: ParsedReference
}

interface Passage {
  readonly reference: string
  readonly book: string
  readonly chapter: number
  readonly verses: readonly Verse[]
  readonly text: string
}

async function fetchBook(order: number, name: string): Promise<GetBibleBook> {
  mkdirSync(CACHE_DIR, { recursive: true })
  const cached = join(CACHE_DIR, `${order}.json`)
  if (existsSync(cached)) {
    return JSON.parse(readFileSync(cached, 'utf8')) as GetBibleBook
  }
  const url = `https://api.getbible.net/v2/web/${order}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${name}: ${url} responded ${response.status} ${response.statusText}`)
  }
  const body = await response.text()
  writeFileSync(cached, body, 'utf8')
  return JSON.parse(body) as GetBibleBook
}

/**
 * The verses a reference covers: a verse range, a single verse, or a whole
 * chapter. Chapter ranges are refused rather than guessed at, since a passage
 * record carries one chapter number.
 */
function versesFor(
  reference: string,
  parsed: ParsedReference,
  book: GetBibleBook,
): readonly Verse[] {
  if (parsed.chapterEnd !== undefined) {
    throw new Error(`${reference}: chapter ranges are not supported in the corpus`)
  }

  const chapter = book.chapters.find(candidate => candidate.chapter === parsed.chapter)
  if (!chapter) throw new Error(`${reference}: ${parsed.book} has no chapter ${parsed.chapter}`)

  const first = parsed.verseStart ?? 1
  const last = parsed.verseEnd ?? parsed.verseStart ?? Number.POSITIVE_INFINITY

  const verses = chapter.verses
    .filter(verse => verse.verse >= first && verse.verse <= last)
    .map(verse => ({ verse: verse.verse, text: verse.text.replace(/\s+/g, ' ').trim() }))

  if (verses.length === 0) throw new Error(`${reference}: no verses matched`)
  return verses
}

/** Serialise one passage as the object literal the corpus holds. */
function serialise(passage: Passage): string {
  const quote = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  const verses = passage.verses
    .map(verse => `      { verse: ${verse.verse}, text: ${quote(verse.text)} },`)
    .join('\n')
  return [
    `  ${quote(passage.reference)}: {`,
    `    reference: ${quote(passage.reference)},`,
    `    book: ${quote(passage.book)},`,
    `    chapter: ${passage.chapter},`,
    '    verses: [',
    verses,
    '    ],',
    `    text: ${quote(passage.text)},`,
    '  },',
  ].join('\n')
}

const HEADER = `import type { ScriptureQuotation } from '@ci/content-schema'

/**
 * Verified public-domain Scripture text.
 *
 * Every full Scripture display on this site is rendered from this corpus. No
 * author ever types a verse by hand, which removes any possibility of a
 * misquoted or misremembered passage reaching a page.
 *
 * Translation: World English Bible (WEB), a public-domain modern English
 * revision of the American Standard Version, released into the public domain
 * by Rainbow Missions, Inc. It was chosen precisely because a reference work
 * of this size quotes Scripture far beyond what incidental-quotation
 * allowances for copyrighted modern translations would permit.
 *
 * GENERATED FILE — do not edit by hand. Retrieved ${WEB_VERIFIED_AT}. Regenerate with
 * \`bun run scripts/conditional-immortality/fetch-scripture.ts\`.
 */

export const WEB_LICENSE_ID = 'web-public-domain'
export const WEB_TRANSLATION = 'World English Bible'
export const WEB_TRANSLATION_SHORT = 'WEB'
export const WEB_VERIFIED_AT = '${WEB_VERIFIED_AT}'

export interface ScriptureVerse {
  readonly verse: number
  readonly text: string
}

export interface ScripturePassage {
  readonly reference: string
  readonly book: string
  readonly chapter: number
  readonly verses: readonly ScriptureVerse[]
  readonly text: string
}

const PASSAGES: Record<string, ScripturePassage> = {
`

const FOOTER = `}

/**
 * Look up a passage by its normalised reference.
 *
 * \`PASSAGES\` is an object literal, so a bare index reaches its prototype:
 * \`getScripture('constructor')\` returned \`Object\` itself, and \`hasScripture\`
 * agreed that it existed. \`requireScripture\` therefore did not throw for it
 * either, and \`<Scripture reference="constructor">\` would have rendered a
 * passage with no reference and no text — quietly defeating the one guarantee
 * this module exists to make. Every lookup goes through an own-property check.
 */
function ownPassage(reference: string): ScripturePassage | undefined {
  const key = reference.trim()
  return Object.hasOwn(PASSAGES, key) ? PASSAGES[key] : undefined
}

export function getScripture(reference: string): ScripturePassage | undefined {
  return ownPassage(reference)
}

/**
 * Look up a passage, failing loudly when it is absent.
 *
 * Called from the \`<Scripture>\` component, so a reference an author has typed
 * incorrectly fails the build with an actionable message rather than silently
 * rendering nothing.
 */
export function requireScripture(reference: string): ScripturePassage {
  const passage = ownPassage(reference)
  if (!passage) {
    throw new Error(
      \`No verified Scripture text for "\${reference}". Add it to \` +
        'ADDITIONAL_REFERENCES in scripts/conditional-immortality/fetch-scripture.ts ' +
        'and re-run that script. Never hand-write Scripture text.',
    )
  }
  return passage
}

export function hasScripture(reference: string): boolean {
  return ownPassage(reference) !== undefined
}

export const scriptureReferences: readonly string[] = Object.keys(PASSAGES)

/** A complete quotation record, including translation and rights metadata. */
export function scriptureQuotation(reference: string): ScriptureQuotation {
  const passage = requireScripture(reference)
  return {
    reference: passage.reference,
    translation: WEB_TRANSLATION,
    licenseId: WEB_LICENSE_ID,
    text: passage.text,
    sourceUrl: 'https://worldenglish.bible/',
    verifiedAt: WEB_VERIFIED_AT,
  }
}
`

async function main(): Promise<void> {
  const wanted = [...new Set([...scriptureReferences, ...ADDITIONAL_REFERENCES])]
  const byBook = new Map<string, Wanted[]>()
  const problems: string[] = []

  for (const reference of wanted) {
    const parsed = parseReference(reference)
    if (!parsed) {
      problems.push(`${reference}: not a reference this parser recognises`)
      continue
    }
    const list = byBook.get(parsed.book) ?? []
    list.push({ reference, parsed })
    byBook.set(parsed.book, list)
  }

  process.stdout.write(`${wanted.length} reference(s) across ${byBook.size} book(s)\n`)

  const passages: Passage[] = []
  const mismatches: string[] = []
  const notices: string[] = []

  for (const [bookName, references] of byBook) {
    const meta = BIBLE_BOOKS.find(candidate => candidate.name === bookName)
    if (!meta) {
      problems.push(`${bookName}: not in the canon`)
      continue
    }
    let book: GetBibleBook
    try {
      book = await fetchBook(meta.order, bookName)
    } catch (error) {
      problems.push((error as Error).message)
      continue
    }

    for (const { reference, parsed } of references) {
      try {
        const verses = versesFor(reference, parsed, book)
        const passage: Passage = {
          reference,
          book: parsed.book,
          chapter: parsed.chapter,
          verses,
          text: verses.map(verse => verse.text).join(' '),
        }

        // A difference means the source changed under us, which is for a
        // person to look at rather than a script to apply.
        const existing = getScripture(reference)
        if (existing) {
          if (existing.text !== passage.text) {
            const known = KNOWN_SOURCE_DEFECTS[reference]
            if (known && sameWords(existing.text, passage.text)) {
              notices.push(`  ${reference} — ${known}`)
            } else {
              mismatches.push(`  ${reference}`)
            }
          }
          passages.push(existing)
        } else {
          process.stdout.write(`  + ${reference} (${verses.length} verse(s))\n`)
          passages.push(passage)
        }
      } catch (error) {
        problems.push((error as Error).message)
      }
    }
  }

  if (problems.length > 0) {
    process.stderr.write(`\nRefusing to write the corpus:\n${problems.join('\n')}\n`)
    process.exit(1)
  }

  if (mismatches.length > 0) {
    process.stderr.write(
      `\n${mismatches.length} passage(s) no longer match the source, so nothing was written:\n` +
        `${mismatches.join('\n')}\n\n` +
        'Committed Scripture text differs from the live World English Bible. Review each\n' +
        'one by hand — this script will not change verified text on its own.\n',
    )
    process.exit(1)
  }

  if (notices.length > 0) {
    process.stdout.write(
      `\nKept the committed text over the feed in ${notices.length} place(s):\n${notices.join('\n')}\n`,
    )
  }

  /*
   * Sorted so the file is stable across runs. Plain code-point order, not
   * `localeCompare`, which orders the punctuation in "Genesis 1:26-27"
   * differently and would reshuffle the committed corpus to no effect.
   */
  passages.sort((a, b) => (a.reference < b.reference ? -1 : a.reference > b.reference ? 1 : 0))

  const source = `${HEADER}${passages.map(serialise).join('\n')}\n${FOOTER}`
  writeFileSync(OUT_FILE, source, 'utf8')

  const format = Bun.spawnSync(['bunx', 'biome', 'check', '--write', OUT_FILE], {
    cwd: REPO_ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (format.exitCode !== 0) {
    process.stderr.write(`\nbiome could not format the generated file:\n${format.stderr}\n`)
    process.exit(1)
  }

  const verses = passages.reduce((sum, passage) => sum + passage.verses.length, 0)
  process.stdout.write(`\nWrote ${OUT_FILE}\n${passages.length} passages, ${verses} verses\n`)
}

await main()
