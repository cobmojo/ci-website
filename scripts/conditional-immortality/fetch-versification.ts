#!/usr/bin/env bun
/**
 * Regenerate the versification table `parseReference` bounds verses against.
 * 1,189 chapters, so it is derived rather than typed.
 *
 * The source is the World English Bible as served by getbible.net — the same
 * versification the Scripture corpus uses, which matters because another
 * edition could disagree about whether 3 John has fourteen verses or fifteen
 * and make the parser reject a reference the corpus can satisfy.
 *
 * Writes `packages/ci-content-schema/src/versification.ts`. Nothing calls it at
 * build or request time; run it by hand when the table needs rebuilding:
 *
 *     bun run scripts/conditional-immortality/fetch-versification.ts
 */
import { writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { BIBLE_BOOKS } from '../../packages/ci-content-schema/src/bible'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const OUT_FILE = join(REPO_ROOT, 'packages', 'ci-content-schema', 'src', 'versification.ts')

/** How many books to fetch at once. Small enough to stay a polite client. */
const CONCURRENCY = 6

interface GetBibleVerse {
  readonly chapter: number
  readonly verse: number
}

interface GetBibleChapter {
  readonly chapter: number
  readonly verses: readonly GetBibleVerse[]
}

interface GetBibleBook {
  readonly nr: number
  readonly name: string
  readonly chapters: readonly GetBibleChapter[]
}

async function fetchBook(order: number): Promise<GetBibleBook> {
  const url = `https://api.getbible.net/v2/web/${order}.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} responded ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as GetBibleBook
}

/**
 * Verse counts for one book, one entry per chapter.
 *
 * Taken from the highest verse *number* rather than the array length: a
 * numbering gap would make the length too small, which is the dangerous
 * direction, since it would reject a real reference.
 */
function verseCounts(book: GetBibleBook): number[] {
  const counts: number[] = []
  for (const chapter of book.chapters) {
    let highest = 0
    for (const verse of chapter.verses) {
      if (verse.verse > highest) highest = verse.verse
    }
    if (highest === 0) throw new Error(`${book.name} ${chapter.chapter} has no verses`)
    counts[chapter.chapter - 1] = highest
  }
  return counts
}

async function main(): Promise<void> {
  const table = new Map<string, number[]>()
  const queue = [...BIBLE_BOOKS]
  const failures: string[] = []

  async function worker(): Promise<void> {
    for (;;) {
      const expected = queue.shift()
      if (!expected) return
      try {
        const fetched = await fetchBook(expected.order)
        const counts = verseCounts(fetched)

        // A mismatch means the two sources disagree about the shape of the
        // Bible, and guessing which is right is not this script's business.
        if (counts.length !== expected.chapters) {
          failures.push(
            `${expected.name}: canon says ${expected.chapters} chapters, source has ${counts.length}`,
          )
          continue
        }
        for (let i = 0; i < counts.length; i += 1) {
          if (!counts[i]) {
            failures.push(`${expected.name} ${i + 1}: no verse count`)
          }
        }
        table.set(expected.name, counts)
        process.stdout.write(`  ${expected.name} (${counts.length} chapters)\n`)
      } catch (error) {
        failures.push(`${expected.name}: ${(error as Error).message}`)
      }
    }
  }

  process.stdout.write(`Fetching ${BIBLE_BOOKS.length} books from getbible.net (WEB)\n`)
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))

  if (failures.length > 0) {
    process.stderr.write(`\nRefusing to write the table:\n${failures.join('\n')}\n`)
    process.exit(1)
  }

  const totalChapters = [...table.values()].reduce((sum, counts) => sum + counts.length, 0)
  const totalVerses = [...table.values()].reduce(
    (sum, counts) => sum + counts.reduce((a, b) => a + b, 0),
    0,
  )

  const rows = BIBLE_BOOKS.map(book => {
    const counts = table.get(book.name)
    if (!counts) throw new Error(`${book.name} missing after fetch`)
    return `  '${book.name.replace(/'/g, "\\'")}': [${counts.join(', ')}],`
  }).join('\n')

  const source = `/**
 * Verse counts for every chapter of the 66-book canon.
 *
 * GENERATED FILE — do not edit by hand. Regenerate with:
 *
 *     bun run scripts/conditional-immortality/fetch-versification.ts
 *
 * Derived from the World English Bible as served by getbible.net, which is the
 * translation the rendered Scripture corpus quotes. Keys are the canonical book
 * names in \`BIBLE_BOOKS\`; each array is one entry per chapter, in order, giving
 * the number of the last verse in that chapter.
 *
 * ${BIBLE_BOOKS.length} books, ${totalChapters} chapters, ${totalVerses} verses.
 */
export const VERSE_COUNTS: Readonly<Record<string, readonly number[]>> = {
${rows}
}

/** The longest chapter in the canon, used as the fallback bound. */
export const LONGEST_CHAPTER = ${Math.max(...[...table.values()].flat())}
`

  writeFileSync(OUT_FILE, source, 'utf8')

  // Hand the file to the formatter rather than trying to emit its exact output,
  // or the generator and `lint:fix` fight over it on every run.
  const format = Bun.spawnSync(['bunx', 'biome', 'check', '--write', OUT_FILE], {
    cwd: REPO_ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  })
  if (format.exitCode !== 0) {
    process.stderr.write(`\nbiome could not format the generated file:\n${format.stderr}\n`)
    process.exit(1)
  }

  process.stdout.write(
    `\nWrote ${OUT_FILE}\n${table.size} books, ${totalChapters} chapters, ${totalVerses} verses\n`,
  )
}

await main()
