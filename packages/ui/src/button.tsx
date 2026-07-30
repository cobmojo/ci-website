import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from './utils'

/**
 * Shared button/link surface.
 *
 * `min-h-11` keeps every target at or above the 44px WCAG 2.2 target-size
 * guidance without needing per-instance overrides.
 *
 * There is no `transition-colors` here any more. Tier 1 feedback is declared
 * once in the base layer of `globals.css` against `button`, so this surface and
 * the hand-written links that are styled to look identical to it now share one
 * duration and one curve instead of two. `pressable` opts into the Tier 2 press
 * scale. See `docs/motion-brief.md`.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium ' +
    'no-underline pressable min-h-11 px-4 py-2 text-[0.97rem] ' +
    'disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-navy text-white hover:bg-navy-deep',
        secondary: 'bg-panel text-navy border border-border-strong hover:bg-panel-strong',
        outline: 'border border-navy text-navy hover:bg-panel',
        ghost: 'text-navy hover:bg-panel',
        copper: 'bg-copper text-white hover:bg-copper-deep',
        /* A tint and a hairline, not a solid fill. Distinct from `copper`. */
        copperSoft: 'border border-copper/45 bg-copper/10 text-copper-deep hover:bg-copper/15',
      },
      size: {
        /* Smaller text and padding, never a smaller target: the base
           `min-h-11` floor applies to every size. */
        sm: 'px-3 py-1.5 text-[0.9rem]',
        md: '',
        lg: 'min-h-12 px-5 text-[1.02rem]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type ButtonProps = ComponentPropsWithoutRef<'button'> & ButtonVariantProps

export function Button({ className, variant, size, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
