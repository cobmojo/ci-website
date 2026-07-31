import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

/**
 * Somewhere durable to put one correction.
 *
 * Three adapters behind one method. The route does not know which it has, and
 * what it needs from any of them is which of three things happened: the record
 * was written, it was refused, or nobody said. A rejected promise, never a
 * quiet return; and where the answer never came back, an `UnconfirmedWrite`
 * rather than a plain error, because "we do not know" and "it did not happen"
 * are different things to tell a reader.
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
 * A write whose outcome nobody knows.
 *
 * The request went out and no answer came back before the timeout. The
 * collector may have stored the record and answered too slowly, or lost the
 * reply on the way, or never received the request at all — from here those are
 * indistinguishable. Reporting it as a failure would tell a reader their
 * correction was not recorded when it may well have been, and send them to
 * write it again; so it is its own outcome, and the handler says so.
 *
 * A non-2xx is *not* this. There the collector spoke and refused, which is a
 * definite answer and stays an ordinary error.
 */
export class UnconfirmedWrite extends Error {
  readonly unconfirmed = true

  constructor(message: string) {
    super(message)
    this.name = 'UnconfirmedWrite'
  }
}

/**
 * Structural rather than `instanceof`, so an adapter loaded through a second
 * module instance — which bundlers do produce — is still recognised.
 */
export function isUnconfirmedWrite(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { unconfirmed?: unknown }).unconfirmed === true
  )
}

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
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, timeoutMs)
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json; charset=utf-8',
            /*
             * The submission id, which is derived from the submission itself
             * rather than drawn at random. A reader whose first attempt timed
             * out is told it may already have been recorded and asked to send
             * it again if not; that resend arrives here with the same key, so
             * a collector that honours it files one correction instead of two
             * and the reader is not punished for the site's uncertainty.
             */
            'idempotency-key': submission.id,
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(submission),
          signal: controller.signal,
          // Not cacheable, and never replayed by anything here: a retry is a
          // reader's decision, carrying the key above.
          cache: 'no-store',
          redirect: 'error',
        })
        /*
         * The answer is in, so the deadline has done its job. Cleared here
         * rather than only in `finally` because a timer firing between this
         * line and the status check below would turn a collector's definite
         * refusal into a reported silence.
         */
        clearTimeout(timer)
        if (!response.ok) {
          /*
           * The status only. A collector that echoes the record back in its
           * error body would otherwise put the reader's message into this
           * site's logs, which is the one thing the endpoint promises not to
           * do.
           */
          throw new Error(`The feedback store answered ${response.status}`)
        }
      } catch (error) {
        // The abort is ours, and it means the request was sent and nothing
        // came back. Whether the record landed is not knowable from here.
        if (timedOut) {
          throw new UnconfirmedWrite(`The feedback store did not answer within ${timeoutMs}ms`)
        }
        throw error
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
