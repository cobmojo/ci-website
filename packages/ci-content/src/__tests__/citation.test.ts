import type { SourceRecord } from '@ci/content-schema'
import { describe, expect, it } from 'vitest'
import { citationLabel, citationShortName, formatCitation, sources } from '../sources/index'

/**
 * How a source is named where there is no room for the whole citation.
 *
 * Inline markers in prose show the short name, and the full citation is the
 * link's accessible name, so both have to be right: the short name is what a
 * reader sees, and the full one is what a screen reader reads out.
 */

function record(overrides: Partial<SourceRecord>): SourceRecord {
  return {
    id: 'test-source',
    type: 'book',
    title: 'A Title',
    perspective: 'conditionalist',
    citedBy: [],
    ...overrides,
  } as SourceRecord
}

describe('citationShortName', () => {
  it('names a modern author by surname', () => {
    expect(citationShortName(record({ author: 'Edward Fudge' }))).toBe('Fudge')
  })

  it('names a classical author by the part before the place', () => {
    // "of Lyons" is where he was bishop, not a family name. Taking the last
    // word cites Irenaeus as "Lyons", which reads as a different person.
    expect(citationShortName(record({ author: 'Irenaeus of Lyons' }))).toBe('Irenaeus')
    expect(citationShortName(record({ author: 'Augustine of Hippo' }))).toBe('Augustine')
    expect(citationShortName(record({ author: 'Ignatius of Antioch' }))).toBe('Ignatius')
  })

  it('does not mistake a surname that merely contains the letters "of"', () => {
    expect(citationShortName(record({ author: 'Jane Ofsted' }))).toBe('Ofsted')
  })

  it('prefers a short name the record states over anything derived', () => {
    expect(
      citationShortName(
        record({ author: undefined, title: 'Strong’s Greek 575: apo', shortName: 'Strong’s G575' }),
      ),
    ).toBe('Strong’s G575')
  })

  it('falls back to the first word of the title when there is no author', () => {
    expect(citationShortName(record({ author: undefined, title: 'Didache and other texts' }))).toBe(
      'Didache',
    )
  })

  it('never leaves an authorless source to that fallback', () => {
    // The fallback is a last resort, not a policy: it produced markers reading
    // "[What]" and "[Weeping]" in prose, and collided outright where two
    // articles opened on the same word.
    const unnamed = sources.filter(source => !source.author && !source.shortName)
    expect(unnamed.map(source => source.id)).toEqual([])
  })

  it('gives no two unrelated sources the same marker', () => {
    // Two works by one author share a surname, which is how citation has
    // always worked and which the locator tells apart. Two *unrelated*
    // sources sharing a marker is the defect: "[Annihilation]" stood for two
    // different articles and "[Strong’s]" for two different lexicon entries.
    const seen = new Map<string, SourceRecord>()
    const collisions: string[] = []
    for (const source of sources) {
      const short = citationShortName(source)
      const first = seen.get(short)
      if (!first) {
        seen.set(short, source)
      } else if (!first.author || first.author !== source.author) {
        collisions.push(`${first.id} and ${source.id} both cite as "${short}"`)
      }
    }
    expect(collisions).toEqual([])
  })

  it('gives every source in the library a short name that is not a bare place', () => {
    for (const source of sources) {
      const short = citationShortName(source)
      expect(short.length).toBeGreaterThan(0)
      if (source.author?.includes(' of ')) {
        // `startsWith` would be satisfied by the whole author string, or by a
        // single letter. The name before the place is the only right answer.
        expect(short, source.id).toBe(source.author.split(' of ')[0])
      }
    }
  })
})

describe('citationLabel', () => {
  it('is the plain citation when the marker adds no locator', () => {
    const source = record({ author: 'Edward Fudge', title: 'The Fire That Consumes' })
    expect(citationLabel(source)).toBe(formatCitation(source))
  })

  it('states the locator once when the marker repeats the one on the record', () => {
    // The record carries a default locator and markers usually pass the same
    // string, which appended blindly reads "...section 3. Book II, section 3".
    const source = record({
      author: 'Irenaeus of Lyons',
      title: 'Against Heresies',
      locator: 'Book II, chapter 34, section 3',
    })
    const label = citationLabel(source, 'Book II, chapter 34, section 3')
    expect(label).toBe('Irenaeus of Lyons. Against Heresies. Book II, chapter 34, section 3')
    expect(label.match(/Book II/g)).toHaveLength(1)
  })

  it('lets a marker cite a narrower place than the record default', () => {
    const source = record({
      author: 'Irenaeus of Lyons',
      title: 'Against Heresies',
      locator: 'Book II, chapter 34, section 3',
    })
    // The marker is citing the whole chapter, so the record's narrower default
    // is not what this citation means and must not trail after it.
    expect(citationLabel(source, 'Book II, chapter 34')).toBe(
      'Irenaeus of Lyons. Against Heresies. Book II, chapter 34',
    )
  })

  it('never repeats a locator for any citation the content actually makes', () => {
    for (const source of sources) {
      const label = citationLabel(source, source.locator)
      if (!source.locator) continue
      expect(label.split(source.locator).length - 1).toBe(1)
    }
  })
})
