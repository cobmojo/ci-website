import { createHash } from 'node:crypto'
import { resolveFeedbackConfig } from '@/lib/feedback/config'
import { type FeedbackDeps, handleFeedback } from '@/lib/feedback/handler'
import { createFeedbackStore, type FeedbackStore } from '@/lib/feedback/store'
import { siteConfig } from '@/lib/site-config'

/**
 * The single write endpoint on this site.
 *
 * Everything this route decides lives in `@/lib/feedback/handler`, which is a
 * pure function of the dependencies below and is tested on every branch it
 * has. This file supplies the real ones: the configured store, the clock and
 * the identifier source.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Resolved once, at module load.
 *
 * The configuration is a property of the deployment, not of the request, and
 * resolving it per request would let a half-updated environment change the
 * answer between two submissions. An unusable configuration is not thrown:
 * the endpoint answers 503 and says why, which keeps one wrong variable from
 * taking the other 129 pages down with it.
 */
const config = resolveFeedbackConfig({
  ...process.env,
  /*
   * The resolved origin rather than the raw variable. `site-url.ts` has
   * already validated and normalised it, and it is set on a deployment that
   * takes its origin from the platform instead of from an explicit variable,
   * where reading `NEXT_PUBLIC_SITE_URL` here would find nothing and refuse a
   * collector that is in fact on this site.
   */
  NEXT_PUBLIC_SITE_URL: siteConfig.url,
})

const store: FeedbackStore | null = config.usable
  ? createFeedbackStore(
      config.kind === 'filesystem'
        ? { kind: 'filesystem', directory: config.directory }
        : config.kind === 'http'
          ? { kind: 'http', endpoint: config.endpoint, token: config.token }
          : { kind: 'memory' },
    )
  : null

if (!config.usable) {
  // Once, at boot, so an operator sees it in the deployment log rather than
  // discovering it from the first reader who tries to send a correction.
  console.error(`[feedback] the correction endpoint is disabled: ${config.problem}`)
}

const deps: FeedbackDeps = {
  config,
  store,
  now: () => new Date(),
  /*
   * SHA-256 of the handler's fingerprint, truncated to 128 bits.
   *
   * It used to be `randomUUID()`, which gave a reader's second attempt at the
   * same correction a second identity and left the collector no way to tell a
   * resend from a new submission. A digest of the submission answers that, and
   * a one-way one: the fingerprint carries the reader's own words, and they
   * cannot be recovered from the id that is written down and returned.
   */
  newId: fingerprint => createHash('sha256').update(fingerprint).digest('hex').slice(0, 32),
  log: (level, line) => {
    if (level === 'error') console.error(line)
    else console.info(line)
  },
}

export async function POST(request: Request): Promise<Response> {
  return handleFeedback(request, deps)
}

/** Anything other than POST is a mistake worth answering clearly. */
export function GET(): Response {
  return new Response(null, { status: 303, headers: { location: '/corrections/' } })
}
