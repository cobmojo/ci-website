#!/usr/bin/env bun
/**
 * Internal link validation.
 *
 * Walks the built HTML and checks that every internal href resolves to a page
 * the site actually produced, and that every in-page fragment exists in the
 * document it points at. External links are reported but not fetched, so the
 * check stays fast and deterministic in CI.
 *
 * Run after `next build`.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const APP_ROOT = join(REPO_ROOT, 'apps', 'conditional-immortality')

/** Next writes prerendered HTML under .next/server/app. */
const HTML_ROOTS = [join(APP_ROOT, '.next', 'server', 'app')]

interface Page {
  readonly route: string
  readonly file: string
  readonly html: string
  readonly ids: Set<string>
}

const pages = new Map<string, Page>()
const errors: string[] = []
const externalLinks = new Set<string>()

function routeFromFile(file: string, root: string): string {
  const rel = relative(root, file).replace(/\\/g, '/')
  const withoutExt = rel.replace(/\.html$/, '')
  if (withoutExt === 'index') return '/'
  return `/${withoutExt}/`.replace(/\/+/g, '/')
}

function collectIds(html: string): Set<string> {
  const ids = new Set<string>()
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
    if (match[1]) ids.add(match[1])
  }
  for (const match of html.matchAll(/\sname="([^"]+)"/g)) {
    if (match[1]) ids.add(match[1])
  }
  return ids
}

/**
 * Ids used more than once in one document.
 *
 * The browser scrolls to the first match, so every link into a later copy lands
 * on the earlier one. The continuous edition renders forty sections that
 * deliberately share heading text, which is what `rehypePrefixIds` namespaces;
 * this checks the namespacing reached every anchor.
 */
function duplicateIds(html: string): string[] {
  const seen = new Map<string, number>()
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
    const id = match[1]
    if (id) seen.set(id, (seen.get(id) ?? 0) + 1)
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id)
}

function walk(dir: string, root: string) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      walk(path, root)
    } else if (entry.endsWith('.html')) {
      const html = readFileSync(path, 'utf8')
      const route = routeFromFile(path, root)
      pages.set(route, { route, file: relative(REPO_ROOT, path), html, ids: collectIds(html) })
    }
  }
}

for (const root of HTML_ROOTS) walk(root, root)

if (pages.size === 0) {
  console.error('No prerendered HTML found. Run `bun run build` before the link check.')
  process.exit(1)
}

/**
 * Routes that legitimately produce no prerendered HTML file.
 *
 * Route handlers emit text, JSON or images. `/search/`, `/og` and
 * `/corrections/` are rendered on demand because they read query parameters,
 * so no static file exists for them either. None of these is a broken link.
 *
 * `/corrections/` earns its place the hard way: it has to answer
 * `?submitted=1`, `?submitted=error` and `?section=S04` on the server, or a
 * reader without scripting submits a correction and is returned to a page that
 * looks untouched. Prerendering it made every one of those states invisible.
 */
const KNOWN_NON_HTML_ROUTES = new Set([
  '/search-index.json',
  '/download/transcript.txt',
  '/download/bibliography.txt',
  '/download/handout.html',
  '/sitemap.xml',
  '/robots.txt',
  '/og',
  '/api/feedback',
  '/search',
  // The site icon. `app/icon.svg` is a file convention: Next serves it and
  // writes the `<link rel="icon">` itself, with a cache-busting query it
  // generates, so there is no prerendered HTML for it and the href on every
  // page carries a hash this check cannot predict.
  '/icon.svg',
  '/corrections',
])

/** Build asset prefixes. These are emitted by the bundler, not by a route. */
const ASSET_PREFIXES = ['/_next/', '/fonts/', '/images/']

function normaliseRoute(href: string): string {
  const [pathPart] = href.split(/[?#]/)
  if (!pathPart) return '/'
  if (pathPart === '') return '/'
  return pathPart.endsWith('/') || pathPart.includes('.') ? pathPart : `${pathPart}/`
}

let internalChecked = 0

for (const page of pages.values()) {
  for (const match of page.html.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1]
    if (!href) continue

    if (/^(https?:)?\/\//.test(href)) {
      externalLinks.add(href)
      continue
    }
    if (href.startsWith('mailto:') || href.startsWith('tel:')) {
      errors.push(
        `${page.route} contains a ${href.split(':')[0]}: link, which this site must not publish.`,
      )
      continue
    }
    if (href.startsWith('data:')) continue

    // Pure fragment: must exist on this page.
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1))
      if (id && !page.ids.has(id)) {
        errors.push(`${page.route} links to #${id}, which does not exist on that page.`)
      }
      continue
    }

    if (!href.startsWith('/')) continue
    if (ASSET_PREFIXES.some(prefix => href.startsWith(prefix))) continue

    internalChecked += 1
    const route = normaliseRoute(href)

    if (KNOWN_NON_HTML_ROUTES.has(route) || KNOWN_NON_HTML_ROUTES.has(route.replace(/\/$/, ''))) {
      continue
    }

    const target = pages.get(route)
    if (!target) {
      errors.push(`${page.route} links to ${href}, which was not generated.`)
      continue
    }

    const hashIndex = href.indexOf('#')
    if (hashIndex !== -1) {
      const fragment = decodeURIComponent(href.slice(hashIndex + 1))
      if (fragment && !target.ids.has(fragment)) {
        errors.push(`${page.route} links to ${href}, but #${fragment} does not exist on ${route}.`)
      }
    }
  }
}

/* No page may use the same id twice. */
let duplicateCount = 0
for (const page of pages.values()) {
  const duplicates = duplicateIds(page.html)
  duplicateCount += duplicates.length
  for (const id of duplicates.slice(0, 10)) {
    errors.push(`${page.route} uses id="${id}" more than once, so links to it land on the first.`)
  }
  if (duplicates.length > 10) {
    errors.push(`${page.route} has ${duplicates.length - 10} further duplicated ids.`)
  }
}

/* Every canonical route should be reachable from somewhere. */
const linked = new Set<string>()
for (const page of pages.values()) {
  for (const match of page.html.matchAll(/\shref="(\/[^"]*)"/g)) {
    if (match[1]) linked.add(normaliseRoute(match[1]))
  }
}
/*
 * `/_not-found/` and `/_global-error/` are Next's own error documents. They are
 * reached by failing to find something, never by a link, so a link to either
 * would be the defect. Everything else that no page points at is unreachable
 * by a reader and uncrawlable by anything that does not read the sitemap.
 */
const NOT_LINKED_BY_DESIGN = (route: string) => route.startsWith('/_')

const orphans = [...pages.keys()].filter(
  route => route !== '/' && !NOT_LINKED_BY_DESIGN(route) && !linked.has(route),
)

console.log('Link check')
console.log('==========')
console.log(`  pages            ${pages.size}`)
console.log(`  internal links   ${internalChecked}`)
console.log(`  external links   ${externalLinks.size} (not fetched)`)
console.log(`  orphan pages     ${orphans.length}`)
console.log(`  duplicated ids   ${duplicateCount}`)
console.log('')

/*
 * An orphan is an error, not a note.
 *
 * This used to print the list and exit zero, which meant a page could stop
 * being linked from anywhere and every gate would stay green. A page nothing
 * links to is one a reader cannot reach by reading, and one that a crawler
 * only ever sees because the sitemap names it — no context, no anchor text,
 * and nothing saying what it is for.
 */
for (const orphan of orphans) {
  errors.push(`${orphan} is linked from no other page, so nothing but the sitemap can find it.`)
}

if (errors.length > 0) {
  console.error(`${errors.length} broken link(s):`)
  for (const error of errors.slice(0, 60)) console.error(`  x ${error}`)
  if (errors.length > 60) console.error(`  … and ${errors.length - 60} more`)
  process.exit(1)
}

console.log('All internal links and fragments resolve.')
