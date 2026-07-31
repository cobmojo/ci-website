import { createHash } from 'node:crypto'
import { searchIndex } from '@/lib/search-index'

/**
 * The search index as a JSON asset.
 *
 * The client search dialog fetches this once, on first open. It is 610kB, and
 * `/privacy/` describes it as "a single file downloaded from this site the
 * first time you open search", so what happens on the second visit is the
 * whole point of this file.
 *
 * Two things were wrong, in order.
 *
 * `must-revalidate` with no validator meant every visit re-downloaded the
 * whole file: three visits cost 1.8MB, and the description was true only of
 * the first. An ETag closed the first half of that.
 *
 * It did not close the second. The route was `force-static`, so the handler ran
 * at build time and never saw a request, and nothing compared `If-None-Match`
 * against the tag it was emitting. Measured against this repository's own
 * `next start`: a second request carrying the exact tag from the first was
 * answered `200` with all 628,636 bytes again. The tag was only ever going to
 * help if a CDN happened to front the site, which nothing here configures, and
 * the end-to-end test asserted that the two headers exist, which is true of the
 * working and the broken version alike.
 *
 * So the handler runs per request and answers the conditional itself. The cost
 * is one `JSON.stringify` of the index, which is why it is done once per
 * process and kept: a request that revalidates does a string comparison and
 * writes no body at all.
 */
export const dynamic = 'force-dynamic'

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  // An hour of freshness, then revalidate against the tag below.
  'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
} as const

let payload: { readonly body: string; readonly etag: string } | undefined

function indexPayload(): { readonly body: string; readonly etag: string } {
  if (payload) return payload
  const body = JSON.stringify(searchIndex())
  // The digest of what is served, so the tag changes when and only when the
  // content does.
  const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 27)}"`
  payload = { body, etag }
  return payload
}

/**
 * Does the request already hold this version?
 *
 * `If-None-Match` is a list, may be `*`, and each entry may be weak. The
 * comparison a cache validator needs is the weak one, which ignores the `W/`
 * prefix, so it is stripped from both sides before comparing.
 */
function matchesEtag(header: string | null, etag: string): boolean {
  if (!header) return false
  if (header.trim() === '*') return true
  const strip = (value: string) => value.trim().replace(/^W\//, '')
  return header.split(',').some(candidate => strip(candidate) === strip(etag))
}

export function GET(request: Request): Response {
  const { body, etag } = indexPayload()

  if (matchesEtag(request.headers.get('if-none-match'), etag)) {
    // No body, and the validators repeated so the stored entry stays usable.
    return new Response(null, { status: 304, headers: { ...HEADERS, etag } })
  }

  return new Response(body, { headers: { ...HEADERS, etag } })
}
