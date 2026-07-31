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
