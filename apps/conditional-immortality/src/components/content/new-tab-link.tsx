import type { ReactNode } from 'react'

/**
 * An external link that opens a new tab and says so.
 *
 * Every hand-written `target="_blank"` link goes through this component, so
 * the `rel` hardening and the screen-reader note cannot be forgotten on the
 * next one. MDX prose links get the same treatment (plus a visible glyph)
 * from `InternalOrExternalLink` in `mdx-content.tsx`, which handles arbitrary
 * authored hrefs; this one is for links whose destination the code chooses.
 */
export function NewTabLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <a href={href} rel="noopener noreferrer" target="_blank" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
