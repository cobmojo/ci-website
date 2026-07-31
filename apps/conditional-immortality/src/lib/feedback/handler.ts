import {
  type FeedbackFieldError,
  FeedbackSubmissionInputSchema,
  SUBMISSION_STATUS_ID,
} from '@ci/content-schema'
import { clientAddress, rateLimit } from '../rate-limit'
import type { FeedbackConfig } from './config'
import type { FeedbackStore, StoredSubmission } from './store'

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
 * 1. **A submission is never lost silently.** Either the record is stored, or
 *    the reader is told it was not. `config.ts` decides whether the configured
 *    store can be believed at all; a store that cannot be believed answers 503
 *    rather than accepting the message and dropping it.
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

type RawBody = Record<string, unknown>

/**
 * Where a form-encoded submission is sent back to.
 *
 * Three things have to be right about this URL, and each was wrong once.
 *
 * The `submitted` value distinguishes a schema rejection from a submission the
 * server could not store. Telling a reader whose wording was fine to check
 * their wording sends them back into a failure that will repeat identically,
 * and spends their rate-limit allowance doing it. The JSON path always drew
 * this distinction; the redirect now does too.
 *
 * The fragment matters as much. Without it the browser lands at the top and
 * the answer renders where it sits in the document — measured at y=2090 on an
 * 812px viewport — so the reader sees an untouched page and the whole point of
 * the redirect is lost.
 *
 * And a failure has to carry back the context the reader arrived with. Without
 * it the retry is sent from a form that has silently dropped the section, the
 * heading and the feedback type, so a correction to S04 arrives labelled a
 * factual correction with no page attached — the exact harm this route was
 * changed to fix, reappearing on the path where a reader is *told* to try
 * again.
 */
export const STATUS_FRAGMENT = `#${SUBMISSION_STATUS_ID}`
export const SUCCESS_REDIRECT = `/corrections/?submitted=1${STATUS_FRAGMENT}`

/**
 * Echoed values are bounded by what the schema would accept.
 *
 * A section id longer than 16 characters is one the schema will reject again,
 * so carrying it back only guarantees a repeat; at around 16kB it also produces
 * a `location` header no client will parse. The reader's *text* is never echoed
 * — a correction is often the most considered thing somebody will write all
 * week, and a query string puts it in browser history, in any proxy log on the
 * way, and in the address bar of a shared screen.
 */
const ECHO_LIMITS = { sectionId: 16, headingId: 128, type: 64 } as const

const ECHOED_FIELDS = [
  ['sectionId', 'section'],
  ['headingId', 'heading'],
  ['type', 'type'],
] as const

function echoedContext(body: RawBody): URLSearchParams {
  const params = new URLSearchParams()
  for (const [field, key] of ECHOED_FIELDS) {
    const value = asString(body[field])?.trim()
    if (value && value.length <= ECHO_LIMITS[field]) params.set(key, value)
  }
  return params
}

export function failureRedirect(outcome: '0' | 'error', body: RawBody): string {
  const params = echoedContext(body)
  params.set('submitted', outcome)
  return `/corrections/?${params.toString()}${STATUS_FRAGMENT}`
}

/** The same context, for the one failure that answers with a page of its own. */
function correctionsHref(body: RawBody): string {
  const query = echoedContext(body).toString()
  return `/corrections/${query ? `?${query}` : ''}#form`
}

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
  readonly newId: () => string
  /** Injected so a test can assert what is — and is not — written to a log. */
  readonly log: (level: 'info' | 'error', line: string) => void
  /**
   * The public origin, for the `Origin` fallback to compare against. Behind a
   * proxy the request's own URL is the internal host and says nothing useful.
   */
  readonly canonicalOrigin?: string
}

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
export function isSameSiteRequest(request: Request, canonicalOrigin?: string): boolean {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite)
    return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none'

  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return true

  /*
   * Compared against the canonical origin, not against `request.url`.
   *
   * Behind any proxy — which is every deployment — `request.url` is the host
   * the process is bound to, `localhost:3000`, while the browser's `Origin` is
   * the public one. Comparing the two rejects a perfectly ordinary submission
   * as cross-site, and it would do so only for the older browsers that send no
   * `Sec-Fetch-Site`, which are exactly the ones this fallback exists for.
   *
   * With no canonical origin to compare against there is nothing to check, so
   * the request is allowed: this is spam hygiene, not CSRF defence — the
   * endpoint has no session and no ambient authority to borrow.
   */
  if (!canonicalOrigin) return true
  try {
    return new URL(origin).host === new URL(canonicalOrigin).host
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

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function rateLimitedResponse(
  wantsJson: boolean,
  retryAfterSeconds: number,
  body: RawBody,
): Response {
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
      // The reader is told to try again, so the way back has to be the form
      // they came from. A bare `/corrections/` sent the retry with no page
      // attached and relabelled, on the path that most explicitly invites one.
      `<p><a href="${escapeAttribute(correctionsHref(body))}">Return to the corrections page</a></p>` +
      `</body></html>`,
    { status: 429, headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } },
  )
}

export async function handleFeedback(request: Request, deps: FeedbackDeps): Promise<Response> {
  /*
   * Which shape of answer this client can read, decided before the body is
   * touched.
   *
   * Every refusal below happens before parsing, so `wantsJson` does not exist
   * yet — but the content type does. A browser that posted a form and received
   * a JSON blob is looking at a wall of braces instead of a page, and these are
   * exactly the paths a reader without scripting reaches.
   */
  const contentType = (request.headers.get('content-type') ?? '').toLowerCase()
  // A form post is the one shape that came from a browser with no scripting, so
  // it is the one that needs a page back. Everything else — JSON, an unknown
  // type, no type at all — is a client that can read a status and a body.
  const isBrowserFormPost =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  const refuse = (error: string, status: number, extra: Record<string, unknown> = {}) =>
    isBrowserFormPost
      ? // Nothing has been parsed yet, so there is no context to carry back.
        redirect(failureRedirect('0', {}))
      : json({ ok: false, error, ...extra }, status)

  if (!isSameSiteRequest(request, deps.canonicalOrigin)) return refuse('cross-site', 403)

  const parsed = await parseBody(request)

  if (parsed === 'unsupported-type') return refuse('unsupported-content-type', 415)
  if (parsed === 'too-large') return refuse('too-large', 413, { maxBytes: MAX_BODY_BYTES })
  if (parsed === 'malformed') return refuse('malformed-body', 400)

  const { body, wantsJson } = parsed

  /*
   * The limiter runs before the honeypot, not after.
   *
   * A trapped request used to return fake success without consuming an
   * allowance, which makes the pair a two-request oracle: a sender who never
   * meets the limit knows it tripped the trap, and knows which field to leave
   * empty next time. Counting it first costs a caught bot its allowance and
   * tells it nothing.
   */
  const limit = rateLimit(
    `feedback:${clientAddress(request.headers, deps.config.trustedProxyHops)}`,
    { limit: RATE_LIMIT, windowMs: RATE_LIMIT_WINDOW_MS },
  )
  if (!limit.allowed) return rateLimitedResponse(wantsJson, limit.retryAfterSeconds, body)

  /**
   * Honeypot. A filled field means an automated client, so the response is
   * indistinguishable from success and nothing is stored. Telling a bot that
   * it was caught only teaches it to avoid the trap next time.
   */
  const honeypot = asString(body[HONEYPOT_FIELD])?.trim() ?? ''
  if (honeypot.length > 0) {
    return wantsJson ? json({ ok: true, id: deps.newId() }, 201) : redirect(SUCCESS_REDIRECT)
  }

  const result = FeedbackSubmissionInputSchema.safeParse(candidateFrom(body))

  if (!result.success) {
    if (!wantsJson) return redirect(failureRedirect('0', body))
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
      : redirect(failureRedirect('error', body))
  }

  const value = result.data
  const submission: StoredSubmission = {
    id: deps.newId(),
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
  } catch {
    // Deliberately no detail: a filesystem or fetch error message can contain
    // the payload in some runtimes, and the submission id is enough to
    // correlate.
    deps.log('error', `[feedback] could not persist submission ${submission.id}`)
    if (!wantsJson) return redirect(failureRedirect('error', body))
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
