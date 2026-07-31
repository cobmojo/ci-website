import type { MetadataRoute } from 'next'
import { absoluteUrl, siteConfig } from '@/lib/site-config'

/**
 * Crawling rules.
 *
 * The site wants to be read and indexed, so the only disallowed path is the
 * write endpoint under `/api/`, which has nothing to index and should never be
 * crawled. Preview deployments are excluded entirely: a preview URL carries the
 * same content as production and would otherwise compete with it.
 */
export default function robots(): MetadataRoute.Robots {
  const sitemap = absoluteUrl('/sitemap.xml')

  // `SITE_ENV` is the provider-neutral switch, because the deployment target is
  // chosen by whoever deploys; `VERCEL_ENV` is still honoured. `next.config.ts`
  // reads the same pair to add `X-Robots-Tag`, which is what actually removes a
  // preview URL a crawler already knows about.
  const environment = (process.env.SITE_ENV ?? process.env.VERCEL_ENV ?? '').toLowerCase()

  if (environment === 'preview') {
    /*
     * A preview is kept out of the index by `X-Robots-Tag: noindex, nofollow`
     * on the response, which `next.config.ts` adds for exactly this
     * environment. Crawling therefore has to be *allowed*: a directive on the
     * response can only be obeyed by a crawler that is permitted to fetch the
     * response.
     *
     * This used to answer `Disallow: /` as well, which reads like extra
     * safety and is the opposite. Google is explicit that a page blocked in
     * robots.txt never has its noindex seen and "can still appear in search
     * results" — so the disallow was suppressing the one directive that
     * actually removes a preview URL somebody had already shared.
     *
     * No `sitemap` and no `host`: a preview must not advertise itself or
     * invite enumeration of URLs that would compete with the canonical site.
     */
    return {
      rules: [{ userAgent: '*', allow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap,
    host: siteConfig.url,
  }
}
