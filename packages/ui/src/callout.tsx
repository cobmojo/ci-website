import type { ReactNode } from 'react'
import { cn } from './utils'

export type CalloutTone = 'note' | 'caution' | 'question' | 'author' | 'affirm' | 'deny'

interface ToneSpec {
  readonly container: string
  readonly label: string
  /** Text glyph, so the distinction survives greyscale printing. */
  readonly glyph: string
}

const TONES: Record<CalloutTone, ToneSpec> = {
  note: { container: 'bg-panel border-border-strong', label: 'text-navy', glyph: '§' },
  caution: { container: 'bg-ochre-soft border-ochre/40', label: 'text-ochre', glyph: '!' },
  question: { container: 'bg-paper-raised border-border-strong', label: 'text-navy', glyph: '?' },
  author: { container: 'bg-paper-raised border-copper/35', label: 'text-copper-deep', glyph: '¶' },
  affirm: { container: 'bg-affirm-soft border-affirm/30', label: 'text-affirm', glyph: '✓' },
  deny: { container: 'bg-deny-soft border-deny/30', label: 'text-deny', glyph: '✕' },
}

export interface CalloutProps {
  tone?: CalloutTone
  title: string
  children: ReactNode
  className?: string
  /**
   * Heading level for the callout title. Callouts inside an article body must
   * not break the document outline, so this is explicit rather than assumed.
   */
  as?: 'h2' | 'h3' | 'h4' | 'p'
  id?: string
}

/**
 * Boxed aside for caveats, open questions and author notes.
 *
 * Never used to hide load-bearing argument: core reasoning stays in the main
 * flow. Tone is conveyed by the label text and a glyph as well as by colour.
 */
export function Callout({
  tone = 'note',
  title,
  children,
  className,
  as: Heading = 'h3',
  id,
}: CalloutProps) {
  const spec = TONES[tone]
  return (
    <aside id={id} className={cn('my-6 rounded-md border p-4 sm:p-5', spec.container, className)}>
      <Heading
        className={cn(
          'mt-0 mb-2 flex items-baseline gap-2 font-sans text-[0.95rem] font-semibold',
          'tracking-wide uppercase',
          spec.label,
        )}
      >
        <span aria-hidden="true" className="not-italic">
          {spec.glyph}
        </span>
        {title}
      </Heading>
      <div className="[&>*+*]:mt-3 [&>p]:m-0 text-[1.02rem] leading-relaxed">{children}</div>
    </aside>
  )
}
