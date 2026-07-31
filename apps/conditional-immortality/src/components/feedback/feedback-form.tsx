'use client'

// Deliberately the `/feedback` entry point rather than the package root. The
// root is where every Zod schema in the project lives, and importing these four
// values from it put Zod and the whole schema graph into this page's bundle —
// 369,610 bytes of it, for a form that works with scripting switched off.
import {
  FEEDBACK_FIELD_MESSAGES,
  FEEDBACK_TYPE_LABELS,
  type FeedbackFieldError,
  type FeedbackType,
  feedbackTypes,
  isAcceptableEmail,
  isAcceptableSourceUrl,
  type PublicationConsent,
  SUBMISSION_STATUS_ID,
} from '@ci/content-schema/feedback'
import { buttonVariants } from '@ci/ui'
import { useForm } from '@tanstack/react-form'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

/**
 * The correction and counterargument form.
 *
 * Three properties matter more than anything else here.
 *
 * 1. It works without JavaScript. The element is a real `<form>` with
 *    `action="/api/feedback"` and `method="post"`, and every control carries a
 *    `name` the server understands. Submission is intercepted only once React
 *    has hydrated, at which point the same values are sent as JSON.
 * 2. Validation is never only in the browser. The server re-validates with
 *    `FeedbackSubmissionInputSchema` and treats its own result as
 *    authoritative. What happens here is a courtesy to the reader.
 * 3. There is no CAPTCHA. A spam trap that blocks a reader using a screen
 *    reader or a switch device is not acceptable on a site whose whole point
 *    is that criticism should be easy to send. Spam is handled by a honeypot
 *    field and a server-side rate limit instead.
 */

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error' | 'rate-limited' | 'invalid'

interface ConsentOption {
  readonly value: PublicationConsent
  readonly label: string
  readonly description: string
}

const CONSENT_OPTIONS: readonly ConsentOption[] = [
  {
    value: 'do-not-publish',
    label: 'Do not publish anything about my submission',
    description:
      'A change may still be made to a page, but nothing about your submission appears in the changelog.',
  },
  {
    value: 'anonymous',
    label: 'Publish the correction without my name',
    description:
      'If the correction is accepted it appears in the changelog with the issue and the decision, and no identifying detail.',
  },
  {
    value: 'publish-name',
    label: 'Publish the correction and credit me by the name I gave',
    description:
      'Only used if you fill in the name field, and only for corrections that are accepted.',
  },
]

const MESSAGE_MIN = 20
const MESSAGE_MAX = 8000

/**
 * The visible label for every field, keyed by wire name.
 *
 * One map serves both the rendered labels and the server-error report, so a
 * server-side validation failure names each rejected field with exactly the
 * words the reader sees above it.
 */
const FIELD_LABELS = {
  type: 'What kind of feedback is this?',
  message: 'Your correction, counterargument or report',
  sourceUrl: 'Source web address',
  name: 'Your name',
  email: 'Your email',
  publicationConsent: 'If this leads to a change, what may be published?',
} as const

function fieldLabel(field: string): string {
  return field in FIELD_LABELS ? FIELD_LABELS[field as keyof typeof FIELD_LABELS] : 'Form'
}

/**
 * The trailing slash is load bearing. `trailingSlash: true` answers a POST to
 * the unslashed path with a 308, and a redirected submission is at best an
 * extra round trip and at worst dropped by an intermediary.
 */
const FEEDBACK_ENDPOINT = '/api/feedback/'

/* ------------------------------------------------------------------ *
 * Field validators
 *
 * Phrased for a reader rather than for a log. The two optional fields call the
 * same predicates the server schema refines with, so "mirror" is now enforced
 * rather than asserted; the length rules below are still duplicated, and are
 * plain enough to read against the schema.
 * ------------------------------------------------------------------ */

function validateMessage(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return 'Please describe the correction or counterargument.'
  if (trimmed.length < MESSAGE_MIN) {
    return `Please give us at least a sentence or two so we can act on it. ${MESSAGE_MIN} characters minimum.`
  }
  if (trimmed.length > MESSAGE_MAX) {
    return `Please keep submissions under ${MESSAGE_MAX} characters. Yours is ${trimmed.length}.`
  }
  return undefined
}

function validateSourceUrl(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  return isAcceptableSourceUrl(trimmed) ? undefined : FEEDBACK_FIELD_MESSAGES.sourceUrl
}

function validateName(value: string): string | undefined {
  if (value.trim().length > 120) return 'Please keep the name under 120 characters.'
  return undefined
}

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  return isAcceptableEmail(trimmed) ? undefined : FEEDBACK_FIELD_MESSAGES.email
}

/** Field errors arrive as strings from the validators above. */
function firstError(errors: readonly unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === 'string' && error.length > 0) return error
    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message: unknown }).message
      if (typeof message === 'string' && message.length > 0) return message
    }
  }
  return undefined
}

/* ------------------------------------------------------------------ *
 * Public component
 * ------------------------------------------------------------------ */

const DEFAULT_TYPE: FeedbackType = 'factual-correction'

function readType(value: string | null): FeedbackType {
  return feedbackTypes.find(type => type === value) ?? DEFAULT_TYPE
}

/**
 * What a reader without scripting is told after the redirect.
 *
 * A rejected submission and a submission the server could not store are
 * different failures and were being reported as the same one: both redirected
 * to `?submitted=0`, which says the values could not be accepted. A reader
 * whose perfectly good text hit a storage error was told to check their
 * wording and send it again, into a failure that would repeat identically and
 * spend their rate-limit allowance doing it. The scripted path had this right
 * all along; only the redirect threw the distinction away.
 */
const REDIRECT_DETAIL: Partial<Record<SubmissionStatus, string>> = {
  invalid:
    'The values sent could not be accepted, and your text was not kept. Check that the message is at least twenty characters and that any web address is complete, then send it again.',
  error:
    'The server did not record it, and your text was not kept. This is a fault at our end, not with what you wrote. Please try again in a few minutes.',
}

/** What `?submitted=` means, and what the reader is told about it. */
function readStatus(submitted: string | undefined): SubmissionStatus {
  if (submitted === '1') return 'success'
  if (submitted === '0') return 'invalid'
  if (submitted === 'error') return 'error'
  return 'idle'
}

/**
 * The query string carries the section and heading a reader came from, and
 * `submitted=` after a redirect from a submission made without JavaScript.
 *
 * The page resolves it and passes it in. It used to be read here with
 * `useSearchParams`, inside a Suspense boundary, so that the route could stay
 * statically prerendered — and that is precisely what broke the promise the
 * API route states in its own docstring, that the form works without
 * JavaScript. A static page cannot vary by query string, so the server sent
 * the fallback to everyone: a reader without scripting submitted a correction,
 * was redirected back, and saw a page that looked untouched. Nothing said it
 * had worked, nothing said it had failed, and the section they were correcting
 * was dropped from the hidden field. `/search/` already pays this cost for the
 * same reason.
 */
export function FeedbackForm({
  sectionId = '',
  headingId = '',
  type,
  submitted,
}: {
  sectionId?: string
  headingId?: string
  type?: string
  submitted?: string
}) {
  return (
    <FeedbackFormFields
      sectionId={sectionId}
      headingId={headingId}
      initialType={readType(type ?? null)}
      initialStatus={readStatus(submitted)}
    />
  )
}

function FeedbackFormFields({
  sectionId,
  headingId,
  initialType,
  initialStatus,
}: {
  sectionId: string
  headingId: string
  initialType: FeedbackType
  initialStatus: SubmissionStatus
}) {
  const uid = useId()
  const ids = {
    type: `${uid}-type`,
    message: `${uid}-message`,
    messageHint: `${uid}-message-hint`,
    messageError: `${uid}-message-error`,
    sourceUrl: `${uid}-source-url`,
    sourceUrlHint: `${uid}-source-url-hint`,
    sourceUrlError: `${uid}-source-url-error`,
    name: `${uid}-name`,
    nameHint: `${uid}-name-hint`,
    nameError: `${uid}-name-error`,
    email: `${uid}-email`,
    emailHint: `${uid}-email-hint`,
    emailError: `${uid}-email-error`,
    consent: `${uid}-consent`,
    honeypot: `${uid}-website`,
    /**
     * Deliberately not `useId()`-derived. The API route redirects a no-JS
     * submission to this fragment, so the id has to be one the server can
     * write into a URL. There is one correction form per page.
     */
    status: SUBMISSION_STATUS_ID,
  }

  const [status, setStatus] = useState<SubmissionStatus>(initialStatus)
  const [detail, setDetail] = useState<string>(REDIRECT_DETAIL[initialStatus] ?? '')
  /**
   * False during server rendering and the first client render, so the markup
   * the browser receives is a plain, working HTML form.
   */
  const [scripted, setScripted] = useState(false)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => setScripted(true), [])

  /**
   * Report the outcome, and take the reader to it.
   *
   * The status region sits above the form, so on a scripted submit — where the
   * page never navigates and nothing scrolls — the answer rendered a full
   * screen *above* the reader: measured at 987px above the top of an 812px
   * viewport, with the reader still looking at the Send button and their text
   * gone from the textarea. Without scripting the redirect's status fragment
   * handles it; with scripting there is no navigation to carry one.
   *
   * Focus rather than a bare scroll, so a keyboard reader lands on the message
   * and can carry on from there. Only an outcome moves focus, never the
   * `submitting` step, and never a redirect's initial render: there the
   * browser has already scrolled, and stealing focus on load is its own defect.
   */
  const settle = (next: SubmissionStatus, message = '') => {
    setStatus(next)
    setDetail(message)
    statusRef.current?.focus()
  }

  const form = useForm({
    defaultValues: {
      type: initialType,
      message: '',
      sourceUrl: '',
      name: '',
      email: '',
      publicationConsent: 'do-not-publish' as PublicationConsent,
    },
    onSubmit: async ({ value }) => {
      setStatus('submitting')
      setDetail('')
      try {
        const response = await fetch(FEEDBACK_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ...value,
            sectionId,
            headingId,
            website: honeypotRef.current?.value ?? '',
          }),
        })

        if (response.status === 429) {
          const retryAfter = Number(response.headers.get('retry-after') ?? '0')
          const minutes = Math.max(1, Math.ceil(retryAfter / 60))
          settle(
            'rate-limited',
            `Please try again in about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}. Nothing was lost: your text is still in the form.`,
          )
          return
        }

        if (response.status === 400) {
          // The server names each rejected field. Surfacing its report is the
          // only honest option here: a 400 from a scripted submit means the
          // client-side validators disagreed with the server, so "check the
          // fields marked below" would point at fields nothing has marked.
          let report = ''
          try {
            const data = (await response.json()) as {
              fieldErrors?: readonly FeedbackFieldError[]
            }
            if (Array.isArray(data.fieldErrors) && data.fieldErrors.length > 0) {
              report = data.fieldErrors
                .map(entry => `${fieldLabel(entry.field)}: ${entry.message}`)
                .join(' ')
            }
          } catch {
            // A 400 without a readable body still gets the generic sentence.
          }
          settle(
            'invalid',
            report ||
              'The server could not accept those values. Check that the message is at least twenty characters and that any web address is complete, then send it again.',
          )
          return
        }

        if (!response.ok) {
          settle(
            'error',
            'The server did not record it. Your text is still in the form, so you can try again.',
          )
          return
        }

        settle('success')
        form.reset()
      } catch {
        settle(
          'error',
          'The submission could not be sent, which usually means the connection dropped. Your text is still in the form.',
        )
      }
    },
  })

  return (
    <div>
      {/* Announced on change, and visible. Present in the DOM from first render
          so assistive technology is already observing it when it fills. */}
      {/* `status-message` fades each result in, and rises it a quarter of a rem
          where motion is welcome. Enough to draw the eye to a form result the
          reader is waiting for, not far enough to be read on the way. The live
          region announces regardless: the animation is for the eye only. */}
      <div aria-live="polite" id={ids.status} ref={statusRef} tabIndex={-1}>
        {status === 'success' ? (
          <p className="status-message m-0 mb-5 rounded-md border border-affirm/30 bg-affirm-soft p-4 font-sans text-[0.95rem] text-ink">
            <strong className="font-semibold text-affirm">Received.</strong> Your submission has
            been recorded. Every submission is read. If it leads to a change, that change is
            published in the <Link href="/changelog/">changelog</Link> with the issue and the
            decision.
          </p>
        ) : null}
        {status === 'error' || status === 'rate-limited' || status === 'invalid' ? (
          <p className="status-message m-0 mb-5 rounded-md border border-deny/30 bg-deny-soft p-4 font-sans text-[0.95rem] text-ink">
            <strong className="font-semibold text-deny">Not recorded.</strong>{' '}
            {detail ||
              'Something went wrong. Your text is still in the form, so you can try again.'}
          </p>
        ) : null}
        {status === 'submitting' ? (
          <p className="status-message m-0 mb-5 rounded-md border border-border-strong bg-panel p-4 font-sans text-[0.95rem] text-ink-muted">
            Sending your submission.
          </p>
        ) : null}
      </div>

      <form
        id="form"
        action={FEEDBACK_ENDPOINT}
        method="post"
        noValidate={scripted}
        onSubmit={event => {
          // Only reachable once React has hydrated. Without scripting the
          // browser performs the native POST above.
          event.preventDefault()
          event.stopPropagation()
          const formElement = event.currentTarget
          void form.handleSubmit().then(() => {
            // If validation stopped the submit, move focus to the first
            // rejected control. Its label, description and error are all in
            // its accessible description, so landing there is what announces
            // the failure; without this, pressing Send with an invalid form
            // does nothing a screen reader can hear.
            requestAnimationFrame(() => {
              const invalid = formElement.querySelector<HTMLElement>('[aria-invalid="true"]')
              invalid?.focus()
            })
          })
        }}
        className="space-y-6"
      >
        <input type="hidden" name="sectionId" value={sectionId} />
        <input type="hidden" name="headingId" value={headingId} />

        {/* Spam trap. Positioned off screen rather than removed with
            display:none, because some automated clients skip anything that is
            not rendered at all. It is inert and hidden from assistive
            technology, out of the tab order, and excluded from autofill, so no
            human is ever asked to fill it in. An inert control is still
            submitted with the form, which is what makes the trap work. */}
        <div
          className="absolute top-auto left-[-10000px] h-px w-px overflow-hidden"
          aria-hidden="true"
          inert
        >
          <label htmlFor={ids.honeypot}>Website (leave this field empty)</label>
          <input
            ref={honeypotRef}
            id={ids.honeypot}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <form.Field name="type">
          {field => (
            <div>
              <label
                htmlFor={ids.type}
                className="mb-1.5 block font-sans text-[0.95rem] font-medium text-ink"
              >
                {FIELD_LABELS.type}
              </label>
              <select
                id={ids.type}
                name={field.name}
                value={field.state.value}
                onChange={event => field.handleChange(event.target.value as FeedbackType)}
                onBlur={field.handleBlur}
                className="min-h-11 w-full max-w-[28rem] rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[1rem] text-ink"
              >
                {feedbackTypes.map(value => (
                  <option key={value} value={value}>
                    {FEEDBACK_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form.Field>

        <form.Field
          name="message"
          validators={{
            onBlur: ({ value }) => validateMessage(value),
            onSubmit: ({ value }) => validateMessage(value),
          }}
        >
          {field => {
            const error = field.state.meta.isTouched
              ? firstError(field.state.meta.errors)
              : undefined
            return (
              <div>
                <label
                  htmlFor={ids.message}
                  className="mb-1.5 block font-sans text-[0.95rem] font-medium text-ink"
                >
                  {FIELD_LABELS.message}
                </label>
                <p
                  id={ids.messageHint}
                  className="mt-0 mb-1.5 font-sans text-[0.86rem] text-ink-subtle"
                >
                  Required. Between {MESSAGE_MIN} and {MESSAGE_MAX.toLocaleString('en-US')}{' '}
                  characters. Quote the wording you are correcting where you can, and name a source
                  if you have one.
                </p>
                <textarea
                  id={ids.message}
                  name={field.name}
                  rows={8}
                  required
                  maxLength={MESSAGE_MAX}
                  value={field.state.value}
                  onChange={event => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={
                    error ? `${ids.messageHint} ${ids.messageError}` : ids.messageHint
                  }
                  className="w-full rounded-md border border-border-strong bg-paper-raised p-3 text-[1.02rem] leading-relaxed text-ink"
                />
                {error ? (
                  <p
                    id={ids.messageError}
                    className="m-0 mt-1.5 font-sans text-[0.88rem] font-medium text-deny"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            )
          }}
        </form.Field>

        <form.Field
          name="sourceUrl"
          validators={{
            onBlur: ({ value }) => validateSourceUrl(value),
            onSubmit: ({ value }) => validateSourceUrl(value),
          }}
        >
          {field => {
            const error = field.state.meta.isTouched
              ? firstError(field.state.meta.errors)
              : undefined
            return (
              <div>
                <label
                  htmlFor={ids.sourceUrl}
                  className="mb-1.5 block font-sans text-[0.95rem] font-medium text-ink"
                >
                  {FIELD_LABELS.sourceUrl} <span className="text-ink-subtle">(optional)</span>
                </label>
                <p
                  id={ids.sourceUrlHint}
                  className="mt-0 mb-1.5 font-sans text-[0.86rem] text-ink-subtle"
                >
                  A link to the article, lexicon entry or primary text you are pointing to.
                </p>
                <input
                  id={ids.sourceUrl}
                  name={field.name}
                  type="url"
                  inputMode="url"
                  // Not `autoComplete="url"`: that token means the person's
                  // own home page, and this field is a citation.
                  autoComplete="off"
                  value={field.state.value}
                  onChange={event => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={
                    error ? `${ids.sourceUrlHint} ${ids.sourceUrlError}` : ids.sourceUrlHint
                  }
                  className="min-h-11 w-full rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[1rem] text-ink"
                />
                {error ? (
                  <p
                    id={ids.sourceUrlError}
                    className="m-0 mt-1.5 font-sans text-[0.88rem] font-medium text-deny"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
            )
          }}
        </form.Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <form.Field
            name="name"
            validators={{
              onBlur: ({ value }) => validateName(value),
              onSubmit: ({ value }) => validateName(value),
            }}
          >
            {field => {
              const error = field.state.meta.isTouched
                ? firstError(field.state.meta.errors)
                : undefined
              return (
                <div>
                  <label
                    htmlFor={ids.name}
                    className="mb-1.5 block font-sans text-[0.95rem] font-medium text-ink"
                  >
                    {FIELD_LABELS.name} <span className="text-ink-subtle">(optional)</span>
                  </label>
                  <p
                    id={ids.nameHint}
                    className="mt-0 mb-1.5 font-sans text-[0.86rem] text-ink-subtle"
                  >
                    Only published if you choose credit below.
                  </p>
                  <input
                    id={ids.name}
                    name={field.name}
                    type="text"
                    autoComplete="name"
                    maxLength={120}
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${ids.nameHint} ${ids.nameError}` : ids.nameHint}
                    className="min-h-11 w-full rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[1rem] text-ink"
                  />
                  {error ? (
                    <p
                      id={ids.nameError}
                      className="m-0 mt-1.5 font-sans text-[0.88rem] font-medium text-deny"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>
              )
            }}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) => validateEmail(value),
              onSubmit: ({ value }) => validateEmail(value),
            }}
          >
            {field => {
              const error = field.state.meta.isTouched
                ? firstError(field.state.meta.errors)
                : undefined
              return (
                <div>
                  <label
                    htmlFor={ids.email}
                    className="mb-1.5 block font-sans text-[0.95rem] font-medium text-ink"
                  >
                    {FIELD_LABELS.email} <span className="text-ink-subtle">(optional)</span>
                  </label>
                  <p
                    id={ids.emailHint}
                    className="mt-0 mb-1.5 font-sans text-[0.86rem] text-ink-subtle"
                  >
                    Only used to reply to you, and never published or shared.
                  </p>
                  <input
                    id={ids.email}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    value={field.state.value}
                    onChange={event => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${ids.emailHint} ${ids.emailError}` : ids.emailHint}
                    className="min-h-11 w-full rounded-md border border-border-strong bg-paper-raised px-3 font-sans text-[1rem] text-ink"
                  />
                  {error ? (
                    <p
                      id={ids.emailError}
                      className="m-0 mt-1.5 font-sans text-[0.88rem] font-medium text-deny"
                    >
                      {error}
                    </p>
                  ) : null}
                </div>
              )
            }}
          </form.Field>
        </div>

        <form.Field name="publicationConsent">
          {field => (
            <fieldset className="m-0 rounded-md border border-border p-4">
              <legend className="px-1 font-sans text-[0.95rem] font-medium text-ink">
                {FIELD_LABELS.publicationConsent}
              </legend>
              <div className="mt-2 space-y-3">
                {CONSENT_OPTIONS.map(option => {
                  const optionId = `${ids.consent}-${option.value}`
                  return (
                    <div key={option.value} className="flex items-start gap-2.5">
                      <input
                        id={optionId}
                        name={field.name}
                        type="radio"
                        value={option.value}
                        checked={field.state.value === option.value}
                        onChange={() => field.handleChange(option.value)}
                        onBlur={field.handleBlur}
                        className="mt-1.5 h-5 w-5 shrink-0"
                      />
                      <label htmlFor={optionId} className="font-sans text-[0.95rem] text-ink">
                        {option.label}
                        <span className="mt-0.5 block text-[0.86rem] text-ink-subtle">
                          {option.description}
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          )}
        </form.Field>

        <form.Subscribe selector={state => state.isSubmitting}>
          {isSubmitting => (
            <div className="flex flex-wrap items-center gap-4">
              {/* Never disabled. A control that cannot be pressed gives a
                  reader no way to find out what went wrong. */}
              <button
                type="submit"
                aria-busy={isSubmitting || undefined}
                aria-describedby={ids.status}
                className={buttonVariants({ variant: 'primary' })}
              >
                {isSubmitting ? 'Sending' : 'Send submission'}
              </button>
              <p className="m-0 font-sans text-[0.86rem] text-ink-subtle">
                No account, no cookie, no tracking, and no CAPTCHA.
              </p>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
