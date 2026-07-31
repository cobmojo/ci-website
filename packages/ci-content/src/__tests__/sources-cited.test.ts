import { describe, expect, it } from 'vitest'
import { caseSections } from '../case/index'
import { extractHeadings, listMdx, mdxExists, readMdx, sectionFileName } from '../mdx'
import { sources } from '../sources/index'

/**
 * `citedBy` has to agree with the citations in the bodies.
 *
 * Every section page renders a list under "Sources cited on this page", built
 * by filtering sources on `citedBy`. That heading is a claim about the page
 * beneath it, and the array is hand-maintained, so the two drifted both ways:
 * a source cited twice in the body was missing from the list, and another was
 * listed on a page whose text never mentions it.
 *
 * Only sections with an MDX body can be checked. The two appendices are built
 * from structured data and have no body to read, so a `citedBy` entry naming
 * one of them is left alone rather than assumed wrong.
 */

const BODIES = new Map<string, string>(
  caseSections
    .map(section => [section.id, sectionFileName(section.id, section.slug)] as const)
    .filter(([, file]) => mdxExists('case', file))
    .map(([id, file]) => [id, readMdx('case', file)]),
)

/** Source ids cited inline in a section body. */
function citedIn(body: string): Set<string> {
  return new Set([...body.matchAll(/<Cite\s+id="([a-z0-9-]+)"/g)].map(match => match[1] ?? ''))
}

describe('sources cited on a page', () => {
  it('has a body to read for all but the two appendices', () => {
    // If this ever drops, the checks below quietly stop covering sections.
    expect(BODIES.size).toBe(caseSections.length - 2)
  })

  it('lists every source a section actually cites', () => {
    const missing: string[] = []
    for (const [sectionId, body] of BODIES) {
      for (const id of citedIn(body)) {
        const source = sources.find(record => record.id === id)
        expect(source, `${sectionId} cites unknown source "${id}"`).toBeDefined()
        if (source && !source.citedBy.includes(sectionId)) {
          missing.push(`${id} is cited in ${sectionId} but not in its citedBy`)
        }
      }
    }
    expect(missing, 'a page cites a source its own sources list leaves out').toEqual([])
  })

  it('claims no citation a section does not make', () => {
    const spurious: string[] = []
    for (const source of sources) {
      for (const sectionId of source.citedBy) {
        const body = BODIES.get(sectionId)
        if (!body) continue
        if (!citedIn(body).has(source.id)) {
          spurious.push(`${source.id} claims ${sectionId}, whose body never cites it`)
        }
      }
    }
    expect(spurious, 'a page lists a source it never cites').toEqual([])
  })
})

/**
 * A callout that renders a level-2 heading has to carry its own id.
 *
 * It is literal JSX, so `rehype-slug` never sees it and cannot supply one. Both
 * appendices opened on such a heading — the caveat saying the page proves
 * nothing about what Scripture teaches — with no id at all, so it could not be
 * linked and "On this page" began at the second heading instead of the first.
 * `extractHeadings` reads the id straight off the tag, which means a missing
 * one fails silently by omission rather than loudly.
 */
describe('callout headings that act as sections', () => {
  const MDX_DIRECTORIES = ['case', 'appendices'] as const

  it('gives every level-2 callout an id, and lists it in the contents', () => {
    const withoutId: string[] = []
    const unlisted: string[] = []

    for (const collection of MDX_DIRECTORIES) {
      for (const file of listMdx(collection)) {
        const body = readMdx(collection, file)
        const headings = extractHeadings(body)
        for (const [, attributes] of body.matchAll(/<Callout\b([^>]*\bas="h2"[^>]*)>/g)) {
          const title = /\btitle="([^"]*)"/.exec(attributes ?? '')?.[1] ?? ''
          const id = /\bid="([^"]*)"/.exec(attributes ?? '')?.[1]
          if (!id) {
            withoutId.push(`${file}: "${title}"`)
            continue
          }
          if (!headings.some(heading => heading.id === id)) {
            unlisted.push(`${file}: "${title}" (#${id})`)
          }
        }
      }
    }

    expect(withoutId, 'a level-2 callout with no id cannot be linked').toEqual([])
    expect(unlisted, 'a level-2 callout missing from the extracted headings').toEqual([])
  })
})
