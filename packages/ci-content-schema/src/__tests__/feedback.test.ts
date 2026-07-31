import { describe, expect, it } from 'vitest'
import { FeedbackSubmissionInputSchema, isAcceptableEmail, isAcceptableSourceUrl } from '../index'

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

/* ------------------------------------------------------------------ *
 * The two validators the browser and the server share
 * ------------------------------------------------------------------ */

describe('the shared field validators', () => {
  /*
   * These live in `feedback-vocabulary.ts` because both halves of the
   * correction form have to agree about them and neither can import the other:
   * the client cannot pull Zod in, and the server must not pull the form
   * library in. The schema wraps them with `.refine()`, so a change here
   * silently changes what the server accepts — which is why they are tested
   * directly rather than only through the schema.
   *
   * Both are deliberately permissive. Neither field is required; refusing a
   * correction over the spelling of an address the reader did not have to give
   * is the worse failure.
   */
  describe('isAcceptableEmail', () => {
    for (const value of [
      'reader@example.org',
      'first.last+tag@sub.example.co.uk',
      '  padded@example.org  ',
      'ünïcode@exämple.org',
    ]) {
      it(`accepts ${JSON.stringify(value)}`, () => {
        expect(isAcceptableEmail(value)).toBe(true)
      })
    }

    for (const value of ['', '   ', 'nobody', 'nobody@', '@example.org', 'no spaces@example.org']) {
      it(`refuses ${JSON.stringify(value)}`, () => {
        expect(isAcceptableEmail(value)).toBe(false)
      })
    }

    it('refuses a host with no dot, which is the one shape that reads as valid', () => {
      expect(isAcceptableEmail('reader@localhost')).toBe(false)
    })
  })

  describe('isAcceptableSourceUrl', () => {
    for (const value of [
      'https://example.org/page',
      'http://example.org',
      '  https://example.org/a?b=c#d  ',
      'https://xn--exmple-cua.org/quelle',
    ]) {
      it(`accepts ${JSON.stringify(value)}`, () => {
        expect(isAcceptableSourceUrl(value)).toBe(true)
      })
    }

    for (const value of ['', 'example.org', '/relative/path', 'not a url']) {
      it(`refuses ${JSON.stringify(value)}`, () => {
        expect(isAcceptableSourceUrl(value)).toBe(false)
      })
    }

    /*
     * The one that matters. A `javascript:` or `data:` address parses as a URL,
     * so a check that only asked whether `new URL()` threw would store it — and
     * the source address is rendered as a link on the corrections review page.
     */
    for (const value of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
    ]) {
      it(`refuses ${JSON.stringify(value)}, which parses but is not a web address`, () => {
        expect(isAcceptableSourceUrl(value)).toBe(false)
      })
    }
  })
})
