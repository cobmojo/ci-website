'use client'

import { buttonVariants } from '@ci/ui'
import { useEffect } from 'react'
import { Link } from '@/components/navigation/link'

/**
 * The recovery page for an uncaught error inside a route.
 *
 * Without one, React unmounts the tree and Next serves its built-in error
 * page: no `lang`, no skip link, no landmark, its own dark-mode styling, and a
 * dead end. On a site whose whole argument is that a reader should be able to
 * check everything, that is the wrong last impression, and it is an
 * accessibility regression at the exact moment a reader most needs a way out.
 *
 * What it deliberately does not do is show the error. `error.message` from a
 * server component is already redacted by React in production, but the digest
 * is meaningless to a reader and the message is not theirs to debug. The route
 * out is what matters.
 *
 * `reset()` re-renders the segment. It is offered first because a transient
 * failure — a slow read, a cold start — is the likeliest cause, and retrying
 * costs a reader nothing.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The digest only. It is the one value that correlates a reader's report
    // with a server log line, and it carries no content.
    console.error(`[error] route render failed${error.digest ? ` (${error.digest})` : ''}`)
  }, [error.digest])

  return (
    <div className="mx-auto w-full max-w-[46rem] px-4 py-16">
      <h1 className="mt-0 mb-4">Something went wrong on this page</h1>
      <p className="m-0 mb-4 text-ink-muted">
        The page could not be displayed. Nothing you did caused it, and nothing has been lost.
      </p>
      <p className="m-0 mb-8 text-ink-muted">
        Trying again often works. If it does not, the same material is reachable from the case index
        and from search.
      </p>

      <div className="flex flex-wrap gap-3">
        <button className={buttonVariants({ variant: 'copperSoft' })} onClick={reset} type="button">
          Try again
        </button>
        <Link className={buttonVariants({ variant: 'outline' })} href="/case/">
          The case
        </Link>
        <Link className={buttonVariants({ variant: 'outline' })} href="/search/">
          Search
        </Link>
      </div>
    </div>
  )
}
