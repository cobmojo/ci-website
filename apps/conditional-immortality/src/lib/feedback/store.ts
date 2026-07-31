import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Somewhere durable to put one correction.
 *
 * Three adapters behind one method. The route does not know which it has, and
 * the only thing it needs from any of them is the difference between "written"
 * and "not written" — a rejected promise, never a quiet return.
 *
 * See `config.ts` for which adapter a deployment gets and why it has to say so.
 */

export interface StoredSubmission {
  readonly id: string
  readonly createdAt: string
  readonly status: 'new'
  readonly sectionId?: string
  readonly headingId?: string
  readonly type: string
  readonly message: string
  readonly sourceUrl?: string
  readonly name?: string
  readonly email?: string
  readonly publicationConsent: string
}

export interface FeedbackStore {
  /** Resolves when the record is safely stored, rejects when it is not. */
  append(submission: StoredSubmission): Promise<void>
  /** Present on the in-memory adapter only, for tests to read back. */
  records?(): readonly StoredSubmission[]
}

export type StoreSpec =
  | { readonly kind: 'filesystem'; readonly directory: string }
  | {
      readonly kind: 'http'
      readonly endpoint: string
      readonly token: string | null
      readonly timeoutMs?: number
    }
  | { readonly kind: 'memory' }

/** Long enough for a slow collector, short enough that a reader is not left waiting. */
const DEFAULT_HTTP_TIMEOUT_MS = 5_000

/**
 * One file per calendar month, keyed on the record's own timestamp.
 *
 * Keying on the record rather than on "now" keeps a submission that arrives a
 * millisecond after midnight on the first out of the previous month's file,
 * which is what makes an export by month exact.
 */
function monthlyFile(directory: string, submission: StoredSubmission): string {
  return path.join(directory, `feedback-${submission.createdAt.slice(0, 7)}.jsonl`)
}

function filesystemStore(directory: string): FeedbackStore {
  return {
    async append(submission) {
      const resolved = path.resolve(process.cwd(), directory)
      await mkdir(resolved, { recursive: true })
      /*
       * One `appendFile` of one line, opened O_APPEND. Concurrent appends
       * under the page size the platform writes atomically do not interleave,
       * and the schema caps a message at 8,000 characters, so a record cannot
       * approach a size where that stops being true. Mode 0600 because the
       * file holds whatever contact details a reader chose to give.
       */
      await appendFile(monthlyFile(resolved, submission), `${JSON.stringify(submission)}\n`, {
        encoding: 'utf8',
        mode: 0o600,
      })
    },
  }
}

function httpStore(endpoint: string, token: string | null, timeoutMs: number): FeedbackStore {
  return {
    async append(submission) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json; charset=utf-8',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(submission),
          signal: controller.signal,
          // A correction is not idempotent to retry blindly and not cacheable.
          cache: 'no-store',
          redirect: 'error',
        })
        if (!response.ok) {
          /*
           * The status only. A collector that echoes the record back in its
           * error body would otherwise put the reader's message into this
           * site's logs, which is the one thing the endpoint promises not to
           * do.
           */
          throw new Error(`The feedback store answered ${response.status}`)
        }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}

function memoryStore(): FeedbackStore {
  const kept: StoredSubmission[] = []
  return {
    async append(submission) {
      kept.push(submission)
    },
    records: () => kept,
  }
}

export function createFeedbackStore(spec: StoreSpec): FeedbackStore {
  switch (spec.kind) {
    case 'filesystem':
      return filesystemStore(spec.directory)
    case 'http':
      return httpStore(spec.endpoint, spec.token, spec.timeoutMs ?? DEFAULT_HTTP_TIMEOUT_MS)
    case 'memory':
      return memoryStore()
  }
}
