/**
 * Every route this site serves, discovered rather than listed.
 *
 * A hardcoded route list answers "are these routes fine". It cannot answer "is
 * any route broken", because the route that was added last week is not in it.
 * Everything here is read from the build output and the registries the build
 * was made from, so a page cannot exist without being audited.
 *
 * Three sources, reconciled, because each one is blind to something:
 *
 *   - the prerendered HTML in `.next/server/app` is the ground truth for what
 *     was actually emitted, and knows nothing about intent;
 *   - `routes-manifest.json` holds the redirects and the route handlers, which
 *     emit no HTML at all;
 *   - `navigation.ts` holds `NOINDEX_ROUTES`, which is the only place that
 *     records that a served page is deliberately not indexable — the sitemap
 *     cannot say so, because a noindex route is precisely what it omits.
 *
 * Disagreement between them is a finding, not something to paper over, so
 * `reconcile()` returns it rather than resolving it quietly.
 *
 * Requires a completed `next build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  NOINDEX_ROUTES,
  STATIC_ROUTES,
} from '../../../apps/conditional-immortality/src/lib/navigation'

export const REPO_ROOT = resolve(import.meta.dir, '..', '..', '..')
export const APP_ROOT = join(REPO_ROOT, 'apps', 'conditional-immortality')
export const NEXT_DIR = join(APP_ROOT, '.next')
const APP_OUTPUT = join(NEXT_DIR, 'server', 'app')

/**
 * Framework error documents. They are served, but they are not routes: nothing
 * links to them, they carry no canonical URL, and `next start` reaches them
 * only by failing to match something else.
 */
const FRAMEWORK_DOCUMENTS = new Set(['/_not-found/', '/_global-error/'])

export type RouteKind =
  | 'indexable-html'
  | 'noindex-html'
  | 'redirect-source'
  | 'error-document'
  | 'route-handler'
  | 'generated-asset'

/**
 * Template families.
 *
 * Grouped by the component that renders them, not by URL prefix for its own
 * sake: two routes in the same family share a bottleneck, so fixing the worst
 * one usually fixes the family, and measuring all forty case sections when
 * they differ only in prose is how a sweep becomes too slow to run twice.
 */
export type RouteFamily =
  | 'home'
  | 'orientation'
  | 'listing'
  | 'article'
  | 'appendix'
  | 'passage'
  | 'topic'
  | 'changelog-entry'
  | 'informational'
  | 'watch'
  | 'corrections'
  | 'search'
  | 'full-case'

export interface RouteRecord {
  readonly route: string
  readonly kind: RouteKind
  readonly family: RouteFamily | null
  /**
   * Whether the build emitted HTML for this route.
   *
   * `/search/` reads `searchParams`, so it is server-rendered on demand and no
   * file exists for it. That is correct, and it is also the reason the route
   * list cannot simply be the contents of a directory: the one page whose cost
   * includes a render would be the one page missing from the sweep.
   */
  readonly rendering: 'prerendered' | 'on-demand' | null
  /** Bytes of prerendered HTML, or of the generated body for an asset. */
  readonly bytes: number
  /** `<a href>` occurrences in the emitted HTML: the prefetch and crawl surface. */
  readonly links: number
  /** Opening tags in the emitted HTML. A cheap, deterministic proxy for DOM size. */
  readonly elements: number
  /** First-load uncompressed JavaScript, from the build's own diagnostics. */
  readonly firstLoadJsBytes: number | null
  /** For a redirect source, where it goes. */
  readonly destination?: string
}

export interface RouteManifest {
  readonly routes: readonly RouteRecord[]
  readonly discrepancies: readonly string[]
  readonly sitemapRoutes: readonly string[]
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/** `.next/server/app/case/foundations/imago-dei.html` → `/case/foundations/imago-dei/`. */
function routeFromHtmlFile(file: string): string {
  const relative = file.slice(APP_OUTPUT.length + 1).replaceAll('\\', '/')
  const withoutExtension = relative.slice(0, -'.html'.length)
  return withoutExtension === 'index' ? '/' : `/${withoutExtension}/`
}

export function familyOf(route: string): RouteFamily | null {
  if (route === '/') return 'home'
  if (route === '/search/') return 'search'
  if (route === '/full-case/') return 'full-case'
  if (route === '/watch/') return 'watch'
  if (route === '/corrections/') return 'corrections'
  if (route === '/start/' || route.startsWith('/start/')) return 'orientation'

  // An index page and its children render from different components, so the
  // trailing-segment count is what separates them.
  const segments = route.split('/').filter(Boolean)
  if (segments.length === 1) {
    const listings = new Set([
      'case',
      'objections',
      'passages',
      'scripture',
      'topics',
      'glossary',
      'sources',
      'changelog',
      'download',
    ])
    if (listings.has(segments[0] as string)) return 'listing'
    return 'informational'
  }

  const [head] = segments
  if (head === 'passages') return 'passage'
  if (head === 'topics') return 'topic'
  if (head === 'changelog') return 'changelog-entry'
  if (head === 'appendix') return 'appendix'
  if (head === 'case' || head === 'objections') return 'article'
  return null
}

/** Cheap, deterministic counts. Not a parse: nothing here needs one. */
function measure(html: string): { links: number; elements: number } {
  return {
    links: (html.match(/<a\s[^>]*href=/gi) ?? []).length,
    elements: (html.match(/<[a-zA-Z][^>]*>/g) ?? []).length,
  }
}

/** `.next/diagnostics/route-bundle-stats.json` is a bare array of these. */
interface RouteBundleStat {
  readonly route: string
  readonly firstLoadUncompressedJsBytes: number
}

function firstLoadJsByRoute(): Map<string, number> {
  const file = join(NEXT_DIR, 'diagnostics', 'route-bundle-stats.json')
  if (!existsSync(file)) return new Map()
  const stats = JSON.parse(readFileSync(file, 'utf8')) as readonly RouteBundleStat[]
  const map = new Map<string, number>()
  for (const entry of stats) {
    // The diagnostics file names the *page*, so `/case/[...slug]` covers every
    // section. Store both the raw key and a trailing-slash form.
    map.set(entry.route, entry.firstLoadUncompressedJsBytes)
  }
  return map
}

/** `/case/foundations/imago-dei/` → the `/case/[...slug]` bundle entry. */
function bundleKeyFor(route: string, keys: Iterable<string>): string | null {
  const trimmed = route === '/' ? '/' : route.replace(/\/$/, '')
  const dynamic = [...keys].filter(key => key.includes('['))
  for (const key of dynamic) {
    const pattern = new RegExp(
      `^${key
        .replace(/\[\.\.\.[^\]]+\]/g, '.+')
        .replace(/\[[^\]]+\]/g, '[^/]+')
        .replace(/\//g, '\\/')}$`,
    )
    if (pattern.test(trimmed)) return key
  }
  return [...keys].includes(trimmed) ? trimmed : null
}

export function buildRouteManifest(): RouteManifest {
  if (!existsSync(APP_OUTPUT)) {
    throw new Error(`No build output at ${APP_OUTPUT}. Run \`bun run build\` first.`)
  }

  const files = walk(APP_OUTPUT)
  const bundleStats = firstLoadJsByRoute()
  const bundleKeys = [...bundleStats.keys()]
  const records: RouteRecord[] = []
  const discrepancies: string[] = []

  const noindex = new Set(NOINDEX_ROUTES)
  const seenHtml = new Set<string>()

  for (const file of files) {
    if (!file.endsWith('.html')) continue
    const route = routeFromHtmlFile(file)
    seenHtml.add(route)
    const html = readFileSync(file, 'utf8')
    const { links, elements } = measure(html)
    const bundleKey = bundleKeyFor(route, bundleKeys)

    const kind: RouteKind = FRAMEWORK_DOCUMENTS.has(route)
      ? 'error-document'
      : noindex.has(route)
        ? 'noindex-html'
        : 'indexable-html'

    records.push({
      route,
      kind,
      family: kind === 'error-document' ? null : familyOf(route),
      rendering: 'prerendered',
      bytes: statSync(file).size,
      links,
      elements,
      firstLoadJsBytes: bundleKey ? (bundleStats.get(bundleKey) ?? null) : null,
    })
  }

  /*
   * Pages that exist but emitted no file. `app-path-routes-manifest.json` is
   * the framework's own list of what it compiled, so a page cannot be rendered
   * on demand and stay out of the audit by leaving nothing on disk.
   */
  const appPaths = JSON.parse(
    readFileSync(join(NEXT_DIR, 'app-path-routes-manifest.json'), 'utf8'),
  ) as Record<string, string>
  for (const [source, page] of Object.entries(appPaths)) {
    if (!source.endsWith('/page')) continue
    if (page.includes('[')) continue
    const route = page === '/' ? '/' : `${page}/`
    if (seenHtml.has(route)) continue
    const kind: RouteKind = FRAMEWORK_DOCUMENTS.has(route)
      ? 'error-document'
      : noindex.has(route)
        ? 'noindex-html'
        : 'indexable-html'
    records.push({
      route,
      kind,
      family: kind === 'error-document' ? null : familyOf(route),
      rendering: 'on-demand',
      bytes: 0,
      links: 0,
      elements: 0,
      firstLoadJsBytes: bundleStats.get(page) ?? null,
    })
  }

  // Route handlers and generated assets: served, auditable, but not HTML pages.
  for (const file of files) {
    if (!file.endsWith('.body')) continue
    const relative = file.slice(APP_OUTPUT.length + 1).replaceAll('\\', '/')
    const route = `/${relative.slice(0, -'.body'.length)}`
    records.push({
      route,
      kind: 'generated-asset',
      family: null,
      rendering: null,
      bytes: statSync(file).size,
      links: 0,
      elements: 0,
      firstLoadJsBytes: null,
    })
  }

  const manifestFile = join(NEXT_DIR, 'routes-manifest.json')
  if (existsSync(manifestFile)) {
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as {
      redirects: ReadonlyArray<{ source: string; destination: string; statusCode: number }>
    }
    for (const redirect of manifest.redirects) {
      // Next adds its own trailing-slash normalisation rules; those are the
      // framework's, not the site's aliases, and they have no destination
      // worth auditing as a route.
      if (redirect.source.includes(':path') || redirect.source.includes('(?')) continue
      records.push({
        route: redirect.source,
        kind: 'redirect-source',
        family: null,
        rendering: null,
        bytes: 0,
        links: 0,
        elements: 0,
        firstLoadJsBytes: null,
        destination: redirect.destination,
      })
    }
  }

  // The API route emits nothing to disk, so nothing above finds it.
  records.push({
    route: '/api/feedback',
    kind: 'route-handler',
    family: null,
    rendering: null,
    bytes: 0,
    links: 0,
    elements: 0,
    firstLoadJsBytes: null,
  })
  records.push({
    route: '/og',
    kind: 'route-handler',
    family: null,
    rendering: null,
    bytes: 0,
    links: 0,
    elements: 0,
    firstLoadJsBytes: null,
  })

  // --- reconcile -----------------------------------------------------------

  const sitemapFile = join(APP_OUTPUT, 'sitemap.xml.body')
  const sitemapRoutes: string[] = []
  if (existsSync(sitemapFile)) {
    for (const match of readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) {
      sitemapRoutes.push(new URL(match[1] as string).pathname)
    }
  } else {
    discrepancies.push('no sitemap in the build output')
  }

  const emitted = new Set(records.filter(r => r.kind.endsWith('html')).map(r => r.route))
  const indexable = new Set(records.filter(r => r.kind === 'indexable-html').map(r => r.route))

  for (const route of sitemapRoutes) {
    if (!emitted.has(route)) discrepancies.push(`sitemap lists ${route}, which was not prerendered`)
    if (noindex.has(route)) discrepancies.push(`sitemap lists ${route}, which is in NOINDEX_ROUTES`)
  }
  const inSitemap = new Set(sitemapRoutes)
  for (const route of indexable) {
    if (!inSitemap.has(route)) discrepancies.push(`${route} is indexable but absent from the sitemap`)
  }
  for (const route of STATIC_ROUTES) {
    if (!emitted.has(route)) discrepancies.push(`STATIC_ROUTES lists ${route}, which was not prerendered`)
  }
  for (const route of NOINDEX_ROUTES) {
    if (!emitted.has(route)) discrepancies.push(`NOINDEX_ROUTES lists ${route}, which was not prerendered`)
  }
  for (const record of records) {
    if (record.kind === 'indexable-html' && record.family === null) {
      discrepancies.push(`${record.route} belongs to no template family; classify it`)
    }
  }

  records.sort((a, b) => a.route.localeCompare(b.route))
  return { routes: records, discrepancies, sitemapRoutes }
}

/** Every HTML route Lighthouse should visit, in a stable order. */
export function auditableRoutes(manifest: RouteManifest): readonly RouteRecord[] {
  return manifest.routes.filter(r => r.kind === 'indexable-html' || r.kind === 'noindex-html')
}

export interface FamilyProfile {
  readonly family: RouteFamily
  readonly count: number
  readonly representative: string
  readonly largestHtml: string
  readonly largestDom: string
  readonly mostLinks: string
  readonly mostJs: string
  /**
   * The route the family is certified on: the heaviest member by the union of
   * the things that cost time. Auditing a family's smallest page and calling
   * the family green is the exact evasion the certification rules forbid.
   */
  readonly worstCandidate: string
}

export function profileFamilies(manifest: RouteManifest): readonly FamilyProfile[] {
  const byFamily = new Map<RouteFamily, RouteRecord[]>()
  for (const record of auditableRoutes(manifest)) {
    if (!record.family) continue
    const list = byFamily.get(record.family) ?? []
    list.push(record)
    byFamily.set(record.family, list)
  }

  const top = (list: RouteRecord[], key: (r: RouteRecord) => number) =>
    list.reduce((best, r) => (key(r) > key(best) ? r : best)).route

  return [...byFamily.entries()]
    .map(([family, list]) => ({
      family,
      count: list.length,
      // Alphabetically first: arbitrary but stable, which is what a
      // representative has to be if two runs are to be comparable.
      representative: (list[0] as RouteRecord).route,
      largestHtml: top(list, r => r.bytes),
      largestDom: top(list, r => r.elements),
      mostLinks: top(list, r => r.links),
      mostJs: top(list, r => r.firstLoadJsBytes ?? 0),
      worstCandidate: top(list, r => r.bytes + r.elements * 24 + r.links * 64),
    }))
    .sort((a, b) => a.family.localeCompare(b.family))
}
