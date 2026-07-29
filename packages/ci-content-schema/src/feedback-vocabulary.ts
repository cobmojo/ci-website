/**
 * The correction form's vocabulary, with no dependencies at all.
 *
 * This exists as its own module for one reason: the form is a client
 * component, and it needs these four values to render. When they lived in
 * `index.ts` alongside every schema in the project, importing them dragged in
 * the whole module — 781 lines of Zod schemas plus Zod itself — because a
 * bundler cannot drop a module that the imported binding lives in.
 *
 * The cost was measured, not guessed: `/corrections/` shipped 926.6 kB of
 * first-load JavaScript against a 565.7 kB median for every other route, in a
 * single 369,610-byte chunk containing `ZodError` and the schema module. For a
 * nine-field form that works with scripting switched off entirely.
 *
 * So these are plain arrays and a plain lookup table, and `index.ts` builds the
 * Zod schemas on top of them and re-exports everything, leaving every existing
 * import working unchanged. Keep this file free of imports — that property is
 * the whole point of it, and `scripts/conditional-immortality/bundle-budget.ts`
 * fails the build if it is lost.
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
