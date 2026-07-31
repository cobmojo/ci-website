import { createHash } from 'node:crypto'
import { searchIndex } from '@/lib/search-index'

/**
 * The search index as a static JSON asset.
 *
 * Emitted at build time, so it is served as a plain file with no server work
 * per request. The client search dialog fetches this once, on first open.
 *
 * It carries an ETag because it is 610kB and `/privacy/` describes it as "a
 * single file downloaded from this site the first time you open search".
 * Without a validator, `must-revalidate` had nothing to revalidate against:
 * every visit re-downloaded the whole file, three visits costing 1.8MB, and
 * the description was true only of the first. The tag is the digest of what is
 * served, so it changes when and only when the content does.
 */
export const dynamic = 'force-static'

export function GET() {
  const body = JSON.stringify(searchIndex())
  const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 27)}"`

  return new Response(body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // An hour of freshness, then revalidate. `must-revalidate` with no
      // validator meant every visit re-downloaded 610kB — three visits cost
      // 1.8MB — while `/privacy/` called it "a single file downloaded the
      // first time you open search". The ETag lets a proxy or CDN answer 304
      // after that hour; `force-static` responses are served by the platform,
      // so the tag is for whatever fronts it rather than for this handler.
      'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
      etag,
    },
  })
}
