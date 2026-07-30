import { caseSections } from '@ci/content'
import { CASE_GROUP_LABELS, type CaseGroup, type CaseSection } from '@ci/content-schema'
import { describe, expect, it } from 'vitest'
import { crumbsFor, groupLabel, sectionBodyExists } from '../sections'

function firstOfGroup(group: CaseGroup): CaseSection {
  const section = caseSections.find(candidate => candidate.group === group)
  if (!section) throw new Error(`The registry has no section in group "${group}"`)
  return section
}

describe('crumbsFor', () => {
  it('starts at the home page and ends on the section itself', () => {
    for (const section of caseSections) {
      const trail = crumbsFor(section)
      expect(trail[0]).toEqual({ href: '/', label: 'Home' })
      expect(trail.at(-1)).toEqual({ href: section.route, label: section.title })
    }
  })

  it('routes an objection through the objections index', () => {
    const section = firstOfGroup('objection')
    expect(crumbsFor(section).map(crumb => crumb.href)).toEqual([
      '/',
      '/objections/',
      section.route,
    ])
  })

  it('routes an appendix through the appendix anchor, not the case index', () => {
    const section = firstOfGroup('appendix')
    expect(crumbsFor(section).map(crumb => crumb.href)).toEqual([
      '/',
      '/case/#appendix',
      section.route,
    ])
  })

  it('routes a case section through its subgroup heading', () => {
    const section = firstOfGroup('key-text')
    expect(crumbsFor(section)).toEqual([
      { href: '/', label: 'Home' },
      { href: '/case/', label: 'The Case' },
      { href: '/case/#key-text', label: 'Key Texts' },
      { href: section.route, label: section.title },
    ])
  })

  it('omits the subgroup crumb for a group that has no heading of its own', () => {
    const section = firstOfGroup('preface')
    expect(crumbsFor(section).map(crumb => crumb.href)).toEqual(['/', '/case/', section.route])
  })

  it('gives every subgroup a crumb pointing at a real anchor on the case index', () => {
    const subgroups: CaseGroup[] = [
      'roadblock',
      'key-text',
      'biblical-language',
      'biblical-pattern',
      'final-destiny',
      'further-reasoning',
    ]
    for (const group of subgroups) {
      const trail = crumbsFor(firstOfGroup(group))
      expect(trail).toHaveLength(4)
      expect(trail[2]?.href).toBe(`/case/#${group}`)
    }
  })
})

describe('groupLabel', () => {
  it('reads the label from the shared schema, so page and index agree', () => {
    for (const section of caseSections) {
      expect(groupLabel(section)).toBe(CASE_GROUP_LABELS[section.group])
    }
  })
})

describe('sectionBodyExists', () => {
  /**
   * Appendix bodies live in their own directory. Looking in the wrong one
   * throws at render time rather than at build time, so both branches of the
   * collection mapping are checked here against the files on disk.
   */
  it('finds the body of a case section and of an appendix', () => {
    expect(sectionBodyExists(firstOfGroup('key-text'))).toBe(true)
    expect(sectionBodyExists(firstOfGroup('appendix'))).toBe(true)
  })
})
