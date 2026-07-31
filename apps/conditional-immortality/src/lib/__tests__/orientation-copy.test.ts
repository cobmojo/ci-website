import { caseSections, ESSENTIAL_PATH, objectionSections } from '@ci/content/case'
import { video } from '@ci/content/video'
import { describe, expect, it } from 'vitest'
import { PRIMARY_NAV, WATCH_CTA } from '../navigation'

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
  'src/app/case/page.tsx (header, "Twelve pages", "All 40 pages")',
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
    expect(parts.filter(section => section.group !== 'roadblock').length).toBe(34)
  })

  it('has 40 entries in all, as "All 40 pages" on the case hub states', () => {
    expect(caseSections.length).toBe(40)
  })

  it('has a twelve-page essential path, as the case hub states', () => {
    expect(ESSENTIAL_PATH.length).toBe(12)
  })

  it('keeps the header nav description in step with the part count', () => {
    const caseEntry = PRIMARY_NAV.find(item => item.href === '/case/')
    expect(caseEntry?.description).toContain(`${parts.length} parts`)
  })

  it('has seven objections, as the objections index description states', () => {
    expect(objectionSections.length).toBe(7)
  })

  it('keeps the Watch CTA running time in step with the video registry', () => {
    // "28 minutes, with chapters and a full transcript" appears in the header
    // and the mobile sheet via WATCH_CTA; the number must be the video's.
    // Floor, not round: the site speaks of a 28:32 video as "28 minutes",
    // the same convention ClickToLoadVideo uses for its poster.
    expect(WATCH_CTA.description).toContain(`${Math.floor(video.durationSeconds / 60)} minutes`)
  })
})
