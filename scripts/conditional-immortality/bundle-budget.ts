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
 *
 * Expressed as bytes *over the median*, not as an absolute number. What the
 * allowance is really describing is the weight of one route's extra machinery,
 * and that is a difference; the baseline underneath it moves whenever the
 * framework does. An absolute cap has to be edited every time something is
 * added to every route — adding `error.tsx` moved every route up 3.9 kB and
 * broke this check without anything on `/corrections` changing at all — and
 * each of those edits is indistinguishable from quietly widening the budget.
 */
const ALLOWANCES: Record<string, { readonly overMedianBytes: number; readonly reason: string }> = {
  '/corrections': {
    overMedianBytes: 82_000,
    reason:
      'TanStack Form: per-field validators, touched state and submit handling for nine fields, ' +
      'on a form that is progressively enhanced and works with scripting disabled. ' +
      'Measured at 76 kB over the median, held at 82. The print-disclosure handler that every ' +
      'route now carries needed no increase here, which is the whole argument for expressing ' +
      'this as a difference: it moved the median and the allowance with it.',
  },
}

/**
 * The most any route may carry, full stop.
 *
 * The relative check catches one route drifting away from its neighbours, and
 * is blind to the case where they all drift together: the median rises with
 * them and nothing fails. This is the floor under that. Set from the measured
 * baseline with room for a framework upgrade, and low enough that a dependency
 * arriving in the shared graph is a conversation rather than a surprise.
 *
 * Lowered from 700,000 when the search engine and its result list moved behind
 * the intent trigger that already fetches the index, which took 33,480 bytes
 * off every route. The headroom over the heaviest route is the 15.4 kB it was
 * originally given; the point of moving it down is that a win this size cannot
 * be given back silently.
 */
const ABSOLUTE_CEILING_BYTES = 666_000

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

const allowanceFor = (route: string) => {
  const allowance = ALLOWANCES[route]
  return allowance ? median + allowance.overMedianBytes : ceiling
}
const budgetFor = (route: string) => Math.min(allowanceFor(route), ABSOLUTE_CEILING_BYTES)

const offenders = routes
  .filter(entry => entry.firstLoadUncompressedJsBytes > budgetFor(entry.route))
  .sort((a, b) => b.firstLoadUncompressedJsBytes - a.firstLoadUncompressedJsBytes)

console.log('First-load JS budget')
console.log('====================')
console.log(`  routes         ${routes.length}`)
console.log(`  median         ${kb(median)}`)
console.log(`  ceiling        ${kb(ceiling)} (median +${Math.round(ALLOWED_EXCESS * 100)}%)`)
console.log(`  largest        ${kb(sizes[sizes.length - 1] ?? 0)}`)
console.log(`  hard ceiling   ${kb(ABSOLUTE_CEILING_BYTES)} (absolute, for any route)`)
console.log('')

for (const [route, allowance] of Object.entries(ALLOWANCES)) {
  const entry = routes.find(candidate => candidate.route === route)
  if (!entry) {
    console.error(`Allowance for ${route}, which no longer exists. Remove it.`)
    process.exit(1)
  }
  console.log(`  allowance      ${route} up to median + ${kb(allowance.overMedianBytes)}`)
  console.log(
    `                 = ${kb(budgetFor(route))}, currently ` +
      `${kb(entry.firstLoadUncompressedJsBytes)} ` +
      `(${kb(entry.firstLoadUncompressedJsBytes - median)} over median)`,
  )
  console.log(`                 ${allowance.reason}`)
  console.log('')
}

const overCeiling = routes.filter(
  entry => entry.firstLoadUncompressedJsBytes > ABSOLUTE_CEILING_BYTES,
)
if (overCeiling.length > 0) {
  console.error(
    `${overCeiling.length} route(s) over the absolute ceiling of ${kb(ABSOLUTE_CEILING_BYTES)}:`,
  )
  for (const entry of overCeiling) {
    console.error(`  x ${entry.route}: ${kb(entry.firstLoadUncompressedJsBytes)}`)
  }
  console.error('')
  console.error('The relative budget cannot see growth that every route shares:')
  console.error('the median rises with it. This is the floor under that, and it')
  console.error('is not raised without deciding that the site should be heavier.')
  process.exit(1)
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
