import { passages } from '@ci/content/passages'
import { describe, expect, it } from 'vitest'
import { passageBySlugOrReference } from '../passages'

describe('passageBySlugOrReference', () => {
  it('resolves a slug to its own page', () => {
    expect(passageBySlugOrReference('mark-9-42-48')).toEqual({
      slug: 'mark-9-42-48',
      route: '/passages/mark-9-42-48/',
      reference: 'Mark 9:42-48',
    })
  })

  it('resolves a normalised reference to the same page as its slug', () => {
    const bySlug = passageBySlugOrReference('matthew-10-28')
    const byReference = passageBySlugOrReference('Matthew 10:28')
    expect(byReference).toEqual(bySlug)
  })

  it('resolves a verse inside a range to the page that covers it', () => {
    expect(passageBySlugOrReference('Mark 9:44')?.slug).toBe('mark-9-42-48')
  })

  it('resolves an additional reference the page also answers', () => {
    // John 3:36 is listed on the John 3:16 page rather than getting its own.
    expect(passageBySlugOrReference('John 3:36')?.slug).toBe('john-3-16-36')
  })

  /**
   * Only passages with substantial treatment get a page. A citation without
   * one belongs in the Scripture index, so returning `undefined` is what
   * stops a thin auto-generated page being linked.
   */
  it('returns nothing for a reference with no page of its own', () => {
    expect(passageBySlugOrReference('Genesis 1:1')).toBeUndefined()
    expect(passageBySlugOrReference('not a reference')).toBeUndefined()
    expect(passageBySlugOrReference('')).toBeUndefined()
  })

  it('agrees with the registry for every passage that has a page', () => {
    for (const passage of passages) {
      expect(passageBySlugOrReference(passage.slug)).toEqual({
        slug: passage.slug,
        route: `/passages/${passage.slug}/`,
        reference: passage.normalizedReference,
      })
      expect(passageBySlugOrReference(passage.normalizedReference)?.slug).toBe(passage.slug)
    }
  })
})
