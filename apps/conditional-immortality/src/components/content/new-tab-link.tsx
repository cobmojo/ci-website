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
/**
 * Whether this link already shows a reader where it goes.
 *
 * Print appends the destination after every external link inside `main`, so a
 * citation can be checked on paper. A link whose visible text *is* the URL
 * would then carry it twice — measured at 56 anchors on `/sources/` and 29 on
 * `/full-case/`, the two pages most likely to be printed, with `break-all`
 * wrapping between the two copies.
 *
 * Detected rather than declared wherever it can be: a single string child that
 * already contains the href needs no annotation, and that is the shape of every
 * link in the source library. `selfLabelled` is the override for the composite
 * case, where the URL is one part of a longer sentence.
 */
function showsItsOwnUrl(children: ReactNode, href: string): boolean {
  return typeof children === 'string' && children.includes(href)
}

export function NewTabLink({
  href,
  className,
  children,
  selfLabelled,
}: {
  href: string
  className?: string
  children: ReactNode
  selfLabelled?: boolean
}) {
  const showsUrl = selfLabelled ?? showsItsOwnUrl(children, href)
  const classes = showsUrl ? `self-labelled ${className ?? ''}`.trim() : className

  return (
    <a href={href} rel="noopener noreferrer" target="_blank" className={classes}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
