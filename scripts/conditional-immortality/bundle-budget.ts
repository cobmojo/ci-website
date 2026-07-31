#!/usr/bin/env bun
/**
 * First-load JavaScript budget.
 *
 * Every page is prerendered and the script only enhances what is already there,
 * so a route shipping materially more than its neighbours is usually an accident
 * of module structure. Relative rather than absolute: the framework baseline
 * moves on every React or Next upgrade, but the routes should differ in content,
 * not in machinery.
 *
 * Run after `next build`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const STATS_FILE = join(
  REPO_ROOT,
  'apps',
  'conditional-immortality',
  '.next',
  'diagnostics',
  'route-bundle-stats.json',
)

/**
 * How far above the median an ordinary route may sit.
 *
 * Every route except one lands within a few kilobytes of the median, because
 * they all carry the same machinery and differ only in prerendered content.
 */
const ALLOWED_EXCESS = 0.03

/**
 * Routes allowed to carry more, each with a reason and a cap of its own. Raising
 * the global threshold instead would let every route drift up to meet it.
 */
const ALLOWANCES: Record<string, { readonly maxBytes: number; readonly reason: string }> = {
  '/corrections': {
    maxBytes: 681_000,
    reason:
      'TanStack Form: per-field validators, touched state and submit handling for nine fields, ' +
      'on a form that is progressively enhanced and works with scripting disabled. ' +
      'Raised by 1kB for the print-disclosure handler in the root layout, which every route ' +
      'carries: Firefox declines `content-visibility` on `::details-content`, so without it a ' +
      'collapsed disclosure prints as its summary and nothing else. 585 bytes of that kB are ' +
      'spent; the rest is not headroom to spend, it is the next increase having to be argued ' +
      'for as this one was.',
  },
}

interface RouteStats {
  readonly route: string
  readonly firstLoadUncompressedJsBytes: number
}

if (!existsSync(STATS_FILE)) {
  console.error(`No route bundle stats at ${STATS_FILE}.`)
  console.error('Run `bun run build` before the bundle budget check.')
  process.exit(1)
}

const raw: unknown = JSON.parse(readFileSync(STATS_FILE, 'utf8'))
const routes: RouteStats[] = (Array.isArray(raw) ? raw : Object.values(raw as object)).filter(
  (entry): entry is RouteStats =>
    typeof entry === 'object' &&
    entry !== null &&
    typeof (entry as RouteStats).route === 'string' &&
    typeof (entry as RouteStats).firstLoadUncompressedJsBytes === 'number',
)

if (routes.length === 0) {
  console.error('The bundle stats file contained no routes. Refusing to report success.')
  process.exit(1)
}

const sizes = routes.map(entry => entry.firstLoadUncompressedJsBytes).sort((a, b) => a - b)
const median = sizes[Math.floor(sizes.length / 2)] ?? 0
const ceiling = Math.round(median * (1 + ALLOWED_EXCESS))

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} kB`

const budgetFor = (route: string) => ALLOWANCES[route]?.maxBytes ?? ceiling

const offenders = routes
  .filter(entry => entry.firstLoadUncompressedJsBytes > budgetFor(entry.route))
  .sort((a, b) => b.firstLoadUncompressedJsBytes - a.firstLoadUncompressedJsBytes)

console.log('First-load JS budget')
console.log('====================')
console.log(`  routes         ${routes.length}`)
console.log(`  median         ${kb(median)}`)
console.log(`  ceiling        ${kb(ceiling)} (median +${Math.round(ALLOWED_EXCESS * 100)}%)`)
console.log(`  largest        ${kb(sizes[sizes.length - 1] ?? 0)}`)
console.log('')

for (const [route, allowance] of Object.entries(ALLOWANCES)) {
  const entry = routes.find(candidate => candidate.route === route)
  if (!entry) {
    console.error(`Allowance for ${route}, which no longer exists. Remove it.`)
    process.exit(1)
  }
  console.log(`  allowance      ${route} up to ${kb(allowance.maxBytes)}`)
  console.log(`                 currently ${kb(entry.firstLoadUncompressedJsBytes)}`)
  console.log(`                 ${allowance.reason}`)
  console.log('')
}

if (offenders.length > 0) {
  console.error(`${offenders.length} route(s) over budget:`)
  for (const entry of offenders) {
    console.error(
      `  x ${entry.route}: ${kb(entry.firstLoadUncompressedJsBytes)}, ` +
        `budget ${kb(budgetFor(entry.route))}`,
    )
  }
  console.error('')
  console.error('A route carrying much more script than its neighbours usually means a')
  console.error('client component imported a barrel module and pulled its whole graph in.')
  console.error('Check which chunk is unique to the route in .next/diagnostics/')
  console.error('route-bundle-stats.json before widening any budget.')
  process.exit(1)
}

console.log('Every route is within its budget.')
