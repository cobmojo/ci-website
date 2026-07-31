// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'
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
} from '../handler'
import { createFeedbackStore, type FeedbackStore, type StoredSubmission } from '../store'

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
    const status = (await handleFeedback(request, deps({ canonicalOrigin: 'https://example.org' })))
      .status
    expect(status).toBe(403)
  })

  it('allows anything when no canonical origin is configured, because there is nothing to compare', async () => {
    // The deployed route always supplies one. A build that has not named its
    // origin cannot start at all, so this is the local and test case only.
    const request = new Request('https://example.org/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://elsewhere.example' },
      body: JSON.stringify(VALID),
    })
    expect((await handleFeedback(request, deps())).status).toBe(201)
  })

  it('allows a same-origin post that carries no Sec-Fetch-Site', async () => {
    const request = new Request('https://example.org/api/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://example.org' },
      body: JSON.stringify(VALID),
    })
    expect((await handleFeedback(request, deps())).status).toBe(201)
  })

  /**
   * Every refusal above happens before the body is parsed, so `wantsJson` is
   * not known yet — but the content type is. A browser that posted a form and
   * got a JSON blob back is looking at a wall of braces rather than at a page,
   * and these are exactly the paths a reader without scripting can reach.
   */
  it('sends a scripting-free reader to the failure receipt, not to raw JSON', async () => {
    const cases: Array<[string, Request]> = [
      ['cross-site', formRequest(VALID, { 'sec-fetch-site': 'cross-site' })],
      ['oversized', formRequest(VALID, { 'content-length': String(MAX_BODY_BYTES + 1) })],
      [
        'malformed',
        new Request('https://example.org/api/feedback', {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'sec-fetch-site': 'same-origin',
          },
          // `formData()` rejects a multipart content type with no boundary.
          body: '%%%',
        }),
      ],
    ]

    for (const [label, request] of cases) {
      const response = await handleFeedback(request, deps())
      expect(response.status, label).toBe(303)
      expect(response.headers.get('location'), label).toBe(`/corrections/#${FAILURE_FRAGMENT}`)
      expect(await response.text(), label).toBe('')
    }
  })

  it('still answers a scripted client with JSON on those same paths', async () => {
    const response = await handleFeedback(
      jsonRequest(VALID, { 'sec-fetch-site': 'cross-site' }),
      deps(),
    )
    expect(response.status).toBe(403)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('compares Origin against the canonical origin, not the host it is bound to', async () => {
    /*
     * Behind a proxy — every deployment — `request.url` is the internal host
     * while the browser's `Origin` is the public one. Comparing those two
     * rejects an ordinary submission as cross-site, and only for the older
     * browsers that send no `Sec-Fetch-Site`, which are the ones the fallback
     * exists for.
     */
    const fromBehindAProxy = new Request('http://localhost:3000/api/feedback/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://example.org' },
      body: JSON.stringify(VALID),
    })
    expect(
      (await handleFeedback(fromBehindAProxy, deps({ canonicalOrigin: 'https://example.org' })))
        .status,
    ).toBe(201)
  })

  it('still refuses an Origin that is not the canonical one', async () => {
    const elsewhere = new Request('http://localhost:3000/api/feedback/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify(VALID),
    })
    expect(
      (await handleFeedback(elsewhere, deps({ canonicalOrigin: 'https://example.org' }))).status,
    ).toBe(403)
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

  it('consumes an allowance, so it is not an oracle for the field name', async () => {
    /*
     * A trapped request used to answer before the limiter ran, so it never
     * cost anything. A sender who never met the limit knew it had tripped the
     * trap, and knew which field to leave empty next time.
     */
    const trap = { ...VALID, website: 'https://spam' }
    for (let attempt = 0; attempt < RATE_LIMIT; attempt += 1) {
      const response = await handleFeedback(
        jsonRequest(trap, { 'x-forwarded-for': '203.0.113.55' }),
        deps(),
      )
      expect(response.status).toBe(201)
    }
    const refused = await handleFeedback(
      jsonRequest(trap, { 'x-forwarded-for': '203.0.113.55' }),
      deps(),
    )
    expect(refused.status).toBe(429)
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

describe('duplicate submissions', () => {
  it('stores both when a reader presses Send twice, and gives each its own id', async () => {
    let counter = 0
    const withIds = deps({
      newId: () => {
        counter += 1
        return `id-${counter}`
      },
    })
    await handleFeedback(jsonRequest(VALID), withIds)
    await handleFeedback(jsonRequest(VALID), withIds)

    const records = store.records?.() ?? []
    expect(records).toHaveLength(2)
    expect(records[0]?.id).not.toBe(records[1]?.id)
  })
})

describe('the receipts the redirects point at exist on the page', () => {
  /**
   * The two halves of the no-scripting fix live in different files: the
   * endpoint redirects to a fragment, and `/corrections/` renders an element
   * with that id. Nothing connected them, so renaming either left a redirect
   * pointing at nothing and every test still green — the reader would land on
   * the corrections page with no receipt at all, which is the exact behaviour
   * the fix was for.
   */
  const page = readFileSync(path.resolve(__dirname, '../../../app/corrections/page.tsx'), 'utf8')

  for (const fragment of [SUCCESS_FRAGMENT, FAILURE_FRAGMENT]) {
    it(`/corrections/ renders an element with id="${fragment}"`, () => {
      expect(page).toContain(`id="${fragment}"`)
    })
  }

  it('and the two are not the same element', () => {
    expect(SUCCESS_FRAGMENT).not.toBe(FAILURE_FRAGMENT)
  })
})
