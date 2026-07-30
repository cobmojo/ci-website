import { caseSections, ESSENTIAL_PATH } from '@ci/content/case'
import { describe, expect, it } from 'vitest'
import { PRIMARY_NAV } from '../navigation'

/**
 * Orientation copy makes numeric claims in words: the homepage and the 404
 * offer "thirty-seven parts", the case hub "thirty-four numbered arguments"
 * and "Twelve pages", the header nav "All 37 parts". Prose cannot interpolate
 * a registry length without abandoning the site's written-out style, so this
 * test pins the registry to the numbers the copy states. If a section is ever
 * added or removed, this fails and names every surface to reword.
 */

const SURFACES = [
  'src/app/page.tsx ("thirty-seven parts")',
  'src/app/not-found.tsx ("thirty-seven parts")',
  'src/app/start/page.tsx ("thirty-seven parts, with a preface and two appendices")',
  'src/app/case/page.tsx (header, "Twelve pages", "all forty")',
  'src/lib/navigation.ts ("All 37 parts")',
].join(', ')

describe('the part counts the orientation copy relies on', () => {
  const parts = caseSections.filter(
    section => section.group !== 'preface' && section.group !== 'appendix',
  )

  it(`has 37 parts (roadblocks plus numbered sections); if not, update ${SURFACES}`, () => {
    expect(parts.length).toBe(37)
  })

  it('has 34 numbered arguments and 3 roadblocks, as the case hub states', () => {
    expect(parts.filter(section => section.group === 'roadblock').length).toBe(3)
    expect(parts.length - 3).toBe(34)
  })

  it('has 40 entries in all, as "all forty" on the case hub states', () => {
    expect(caseSections.length).toBe(40)
  })

  it('has a twelve-page essential path, as the case hub states', () => {
    expect(ESSENTIAL_PATH.length).toBe(12)
  })

  it('keeps the header nav description in step with the part count', () => {
    const caseEntry = PRIMARY_NAV.find(item => item.href === '/case/')
    expect(caseEntry?.description).toContain(`${parts.length} parts`)
  })
})
