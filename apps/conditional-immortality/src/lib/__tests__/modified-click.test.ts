import { describe, expect, it } from 'vitest'
import { isModifiedClick } from '../modified-click'

/**
 * Every handler that intercepts a real link has to let the browser's own
 * link behaviour through. The search trigger is an `<a href="/search/">` and
 * each quick-search row is a `<Link>`; a modified click on either means "open
 * this somewhere else", and swallowing it loses a navigation the markup
 * promised.
 */

const plain = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false }

describe('isModifiedClick', () => {
  it('lets an ordinary primary click be intercepted', () => {
    expect(isModifiedClick(plain)).toBe(false)
  })

  it.each([
    ['meta (macOS new tab)', { metaKey: true }],
    ['ctrl (Windows and Linux new tab)', { ctrlKey: true }],
    ['shift (new window)', { shiftKey: true }],
    ['alt (download)', { altKey: true }],
  ])('treats %s as the browser’s to handle', (_label, modifier) => {
    expect(isModifiedClick({ ...plain, ...modifier })).toBe(true)
  })

  it('treats a middle click as the browser’s to handle', () => {
    expect(isModifiedClick({ ...plain, button: 1 })).toBe(true)
  })

  it('works for events that report no button at all', () => {
    const { button: _button, ...noButton } = plain
    expect(isModifiedClick(noButton)).toBe(false)
  })
})
