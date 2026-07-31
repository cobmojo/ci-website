import { describe, expect, it } from 'vitest'
import { FeedbackSubmissionInputSchema } from '../index'

/**
 * The correction form's client-side validators are documented as mirrors of
 * this schema. A mirror has to agree on what is valid: the client refuses any
 * source URL that is not http or https, so the server must too, or a no-JS
 * submission can store a URL the scripted form would have refused, including
 * a `javascript:` URL that becomes a hazard the moment review tooling renders
 * it as a link.
 */

const VALID = {
  type: 'factual-correction',
  message: 'The citation on this page points at the wrong chapter of the source.',
  publicationConsent: 'do-not-publish',
} as const

function parse(sourceUrl: string) {
  return FeedbackSubmissionInputSchema.safeParse({ ...VALID, sourceUrl })
}

describe('feedback sourceUrl', () => {
  it('accepts an https address', () => {
    expect(parse('https://example.org/article').success).toBe(true)
  })

  it('accepts an http address', () => {
    expect(parse('http://example.org/article').success).toBe(true)
  })

  it('accepts the empty string the form sends for an untouched field', () => {
    expect(parse('').success).toBe(true)
  })

  it('rejects a javascript: URL', () => {
    expect(parse('javascript:alert(1)').success).toBe(false)
  })

  it('rejects other non-web schemes', () => {
    expect(parse('ftp://example.org/file').success).toBe(false)
  })
})
