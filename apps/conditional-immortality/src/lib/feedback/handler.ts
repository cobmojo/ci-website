import { type FeedbackFieldError, FeedbackSubmissionInputSchema } from '@ci/content-schema'
import { clientAddress, rateLimit } from '../rate-limit'
import type { FeedbackConfig } from './config'
import { type FeedbackStore, isUnconfirmedWrite, type StoredSubmission } from './store'

/**
 * The correction endpoint, as a function of its dependencies.
 *
 * Lives here rather than in `app/api/feedback/route.ts` so that every branch —
 * and this endpoint is almost entirely branches — can be exercised without a
 * server, a browser or a disk. The route file is the adapter that supplies the
 * real store, clock and identifier source.
 *
 * Design constraints, in order of priority:
 *
 * 1. **A submission is never lost silently, and never misreported.** Either the
 *    record is stored, or the reader is told it was not — or, where the store
 *    was asked and never answered, that nobody knows. `config.ts` decides
 *    whether the configured store can be believed at all; a store that cannot
 *    be believed answers 503 rather than accepting the message and dropping it.
 * 2. **The server is the authority on what is valid.** The browser form is a
 *    courtesy; every field is re-validated here with the shared schema, and
 *    only the fields the schema returns are ever written.
 * 3. **Nothing sensitive is logged.** The message body, the name and the email
 *    address never reach a log line, an error message or a monitoring tool.
 *    Log statements carry the generated id and the outcome, nothing else.
 * 4. **It works without JavaScript.** A form-encoded POST is answered with a
 *    303 to a fragment the corrections page renders a receipt for; a JSON POST
 *    is answered with JSON.
 */

/** Five submissions per ten minutes per address. */
export const RATE_LIMIT = 5
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

/**
 * The largest body this endpoint will read.
 *
 * The schema caps a message at 8,000 characters, so a legitimate submission
 * cannot approach this even in four-byte UTF-8. Without a cap the whole body
 * is buffered into memory before any validation runs, which makes the one
 * unauthenticated write endpoint on the site a memory amplifier: the limiter
 * cannot help, because it does not run until the body has already been read.
 */
export const MAX_BODY_BYTES = 64 * 1024

/** Where a form-encoded submission is sent back to. */
export const SUCCESS_FRAGMENT = 'submission-received'
export const FAILURE_FRAGMENT = 'submission-not-recorded'
/** The third receipt: the store was asked and did not answer in time. */
export const UNCONFIRMED_FRAGMENT = 'submission-not-confirmed'
const SUCCESS_REDIRECT = `/corrections/#${SUCCESS_FRAGMENT}`
const FAILURE_REDIRECT = `/corrections/#${FAILURE_FRAGMENT}`
const UNCONFIRMED_REDIRECT = `/corrections/#${UNCONFIRMED_FRAGMENT}`

/** The honeypot control rendered off screen by the form. */
const HONEYPOT_FIELD = 'website'

/** Exactly the keys the schema accepts. Anything else is dropped, not rejected. */
const ACCEPTED_FIELDS = [
  'sectionId',
  'headingId',
  'type',
  'message',
  'sourceUrl',
  'name',
  'email',
  'publicationConsent',
] as const

export interface FeedbackDeps {
  readonly config: FeedbackConfig
  /** Absent when the configuration is unusable; the endpoint then answers 503. */
  readonly store: FeedbackStore | null
  readonly now: () => Date
  /**
   * The id for one submission, as a function of the fingerprint below rather
   * than of chance.
   *
   * It becomes the idempotency key the http store sends, so it has to survive
   * a resend: a reader whose first attempt timed out is told the correction
   * may already be recorded, and if they send it again the collector needs to
   * recognise the two as one. A fresh random id per request made that
   * impossible, which is the whole reason this takes an argument.
   *
   * The route hashes it. Nothing here depends on how.
   */
  readonly newId: (fingerprint: string) => string
  /** Injected so a test can assert what is — and is not — written to a log. */
  readonly log: (level: 'info' | 'error', line: string) => void
}

type RawBody = Record<string, unknown>

interface ParsedRequest {
  readonly body: RawBody
  /** True when the client sent JSON and therefore expects JSON back. */
  readonly wantsJson: boolean
}

function redirect(location: string): Response {
  // 303 so the browser follows with GET and a reload cannot resubmit.
  return new Response(null, { status: 303, headers: { location } })
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  })
}

/**
 * Whether this request came from this site.
 *
 * `Sec-Fetch-Site` is the browser's own answer and cannot be set by script.
 * `Origin` is the fallback for anything that does not send it. A request with
 * neither is not a browser, and is left alone: this endpoint has no session and
 * no ambient authority to borrow, so the check is spam hygiene rather than CSRF
 * defence, and refusing `curl` would only break the documented way to test it.
 */
export function isSameSiteRequest(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite)
    return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none'

  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

/**
 * Read at most `MAX_BODY_BYTES`, whatever the headers claim.
 *
 * `Content-Length` is checked first because it lets an oversized request be
 * refused without reading it, but it is a claim, not a fact, so the stream is
 * counted as well.
 */
async function readCappedBody(request: Request): Promise<Uint8Array<ArrayBuffer> | 'too-large'> {
  const declared = Number(request.headers.get('content-length') ?? Number.NaN)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return 'too-large'

  const body = request.body
  if (!body) return new Uint8Array()

  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel()
      return 'too-large'
    }
    chunks.push(value)
  }

  const joined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return joined
}

type ParseOutcome = ParsedRequest | 'unsupported-type' | 'malformed' | 'too-large'

async function parseBody(request: Request): Promise<ParseOutcome> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  const isJson = contentType.includes('application/json')
  const isForm =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')

  if (!isJson && !isForm) return 'unsupported-type'

  const bytes = await readCappedBody(request)
  if (bytes === 'too-large') return 'too-large'

  if (isJson) {
    try {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return 'malformed'
      return { body: parsed as RawBody, wantsJson: true }
    } catch {
      return 'malformed'
    }
  }

  try {
    // Re-wrapped so `formData()` parses the bytes already counted rather than
    // reading the (now consumed) original stream.
    const formData = await new Request(request.url, {
      method: 'POST',
      headers: { 'content-type': request.headers.get('content-type') ?? '' },
      body: bytes,
    }).formData()
    const body: RawBody = {}
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') body[key] = value
    }
    return { body, wantsJson: false }
  } catch {
    return 'malformed'
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Build the candidate object the schema will judge.
 *
 * Empty optional strings are removed rather than passed through, so a blank
 * field is stored as absent instead of as an empty string.
 */
function candidateFrom(body: RawBody): Record<string, unknown> {
  const candidate: Record<string, unknown> = {}
  for (const field of ACCEPTED_FIELDS) {
    const value = asString(body[field])
    if (value === undefined) continue
    const trimmed = value.trim()
    if (trimmed.length === 0 && field !== 'message') continue
    candidate[field] = field === 'message' ? value : trimmed
  }
  return candidate
}

/**
 * What makes two submissions the same submission.
 *
 * The same words are one correction, however many times they arrive — which is
 * exactly the case a reader is put in when they are told the first attempt
 * could not be confirmed and they send it again. Hashing this gives that
 * resend the id the first attempt had, and a collector honouring the key files
 * one correction rather than two.
 *
 * Only the fields the schema returned go in. Not the clock, which would give
 * every attempt its own id again and undo the point; and not the network
 * address, which `/privacy/` says is used for the rate limit alone and is
 * never written down — an id derived from it would be written down on every
 * submission.
 *
 * The cost is that two readers who send byte-identical text are treated as one
 * submission. That is the right reading of "the same correction", and it is
 * the only way an id can survive the retry it is there to make safe.
 */
function fingerprintOf(fields: Record<string, unknown>): string {
  return Object.keys(fields)
    .sort()
    .map(key => `${key}=${String(fields[key])}`)
    .join('\n')
}

function rateLimitedResponse(wantsJson: boolean, retryAfterSeconds: number): Response {
  const headers = { 'retry-after': String(retryAfterSeconds) }
  if (wantsJson) {
    return json(
      {
        ok: false,
        error: 'rate-limited',
        message: 'Too many submissions from this connection. Please try again shortly.',
        retryAfterSeconds,
      },
      429,
      headers,
    )
  }
  // A browser without scripting lands on whatever this returns, so it is a
  // real page with a way back rather than a bare status line.
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60))
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<meta name="robots" content="noindex, follow">` +
      `<title>Too many submissions</title></head><body>` +
      `<h1>Too many submissions</h1>` +
      `<p>This connection has reached the submission limit. Please try again in about ${minutes} ` +
      `${minutes === 1 ? 'minute' : 'minutes'}. Nothing you sent was recorded.</p>` +
      `<p><a href="/corrections/">Return to the corrections page</a></p>` +
      `</body></html>`,
    { status: 429, headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } },
  )
}

export async function handleFeedback(request: Request, deps: FeedbackDeps): Promise<Response> {
  if (!isSameSiteRequest(request)) {
    return json({ ok: false, error: 'cross-site' }, 403)
  }

  const parsed = await parseBody(request)

  if (parsed === 'unsupported-type')
    return json({ ok: false, error: 'unsupported-content-type' }, 415)
  if (parsed === 'too-large') {
    return json({ ok: false, error: 'too-large', maxBytes: MAX_BODY_BYTES }, 413)
  }
  if (parsed === 'malformed') return json({ ok: false, error: 'malformed-body' }, 400)

  const { body, wantsJson } = parsed
  const candidate = candidateFrom(body)

  /**
   * Honeypot. A filled field means an automated client, so the response is
   * indistinguishable from success and nothing is stored. Telling a bot that
   * it was caught only teaches it to avoid the trap next time.
   */
  const honeypot = asString(body[HONEYPOT_FIELD])?.trim() ?? ''
  if (honeypot.length > 0) {
    return wantsJson
      ? json({ ok: true, id: deps.newId(fingerprintOf(candidate)) }, 201)
      : redirect(SUCCESS_REDIRECT)
  }

  const limit = rateLimit(
    `feedback:${clientAddress(request.headers, deps.config.trustedProxyHops)}`,
    { limit: RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW_MS },
  )
  if (!limit.allowed) return rateLimitedResponse(wantsJson, limit.retryAfterSeconds)

  const result = FeedbackSubmissionInputSchema.safeParse(candidate)

  if (!result.success) {
    if (!wantsJson) return redirect(FAILURE_REDIRECT)
    // Field paths and schema messages only. No submitted value is echoed back.
    const fieldErrors: FeedbackFieldError[] = result.error.issues.map(issue => ({
      field: issue.path.join('.') || 'form',
      message: issue.message,
    }))
    return json({ ok: false, error: 'invalid', fieldErrors }, 400)
  }

  /*
   * The store is only absent when the configuration did not resolve, which is
   * an operator error rather than a reader error. Refusing here — after the
   * message has been validated but before pretending it was kept — is the one
   * honest answer: the reader can see it was not recorded and can try again.
   */
  if (!deps.store) {
    deps.log(
      'error',
      `[feedback] refusing submissions: ${deps.config.usable ? '' : deps.config.problem}`,
    )
    return wantsJson
      ? json(
          {
            ok: false,
            error: 'store-unavailable',
            message:
              'This site cannot record corrections at the moment. Nothing you sent was stored. ' +
              'Please try again later.',
          },
          503,
        )
      : redirect(FAILURE_REDIRECT)
  }

  const value = result.data
  const submission: StoredSubmission = {
    id: deps.newId(fingerprintOf(value)),
    createdAt: deps.now().toISOString(),
    status: 'new',
    type: value.type,
    message: value.message,
    publicationConsent: value.publicationConsent,
    ...(value.sectionId ? { sectionId: value.sectionId } : {}),
    ...(value.headingId ? { headingId: value.headingId } : {}),
    ...(value.sourceUrl ? { sourceUrl: value.sourceUrl } : {}),
    ...(value.name ? { name: value.name } : {}),
    ...(value.email ? { email: value.email } : {}),
  }

  try {
    // Persistence happens first, and on its own. Notification is never the
    // only record of a submission.
    await deps.store.append(submission)
  } catch (error) {
    /*
     * A store that was asked and never answered is not a store that refused.
     * Telling a reader their correction was not recorded, when the collector
     * may have written it and lost the reply, sends them away to type it again
     * and leaves two copies of the same correction — or, worse, teaches them
     * the form does not work. So the third answer exists, it says what is and
     * is not known, and the resend it invites carries the same id.
     */
    if (isUnconfirmedWrite(error)) {
      deps.log('error', `[feedback] unconfirmed write for submission ${submission.id}`)
      if (!wantsJson) return redirect(UNCONFIRMED_REDIRECT)
      // 504: this site asked something upstream and got no answer in time.
      return json(
        {
          ok: false,
          error: 'not-confirmed',
          id: submission.id,
          message:
            'Where corrections are stored did not answer in time, so this one may already have ' +
            'been recorded. Sending the same text again is safe: it carries the same reference, ' +
            'so it is not filed as a second correction.',
        },
        504,
      )
    }
    // Deliberately no detail: a filesystem or fetch error message can contain
    // the payload in some runtimes, and the submission id is enough to
    // correlate.
    deps.log('error', `[feedback] could not persist submission ${submission.id}`)
    if (!wantsJson) return redirect(FAILURE_REDIRECT)
    return json({ ok: false, error: 'not-recorded' }, 500)
  }

  /**
   * Notification.
   *
   * If `FEEDBACK_NOTIFY_EMAIL` is set, this is where a short "one new
   * submission, id X" message would be dispatched, after the record is safely
   * stored and never in place of it. No mail dependency is added here on
   * purpose: the site must work with nothing configured, and adding a provider
   * would make delivery failure look like submission failure. Any such message
   * would carry the id and the feedback type only, never the message body, the
   * name or the email address.
   */
  if (deps.config.notifyEmail) {
    deps.log('info', `[feedback] stored submission ${submission.id} (${submission.type})`)
  }

  if (!wantsJson) return redirect(SUCCESS_REDIRECT)
  return json({ ok: true, id: submission.id }, 201)
}
