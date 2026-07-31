import { type ParsedReference, parseReference } from '@ci/content-schema'
import { describe, expect, it } from 'vitest'
import { caseSections } from '../case/index'
import { listMdx, mdxExists, readMdx, sectionFileName } from '../mdx'

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
    .map(section => [section.id, sectionFileName(section.id, section.slug)] as const)
    .filter(([, file]) => mdxExists('case', file))
    .map(([id, file]) => [id, readMdx('case', file)]),
)

/** Every reference set out as a full `<Scripture>` block in a body. */
function displayedIn(body: string): string[] {
  const found = [...body.matchAll(/<Scripture\b[^>]*\breference="([^"]+)"/g)].map(
    match => match[1] ?? '',
  )
  return [...new Set(found)]
}

/** Does one parsed reference reach the verses of another? */
function covers(declared: ParsedReference, shown: ParsedReference): boolean {
  if (declared.book !== shown.book) return false

  const declaredChapters = [declared.chapter, declared.chapterEnd ?? declared.chapter] as const
  const shownChapters = [shown.chapter, shown.chapterEnd ?? shown.chapter] as const
  if (declaredChapters[0] > shownChapters[1] || shownChapters[0] > declaredChapters[1]) return false

  // A range spanning chapters, or a reference naming no verse, is the whole of
  // every chapter it touches, so a chapter in common is enough.
  const spansChapters = declared.chapterEnd !== undefined || shown.chapterEnd !== undefined
  if (spansChapters || declared.verseStart === undefined || shown.verseStart === undefined) {
    return true
  }

  const declaredVerses = [declared.verseStart, declared.verseEnd ?? declared.verseStart] as const
  const shownVerses = [shown.verseStart, shown.verseEnd ?? shown.verseStart] as const
  return declaredVerses[0] <= shownVerses[1] && shownVerses[0] <= declaredVerses[1]
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

  it('reads a body for every section that has one', () => {
    // Without this, a rename of the MDX files would empty `BODIES` and the
    // check above would pass by having nothing left to look at.
    expect(BODIES.size).toBeGreaterThan(30)
    expect(BODIES.size).toBeLessThanOrEqual(listMdx('case').length)
  })

  it('finds the blocks it is looking for', () => {
    // And without this, a change to how a full quotation is written in MDX
    // would silently reduce the check to an empty loop.
    const displayed = [...BODIES.values()].flatMap(displayedIn)
    expect(displayed.length).toBeGreaterThan(20)
  })
})
