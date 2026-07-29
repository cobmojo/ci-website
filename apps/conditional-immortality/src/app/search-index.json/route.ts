import { searchIndex } from '@/lib/search-index'

/**
 * The search index as a static JSON asset.
 *
 * Emitted at build time, so it is served as a plain file with no server work
 * per request. The client search dialog fetches this once, on first open.
 */
export const dynamic = 'force-static'

export function GET() {
  return new Response(JSON.stringify(searchIndex()), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
