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

  if (process.env.VERCEL_ENV === 'preview') {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
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
