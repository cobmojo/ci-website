#!/usr/bin/env bun
/**
 * The indexability matrix: what every route says about itself, on the wire.
 *
 * `seo.spec.ts` asserts the rules a page must satisfy. This answers the other
 * question — what does each of the hundred and twenty-one routes actually
 * claim — and writes it out as a table somebody can read, because a rule that
 * passes tells you nothing about the shape of the site.
 *
 * The checks here are the ones that need the whole set at once, or the wire:
 *
 *   - a title or description that is unique nowhere else on the site;
 *   - an internal link to a redirect *source* when the destination is known,
 *     which costs every reader a round trip and every crawler a hop;
 *   - a redirect chain;
 *   - a heading structure with no `h1`, or more than one;
 *   - an image with no alt attribute at all, as distinct from a decorative
 *     empty one;
 *   - `X-Robots-Tag` and the meta robots directive disagreeing.
 *
 * Run after `next build`. Starts and stops its own server.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ARTIFACT_ROOT, startServedBuild } from './lib/lighthouse-runner'
import { auditableRoutes, buildRouteManifest, REPO_ROOT } from './lib/route-manifest'

const manifest = buildRouteManifest()
const routes = auditableRoutes(manifest)
const sitemap = manifest.sitemapRoutes
const redirectSources = new Map(
  manifest.routes
    .filter(record => record.kind === 'redirect-source')
    .map(record => [record.route, record.destination as string]),
)

interface Row {
  readonly route: string
  readonly kind: string
  readonly status: number
  readonly robotsMeta: string
  readonly xRobotsTag: string
  readonly canonical: string
  readonly inSitemap: number
  readonly title: string
  readonly description: string
  readonly h1: readonly string[]
  readonly jsonLdTypes: readonly string[]
  readonly breadcrumb: boolean
  readonly internalLinks: number
  readonly imagesWithoutAlt: number
}

const server = await startServedBuild()
const problems: string[] = []
const rows: Row[] = []

function one(html: string, pattern: RegExp): string {
  const match = html.match(pattern)
  return match?.[1]?.trim() ?? ''
}

function all(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map(match => (match[1] ?? '').trim())
}

/** Strip tags and collapse whitespace, so an `<h1>` with a span reads as text. */
const text = (raw: string) =>
  raw
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

try {
  for (const record of routes) {
    const response = await fetch(`${server.origin}${record.route}`, { redirect: 'manual' })
    const html = await response.text()

    const canonicals = all(html, /<link rel="canonical" href="([^"]*)"/g)
    if (canonicals.length !== 1) {
      problems.push(`${record.route}: ${canonicals.length} canonical tags, expected exactly 1`)
    }

    const jsonLdTypes: string[] = []
    for (const block of all(
      html,
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    )) {
      try {
        const parsed = JSON.parse(block) as unknown
        for (const node of Array.isArray(parsed) ? parsed : [parsed]) {
          const type = (node as { '@type'?: string })['@type']
          if (type) jsonLdTypes.push(type)
        }
      } catch {
        problems.push(`${record.route}: a JSON-LD block does not parse`)
      }
    }

    const h1 = all(html, /<h1[^>]*>([\s\S]*?)<\/h1>/g).map(text)
    const internalHrefs = all(html, /<a\s[^>]*href="(\/[^"]*)"/g)

    // `<img>` with no `alt` attribute at all. An empty `alt=""` is the correct
    // way to mark an image decorative and is not counted.
    const imagesWithoutAlt = (html.match(/<img\b(?![^>]*\salt=)[^>]*>/g) ?? []).length

    for (const href of internalHrefs) {
      const path = href.split('#')[0]?.split('?')[0] ?? ''
      const bare = path.replace(/\/$/, '')
      if (redirectSources.has(bare) || redirectSources.has(path)) {
        problems.push(
          `${record.route}: links to ${path}, which is a redirect source; ` +
            `link to ${redirectSources.get(bare) ?? redirectSources.get(path)} instead`,
        )
      }
    }

    rows.push({
      route: record.route,
      kind: record.kind,
      status: response.status,
      robotsMeta: one(html, /<meta name="robots" content="([^"]*)"/),
      xRobotsTag: response.headers.get('x-robots-tag') ?? '',
      canonical: canonicals[0] ?? '',
      inSitemap: sitemap.filter(entry => entry === record.route).length,
      title: text(one(html, /<title>([\s\S]*?)<\/title>/)),
      description: one(html, /<meta name="description" content="([^"]*)"/),
      h1,
      jsonLdTypes,
      breadcrumb: jsonLdTypes.includes('BreadcrumbList'),
      internalLinks: internalHrefs.length,
      imagesWithoutAlt,
    })
  }

  // --- redirects, on the wire ----------------------------------------------

  /*
   * Every alias is followed to the end, not one hop.
   *
   * `trailingSlash: true` makes Next emit its own normalisation redirect, and
   * `routes-manifest.json` lists that rule *before* the site's aliases, so a
   * shared link without a trailing slash costs two hops: `/annihilationism` →
   * `/annihilationism/` → `/topics/annihilationism/`. Both are 308 and the
   * destination is a 200, so nothing is broken and no equity is lost; the
   * alternative is an edge function in front of a static site for the sake of
   * twenty-one vanity URLs. What has to hold is that the chain is short, every
   * hop is permanent, and it ends where the table says.
   */
  const MAX_HOPS = 2
  for (const [source, destination] of redirectSources) {
    const chain: string[] = []
    let url = source
    let status = 0
    for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
      const response = await fetch(`${server.origin}${url}`, { redirect: 'manual' })
      status = response.status
      if (status === 200) break
      if (status !== 301 && status !== 308) {
        problems.push(`${source}: ${url} answered ${status}, which is not a permanent redirect`)
        break
      }
      const location = response.headers.get('location') ?? ''
      url = location.startsWith('http') ? new URL(location).pathname : location
      chain.push(url)
    }
    if (status !== 200) {
      problems.push(
        `${source}: ${[source, ...chain].join(' -> ')} did not reach a page within ${MAX_HOPS} hops`,
      )
      continue
    }
    if (url !== destination) {
      problems.push(`${source}: ends at ${url}, the redirect table says ${destination}`)
    }
    if (chain.length > MAX_HOPS) {
      problems.push(`${source}: ${chain.length} hops — ${[source, ...chain].join(' -> ')}`)
    }
  }

  // --- the sitemap, on the wire --------------------------------------------

  for (const route of sitemap) {
    const response = await fetch(`${server.origin}${route}`, { redirect: 'manual' })
    if (response.status !== 200) {
      problems.push(`sitemap lists ${route}, which answered ${response.status}`)
    }
  }
} finally {
  server.stop()
}

// --- whole-set checks ------------------------------------------------------

const indexable = rows.filter(row => row.kind === 'indexable-html')

for (const row of rows) {
  const noindexIntended = row.kind === 'noindex-html'
  const saysNoindex = row.robotsMeta.includes('noindex')
  const headerSaysNoindex = row.xRobotsTag.includes('noindex')

  if (row.status !== 200) problems.push(`${row.route}: answered ${row.status}`)
  if (noindexIntended && !saysNoindex) problems.push(`${row.route}: should be noindex and is not`)
  if (!noindexIntended && saysNoindex) problems.push(`${row.route}: carries an unintended noindex`)
  if (noindexIntended && !row.robotsMeta.includes('follow')) {
    problems.push(`${row.route}: noindex without follow, so its outbound links are wasted`)
  }
  if (saysNoindex !== headerSaysNoindex && row.xRobotsTag !== '') {
    problems.push(
      `${row.route}: meta robots says "${row.robotsMeta}" and X-Robots-Tag says "${row.xRobotsTag}"`,
    )
  }
  if (row.h1.length !== 1) problems.push(`${row.route}: ${row.h1.length} h1 elements, expected 1`)
  if (row.title === '') problems.push(`${row.route}: no title`)
  if (row.description === '') problems.push(`${row.route}: no meta description`)
  if (row.imagesWithoutAlt > 0) {
    problems.push(`${row.route}: ${row.imagesWithoutAlt} img element(s) with no alt attribute`)
  }
}

for (const row of indexable) {
  if (row.inSitemap !== 1) {
    problems.push(`${row.route}: appears ${row.inSitemap} time(s) in the sitemap, expected 1`)
  }
}
for (const row of rows.filter(candidate => candidate.kind === 'noindex-html')) {
  if (row.inSitemap !== 0) problems.push(`${row.route}: noindex but listed in the sitemap`)
}

function duplicates(field: 'title' | 'description'): string[] {
  const byValue = new Map<string, string[]>()
  for (const row of indexable) {
    const list = byValue.get(row[field]) ?? []
    list.push(row.route)
    byValue.set(row[field], list)
  }
  return [...byValue.entries()]
    .filter(([, where]) => where.length > 1)
    .map(
      ([value, where]) =>
        `${field} shared by ${where.length} routes: ${where.join(', ')} — "${value.slice(0, 70)}"`,
    )
}
problems.push(...duplicates('title'), ...duplicates('description'))

// --- output ----------------------------------------------------------------

const outputDir = join(ARTIFACT_ROOT, '..', 'seo')
mkdirSync(outputDir, { recursive: true })
writeFileSync(join(outputDir, 'indexability-matrix.json'), JSON.stringify(rows, null, 2))

const tsv = [
  [
    'route',
    'kind',
    'status',
    'robots',
    'x-robots-tag',
    'canonical',
    'sitemap',
    'h1',
    'jsonld',
    'links',
    'title',
  ].join('\t'),
  ...rows.map(row =>
    [
      row.route,
      row.kind,
      row.status,
      row.robotsMeta || '-',
      row.xRobotsTag || '-',
      row.canonical,
      row.inSitemap,
      row.h1.length,
      row.jsonLdTypes.join('+') || '-',
      row.internalLinks,
      row.title,
    ].join('\t'),
  ),
].join('\n')
writeFileSync(join(outputDir, 'indexability-matrix.tsv'), tsv)

console.log('Indexability matrix')
console.log('===================')
console.log(`  routes           ${rows.length}`)
console.log(`  indexable        ${indexable.length}`)
console.log(`  deliberately not ${rows.length - indexable.length}`)
console.log(`  sitemap entries  ${sitemap.length}`)
console.log(`  redirect sources ${redirectSources.size}`)
console.log(`  distinct titles  ${new Set(indexable.map(row => row.title)).size}`)
console.log(`  distinct descs   ${new Set(indexable.map(row => row.description)).size}`)
console.log(
  `  breadcrumbs      ${rows.filter(row => row.breadcrumb).length} of ${rows.length} pages`,
)
console.log(
  `  written to       ${join(outputDir, 'indexability-matrix.tsv').slice(REPO_ROOT.length + 1)}`,
)
console.log('')

if (problems.length > 0) {
  console.error(`${problems.length} indexability problem(s):`)
  for (const problem of problems) console.error(`  x ${problem}`)
  process.exit(1)
}

console.log('Every route says the same thing about itself in the markup, the headers,')
console.log('the sitemap and the link graph.')
