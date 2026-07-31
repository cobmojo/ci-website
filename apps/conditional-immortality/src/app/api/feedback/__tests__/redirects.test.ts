import { SUBMISSION_STATUS_ID } from '@ci/content-schema'
import { describe, expect, it } from 'vitest'
import { correctionsHref, ECHO_LIMITS, failureRedirect, SUCCESS_REDIRECT } from '../redirects'

/**
 * The URL a reader without scripting is sent back to.
 *
 * Every claim below is one the route's own comments make, and none of them was
 * reachable from a test. The end-to-end block named for them runs with
 * `javaScriptEnabled: false` and then navigates to hand-written URLs —
 * `/corrections/?submitted=1#submission-status` and
 * `?submitted=0&section=S04&heading=the-text&type=broken-link` — so it supplies
 * the fragment and the echoed context itself and measures only how
 * `/corrections/` reads a query string. It passes with the fragment dropped
 * from the redirect, with both failure outcomes collapsed into one, and with
 * the echo removed entirely.
 *
 * Posting a real submission to reach them would spend the rate limit five
 * attempts at a time and write to the store, so the construction is tested
 * here and the page's reading of it stays where it is.
 */
describe('the redirect a form-encoded submission is answered with', () => {
  it('carries the fragment, so the answer is where the reader is looking', () => {
    // Without it the browser lands at the top and the message renders where it
    // sits in the document — measured at y=2090 on an 812px viewport.
    expect(SUCCESS_REDIRECT).toContain(`#${SUBMISSION_STATUS_ID}`)
    expect(failureRedirect('0', {})).toContain(`#${SUBMISSION_STATUS_ID}`)
    expect(failureRedirect('error', {})).toContain(`#${SUBMISSION_STATUS_ID}`)
  })

  it('tells a rejected submission apart from one the server could not store', () => {
    // Telling a reader whose wording was fine to check their wording sends
    // them back into a failure that repeats identically.
    expect(failureRedirect('0', {})).not.toBe(failureRedirect('error', {}))
    expect(new URL(failureRedirect('0', {}), 'https://x').searchParams.get('submitted')).toBe('0')
    expect(new URL(failureRedirect('error', {}), 'https://x').searchParams.get('submitted')).toBe(
      'error',
    )
  })

  it('carries the section, heading and type back for the retry', () => {
    const body = { sectionId: 'S04', headingId: 'the-text', type: 'broken-link' }
    const params = new URL(failureRedirect('0', body), 'https://x').searchParams
    expect(params.get('section')).toBe('S04')
    expect(params.get('heading')).toBe('the-text')
    expect(params.get('type')).toBe('broken-link')
  })

  it('never carries the message, the name or the email', () => {
    // A rejected message can be eight thousand characters, and putting it in
    // the query string puts it in history, in proxy logs, and on a shared
    // screen. The failure copy says plainly that the text was not kept.
    const location = failureRedirect('0', {
      sectionId: 'S04',
      message: 'the considered paragraph a reader wrote',
      name: 'A Reader',
      email: 'reader@example.com',
    })
    expect(location).not.toContain('considered')
    expect(location).not.toContain('A Reader')
    expect(location).not.toContain('example.com')
  })

  it('drops an echo the schema would reject again', () => {
    const tooLong = 'S'.repeat(ECHO_LIMITS.sectionId + 1)
    const params = new URL(failureRedirect('0', { sectionId: tooLong }), 'https://x').searchParams
    expect(params.get('section')).toBeNull()
    // And keeps one exactly at the limit, so the bound is not off by one.
    const atLimit = 'S'.repeat(ECHO_LIMITS.sectionId)
    expect(
      new URL(failureRedirect('0', { sectionId: atLimit }), 'https://x').searchParams.get(
        'section',
      ),
    ).toBe(atLimit)
  })

  it('ignores a value that is not a string', () => {
    const params = new URL(
      failureRedirect('0', { sectionId: ['S04'], headingId: 7, type: null }),
      'https://x',
    ).searchParams
    expect([...params.keys()]).toEqual(['submitted'])
  })

  it('sends the one failure with a page of its own to the form itself', () => {
    expect(correctionsHref({ sectionId: 'S04' })).toBe('/corrections/?section=S04#form')
    // Every feedback link on the site ends in `#form`, including this one when
    // there is no context to carry.
    expect(correctionsHref({})).toBe('/corrections/#form')
  })
})
