import type { NextConfig } from 'next'
import { resolveSiteUrl } from './src/lib/site-url'

/**
 * Content Security Policy.
 *
 * The site loads no third-party script, font or stylesheet. The only external
 * origin ever contacted is YouTube's privacy-enhanced domain, and only after a
 * visitor deliberately presses play on the watch page or the homepage poster.
 */
/**
 * Whether this build is served over HTTPS.
 *
 * `upgrade-insecure-requests` rewrites every `http://` subresource to `https://`.
 * On an HTTPS origin that is exactly what we want. On a plain-HTTP origin there
 * is nothing to upgrade *to*, and the directive is not harmless: Chromium and
 * Firefox exempt loopback from it, WebKit does not, so on a local HTTP server
 * WebKit upgrades the site's own scripts and fonts to a port with no TLS and
 * fails every one of them.
 *
 * `Strict-Transport-Security` is emitted under the same condition and for the
 * same reason: sent from a plain-HTTP local server it would pin the browser's
 * `localhost` entry to HTTPS for a year and break every other project on the
 * machine. It belongs to an origin that already has TLS.
 *
 * The origin is resolved by the same validated function `site-config.ts` uses,
 * so the header policy and the canonical URLs can never disagree about what
 * this build is.
 */
const canonicalOrigin = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL: process.env.NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL,
})

const servedOverHttps = canonicalOrigin.startsWith('https://')

const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https://i.ytimg.com'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-src': ['https://www.youtube-nocookie.com'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  ...(servedOverHttps ? { 'upgrade-insecure-requests': [] } : {}),
}

const csp = Object.entries(CSP_DIRECTIVES)
  .map(([key, values]) => (values.length ? `${key} ${values.join(' ')}` : key))
  .join('; ')

/**
 * Whether this deployment is a preview rather than the canonical site.
 *
 * `robots.ts` already answers this for `robots.txt`, but a crawler that reaches
 * a preview URL directly — from a pull-request comment, a chat link, a referrer
 * header — never asks for `robots.txt` first, and a `Disallow` in it does not
 * remove a URL that is already known. `X-Robots-Tag` on the response itself
 * does. `SITE_ENV` is the provider-neutral switch; `VERCEL_ENV` is recognised
 * because the repository already reads it.
 */
const isPreviewDeployment =
  (process.env.SITE_ENV ?? process.env.VERCEL_ENV ?? '').toLowerCase() === 'preview'

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
  },
  /*
   * Two years, subdomains included, but deliberately no `preload`. Preloading
   * is a one-way door: it is hard-coded into browser binaries and takes months
   * to undo, and it would commit every current and future subdomain of a domain
   * this project does not yet own to HTTPS-only. That is the owner's decision to
   * make after the domain is live, and it is recorded in the launch runbook.
   */
  ...(servedOverHttps
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]
    : []),
  ...(isPreviewDeployment ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@ci/content', '@ci/content-schema', '@ci/search', '@ci/ui'],

  /**
   * Canonical routes end with a slash. Without this, Next strips the trailing
   * slash from rendered hrefs, so the emitted HTML would disagree with the
   * canonical URLs in metadata and with the sitemap.
   */
  trailingSlash: true,

  typedRoutes: false,

  /*
   * `images` is deliberately absent.
   *
   * It allowed `i.ytimg.com` as a remote pattern for a `next/image` this
   * repository does not contain and has no plan to add — the video poster is
   * text, by design. An allowed remote pattern is not inert: it opens
   * `/_next/image?url=…` as a fetch-and-re-encode proxy for that host, which
   * is server work anyone can ask for and nothing here needs.
   */

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        /*
         * The six self-hosted faces never change without changing name: their
         * unicode-range subsets are mirrored in `supported-text.ts`, which
         * already treats widening them as a font change first. Without this
         * they inherit the default and are revalidated on every navigation,
         * which is a round trip before any text can be shaped in the right
         * face.
         */
        source: '/fonts/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        /*
         * Reachable, quotable, and not indexable.
         *
         * The three downloads and the search index are complete duplicates of
         * pages that are already indexed — the transcript of `/watch/`, the
         * bibliography of `/sources/`, the handout of `/start/`, and an index
         * containing every page's prose. A crawler that reaches one of them
         * finds the site's whole text with no navigation and no canonical URL
         * to point back at. Nothing about them should be hidden from a reader;
         * they simply should not compete in a search result.
         */
        source:
          '/:path(download/transcript.txt|download/bibliography.txt|download/handout.html|search-index.json)',
        /*
         * A later rule with the same key replaces an earlier one rather than
         * adding to it, so this has to carry the preview directive too.
         * Without it these four paths would be the only ones on a preview
         * deployment that lost `nofollow` — and `handout.html` carries links,
         * so a crawler reaching the preview would be invited to follow them.
         */
        headers: [
          { key: 'X-Robots-Tag', value: isPreviewDeployment ? 'noindex, nofollow' : 'noindex' },
        ],
      },
    ]
  },

  async redirects() {
    // Common entry paths readers guess or that get shared in conversation.
    // These are redirects rather than duplicate pages, so no thin SEO surface
    // is created and link equity stays on the canonical route.
    const aliases: Array<[string, string]> = [
      ['/conditional-immortality', '/start/what-is-conditional-immortality/'],
      ['/what-is-conditional-immortality', '/start/what-is-conditional-immortality/'],
      ['/annihilationism', '/topics/annihilationism/'],
      ['/annihilation', '/topics/annihilationism/'],
      ['/ect-vs-ci', '/start/compare-the-views/'],
      ['/ci-vs-ect', '/start/compare-the-views/'],
      ['/compare', '/start/compare-the-views/'],
      ['/conditionalism', '/start/what-is-conditional-immortality/'],
      ['/evangelical-conditionalism', '/start/what-is-conditional-immortality/'],
      ['/video', '/watch/'],
      ['/transcript', '/watch/'],
      ['/summary', '/start/'],
      ['/map', '/start/case-map/'],
      ['/sections', '/case/'],
      ['/bible', '/scripture/'],
      ['/verses', '/scripture/'],
      ['/references', '/scripture/'],
      ['/bibliography', '/sources/'],
      ['/feedback', '/corrections/'],
      ['/contact', '/corrections/'],
      ['/read', '/full-case/'],
    ]
    return aliases.map(([source, destination]) => ({ source, destination, permanent: true }))
  },
}

export default nextConfig
