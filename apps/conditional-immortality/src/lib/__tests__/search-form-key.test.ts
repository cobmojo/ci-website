import { describe, expect, it } from 'vitest'
import { searchFormKey } from '../search-form-key'

/**
 * The key that remounts the search form.
 *
 * Its only job is to differ whenever the form's uncontrolled defaults would
 * differ. A key that collides leaves a reader with controls describing a
 * different search from the one on screen, which is what a comma-joined key
 * did, so injectivity is the property worth testing and it is testable here
 * rather than through a browser.
 */
describe('searchFormKey', () => {
  it('separates a query that spells a filter from that filter being on', () => {
    // The measured collision: searching for the phrase "hell,objection" and
    // searching "hell" with the Objections filter produced the same key, so
    // the form kept the previous form's ticked box over unfiltered results.
    expect(searchFormKey('hell,objection', [], [], [])).not.toBe(
      searchFormKey('hell', ['objection'], [], []),
    )
  })

  it('separates one multi-valued parameter from another', () => {
    expect(searchFormKey('fire', [], ['a,b'], [])).not.toBe(
      searchFormKey('fire', [], ['a', 'b'], []),
    )
    expect(searchFormKey('fire', [], [], ['Mark'])).not.toBe(
      searchFormKey('fire', [], ['Mark'], []),
    )
  })

  it('separates values that differ only by where a boundary falls', () => {
    expect(searchFormKey('', ['a'], [], [])).not.toBe(searchFormKey('a', [], [], []))
    expect(searchFormKey('"', [], [], [])).not.toBe(searchFormKey('', ['"'], [], []))
  })

  it('is stable for the same parameters', () => {
    expect(searchFormKey('fire', ['topic'], ['key-text'], ['Mark'])).toBe(
      searchFormKey('fire', ['topic'], ['key-text'], ['Mark']),
    )
  })
})
