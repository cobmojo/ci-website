import NextLink from 'next/link'
import type { ComponentProps } from 'react'

/**
 * `next/link`, with prefetching opt-in instead of opt-out.
 *
 * Next prefetches a static route *in full* — the whole React Server Component
 * payload — as soon as the link enters the viewport. On an application with a
 * handful of small routes that is free. Here the payloads are the size of the
 * pages, and the pages are the argument:
 *
 * | route                                | payload |
 * |--------------------------------------|---------|
 * | `/full-case/`                        |  975 kB |
 * | `/scripture/`                        |  303 kB |
 * | `/sources/`                          |  183 kB |
 * | `/case/`                             |  139 kB |
 * | a long case section                  | ~110 kB |
 *
 * A case section carries a header naming six of those, a footer naming
 * sixteen, a breadcrumb trail, a contents list and sixty-odd cross-references
 * into passages, topics and the source library. Measured on the wire, opening
 * one article started **2.26 MB across 95 requests** before the reader had
 * pressed anything, of which they would use at most one. The home page started
 * 1.82 MB. On the standard Lighthouse mobile configuration that bandwidth
 * competes with the document, the stylesheet and the two preloaded faces that
 * the largest paint waits on, and the home page reached LCP at 3,459ms against
 * a 2,500ms ceiling.
 *
 * So the default is inverted. This is a reference work: a reader spends
 * minutes on a page and then follows one link. Downloading every destination
 * in view is not a prediction, it is the absence of one — and on a phone it is
 * megabytes of somebody's data spent on pages they will never open.
 *
 * Prefetching is still available and still used, by passing `prefetch`
 * explicitly. `chapter-navigation.tsx` does, for Previous and Next, because
 * sequential reading is the one navigation on this site that genuinely is
 * predictable.
 *
 * Everything else about `next/link` is unchanged: client-side navigation,
 * scroll behaviour, `scroll`, `replace`, `onNavigate`, and plain `<a>`
 * semantics without scripting.
 *
 * `tests/e2e/prefetch-budget.spec.ts` holds the line on the wire, per route
 * family, because a dropped prop is invisible in a snapshot.
 */
export type LinkProps = ComponentProps<typeof NextLink>

export function Link({ prefetch = false, ...rest }: LinkProps) {
  return <NextLink prefetch={prefetch} {...rest} />
}
