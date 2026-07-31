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
 * - `http`, for everywhere else. It POSTs each record to an endpoint the
 *   operator owns, which is the only durable option that is not tied to one
 *   vendor and adds no dependency. In production it requires
 *   `FEEDBACK_STORE_FIRST_PARTY=1`, for the reason set out at that check.
 * - `memory`, for tests, and refused in production by name.
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
  readonly FEEDBACK_STORE?: string | undefined
  readonly FEEDBACK_STORE_DIR?: string | undefined
  readonly FEEDBACK_STORE_DURABLE?: string | undefined
  readonly FEEDBACK_STORE_URL?: string | undefined
  readonly FEEDBACK_STORE_FIRST_PARTY?: string | undefined
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
 * Zero means nothing is in front of this process, so no forwarding header can
 * be believed and there is no way to tell one reader from another. The limiter
 * then keys every request the same way, which is one shared allowance for the
 * whole site: five submissions per ten minutes, in total. That is deliberate —
 * a limiter that cannot identify a client should throttle conservatively rather
 * than not at all — but it is a real consequence of an explicit setting, and
 * `.env.example` and the runbook both say so.
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
     * The endpoint has to be the site owner's, and only the site owner knows.
     *
     * `/corrections/` tells a reader that "no third party is contacted" and
     * that submissions are "stored on the site's own server". `/privacy/` says
     * "there is no third party involved in receiving, storing or reading a
     * submission". Those are commitments, and this adapter is the one place in
     * the codebase that could break them: it POSTs the whole record — the
     * message, and the name and email address if the reader gave them — to
     * whatever URL is configured.
     *
     * Nothing in the code can tell a collector the author runs on their own
     * infrastructure from a hosted form service. It is a fact about the
     * deployment, so the deployment states it, exactly as it states that a
     * filesystem directory is durable. Without the statement the store is
     * refused and the endpoint answers 503, which is a visible failure — the
     * alternative is a site that quietly contradicts its own privacy page.
     */
    if (deployed && env.FEEDBACK_STORE_FIRST_PARTY !== '1') {
      return unusable(
        'http',
        'FEEDBACK_STORE=http posts each submission, including any name and email address the ' +
          'reader gave, to FEEDBACK_STORE_URL. /corrections/ and /privacy/ both promise that no ' +
          'third party receives a submission, and no code can check whether that endpoint is ' +
          'yours. Set FEEDBACK_STORE_FIRST_PARTY=1 to state that it is a service you operate — ' +
          'or change the promise. See docs/launch-runbook.md.',
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
