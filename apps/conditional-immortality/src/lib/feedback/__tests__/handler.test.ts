// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetRateLimit } from '../../rate-limit'
import { resolveFeedbackConfig } from '../config'
import {
  FAILURE_FRAGMENT,
  type FeedbackDeps,
  handleFeedback,
  MAX_BODY_BYTES,
  RATE_LIMIT,
  SUCCESS_FRAGMENT,
  UNCONFIRMED_FRAGMENT,
} from '../handler'
import {
  createFeedbackStore,
  type FeedbackStore,
  type StoredSubmission,
  UnconfirmedWrite,
} from '../store'

/**
 * The site's only write endpoint, exercised on every path it has.
 *
 * It had no tests at all. Every branch below is one a reader can reach — a
 * malformed body, a blocked store, a rate limit, a submission with no
 * scripting — and the two that matter most are the ones nobody sees: that a
 * record is never reported as stored unless it was, and that nothing a reader
 * typed ever reaches a log line.
 */

const VALID = {
  type: 'factual-correction',
  message: 'Section 12 transliterates the Greek two different ways in the same paragraph.',
  publicationConsent: 'anonymous',
} as const

let logs: Array<{ level: string; line: string }> = []
let store: FeedbackStore

function deps(overrides: Partial<FeedbackDeps> = {}): FeedbackDeps {
  return {
    config: resolveFeedbackConfig({ NODE_ENV: 'test' }),
    store,
    now: () => new Date('2026-07-31T10:00:00.000Z'),
    newId: () => '11111111-2222-3333-4444-555555555555',
    log: (level, line) => logs.push({ level, line }),
    ...overrides,
  }
}

function jsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://example.org/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function formRequest(
  fields: Record<string, string>,
  headers: Record<string, string> = {},
): Request {
  return new Request('https://example.org/api/feedback', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'sec-fetch-site': 'same-origin',
      ...headers,
    },
    body: new URLSearchParams(fields).toString(),
  })
}

beforeEach(() => {
  logs = []
  store = createFeedbackStore({ kind: 'memory' })
  resetRateLimit()
})

afterEach(() => {
  resetRateLimit()
})

describe('a valid submission', () => {
  it('is stored and acknowledged with the id it was stored under', async () => {
    const response = await handleFeedback(jsonRequest(VALID), deps())
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({ ok: true, id: expect.any(String) })
    expect(store.records?.()).toHaveLength(1)
  })

  it('stores only the fields the schema returned', async () => {
    await handleFeedback(
      jsonRequest({ ...VALID, name: 'A Reader', somethingElse: 'dropped', status: 'resolved' }),
      deps(),
    )
    const record = store.records?.()[0] as StoredSubmission
    expect(record.status).toBe('new')
    expect(Object.keys(record)).not.toContain('somethingElse')
  })

  it('answers a scripting-free submission with a 303 to a receipt the page can render', async () => {
    const response = await handleFeedback(formRequest(VALID), deps())
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`/corrections/#${SUCCESS_FRAGMENT}`)
    expect(store.records?.()).toHaveLength(1)
  })

  it('drops a blank optional field rather than storing an empty string', async () => {
    await handleFeedback(jsonRequest({ ...VALID, name: '   ', email: '' }), deps())
    const record = store.records?.()[0] as StoredSubmission
    expect(record.name).toBeUndefined()
    expect(record.email).toBeUndefined()
  })
})

describe('what the endpoint refuses', () => {
  it('refuses an unsupported content type', async () => {
    const response = await handleFeedback(
      new Request('https://example.org/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'text/plain', 'sec-fetch-site': 'same-origin' },
        body: 'hello',
      }),
      deps(),
    )
    expect(response.status).toBe(415)
  })

  it('answers malformed JSON with 400, not with “unsupported type”', async () => {
    const response = await handleFeedback(jsonRequest('{not json'), deps())
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ error: 'malformed-body' })
  })

  it('refuses a JSON array, which is an object to `typeof` and not to the schema', async () => {
    const response = await handleFeedback(jsonRequest([VALID]), deps())
    expect(response.status).toBe(400)
  })

  it('refuses an oversized body without reading it, on the declared length alone', async () => {
    const response = await handleFeedback(
      jsonRequest(VALID, { 'content-length': String(MAX_BODY_BYTES + 1) }),
      deps(),
    )
    expect(response.status).toBe(413)
  })

  it('refuses an oversized body that lies about its length', async () => {
    const huge = { ...VALID, message: 'x'.repeat(MAX_BODY_BYTES + 1_000) }
    const request = new Request('https://example.org/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify(huge),
    })
    request.headers.delete('content-length')
    expect((await handleFeedback(request, deps())).status).toBe(413)
    expect(store.records?.()).toHaveLength(0)
  })

  it('refuses a cross-site post', async () => {
    const response = await handleFeedback(
      jsonRequest(VALID, { 'sec-fetch-site': 'cross-site' }),
      deps(),
    )
    expect(response.status).toBe(403)
    expect(store.records?.()).toHaveLength(0)
  })

  it('refuses a post whose Origin is another host, for a browser that sends no Sec-Fetch-Site', async () => {
    const request = new Request('https://example.org/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://elsewhere.example' },
      body: JSON.stringify(VALID),
    })
    expect((await handleFeedback(request, deps())).status).toBe(403)
  })

  it('allows a same-origin post that carries no Sec-Fetch-Site', async () => {
    const request = new Request('https://example.org/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://example.org' },
      body: JSON.stringify(VALID),
    })
    expect((await handleFeedback(request, deps())).status).toBe(201)
  })

  it('allows a request from something that is not a browser at all', async () => {
    const request = new Request('https://example.org/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(VALID),
    })
    expect((await handleFeedback(request, deps())).status).toBe(201)
  })
})

describe('validation is the server’s job', () => {
  it('rejects a message below the minimum with a per-field report', async () => {
    const response = await handleFeedback(jsonRequest({ ...VALID, message: 'too short' }), deps())
    expect(response.status).toBe(400)
    const body = (await response.json()) as { fieldErrors: Array<{ field: string }> }
    expect(body.fieldErrors.map(error => error.field)).toContain('message')
  })

  it('never echoes a submitted value back in the error report', async () => {
    const secret = 'a-value-that-must-not-come-back-0xbeef'
    const response = await handleFeedback(
      jsonRequest({ ...VALID, message: secret, email: 'not-an-email' }),
      deps(),
    )
    expect(await response.text()).not.toContain(secret)
  })

  it('rejects a javascript: source URL, which a no-JS submission could otherwise store', async () => {
    const response = await handleFeedback(
      // biome-ignore lint/suspicious/noExplicitAny: deliberately an invalid value
      jsonRequest({ ...VALID, sourceUrl: 'javascript:alert(1)' } as any),
      deps(),
    )
    expect(response.status).toBe(400)
    expect(store.records?.()).toHaveLength(0)
  })

  it('sends a scripting-free reader to a failure receipt rather than a bare status', async () => {
    const response = await handleFeedback(formRequest({ ...VALID, message: 'no' }), deps())
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`/corrections/#${FAILURE_FRAGMENT}`)
  })
})

describe('the honeypot', () => {
  it('is answered exactly like a success, and stores nothing', async () => {
    const real = await handleFeedback(jsonRequest(VALID), deps())
    resetRateLimit()
    store = createFeedbackStore({ kind: 'memory' })
    const trapped = await handleFeedback(jsonRequest({ ...VALID, website: 'https://spam' }), deps())

    expect(trapped.status).toBe(real.status)
    expect(Object.keys(await trapped.json())).toEqual(Object.keys(await real.json()))
    expect(store.records?.()).toHaveLength(0)
  })

  it('is answered with the success redirect for a form post', async () => {
    const response = await handleFeedback(formRequest({ ...VALID, website: 'spam' }), deps())
    expect(response.headers.get('location')).toBe(`/corrections/#${SUCCESS_FRAGMENT}`)
    expect(store.records?.()).toHaveLength(0)
  })
})

describe('rate limiting', () => {
  const fromAddress = (body: unknown = VALID) =>
    jsonRequest(body, { 'x-forwarded-for': '198.51.100.9' })

  it('allows exactly the limit and then refuses', async () => {
    for (let attempt = 0; attempt < RATE_LIMIT; attempt += 1) {
      expect((await handleFeedback(fromAddress(), deps())).status).toBe(201)
    }
    const refused = await handleFeedback(fromAddress(), deps())
    expect(refused.status).toBe(429)
    expect(refused.headers.get('retry-after')).toMatch(/^\d+$/)
  })

  it('answers a scripting-free reader with a real page rather than a bare 429', async () => {
    for (let attempt = 0; attempt < RATE_LIMIT; attempt += 1) {
      await handleFeedback(fromAddress(), deps())
    }
    const refused = await handleFeedback(
      formRequest(VALID, { 'x-forwarded-for': '198.51.100.9' }),
      deps(),
    )
    expect(refused.status).toBe(429)
    expect(refused.headers.get('content-type')).toContain('text/html')
    expect(await refused.text()).toContain('Return to the corrections page')
  })

  it('cannot be escaped by prepending addresses to the forwarding chain', async () => {
    for (let attempt = 0; attempt < RATE_LIMIT; attempt += 1) {
      await handleFeedback(fromAddress(), deps())
    }
    const forged = await handleFeedback(
      jsonRequest(VALID, {
        'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 200)}, 198.51.100.9`,
      }),
      deps(),
    )
    expect(forged.status).toBe(429)
  })

  it('keeps separate addresses in separate windows', async () => {
    for (let attempt = 0; attempt < RATE_LIMIT; attempt += 1) {
      await handleFeedback(fromAddress(), deps())
    }
    const other = await handleFeedback(
      jsonRequest(VALID, { 'x-forwarded-for': '198.51.100.10' }),
      deps(),
    )
    expect(other.status).toBe(201)
  })
})

describe('when the store cannot be trusted', () => {
  const unusable = resolveFeedbackConfig({
    NODE_ENV: 'production',
    FEEDBACK_STORE_DIR: '/var/data',
  })

  it('says so, rather than accepting the message and dropping it', async () => {
    const response = await handleFeedback(
      jsonRequest(VALID),
      deps({ config: unusable, store: null }),
    )
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'store-unavailable' })
  })

  it('tells the reader nothing was stored', async () => {
    const response = await handleFeedback(
      jsonRequest(VALID),
      deps({ config: unusable, store: null }),
    )
    expect((await response.json()).message).toMatch(/nothing you sent was stored/i)
  })

  it('sends a scripting-free reader to the failure receipt', async () => {
    const response = await handleFeedback(
      formRequest(VALID),
      deps({ config: unusable, store: null }),
    )
    expect(response.headers.get('location')).toBe(`/corrections/#${FAILURE_FRAGMENT}`)
  })
})

describe('when the store fails mid-write', () => {
  const failing: FeedbackStore = {
    append: async () => {
      throw new Error('ENOSPC: no space left on device, write /var/data/feedback-2026-07.jsonl')
    },
  }

  it('reports the failure instead of a success', async () => {
    const response = await handleFeedback(jsonRequest(VALID), deps({ store: failing }))
    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({ error: 'not-recorded' })
  })

  it('does not put the underlying error, which can carry a path or a payload, into the log', async () => {
    await handleFeedback(jsonRequest(VALID), deps({ store: failing }))
    expect(logs).toHaveLength(1)
    expect(logs[0]?.line).not.toContain('ENOSPC')
    expect(logs[0]?.line).not.toContain('/var/data')
    expect(logs[0]?.line).toContain('11111111-2222-3333-4444-555555555555')
  })
})

describe('nothing a reader typed reaches a log line', () => {
  const PRIVATE = {
    type: 'factual-correction',
    message: 'MESSAGE-BODY-SENTINEL that must never be logged anywhere at all.',
    name: 'NAME-SENTINEL',
    email: 'EMAIL-SENTINEL@example.org',
    sourceUrl: 'https://SOURCEURL-SENTINEL.example/page',
    publicationConsent: 'publish-name',
  } as const

  it('on the success path, even with notification switched on', async () => {
    const config = resolveFeedbackConfig({
      NODE_ENV: 'test',
      FEEDBACK_NOTIFY_EMAIL: 'owner@example.org',
    })
    await handleFeedback(jsonRequest(PRIVATE), deps({ config }))

    expect(logs.length).toBeGreaterThan(0)
    const everything = logs.map(entry => entry.line).join('\n')
    for (const sentinel of [
      'MESSAGE-BODY',
      'NAME-SENTINEL',
      'EMAIL-SENTINEL',
      'SOURCEURL-SENTINEL',
    ]) {
      expect(everything).not.toContain(sentinel)
    }
  })

  it('and the response body carries only the id', async () => {
    const response = await handleFeedback(jsonRequest(PRIVATE), deps())
    const text = await response.text()
    for (const sentinel of [
      'MESSAGE-BODY',
      'NAME-SENTINEL',
      'EMAIL-SENTINEL',
      'SOURCEURL-SENTINEL',
    ]) {
      expect(text).not.toContain(sentinel)
    }
  })

  it('says nothing at all when notification is switched off', async () => {
    await handleFeedback(jsonRequest(PRIVATE), deps())
    expect(logs).toEqual([])
  })
})

/**
 * A store that was asked and never answered.
 *
 * The reader must not be told their correction was not recorded, because
 * nobody knows that: the collector may have written it and lost the reply. See
 * `UnconfirmedWrite` in `store.ts`.
 */
describe('when the store does not answer in time', () => {
  const silent: FeedbackStore = {
    append: async () => {
      throw new UnconfirmedWrite('The feedback store did not answer within 5000ms')
    },
  }

  it('says the submission may already have been recorded, rather than that it was not', async () => {
    const response = await handleFeedback(jsonRequest(VALID), deps({ store: silent }))
    expect(response.status).toBe(504)
    const body = (await response.json()) as { error: string; message: string }
    expect(body.error).toBe('not-confirmed')
    expect(body.message).toMatch(/may already have been recorded/i)
    // The one thing it must never say, because it is the one thing not known.
    expect(body.message).not.toMatch(/nothing (you sent )?was (stored|recorded)/i)
  })

  it('is not the same answer as a store that refused, which is a fact rather than a doubt', async () => {
    const refusing: FeedbackStore = {
      append: async () => {
        throw new Error('The feedback store answered 422')
      },
    }
    const unknown = await handleFeedback(jsonRequest(VALID), deps({ store: silent }))
    const refused = await handleFeedback(jsonRequest(VALID), deps({ store: refusing }))
    expect(unknown.status).toBe(504)
    expect(refused.status).toBe(500)
  })

  it('sends a scripting-free reader to a receipt of its own', async () => {
    const response = await handleFeedback(formRequest(VALID), deps({ store: silent }))
    expect(response.status).toBe(303)
    expect(response.headers.get('location')).toBe(`/corrections/#${UNCONFIRMED_FRAGMENT}`)
  })

  it('logs the id and nothing a reader typed', async () => {
    await handleFeedback(jsonRequest(VALID), deps({ store: silent }))
    expect(logs).toHaveLength(1)
    expect(logs[0]?.line).toContain('11111111-2222-3333-4444-555555555555')
    expect(logs[0]?.line).not.toContain(VALID.message)
  })
})

/**
 * The id is what a resend is recognised by.
 *
 * It becomes the `Idempotency-Key` the http store sends, so a reader who is
 * told their first attempt could not be confirmed and sends the same text
 * again has to arrive with the same one. A random id per request — which is
 * what this used to be — made that impossible.
 */
describe('the submission id', () => {
  /** The id is the fingerprint itself here, so the assertions read directly. */
  const identified = () => deps({ newId: fingerprint => fingerprint })

  it('is the same for the same correction sent twice', async () => {
    await handleFeedback(jsonRequest(VALID), identified())
    await handleFeedback(jsonRequest(VALID), identified())

    const records = store.records?.() ?? []
    expect(records).toHaveLength(2)
    expect(records[0]?.id).toBe(records[1]?.id)
  })

  it('does not move when the clock does, or a resend a minute later would be a new submission', async () => {
    await handleFeedback(jsonRequest(VALID), identified())
    await handleFeedback(
      jsonRequest(VALID),
      deps({ newId: fingerprint => fingerprint, now: () => new Date('2027-01-01T00:00:00.000Z') }),
    )

    const records = store.records?.() ?? []
    expect(records[0]?.id).toBe(records[1]?.id)
    expect(records[0]?.createdAt).not.toBe(records[1]?.createdAt)
  })

  it('differs as soon as a word of the correction differs', async () => {
    await handleFeedback(jsonRequest(VALID), identified())
    await handleFeedback(
      jsonRequest({ ...VALID, message: `${VALID.message} And one more thing.` }),
      identified(),
    )

    const records = store.records?.() ?? []
    expect(records[0]?.id).not.toBe(records[1]?.id)
  })

  it('differs when an optional field is filled in on the second attempt', async () => {
    await handleFeedback(jsonRequest(VALID), identified())
    await handleFeedback(jsonRequest({ ...VALID, name: 'A Reader' }), identified())

    const records = store.records?.() ?? []
    expect(records[0]?.id).not.toBe(records[1]?.id)
  })
})

describe('duplicate submissions', () => {
  /**
   * Nothing is deduplicated here. The handler stores what it is given, and
   * collapsing a resend is the collector's job, done with the idempotency key
   * the http store sends. What has to be true in this file is that both
   * attempts carry the same id, which is what makes that possible.
   */
  it('stores both when a reader presses Send twice, under one shared id', async () => {
    const withIds = deps({ newId: fingerprint => `id-${fingerprint.length}` })
    await handleFeedback(jsonRequest(VALID), withIds)
    await handleFeedback(jsonRequest(VALID), withIds)

    const records = store.records?.() ?? []
    expect(records).toHaveLength(2)
    expect(records[0]?.id).toBe(records[1]?.id)
  })
})
