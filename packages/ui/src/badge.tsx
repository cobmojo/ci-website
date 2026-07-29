import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from './utils'

export type BadgeTone = 'neutral' | 'navy' | 'copper' | 'ochre' | 'affirm' | 'deny'

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-panel text-ink-muted border-border-strong',
  navy: 'bg-navy/10 text-navy border-navy/25',
  copper: 'bg-copper/10 text-copper-deep border-copper/30',
  ochre: 'bg-ochre-soft text-ochre border-ochre/35',
  affirm: 'bg-affirm-soft text-affirm border-affirm/30',
  deny: 'bg-deny-soft text-deny border-deny/30',
}

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone
  /**
   * Optional leading glyph. Badges always carry their own text, so the glyph
   * is decorative and is hidden from assistive technology.
   */
  glyph?: ReactNode
}

/**
 * Small labelled marker for evidence roles, review statuses and page types.
 * Tone is supplementary: the label text always carries the meaning.
 */
export function Badge({ className, tone = 'neutral', glyph, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5',
        'font-sans text-[0.78rem] font-medium leading-5 tracking-wide',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    >
      {glyph ? (
        <span aria-hidden="true" className="text-[0.85em]">
          {glyph}
        </span>
      ) : null}
      {children}
    </span>
  )
}
