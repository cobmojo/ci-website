/**
 * Where reader corrections are written, decided once and checked.
 *
 * The correction form is the only write this site performs, and the only way a
 * reader can tell it that it is wrong. Losing a submission is worse than
 * refusing one: a refusal is visible to the person who wrote it, and can be
 * retried.
 *
 * The original implementation appended to a directory under `process.cwd()`
 * and hoped. That is correct on a persistent server and catastrophic on an
 * ephemeral or read-only one, and no code can tell the two apart — a directory
 * that survives a redeploy and a directory that evaporates on the next one
 * behave identically to `appendFile`. It is a deployment fact, so the
 * deployment has to state it.
 *
 * Hence three stores and one acknowledgement:
 *
 * - `filesystem`, the default, for local work and for a genuinely persistent
 *   server. In production it additionally requires `FEEDBACK_STORE_DURABLE=1`,
 *   which is an operator asserting that the volume survives a deploy.
 * - `http`, for everywhere else. It POSTs each record to an endpoint on this
 *   site's own origin, which is the only durable option that is not tied to one
 *   vendor and adds no dependency.
 * - `memory`, for tests, and refused in production by name.
 *
 * Two further things are refused here rather than left to a runbook, because
 * both are silent when they are wrong: a deployment with no proxy in front of
 * it, which leaves the rate limiter one bucket for every reader, and a
 * collector on somebody else's origin, which would make what `/privacy/` and
 * `/corrections/` promise untrue.
 *
 * A configuration that does not resolve does not throw here. The endpoint
 * answers 503 and says so, which keeps a misconfiguration from taking the
 * other 129 pages down with it.
 */

export type FeedbackStoreKind = 'filesystem' | 'http' | 'memory'

interface Base {
  readonly trustedProxyHops: number
  readonly notifyEmail: string | null
}

export type FeedbackConfig = Base &
  (
    | { readonly kind: 'filesystem'; readonly usable: true; readonly directory: string }
    | {
        readonly kind: 'http'
        readonly usable: true
        readonly endpoint: string
        readonly token: string | null
      }
    | { readonly kind: 'memory'; readonly usable: true }
    | {
        readonly kind: FeedbackStoreKind | 'unknown'
        readonly usable: false
        readonly problem: string
      }
  )

export interface FeedbackEnv {
  readonly NODE_ENV?: string | undefined
  /**
   * The canonical origin this site publishes under, which the http collector
   * has to be part of. `site-url.ts` owns how it is resolved and validated;
   * this only ever compares it.
   */
  readonly NEXT_PUBLIC_SITE_URL?: string | undefined
  readonly FEEDBACK_STORE?: string | undefined
  readonly FEEDBACK_STORE_DIR?: string | undefined
  readonly FEEDBACK_STORE_DURABLE?: string | undefined
  readonly FEEDBACK_STORE_URL?: string | undefined
  readonly FEEDBACK_STORE_TOKEN?: string | undefined
  readonly FEEDBACK_TRUSTED_PROXY_HOPS?: string | undefined
  readonly FEEDBACK_NOTIFY_EMAIL?: string | undefined
}

/** Relative to the repository root, and only ever reached locally. */
export const DEFAULT_STORE_DIR = '.feedback-store'

/**
 * How many proxies sit in front of this origin.
 *
 * One is the shape of every managed host: an edge that appends the real client
 * address to `X-Forwarded-For` before passing the request on. The entry that
 * matters is therefore the *last* one, not the first — everything to the left
 * of it is whatever the client chose to send.
 *
 * There is no valid zero. See the refusal in `resolveFeedbackConfig`.
 */
const DEFAULT_TRUSTED_PROXY_HOPS = 1

function wholeNumber(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback
  if (!/^\d+$/.test(raw.trim())) return fallback
  return Number.parseInt(raw.trim(), 10)
}

export function resolveFeedbackConfig(env: FeedbackEnv): FeedbackConfig {
  const base: Base = {
    trustedProxyHops: wholeNumber(env.FEEDBACK_TRUSTED_PROXY_HOPS, DEFAULT_TRUSTED_PROXY_HOPS),
    notifyEmail: env.FEEDBACK_NOTIFY_EMAIL?.trim() || null,
  }

  const deployed = env.NODE_ENV === 'production'
  const requested = (env.FEEDBACK_STORE?.trim() || 'filesystem') as FeedbackStoreKind
  const unusable = (kind: FeedbackConfig['kind'], problem: string): FeedbackConfig => ({
    ...base,
    kind,
    usable: false,
    problem,
  })

  /*
   * A per-connection address the limiter can believe, or nothing runs.
   *
   * With nothing in front of this process there is no forwarding header worth
   * reading, so `clientAddress` answers `unknown-client` for every request and
   * every reader shares one bucket: five submissions from any one sender close
   * the form for everybody else for the rest of the ten-minute window. That is
   * worse than refusing to start, because the correction form is the only way
   * a reader can tell this site it is wrong, and the failure is invisible from
   * the inside — the endpoint looks healthy and answers 429.
   */
  if (base.trustedProxyHops < 1) {
    return unusable(
      'unknown',
      'FEEDBACK_TRUSTED_PROXY_HOPS=0 leaves the rate limiter without a trustworthy ' +
        'per-connection address, so every reader would share one bucket and five submissions ' +
        'from any one sender would refuse the form to everybody. Set it to the number of ' +
        'proxies in front of this origin — 1 on every managed platform. A deployment exposed ' +
        'directly to the internet has to sit behind a proxy that appends the client address to ' +
        'X-Forwarded-For. See docs/launch-runbook.md.',
    )
  }

  if (requested === 'memory') {
    if (deployed) {
      return unusable(
        'memory',
        'FEEDBACK_STORE=memory keeps submissions in the process and loses every one of them ' +
          'when it exits. It exists for tests and is refused in production.',
      )
    }
    return { ...base, kind: 'memory', usable: true }
  }

  if (requested === 'http') {
    const endpoint = env.FEEDBACK_STORE_URL?.trim()
    if (!endpoint) {
      return unusable('http', 'FEEDBACK_STORE=http needs FEEDBACK_STORE_URL to post records to.')
    }
    let parsed: URL
    try {
      parsed = new URL(endpoint)
    } catch {
      return unusable('http', `FEEDBACK_STORE_URL is not a URL: ${JSON.stringify(endpoint)}`)
    }
    if (parsed.protocol !== 'https:') {
      return unusable(
        'http',
        'FEEDBACK_STORE_URL must use https. A correction carries a reader’s words and, if they ' +
          'chose to give them, a name and an email address; those do not travel in clear.',
      )
    }

    /*
     * The collector has to be this site.
     *
     * `/privacy/` tells readers that no third party is involved in receiving,
     * storing or reading a submission, and `/corrections/` that submissions
     * are stored on the site's own server. Those are promises about where a
     * correction goes, and a POST to anyone else's host makes both of them
     * false while the pages still say otherwise — which is the kind of thing
     * a reader can never check and would have every right to be angry about.
     * So the origin is enforced here rather than left as a sentence in a
     * runbook that a hurried deploy can skip.
     */
    let siteOrigin: string
    try {
      siteOrigin = new URL(env.NEXT_PUBLIC_SITE_URL?.trim() ?? '').origin
    } catch {
      return unusable(
        'http',
        'FEEDBACK_STORE=http needs NEXT_PUBLIC_SITE_URL, because the collector is only accepted ' +
          'on this site’s own origin and there is nothing to compare it against.',
      )
    }
    if (parsed.origin !== siteOrigin) {
      return unusable(
        'http',
        `FEEDBACK_STORE_URL must be on this site’s own origin (${siteOrigin}); ` +
          `${parsed.origin} is somewhere else. The privacy page promises that no third party ` +
          'receives or stores a submission and the corrections page that submissions stay on ' +
          'this site’s own server. Route the collector path through this origin, or change ' +
          'those promises first. See docs/launch-runbook.md.',
      )
    }

    return {
      ...base,
      kind: 'http',
      usable: true,
      endpoint: parsed.toString(),
      token: env.FEEDBACK_STORE_TOKEN?.trim() || null,
    }
  }

  if (requested !== 'filesystem') {
    return unusable(
      'unknown',
      `FEEDBACK_STORE=${requested} is not a store this site has. Use filesystem, http or memory.`,
    )
  }

  const directory = env.FEEDBACK_STORE_DIR?.trim() || DEFAULT_STORE_DIR

  if (deployed) {
    if (env.FEEDBACK_STORE_DURABLE !== '1') {
      return unusable(
        'filesystem',
        'The filesystem store is only safe where the directory outlives the process. Set ' +
          'FEEDBACK_STORE_DURABLE=1 to declare that it does, or use FEEDBACK_STORE=http. ' +
          'See docs/launch-runbook.md.',
      )
    }
    // `process.cwd()` is the host's choice, not ours, and it moves between a
    // build step, a serverless bundle and a container. A relative path is a
    // different directory in each.
    const isAbsolute = directory.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(directory)
    if (!isAbsolute) {
      return unusable(
        'filesystem',
        `FEEDBACK_STORE_DIR must be an absolute path in production; ${JSON.stringify(directory)} ` +
          'resolves against whatever working directory the host happens to use.',
      )
    }
  }

  return { ...base, kind: 'filesystem', usable: true, directory }
}
