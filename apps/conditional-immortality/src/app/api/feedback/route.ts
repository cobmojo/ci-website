import { randomUUID } from 'node:crypto'
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
const config = resolveFeedbackConfig(process.env)

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
  canonicalOrigin: siteConfig.url,
  now: () => new Date(),
  newId: () => randomUUID(),
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
