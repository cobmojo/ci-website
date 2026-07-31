import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFeedbackStore, type StoredSubmission } from '../store'

/**
 * The store is the last thing between a reader's correction and nothing.
 *
 * Every adapter has to answer the same question the same way: either the
 * record is written, or the caller is told it was not. There is no third
 * answer, and in particular there is no "probably".
 */

function submission(overrides: Partial<StoredSubmission> = {}): StoredSubmission {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    createdAt: '2026-07-31T10:00:00.000Z',
    status: 'new',
    type: 'factual-correction',
    message: 'The Greek in section 12 is transliterated inconsistently.',
    publicationConsent: 'anonymous',
    ...overrides,
  }
}

describe('the filesystem store', () => {
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(path.join(os.tmpdir(), 'ci-feedback-store-test-'))
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('writes one JSON Lines record', async () => {
    const store = createFeedbackStore({ kind: 'filesystem', directory })
    await store.append(submission())

    const files = readdirSync(directory)
    expect(files).toEqual(['feedback-2026-07.jsonl'])
    const written = readFileSync(path.join(directory, files[0] as string), 'utf8')
    expect(JSON.parse(written.trim())).toMatchObject({ id: submission().id, status: 'new' })
  })

  it('files a record by the month it was created in, not the month it is written in', async () => {
    const store = createFeedbackStore({ kind: 'filesystem', directory })
    await store.append(submission({ createdAt: '2025-12-31T23:59:59.999Z', id: 'a' }))
    await store.append(submission({ createdAt: '2026-01-01T00:00:00.000Z', id: 'b' }))
    expect(readdirSync(directory).sort()).toEqual([
      'feedback-2025-12.jsonl',
      'feedback-2026-01.jsonl',
    ])
  })

  it('appends rather than replacing, so a second correction does not erase the first', async () => {
    const store = createFeedbackStore({ kind: 'filesystem', directory })
    await store.append(submission({ id: 'first' }))
    await store.append(submission({ id: 'second' }))
    const written = readFileSync(path.join(directory, 'feedback-2026-07.jsonl'), 'utf8')
    expect(written.trim().split('\n')).toHaveLength(2)
  })

  it('keeps every concurrent record, and every record on its own line', async () => {
    const store = createFeedbackStore({ kind: 'filesystem', directory })
    const many = Array.from({ length: 24 }, (_unused, index) =>
      submission({ id: `concurrent-${index}`, message: `${'m'.repeat(400)} ${index}` }),
    )
    await Promise.all(many.map(record => store.append(record)))

    const lines = readFileSync(path.join(directory, 'feedback-2026-07.jsonl'), 'utf8')
      .trim()
      .split('\n')
    expect(lines).toHaveLength(24)
    // Every line parses: an interleaved write would leave a torn one behind.
    const ids = lines.map(line => JSON.parse(line).id as string)
    expect(new Set(ids).size).toBe(24)
  })

  it('reports a failure instead of swallowing it', async () => {
    // A path whose parent is a file cannot be created as a directory.
    const store = createFeedbackStore({ kind: 'filesystem', directory })
    await store.append(submission())
    const blocked = createFeedbackStore({
      kind: 'filesystem',
      directory: path.join(directory, 'feedback-2026-07.jsonl', 'nested'),
    })
    await expect(blocked.append(submission())).rejects.toThrow()
  })
})

describe('the http store', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('posts the record as JSON to the configured endpoint', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(null, { status: 201 })
    })

    const store = createFeedbackStore({
      kind: 'http',
      endpoint: 'https://collector.example/records',
      token: null,
    })
    await store.append(submission())

    expect(calls).toHaveLength(1)
    expect(calls[0]?.url).toBe('https://collector.example/records')
    expect(calls[0]?.init.method).toBe('POST')
    expect(JSON.parse(String(calls[0]?.init.body))).toMatchObject({ id: submission().id })
  })

  it('sends the bearer token when there is one, and no Authorization header when there is not', async () => {
    const headers: Array<Headers> = []
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      headers.push(new Headers(init.headers))
      return new Response(null, { status: 200 })
    })

    await createFeedbackStore({
      kind: 'http',
      endpoint: 'https://collector.example/r',
      token: 'secret-value',
    }).append(submission())
    await createFeedbackStore({
      kind: 'http',
      endpoint: 'https://collector.example/r',
      token: null,
    }).append(submission())

    expect(headers[0]?.get('authorization')).toBe('Bearer secret-value')
    expect(headers[1]?.has('authorization')).toBe(false)
  })

  it('treats any non-2xx as a failure, so the reader is told', async () => {
    vi.stubGlobal('fetch', async () => new Response('nope', { status: 500 }))
    const store = createFeedbackStore({
      kind: 'http',
      endpoint: 'https://collector.example/r',
      token: null,
    })
    await expect(store.append(submission())).rejects.toThrow(/500/)
  })

  it('never puts the endpoint’s response body into the error, which could echo the submission back', async () => {
    vi.stubGlobal(
      'fetch',
      async () => new Response('rejected: the Greek in section 12 is…', { status: 422 }),
    )
    const store = createFeedbackStore({
      kind: 'http',
      endpoint: 'https://collector.example/r',
      token: null,
    })
    await expect(store.append(submission())).rejects.toThrow(/^(?!.*Greek).*$/s)
  })

  it('gives up rather than hanging when the endpoint never answers', async () => {
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    })
    const store = createFeedbackStore({
      kind: 'http',
      endpoint: 'https://collector.example/r',
      token: null,
      timeoutMs: 20,
    })
    await expect(store.append(submission())).rejects.toThrow()
  })
})

describe('the memory store', () => {
  it('keeps what it is given, for a test to read back', async () => {
    const store = createFeedbackStore({ kind: 'memory' })
    await store.append(submission({ id: 'kept' }))
    expect(store.records?.()).toHaveLength(1)
    expect(store.records?.()[0]?.id).toBe('kept')
  })
})
