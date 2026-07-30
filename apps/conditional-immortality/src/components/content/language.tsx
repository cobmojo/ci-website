import type { ReactNode } from 'react'

/**
 * Original-language display.
 *
 * The `lang` attribute is always set so screen readers switch pronunciation,
 * and a transliteration and gloss always accompany the original so the
 * argument is readable to someone who does not read the script. Hebrew is
 * additionally marked right-to-left and isolated so it cannot reorder the
 * surrounding English.
 */
export function Greek({
  text,
  transliteration,
  gloss,
}: {
  text: string
  transliteration: string
  gloss?: string
}) {
  return (
    <span className="whitespace-normal">
      <span lang="grc" className="lang-grc">
        {text}
      </span>{' '}
      <span className="font-sans text-[0.88em] text-ink-muted">
        ({transliteration}
        {gloss ? `, ${gloss}` : ''})
      </span>
    </span>
  )
}

export function Hebrew({
  text,
  transliteration,
  gloss,
}: {
  text: string
  transliteration: string
  gloss?: string
}) {
  return (
    <span className="whitespace-normal">
      <span lang="he" dir="rtl" className="lang-he">
        {text}
      </span>{' '}
      <span className="font-sans text-[0.88em] text-ink-muted">
        ({transliteration}
        {gloss ? `, ${gloss}` : ''})
      </span>
    </span>
  )
}

/**
 * Side-by-side presentation of the two readings.
 *
 * On narrow screens the two panels stack. Each panel carries its own heading
 * text, so the distinction never depends on position or colour.
 */
export function Compare({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-4 md:grid-cols-2">{children}</div>
}

/**
 * The reading panels take their heading level as a prop for the same reason
 * `Callout` does: a panel must not break the document outline it lands in.
 * Authored bodies sit under `###` at deepest, so `h4` is the default; the
 * continuous edition demotes every heading a level and passes `h5`.
 */
export function ECTReading({
  children,
  as: Heading = 'h4',
}: {
  children: ReactNode
  as?: 'h4' | 'h5'
}) {
  return (
    <div className="rounded-md border border-border-strong bg-panel p-4">
      <Heading className="mt-0 mb-2 font-sans text-[0.86rem] font-semibold tracking-wide text-navy uppercase">
        <span aria-hidden="true">▣ </span>
        The eternal conscious torment reading
      </Heading>
      <div className="text-[1rem] [&>*+*]:mt-3 [&>p]:m-0">{children}</div>
    </div>
  )
}

export function CIReading({
  children,
  as: Heading = 'h4',
}: {
  children: ReactNode
  as?: 'h4' | 'h5'
}) {
  return (
    <div className="rounded-md border border-copper/35 bg-paper-raised p-4">
      <Heading className="mt-0 mb-2 font-sans text-[0.86rem] font-semibold tracking-wide text-copper-deep uppercase">
        <span aria-hidden="true">◈ </span>
        The conditionalist reading
      </Heading>
      <div className="text-[1rem] [&>*+*]:mt-3 [&>p]:m-0">{children}</div>
    </div>
  )
}

/**
 * Progressive disclosure for genuinely supplementary material only.
 *
 * Print styles force these open, so nothing is lost on paper.
 */
export function Details({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="my-5 rounded-md border border-border bg-paper-raised px-4 py-3">
      <summary className="summary-hit-area font-sans text-[0.95rem] font-medium text-navy">
        {summary}
      </summary>
      <div className="mt-3 [&>*+*]:mt-3">{children}</div>
    </details>
  )
}
