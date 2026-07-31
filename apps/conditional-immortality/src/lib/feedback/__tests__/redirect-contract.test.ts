import { SUBMISSION_STATUS_ID } from '@ci/content-schema'
import { describe, expect, it } from 'vitest'
import { failureRedirect, SUCCESS_REDIRECT } from '../handler'

/**
 * The URL a reader without scripting is sent back to, asserted as properties.
 *
 * `handler.test.ts` covers the same redirects by comparing the `location`
 * header against `failureRedirect(...)` and `SUCCESS_REDIRECT`. That proves the
 * handler uses these builders and nothing about what they build: both sides of
 * the comparison move together, so dropping the fragment, collapsing the two
 * failure outcomes, or echoing a reader's message would keep every one of those
 * assertions green.
 *
 * These state the three claims the code makes in prose instead. Each was a real
 * defect once: the redirect landed at the top of a 2,000px page with the answer
 * off screen; a storage failure told a reader to check wording that was fine,
 * sending them back into a failure that repeats; and a retry arrived with no
 * page attached and relabelled as a factual correction.
 */
describe('the redirect a form-encoded submission is answered with', () => {
  it('carries the fragment, so the answer is where the reader is looking', () => {
    expect(SUCCESS_REDIRECT).toContain(`#${SUBMISSION_STATUS_ID}`)
    expect(failureRedirect('0', {})).toContain(`#${SUBMISSION_STATUS_ID}`)
    expect(failureRedirect('error', {})).toContain(`#${SUBMISSION_STATUS_ID}`)
  })

  it('tells a rejected submission apart from one the server could not store', () => {
    expect(failureRedirect('0', {})).not.toBe(failureRedirect('error', {}))
    expect(new URL(failureRedirect('0', {}), 'https://x').searchParams.get('submitted')).toBe('0')
    expect(new URL(failureRedirect('error', {}), 'https://x').searchParams.get('submitted')).toBe(
      'error',
    )
  })

  it('carries the section, heading and type back for the retry', () => {
    const body = { sectionId: 'S04', headingId: 'in-brief', type: 'broken-link' }
    const params = new URL(failureRedirect('0', body), 'https://x').searchParams
    expect(params.get('section')).toBe('S04')
    expect(params.get('heading')).toBe('in-brief')
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

  it('ignores a value that is not a string', () => {
    const params = new URL(
      failureRedirect('0', { sectionId: ['S04'], headingId: 7, type: null }),
      'https://x',
    ).searchParams
    expect([...params.keys()]).toEqual(['submitted'])
  })
})
