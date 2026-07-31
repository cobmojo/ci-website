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

/** Every `<Scripture>` block in a body, in order, repeats included. */
function matchedIn(body: string): string[] {
  return [...body.matchAll(/<Scripture\b[^>]*\breference="([^"]+)"/g)].map(match => match[1] ?? '')
}

/** The distinct references a body sets out. */
function displayedIn(body: string): string[] {
  return [...new Set(matchedIn(body))]
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
    // Every block written is a block parsed, per page. The first attempt at
    // this compared `bodies.flatMap(displayedIn).length` against
    // `Σ new Set(displayedIn(body)).size`, which is the same number by
    // construction for any implementation — `displayedIn` already
    // deduplicates. It held at 0 = 0 with the matcher returning nothing, and at
    // 38 = 38 with 151 of the 189 blocks dropped, so the corpus-wide count its
    // own message advertised was never asserted at all. `matchedIn` keeps the
    // repeats, which is what makes the comparison mean something.
    const blocksIn = (body: string) => body.split('<Scripture').length - 1
    const written = [...BODIES.values()].reduce((total, body) => total + blocksIn(body), 0)
    /*
     * Pinned, not floored.
     *
     * `> 150` against 189 blocks is the same shape as the `> 20` this replaced
     * and as the `BODIES.size > 30` two tests above: true of the corpus and
     * true of a corpus missing 38 of them. The per-page equality below cannot
     * compensate, because both of its sides are derived from the same
     * `<Scripture` token — a page that stops writing them scores 0 === 0 and
     * the coverage check simply iterates nothing for it. Deleting the blocks
     * from RB2, RB3 and S06 leaves 154, which cleared the floor.
     *
     * So the count is recorded. Adding or removing a quotation is a content
     * decision and updating this line is part of making it.
     */
    expect(written, 'the number of Scripture blocks in the corpus changed').toBe(189)

    const unparsed: string[] = []
    for (const [id, body] of BODIES) {
      const matched = matchedIn(body).length
      if (matched !== blocksIn(body)) {
        unparsed.push(`${id}: ${blocksIn(body)} blocks written, ${matched} parsed`)
      }
    }
    expect(unparsed, 'a block the reference pattern no longer matches').toEqual([])
  })
})
