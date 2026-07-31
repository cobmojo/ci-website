import { randomUUID } from 'node:crypto'
import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import {
  type FeedbackFieldError,
  FeedbackSubmissionInputSchema,
  SUBMISSION_STATUS_ID,
} from '@ci/content-schema'
import { clientAddress, rateLimit } from '@/lib/rate-limit'
import { siteConfig } from '@/lib/site-config'

/**
 * The single write endpoint on this site.
 *
 * Design constraints, in order of priority:
 *
 * 1. **A submission is never lost to a missing integration.** The record is
 *    appended to a local JSON Lines file before anything else is attempted.
 *    The site runs correctly with no mail provider, no database and no API key
 *    configured, which is also how it runs in development and in tests.
 * 2. **The server is the authority on what is valid.** The browser form is a
 *    courtesy; every field is re-validated here with the shared schema, and
 *    only the fields the schema returns are ever written.
 * 3. **Nothing sensitive is logged.** The message body, the name and the email
 *    address never reach a log line, an error message or a monitoring tool.
 *    Log statements carry the generated id and the outcome, nothing else.
 * 4. **It works without JavaScript.** A form-encoded POST is answered with a
 *    303 redirect back to the corrections page; a JSON POST is answered with
 *    JSON.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Five submissions per ten minutes per address. */
const RATE_LIMIT = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

const STORE_DIR = process.env.FEEDBACK_STORE_DIR ?? '.feedback-store'

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
const STATUS_FRAGMENT = `#${SUBMISSION_STATUS_ID}`
const SUCCESS_REDIRECT = `/corrections/?submitted=1${STATUS_FRAGMENT}`

/**
 * A failure returns the reader to the form, pointing at the same page and kind
 * of feedback they arrived with.
 *
 * Not their text. A rejected message can be eight thousand characters, and a
 * correction is often the most considered thing a reader will write all week;
 * putting it back through the query string would put it in browser history, in
 * any proxy log on the way, and in the address bar of a shared screen. The
 * failure messages say plainly that the text was not kept, which is the honest
 * trade rather than a silent one.
 *
 * Echoed values are bounded by what the schema would accept. A section id
 * longer than 16 characters is one the schema will reject again, so carrying it
 * back only guarantees a repeat; at around 16kB it also produces a `location`
 * header no client will parse.
 */
const ECHO_LIMITS = { sectionId: 16, headingId: 128, type: 64 } as const

function failureRedirect(outcome: '0' | 'error', body: RawBody): string {
  const params = new URLSearchParams({ submitted: outcome })
  for (const [field, key] of [
    ['sectionId', 'section'],
    ['headingId', 'heading'],
    ['type', 'type'],
  ] as const) {
    const value = asString(body[field])?.trim()
    if (value && value.length <= ECHO_LIMITS[field]) params.set(key, value)
  }
  return `/corrections/?${params.toString()}${STATUS_FRAGMENT}`
}

/** The same context, for the one failure that answers with a page of its own. */
function correctionsHref(body: RawBody): string {
  const params = new URLSearchParams()
  for (const [field, key] of [
    ['sectionId', 'section'],
    ['headingId', 'heading'],
    ['type', 'type'],
  ] as const) {
    const value = asString(body[field])?.trim()
    if (value && value.length <= ECHO_LIMITS[field]) params.set(key, value)
  }
  const query = params.toString()
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

type RawBody = Record<string, unknown>

interface ParsedRequest {
  readonly body: RawBody
  /** True when the client sent JSON and therefore expects JSON back. */
  readonly wantsJson: boolean
}

async function parseBody(request: Request): Promise<ParsedRequest | null> {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''

  if (contentType.includes('application/json')) {
    try {
      const parsed: unknown = await request.json()
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      return { body: parsed as RawBody, wantsJson: true }
    } catch {
      return null
    }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    try {
      const formData = await request.formData()
      const body: RawBody = {}
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') body[key] = value
      }
      return { body, wantsJson: false }
    } catch {
      return null
    }
  }

  return null
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

interface StoredSubmission {
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

/**
 * Append one JSON Lines record.
 *
 * One file per calendar month keeps a single file from growing without bound
 * while staying trivially greppable. The directory is created on demand so a
 * fresh checkout needs no setup step.
 */
async function persist(submission: StoredSubmission): Promise<void> {
  const directory = path.resolve(process.cwd(), STORE_DIR)
  await mkdir(directory, { recursive: true })
  const month = submission.createdAt.slice(0, 7)
  const file = path.join(directory, `feedback-${month}.jsonl`)
  await appendFile(file, `${JSON.stringify(submission)}\n`, { encoding: 'utf8', mode: 0o600 })
}

/** Attribute-safe text for the one place this route writes HTML by hand. */
function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
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

export async function POST(request: Request): Promise<Response> {
  const parsed = await parseBody(request)

  if (!parsed) {
    return json({ ok: false, error: 'unsupported-content-type' }, 415)
  }

  const { body, wantsJson } = parsed

  /**
   * Honeypot. A filled field means an automated client, so the response is
   * indistinguishable from success and nothing is stored. Telling a bot that
   * it was caught only teaches it to avoid the trap next time.
   */
  const honeypot = asString(body[HONEYPOT_FIELD])?.trim() ?? ''
  if (honeypot.length > 0) {
    // Same status, same shape and same redirect as a real success, so the
    // response carries no signal that the trap was tripped.
    return wantsJson ? json({ ok: true, id: randomUUID() }, 201) : redirect(SUCCESS_REDIRECT)
  }

  const limit = rateLimit(`feedback:${clientAddress(request.headers)}`, {
    limit: RATE_LIMIT,
    windowMs: RATE_LIMIT_WINDOW_MS,
  })

  if (!limit.allowed) {
    const headers = { 'retry-after': String(limit.retryAfterSeconds) }
    if (wantsJson) {
      return json(
        {
          ok: false,
          error: 'rate-limited',
          message: 'Too many submissions from this connection. Please try again shortly.',
          retryAfterSeconds: limit.retryAfterSeconds,
        },
        429,
        headers,
      )
    }
    // A browser without scripting lands on whatever this returns, so it is a
    // real page with a way back rather than a bare status line.
    const minutes = Math.max(1, Math.ceil(limit.retryAfterSeconds / 60))
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
      {
        status: 429,
        headers: { ...headers, 'content-type': 'text/html; charset=utf-8' },
      },
    )
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

  const value = result.data
  const submission: StoredSubmission = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
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
    await persist(submission)
  } catch {
    // Deliberately no detail: an fs error message can contain the payload in
    // some runtimes, and the submission id is enough to correlate.
    console.error(`[feedback] could not persist submission ${submission.id}`)
    if (!wantsJson) return redirect(failureRedirect('error', body))
    return json({ ok: false, error: 'not-recorded' }, 500)
  }

  /**
   * Notification.
   *
   * If `FEEDBACK_NOTIFY_EMAIL` is set, this is where a short "one new
   * submission, id X" message would be dispatched, after the record is safely
   * on disk and never in place of it. No mail dependency is added here on
   * purpose: the site must work with nothing configured, and adding a provider
   * would make delivery failure look like submission failure. Any such message
   * would carry the id and the feedback type only, never the message body, the
   * name or the email address.
   */
  if (siteConfig.feedbackNotifyEmail) {
    console.info(`[feedback] stored submission ${submission.id} (${submission.type})`)
  }

  if (!wantsJson) return redirect(SUCCESS_REDIRECT)
  return json({ ok: true, id: submission.id }, 201)
}

/** Anything other than POST is a mistake worth answering clearly. */
export function GET(): Response {
  return new Response(null, { status: 303, headers: { location: '/corrections/' } })
}
