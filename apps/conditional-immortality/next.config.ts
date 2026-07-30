import type { NextConfig } from 'next'

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
 * So it is emitted when, and only when, the canonical origin is HTTPS —
 * resolved exactly as `site-config.ts` resolves it, including the Vercel
 * fallbacks, so a deployment that sets no `NEXT_PUBLIC_SITE_URL` still gets
 * the production policy. The local production server the browser suites run
 * against resolves to none of them, and is testable in all three engines.
 */
const canonicalOrigin =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : '') ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

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

  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
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
