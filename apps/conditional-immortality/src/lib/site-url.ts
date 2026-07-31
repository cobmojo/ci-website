/**
 * The canonical origin, resolved once and validated hard.
 *
 * This is the highest-leverage value in the build. It decides the canonical
 * link on every page, every `<loc>` in the sitemap, `Host` and `Sitemap` in
 * robots.txt, every Open Graph URL, the site address printed on the three
 * downloads, and the destination encoded in the printed handout's QR code.
 *
 * It used to fall back to `http://localhost:3210` unconditionally, which meant
 * a production build that forgot one environment variable was silently wrong
 * in 604 output files at once: un-indexable, with social cards that never
 * render and a printed QR code that resolves to nothing. Nothing failed,
 * because a build with the default is byte-identical in shape to a correct
 * one — and because the value is baked at build time, setting the variable on
 * the running server afterwards does not fix it.
 *
 * So the fallback now has to be asked for. A build either says what the
 * canonical origin is, or says that it is a local build and does not care.
 * There is no third state.
 */

/** Where local development, the test servers and CI serve from. */
export const LOCALHOST_SITE_URL = 'http://localhost:3210'

/**
 * The variables that decide the origin.
 *
 * Read as a plain object rather than from `process.env` directly so the
 * resolution is a pure function and can be tested against every branch. The
 * caller is responsible for passing literal `process.env.X` member accesses,
 * which is what lets Next inline the `NEXT_PUBLIC_` ones into the client
 * bundle.
 */
export interface SiteUrlEnv {
  readonly NEXT_PUBLIC_SITE_URL?: string | undefined
  readonly NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL?: string | undefined
  readonly VERCEL_PROJECT_PRODUCTION_URL?: string | undefined
  readonly VERCEL_URL?: string | undefined
}

const GUIDANCE =
  'Set NEXT_PUBLIC_SITE_URL to the exact canonical production origin before building ' +
  '(for example https://example.org, with no trailing path). For a local, test or CI ' +
  'build that is served from localhost, set NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL=1 ' +
  'instead. See docs/launch-runbook.md.'

/**
 * Reject anything that would produce a malformed URL when a path is appended.
 *
 * `allowInsecure` is the localhost opt-out: the browser suites serve over plain
 * HTTP, and a released site must not.
 */
function validated(raw: string, source: string, allowInsecure: boolean): string {
  // Trailing slashes are stripped before parsing rather than rejected: a value
  // pasted out of a provider dashboard almost always carries one, and it says
  // nothing different from a value without one. A path segment is a different
  // matter and is rejected below.
  const trimmed = raw.trim().replace(/\/+$/, '')

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error(`${source} is not an absolute URL: ${JSON.stringify(trimmed)}. ${GUIDANCE}`)
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`${source} must use https (or http for a local build), not ${url.protocol}`)
  }

  if (url.protocol === 'http:' && !allowInsecure) {
    throw new Error(
      `${source} must use https for a release build. ${JSON.stringify(trimmed)} does not. ${GUIDANCE}`,
    )
  }

  if (url.username || url.password) {
    throw new Error(`${source} must not carry credentials.`)
  }

  if (url.search || url.hash) {
    throw new Error(`${source} must not carry a query string or a fragment.`)
  }

  if (url.pathname !== '/') {
    // A path here would appear twice in every URL the site builds, because
    // `absoluteUrl` appends a route that already starts with a slash.
    throw new Error(
      `${source} must be an origin with no path component. ` +
        `${JSON.stringify(trimmed)} has ${JSON.stringify(url.pathname)}.`,
    )
  }

  // `URL` normalises `https://example.org` to a trailing slash; strip it back
  // off so nothing ever concatenates a double slash.
  return url.origin
}

export function resolveSiteUrl(env: SiteUrlEnv): string {
  const allowLocalhost = env.NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL === '1'

  const configured = env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return validated(configured, 'NEXT_PUBLIC_SITE_URL', allowLocalhost)

  /*
   * Provider fallbacks, in the order the provider itself recommends: the stable
   * production domain before the per-deployment one, so a production build
   * never canonicalises itself to a deployment-specific host. These are
   * server-only variables, so a build that relies on them alone would resolve
   * differently in the browser bundle — which is why the runbook requires
   * NEXT_PUBLIC_SITE_URL for a real deployment and treats these as a preview
   * convenience only.
   */
  const providerHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim()
  if (providerHost) {
    const source = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      ? 'VERCEL_PROJECT_PRODUCTION_URL'
      : 'VERCEL_URL'
    return validated(`https://${providerHost.replace(/^https?:\/\//, '')}`, source, allowLocalhost)
  }

  if (allowLocalhost) return LOCALHOST_SITE_URL

  throw new Error(`No canonical origin is configured for this build. ${GUIDANCE}`)
}
