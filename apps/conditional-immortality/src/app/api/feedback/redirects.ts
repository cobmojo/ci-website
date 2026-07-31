import { SUBMISSION_STATUS_ID } from '@ci/content-schema'

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
 *
 * This lives beside the route rather than inside it because all three claims
 * are properties of a string, and a Next route module may export only its
 * handlers. Held in the route, they were reachable from a test only by posting
 * a real submission through the rate limiter and the store — so the end-to-end
 * tests named for them navigated to hand-written URLs instead, and passed
 * against a redirect that dropped the fragment, collapsed the two failure
 * outcomes together, or echoed nothing back.
 */

export type RawBody = Record<string, unknown>

export const STATUS_FRAGMENT = `#${SUBMISSION_STATUS_ID}`
export const SUCCESS_REDIRECT = `/corrections/?submitted=1${STATUS_FRAGMENT}`

/**
 * Echoed values are bounded by what the schema would accept. A section id
 * longer than 16 characters is one the schema will reject again, so carrying it
 * back only guarantees a repeat; at around 16kB it also produces a `location`
 * header no client will parse.
 */
export const ECHO_LIMITS = { sectionId: 16, headingId: 128, type: 64 } as const

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/** The context a reader arrived with, as query parameters, within the limits. */
function echoed(body: RawBody): URLSearchParams {
  const params = new URLSearchParams()
  for (const [field, key] of [
    ['sectionId', 'section'],
    ['headingId', 'heading'],
    ['type', 'type'],
  ] as const) {
    const value = asString(body[field])?.trim()
    if (value && value.length <= ECHO_LIMITS[field]) params.set(key, value)
  }
  return params
}

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
 */
export function failureRedirect(outcome: '0' | 'error', body: RawBody): string {
  const params = new URLSearchParams({ submitted: outcome })
  for (const [key, value] of echoed(body)) params.set(key, value)
  return `/corrections/?${params.toString()}${STATUS_FRAGMENT}`
}

/** The same context, for the one failure that answers with a page of its own. */
export function correctionsHref(body: RawBody): string {
  const query = echoed(body).toString()
  return `/corrections/${query ? `?${query}` : ''}#form`
}
