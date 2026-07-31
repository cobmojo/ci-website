#!/usr/bin/env bun
/**
 * Lighthouse, over this site, under conditions that do not move between runs.
 *
 *   bun run perf:smoke        one cold run per family representative
 *   bun run perf:audit        one cold run on every HTML route, both modes
 *   bun run perf:certify      five cold runs on the worst route of every family
 *
 * Flags:
 *   --routes all|families|<comma-separated>
 *   --modes  mobile,desktop
 *   --runs   N
 *   --label  NAME               artifact subdirectory under reports/lighthouse
 *   --gate                      apply the certification rules and exit non-zero
 *   --keep-reports              write the full Lighthouse JSON for each run
 *   --base-url URL              audit a deployed origin instead of a local build
 *
 * Nothing here weakens a default. The throttling, the viewport, the storage
 * reset and the motion preference are Lighthouse's own; the only things this
 * adds are a server it has proved is serving this build, a browser it has
 * proved is not in reduced-motion, and enough repetition to tell a change from
 * the noise on a laptop.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ARTIFACT_ROOT,
  type AuditResult,
  auditRoute,
  type BrowserHandle,
  launchBrowser,
  type Mode,
  mad,
  median,
  provenance,
  type ServerHandle,
  startServedBuild,
} from './lib/lighthouse-runner'
import {
  auditableRoutes,
  buildRouteManifest,
  profileFamilies,
  type RouteRecord,
} from './lib/route-manifest'

// --- arguments -------------------------------------------------------------

function flag(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1 || index === process.argv.length - 1) return fallback
  return process.argv[index + 1]
}
const has = (name: string) => process.argv.includes(`--${name}`)

const routeSelector = flag('routes', 'families') as string
const modes = (flag('modes', 'mobile,desktop') as string).split(',').filter(Boolean) as Mode[]
const runs = Number(flag('runs', '1'))
const label = flag('label', `${routeSelector}-${runs}x`) as string
const gating = has('gate')
const keepReports = has('keep-reports')
const deployedBaseUrl = flag('base-url')?.replace(/\/+$/, '')

/**
 * The ceilings, under the standard mobile configuration.
 *
 * Maximums, not targets. A page that sits at 2,400ms of LCP has passed this and
 * has not earned a hundred; the score gate below is the one that decides.
 */
const MOBILE_CEILINGS = {
  lcp: 2500,
  tbt: 150,
  cls: 0.1,
  fcp: 1800,
  speedIndex: 3400,
} as const

// --- selection -------------------------------------------------------------

const manifest = buildRouteManifest()
const families = profileFamilies(manifest)
const allRoutes = auditableRoutes(manifest)

function selectedRoutes(): readonly RouteRecord[] {
  if (routeSelector === 'all') return allRoutes
  if (routeSelector === 'families') {
    const wanted = new Set(families.map(profile => profile.worstCandidate))
    return allRoutes.filter(record => wanted.has(record.route))
  }
  const wanted = new Set(routeSelector.split(',').map(route => route.trim()))
  const found = allRoutes.filter(record => wanted.has(record.route))
  const missing = [...wanted].filter(route => !found.some(record => record.route === route))
  if (missing.length > 0) {
    console.error(`No such route(s): ${missing.join(', ')}`)
    process.exit(1)
  }
  return found
}

const routes = selectedRoutes()

// --- run -------------------------------------------------------------------

const outputDir = join(ARTIFACT_ROOT, label)
mkdirSync(outputDir, { recursive: true })

let server: ServerHandle
let browser: BrowserHandle

if (deployedBaseUrl) {
  // A deployed origin was built elsewhere, so there is no build id to prove.
  // What is still worth proving is that it answers at all before a hundred
  // audits report the same connection error as a hundred findings.
  const probe = await fetch(`${deployedBaseUrl}/`)
  if (!probe.ok) {
    console.error(`${deployedBaseUrl} answered ${probe.status}. Nothing to audit.`)
    process.exit(1)
  }
  server = { origin: deployedBaseUrl, buildId: 'deployed', stop: () => {} }
} else {
  server = await startServedBuild()
}

try {
  browser = await launchBrowser()
} catch (error) {
  server.stop()
  throw error
}

const meta = { ...provenance(server, browser), target: deployedBaseUrl ? 'deployed' : 'local' }

console.log('Lighthouse')
console.log('==========')
console.log(`  lighthouse     ${meta.lighthouse}`)
console.log(`  chrome         ${meta.chrome}`)
console.log(`  next           ${meta.next}`)
console.log(`  commit         ${meta.commit.slice(0, 8)}${meta.dirty ? ' (dirty)' : ''}`)
console.log(`  build          ${meta.buildId}`)
console.log(`  origin         ${meta.origin}`)
console.log(`  cpu            ${meta.cpu} (${meta.cores} cores)`)
console.log(`  motion         ${meta.motionPreference}`)
console.log(`  routes         ${routes.length} x ${modes.join(',')} x ${runs}`)
console.log('')

const results: AuditResult[] = []
const started = Date.now()
let index = 0
const total = routes.length * modes.length * runs

try {
  for (const record of routes) {
    for (const mode of modes) {
      for (let run = 1; run <= runs; run += 1) {
        index += 1
        const result = await auditRoute({
          origin: server.origin,
          route: record.route,
          mode,
          run,
          browser,
          outputDir,
          keepReport: keepReports,
        })
        results.push(result)
        const m = result.metrics
        const elapsed = ((Date.now() - started) / 1000).toFixed(0)
        console.log(
          `  [${String(index).padStart(String(total).length)}/${total} ${elapsed}s] ` +
            `${mode.padEnd(7)} ${record.route.padEnd(46)} ` +
            `P${String(m.performance).padStart(3)} A${String(m.accessibility).padStart(3)} ` +
            `B${String(m.bestPractices).padStart(3)} S${String(m.seo).padStart(3)}  ` +
            `LCP ${Math.round(m.lcp)}ms TBT ${Math.round(m.tbt)}ms CLS ${m.cls.toFixed(3)}`,
        )
      }
    }
  }
} finally {
  /*
   * The server comes down even if the browser will not.
   *
   * It did not, once: chrome-launcher threw EBUSY deleting its own temporary
   * profile, the throw skipped the line below, and a `next start` from that
   * run held the benchmark port for the rest of the afternoon. Two runs later
   * the build-id guard caught it — which is the guard working, and also two
   * runs of wasted measurement.
   */
  try {
    await browser.kill()
  } finally {
    server.stop()
  }
}

// --- summarise -------------------------------------------------------------

interface RouteSummary {
  readonly route: string
  readonly family: string | null
  readonly kind: string
  readonly mode: Mode
  readonly runs: number
  readonly scores: Record<string, { median: number; min: number; max: number }>
  readonly metrics: Record<string, { median: number; mad: number; min: number; max: number }>
  readonly lcpElement: string | null
  readonly failedAudits: readonly string[]
  readonly consoleErrors: readonly string[]
}

const METRIC_KEYS = [
  'fcp',
  'lcp',
  'speedIndex',
  'tbt',
  'cls',
  'serverResponseMs',
  'mainThreadMs',
  'scriptEvalMs',
  'totalBytes',
  'scriptBytes',
  'stylesheetBytes',
  'imageBytes',
  'fontBytes',
  'documentBytes',
  'requests',
  'domElements',
  'longTasks',
] as const

const SCORE_KEYS = ['performance', 'accessibility', 'bestPractices', 'seo'] as const

const summaries: RouteSummary[] = []
for (const record of routes) {
  for (const mode of modes) {
    const group = results.filter(r => r.route === record.route && r.mode === mode)
    if (group.length === 0) continue

    const scores: RouteSummary['scores'] = {}
    for (const key of SCORE_KEYS) {
      const values = group.map(r => r.metrics[key])
      scores[key] = { median: median(values), min: Math.min(...values), max: Math.max(...values) }
    }

    const metrics: RouteSummary['metrics'] = {}
    for (const key of METRIC_KEYS) {
      const values = group
        .map(r => r.metrics[key])
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      if (values.length === 0) continue
      metrics[key] = {
        median: median(values),
        mad: mad(values),
        min: Math.min(...values),
        max: Math.max(...values),
      }
    }

    summaries.push({
      route: record.route,
      family: record.family,
      kind: record.kind,
      mode,
      runs: group.length,
      scores,
      metrics,
      lcpElement: group[0]?.metrics.lcpElement ?? null,
      failedAudits: [...new Set(group.flatMap(r => r.metrics.failedAudits))].sort(),
      consoleErrors: [...new Set(group.flatMap(r => r.metrics.consoleErrors))],
    })
  }
}

writeFileSync(
  join(outputDir, 'summary.json'),
  JSON.stringify({ meta, runs, summaries, families }, null, 2),
)

// --- report ----------------------------------------------------------------

console.log('')
console.log('Summary')
console.log('=======')
console.log(
  `  ${'route'.padEnd(46)} ${'mode'.padEnd(7)}  P   A   B   S   ` +
    `${'LCP'.padStart(6)} ${'TBT'.padStart(6)} ${'CLS'.padStart(6)} ${'FCP'.padStart(6)} ${'SI'.padStart(6)}`,
)
for (const summary of summaries) {
  const s = summary.scores
  const m = summary.metrics
  const show = (key: string, digits = 0) =>
    (m[key] ? m[key]?.median.toFixed(digits) : '-')?.padStart(6)
  console.log(
    `  ${summary.route.padEnd(46)} ${summary.mode.padEnd(7)} ` +
      `${String(s.performance?.median).padStart(3)} ${String(s.accessibility?.median).padStart(3)} ` +
      `${String(s.bestPractices?.median).padStart(3)} ${String(s.seo?.median).padStart(3)} ` +
      `${show('lcp')} ${show('tbt')} ${show('cls', 3)} ${show('fcp')} ${show('speedIndex')}`,
  )
}
console.log('')

const failing = summaries.filter(s => s.failedAudits.length > 0)
if (failing.length > 0) {
  console.log('Failing audits')
  console.log('==============')
  const byAudit = new Map<string, string[]>()
  for (const summary of failing) {
    for (const audit of summary.failedAudits) {
      const list = byAudit.get(audit) ?? []
      list.push(`${summary.route} (${summary.mode})`)
      byAudit.set(audit, list)
    }
  }
  for (const [audit, where] of [...byAudit.entries()].sort()) {
    console.log(`  ${audit}  x${where.length}`)
    for (const one of where.slice(0, 6)) console.log(`      ${one}`)
    if (where.length > 6) console.log(`      ... and ${where.length - 6} more`)
  }
  console.log('')
}

// --- gate ------------------------------------------------------------------

if (!gating) {
  console.log(`Reports in ${outputDir}`)
  process.exit(0)
}

const problems: string[] = []

for (const summary of summaries) {
  const where = `${summary.route} (${summary.mode})`
  const s = summary.scores
  const indexable = summary.kind === 'indexable-html'

  /*
   * Accessibility, best practices and SEO are deterministic: the audits behind
   * them read the DOM and the response, not a clock. A single run below a
   * hundred is a defect, not variance, so every run has to be a hundred rather
   * than the median.
   */
  if (s.accessibility?.min !== 100) problems.push(`${where}: accessibility ${s.accessibility?.min}`)
  if (s.bestPractices?.min !== 100)
    problems.push(`${where}: best practices ${s.bestPractices?.min}`)
  if (indexable && s.seo?.min !== 100) problems.push(`${where}: SEO ${s.seo?.min}`)

  /*
   * Performance is timing, so the median decides and a floor catches the tail.
   * A run at 99 is the machine; a run at 96 is the site.
   */
  if (s.performance?.median !== 100) {
    problems.push(`${where}: median performance ${s.performance?.median}`)
  }
  if (summary.runs >= 3 && (s.performance?.min ?? 0) < 99) {
    problems.push(`${where}: worst performance run ${s.performance?.min}`)
  }
  if (summary.runs < 3 && s.performance?.min !== 100) {
    problems.push(`${where}: performance ${s.performance?.min}`)
  }

  if (summary.mode === 'mobile') {
    for (const [key, ceiling] of Object.entries(MOBILE_CEILINGS)) {
      const value = summary.metrics[key]?.median
      if (value !== undefined && value > ceiling) {
        problems.push(`${where}: ${key} ${value.toFixed(key === 'cls' ? 3 : 0)} over ${ceiling}`)
      }
    }
  }

  for (const error of summary.consoleErrors) problems.push(`${where}: console error — ${error}`)
}

/*
 * A gate that measured nothing would otherwise pass. The last time a suite here
 * reported green on an empty result set it took a second sweep to notice.
 */
if (summaries.length === 0) {
  console.error('Nothing was audited. Refusing to report a pass.')
  process.exit(1)
}

if (problems.length > 0) {
  console.error(`${problems.length} gate failure(s):`)
  for (const problem of problems) console.error(`  x ${problem}`)
  console.error('')
  console.error(`Full reports in ${outputDir}`)
  process.exit(1)
}

console.log(
  `${summaries.length} route/mode pair(s), ${results.length} cold run(s): every applicable ` +
    'category at 100 and every mobile ceiling met.',
)
console.log(`Reports in ${outputDir}`)
