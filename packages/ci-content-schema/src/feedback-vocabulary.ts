/**
 * The correction form's vocabulary, with no dependencies at all.
 *
 * The form is a client component, and taking these values from `index.ts` pulled
 * every Zod schema in the project into its bundle along with Zod itself. Keep
 * this file free of imports — that is the whole point of it, and
 * `scripts/conditional-immortality/bundle-budget.ts` fails the build if it is
 * lost. `index.ts` builds the schemas on top and re-exports everything.
 */

export const feedbackTypes = [
  'factual-correction',
  'theological-counterargument',
  'better-source',
  'translation-correction',
  'historical-correction',
  'broken-link',
  'accessibility',
  'typo',
  'general',
] as const

export type FeedbackType = (typeof feedbackTypes)[number]

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  'factual-correction': 'Factual correction',
  'theological-counterargument': 'Biblical or theological counterargument',
  'better-source': 'Better source',
  'translation-correction': 'Translation or language correction',
  'historical-correction': 'Historical correction',
  'broken-link': 'Broken link',
  accessibility: 'Accessibility issue',
  typo: 'Typographical error',
  general: 'General feedback',
}

export const publicationConsents = ['do-not-publish', 'anonymous', 'publish-name'] as const

export type PublicationConsent = (typeof publicationConsents)[number]

/**
 * One rejected field in a 400 response from `POST /api/feedback/`.
 *
 * The server builds this from its Zod issues and the form renders it in the
 * failure status message. Declared here, in the dependency-free vocabulary
 * both sides already import, so the wire shape cannot drift between them.
 */
export interface FeedbackFieldError {
  readonly field: string
  readonly message: string
}

export const feedbackStatuses = [
  'new',
  'reviewing',
  'accepted',
  'partially-accepted',
  'declined',
  'duplicate',
  'spam',
] as const

export type FeedbackStatus = (typeof feedbackStatuses)[number]

/* ------------------------------------------------------------------ *
 * Optional-field rules, shared by the form and the schema
 *
 * The form's validators are documented as mirrors of the server schema, and
 * they were not. The browser accepted any non-space characters either side of
 * an `@`; the server used Zod's ASCII-only rule. So `josé@münchen.de` passed
 * every check the reader could see, and the whole correction was then thrown
 * away by a 400 that named an *optional* field. The same gap existed on the
 * source address, where the browser parsed with `URL` and the server did not
 * accept an internationalised host.
 *
 * The rules live here, in the dependency-free vocabulary both sides already
 * import, because the client cannot import Zod — the comment at the top of
 * `feedback-form.tsx` records what that cost when it was tried. The server
 * wraps these with `.refine()`.
 *
 * Both are deliberately permissive. Neither field is required, both exist so
 * the author can reply or check a source, and refusing a correction over the
 * spelling of an address the reader did not have to give is the worse failure.
 * ------------------------------------------------------------------ */

/** Something with a local part, one `@`, and a dotted host. */
export function isAcceptableEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** A complete http or https address, internationalised hosts included. */
export function isAcceptableSourceUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** The wording the reader sees, on whichever side rejects the value. */
export const FEEDBACK_FIELD_MESSAGES = {
  email: 'That does not look like an email address. Correct it, or leave it empty.',
  sourceUrl:
    'That does not look like a complete web address. Include https://, or leave this empty.',
} as const

/**
 * The fragment a scriptless submission is sent back to.
 *
 * Declared here because two files have to agree on it and neither can import
 * the other: the form renders it as an id, and the API route writes it into a
 * `location` header. The route cannot import the form — that would pull the
 * form library onto the server — so a literal in each place would be two
 * strings with nothing holding them together.
 */
export const SUBMISSION_STATUS_ID = 'submission-status'
