import { type ParsedReference, parseReference } from '@ci/content-schema'
import { describe, expect, it } from 'vitest'
import { caseSections } from '../case/index'
import { listMdx, mdxExists, readMdx, sectionCollection, sectionFileName } from '../mdx'

/**
 * The Scripture index has to hold what the pages actually display.
 *
 * `/scripture/` is offered as "Every reference used anywhere in the case, with
 * links to the sections that treat it", and the narrow-screen menu calls it
 * "Every reference in the case". The index is built only from each section's
 * declared `primaryPassages` and `relatedPassages`; nothing reads the bodies.
 * So a `<Scripture>` block quoted in full on a page reached the index only if
 * someone also remembered to declare it, and five did not: RB2 sets out
 * Genesis 1:26-27 and declares nothing in Genesis, RB3 quotes
 * 1 Corinthians 15:24-26 and Hebrews 9:27 and declares nothing in either book,
 * and S28 quotes Revelation 22:1-5 and Revelation 2:7 while declaring only
 * Revelation 22:14-15. A reader looking any of them up found no row naming the
 * page that sets it out.
 *
 * Coverage, not string equality, is the test. A section that displays
 * Matthew 25:46 while declaring Matthew 25:31-46 is already on that row, and a
 * reader looking the verse up finds the section — which is all the promise
 * claims. Requiring the exact string would demand churn that buys nothing.
 */

const BODIES = new Map<string, string>(
  caseSections
    .map(
      section =>
        [
          section.id,
          sectionCollection(section.group),
          sectionFileName(section.id, section.slug),
        ] as const,
    )
    .filter(([, collection, file]) => mdxExists(collection, file))
    .map(([id, collection, file]) => [id, readMdx(collection, file)]),
)

/** Every reference set out as a full `<Scripture>` block in a body. */
function displayedIn(body: string): string[] {
  const found = [...body.matchAll(/<Scripture\b[^>]*\breference="([^"]+)"/g)].map(
    match => match[1] ?? '',
  )
  return [...new Set(found)]
}

/**
 * Does a declared reference reach every verse of a displayed one?
 *
 * Containment, not overlap. Written as an intersection, a *narrower*
 * declaration covered a *wider* display: S13 declares Hebrews 12:29 and sets
 * out Hebrews 12:26-29 in full, so the index held a row for the single verse
 * and none for the three before it, and the check that exists to catch exactly
 * that was green against it. The same slip in the other direction let a
 * declared single verse stand for a whole chapter on the page.
 */
function covers(declared: ParsedReference, shown: ParsedReference): boolean {
  if (declared.book !== shown.book) return false

  const declaredChapters = [declared.chapter, declared.chapterEnd ?? declared.chapter] as const
  const shownChapters = [shown.chapter, shown.chapterEnd ?? shown.chapter] as const
  // Every chapter the display touches must be inside the declaration.
  if (shownChapters[0] < declaredChapters[0] || shownChapters[1] > declaredChapters[1]) return false

  // A declaration spanning chapters, or naming no verse, is the whole of every
  // chapter it names — so the chapter test above has already settled it.
  if (declared.chapterEnd !== undefined || declared.verseStart === undefined) return true

  // A display naming no verse, or spanning chapters, is a whole chapter or
  // more; a declaration naming verses cannot reach all of it.
  if (shown.chapterEnd !== undefined || shown.verseStart === undefined) return false

  const declaredVerses = [declared.verseStart, declared.verseEnd ?? declared.verseStart] as const
  const shownVerses = [shown.verseStart, shown.verseEnd ?? shown.verseStart] as const
  return declaredVerses[0] <= shownVerses[0] && shownVerses[1] <= declaredVerses[1]
}

describe('the Scripture index against the pages it indexes', () => {
  it('lists the section for every passage that section sets out in full', () => {
    const unreachable: string[] = []

    for (const section of caseSections) {
      const body = BODIES.get(section.id)
      if (!body) continue

      const declared = [...section.primaryPassages, ...section.relatedPassages]
        .map(reference => parseReference(reference))
        .filter((parsed): parsed is ParsedReference => parsed !== undefined)

      for (const reference of displayedIn(body)) {
        const shown = parseReference(reference)
        expect(shown, `${section.id} displays "${reference}", which will not parse`).toBeDefined()
        if (!shown) continue
        if (!declared.some(entry => covers(entry, shown))) {
          unreachable.push(
            `${section.id} sets out ${shown.normalized} and declares nothing that reaches it`,
          )
        }
      }
    }

    expect(unreachable).toEqual([])
  })

  it('reads a body for every section, including both appendices', () => {
    // Without this, a rename of the MDX files would empty `BODIES` and the
    // check above would pass by having nothing left to look at. Pinned to the
    // registry rather than to a floor: `BODIES.size > 30` was true of the 38
    // this read before the appendices were included, and true of 40 after, so
    // it could not tell that two of the forty pages were being skipped.
    expect(BODIES.size).toBe(caseSections.length)
    expect(listMdx('case').length + listMdx('appendices').length).toBe(caseSections.length)
  })

  it('finds every block it is looking for', () => {
    // And without this, a change to how a full quotation is written in MDX
    // would silently reduce the check to an empty loop.
    //
    // Counted against the bodies rather than floored. `> 20` was true of the
    // 189 blocks the corpus holds and true of any 21 of them, so 38 of the 40
    // pages could stop being matched and this stayed green — the same "true of
    // 38 and true of 40" shape as the assertion two tests above.
    const bodies = [...BODIES.values()]
    const blocksIn = (body: string) => body.split('<Scripture').length - 1
    const written = bodies.reduce((total, body) => total + blocksIn(body), 0)
    const found = bodies.flatMap(displayedIn)
    expect(written, 'the corpus stopped setting Scripture out in blocks').toBeGreaterThan(150)
    // Distinct per body, so the two counts differ only by repeats within a page.
    expect(new Set(found).size).toBeLessThanOrEqual(written)
    expect(found.length, 'a block the reference pattern no longer matches').toBe(
      bodies.reduce((total, body) => total + new Set(displayedIn(body)).size, 0),
    )
    for (const [id, body] of BODIES) {
      if (blocksIn(body) > 0) {
        expect(
          displayedIn(body).length,
          `${id} sets out blocks none of which parse`,
        ).toBeGreaterThan(0)
      }
    }
  })
})
