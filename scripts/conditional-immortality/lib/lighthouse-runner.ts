/**
 * The measurement instrument.
 *
 * One place that owns the production server, the browser, the Lighthouse
 * version and the shape of a result, so that two numbers from two different
 * days are comparable. Everything that could quietly change a score — the
 * throttling, the viewport, the motion preference, which build is being served
 * — is either fixed here or recorded in the result and checked.
 *
 * Three things this deliberately refuses to do:
 *
 *   - run against `next dev`, which renders different markup and ships an
 *     error overlay;
 *   - run against a server it has not proved is serving the build on disk,
 *     which is the failure that produced nine false findings the last time a
 *     suite here assumed a port;
 *   - certify under `prefers-reduced-motion: reduce`, which would measure a
 *     site no reader gets. Headless Chrome has answered `reduce` by default
 *     before now, so it is asserted rather than assumed.
 */
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import os from 'node:os'
import { join } from 'node:path'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { APP_ROOT, NEXT_DIR, REPO_ROOT } from './route-manifest'

export type Mode = 'mobile' | 'desktop'

export const ARTIFACT_ROOT = join(REPO_ROOT, 'reports', 'lighthouse')

/**
 * Not 3210 (`next dev`) and not 3211 (Playwright). A benchmark that is answered
 * by another checkout's server produces numbers about somebody else's code, and
 * nothing in the output would say so.
 */
export const DEFAULT_PORT = Number(process.env.LIGHTHOUSE_PORT ?? 3219)

// --- the served build ------------------------------------------------------

export interface ServerHandle {
  readonly origin: string
  readonly buildId: string
  stop(): void
}

function localBuildId(): string {
  return readFileSync(join(NEXT_DIR, 'BUILD_ID'), 'utf8').trim()
}

async function waitForServer(origin: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastError = 'never answered'
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/`, { redirect: 'manual' })
      if (response.status === 200) return
      lastError = `answered ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await new Promise(resolve => setTimeout(resolve, 400))
  }
  throw new Error(`${origin} did not come up within ${timeoutMs}ms (${lastError})`)
}

/**
 * Start `next start` on a port of our own and prove it is this build.
 *
 * The proof is the point. `next start` loads its manifest once at boot, so a
 * server that was already running serves whatever was built when it started —
 * which is how a benchmark ends up describing a build that no longer exists.
 */
export async function startServedBuild(port = DEFAULT_PORT): Promise<ServerHandle> {
  if (!existsSync(join(NEXT_DIR, 'BUILD_ID'))) {
    throw new Error(`No build at ${NEXT_DIR}. Run \`bun run build\` first.`)
  }
  /*
   * Say so now rather than in two minutes. A held port used to surface as a
   * start-up timeout, which reads like the build being slow rather than like an
   * orphaned server from a killed run — and an orphan on a Windows box outlives
   * the terminal that made it.
   */
  await new Promise<void>((resolve, reject) => {
    const probe = createServer()
    probe.once('error', (error: NodeJS.ErrnoException) =>
      reject(
        new Error(
          error.code === 'EADDRINUSE'
            ? `Port ${port} is already in use. Something else — very likely an orphaned ` +
                `\`next start\` from a killed run — is holding it. Stop it, or set ` +
                `LIGHTHOUSE_PORT to a free port.`
            : `Could not test port ${port}: ${error.message}`,
        ),
      ),
    )
    probe.once('listening', () => probe.close(() => resolve()))
    probe.listen(port, '127.0.0.1')
  })
  const buildId = localBuildId()
  const origin = `http://localhost:${port}`

  const child = spawn('bunx', ['next', 'start', '--port', String(port)], {
    cwd: APP_ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      /*
       * `next.config.ts` resolves the canonical origin every time the server
       * boots, not only at build time, so the value the build was made with
       * has to be present here too. Without it `next start` prints "Ready" and
       * then fails to load its config, and the only symptom is a port that
       * never answers.
       */
      NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL
        ? undefined
        : (process.env.NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL ?? '1'),
      /*
       * No audit here submits a correction, and none should: the write path is
       * the one part of this site with side effects. `memory` is refused in
       * production by name, so the endpoint disables itself and answers 503 —
       * which is the correct behaviour for a benchmark server and guarantees a
       * stray POST cannot reach a real store.
       */
      FEEDBACK_STORE: 'memory',
    },
    stdio: 'ignore',
    shell: process.platform === 'win32',
  })

  const stop = () => {
    if (child.pid === undefined) return
    if (process.platform === 'win32') {
      // `child.kill()` reaches the shell, not `next start` under it.
      try {
        execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      } catch {
        /* already gone */
      }
    } else {
      child.kill('SIGTERM')
    }
  }

  try {
    await waitForServer(origin, 120_000)
  } catch (error) {
    stop()
    throw error
  }

  const html = await (await fetch(`${origin}/`)).text()
  if (!html.includes(buildId)) {
    stop()
    throw new Error(
      `${origin} is not serving the build in .next (${buildId}). Another process is ` +
        `holding the port. Set LIGHTHOUSE_PORT to something free and run again.`,
    )
  }

  return { origin, buildId, stop }
}

// --- the browser -----------------------------------------------------------

/**
 * A minimal DevTools client, for the one question Lighthouse cannot answer.
 *
 * Lighthouse never sets the motion preference, so whether the run happens under
 * `no-preference` is a property of the browser, not of the configuration. It has
 * to be read out of a live page, and reading one value does not justify a
 * Puppeteer dependency.
 */
async function evaluateInFreshTab(devtoolsPort: number, expression: string): Promise<unknown> {
  const target = (await (
    await fetch(`http://127.0.0.1:${devtoolsPort}/json/new?about:blank`, { method: 'PUT' })
  ).json()) as { webSocketDebuggerUrl: string; id: string }

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  try {
    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve()
      socket.onerror = () => reject(new Error('could not attach to the browser'))
    })
    const result = await new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('the browser did not answer')), 10_000)
      socket.onmessage = event => {
        const message = JSON.parse(String(event.data)) as {
          id?: number
          result?: { result?: { value?: unknown } }
        }
        if (message.id !== 1) return
        clearTimeout(timer)
        resolve(message.result?.result?.value)
      }
      socket.send(
        JSON.stringify({
          id: 1,
          method: 'Runtime.evaluate',
          params: { expression, returnByValue: true },
        }),
      )
    })
    return result
  } finally {
    socket.close()
    await fetch(`http://127.0.0.1:${devtoolsPort}/json/close/${target.id}`).catch(() => {})
  }
}

export interface BrowserHandle {
  readonly port: number
  readonly version: string
  readonly executable: string
  kill(): Promise<void>
}

export async function launchBrowser(): Promise<BrowserHandle> {
  const chrome = await chromeLauncher.launch({
    // `--headless` and nothing that changes how the page renders or how fast it
    // does. No `--disable-gpu`, no `--disable-dev-shm-usage`, no resource
    // blocking: a flag that makes the site cheaper to draw makes the score a
    // measurement of the flag.
    chromeFlags: ['--headless'],
  })

  const versionInfo = (await (
    await fetch(`http://127.0.0.1:${chrome.port}/json/version`)
  ).json()) as { Browser: string }

  const reduced = await evaluateInFreshTab(
    chrome.port,
    "matchMedia('(prefers-reduced-motion: reduce)').matches",
  )
  if (reduced === true) {
    await chrome.kill()
    throw new Error(
      'This browser reports prefers-reduced-motion: reduce. Certifying under it would ' +
        'measure a site with the Tier 2, 3 and 4 animations removed, which is not what a ' +
        'reader gets. Refusing to run.',
    )
  }

  return {
    port: chrome.port,
    version: versionInfo.Browser,
    executable: chrome.process?.spawnfile ?? 'unknown',
    kill: async () => {
      try {
        await chrome.kill()
      } catch (error) {
        /*
         * chrome-launcher deletes its temporary profile directory immediately
         * after killing the process. On Windows the handles are still open for
         * a moment, so the delete throws EBUSY and takes the whole run down
         * with it — after every audit has already completed. The browser is
         * dead either way; the leftover directory is the operating system's to
         * reap.
         */
        const code = (error as NodeJS.ErrnoException).code
        if (code !== 'EBUSY' && code !== 'ENOTEMPTY' && code !== 'EPERM') throw error
      }
    },
  }
}

// --- one audit -------------------------------------------------------------

export interface Metrics {
  readonly performance: number
  readonly accessibility: number
  readonly bestPractices: number
  readonly seo: number
  readonly fcp: number
  readonly lcp: number
  readonly speedIndex: number
  readonly tbt: number
  readonly cls: number
  readonly tti: number
  readonly serverResponseMs: number | null
  readonly mainThreadMs: number | null
  readonly scriptEvalMs: number | null
  readonly totalBytes: number | null
  readonly scriptBytes: number | null
  readonly stylesheetBytes: number | null
  readonly imageBytes: number | null
  readonly fontBytes: number | null
  readonly documentBytes: number | null
  readonly requests: number | null
  readonly domElements: number | null
  readonly longTasks: number | null
  readonly lcpElement: string | null
  readonly lcpPhases: Readonly<Record<string, number>> | null
  readonly failedAudits: readonly string[]
  readonly consoleErrors: readonly string[]
  /**
   * Lighthouse could not measure the page at all.
   *
   * Without this a run that failed to load reports a performance score of
   * zero, which is indistinguishable in a summary table from a page that is
   * catastrophically slow. Five audits in the first whole-site sweep came back
   * as zeros and it took a second run to find out why, because the reports had
   * not been kept. A run that measured nothing has to say so.
   */
  readonly runtimeError: string | null
}

export interface AuditResult {
  readonly route: string
  readonly mode: Mode
  readonly run: number
  readonly lighthouseVersion: string
  readonly benchmarkIndex: number
  readonly fetchTime: string
  readonly metrics: Metrics
  readonly reportPath: string
}

const SCORE_KEYS = {
  performance: 'performance',
  accessibility: 'accessibility',
  bestPractices: 'best-practices',
  seo: 'seo',
} as const

type LhrAudit = {
  score: number | null
  scoreDisplayMode: string
  numericValue?: number
  displayValue?: string
  details?: Record<string, unknown>
}
type Lhr = {
  lighthouseVersion: string
  fetchTime: string
  runtimeError?: { code: string; message: string }
  runWarnings?: string[]
  environment: { benchmarkIndex: number; hostUserAgent: string }
  categories: Record<string, { score: number | null }>
  audits: Record<string, LhrAudit>
}

function numeric(lhr: Lhr, id: string): number {
  return lhr.audits[id]?.numericValue ?? Number.NaN
}

function tableItems(audit: LhrAudit | undefined): ReadonlyArray<Record<string, unknown>> {
  const items = (audit?.details as { items?: unknown } | undefined)?.items
  return Array.isArray(items) ? (items as Array<Record<string, unknown>>) : []
}

/** Bytes by resource type, from the request log rather than a summary audit. */
function byteBreakdown(lhr: Lhr): {
  total: number | null
  byType: Record<string, number>
  requests: number | null
} {
  const items = tableItems(lhr.audits['network-requests'])
  if (items.length === 0) return { total: null, byType: {}, requests: null }
  const byType: Record<string, number> = {}
  let total = 0
  for (const item of items) {
    const size = Number(item.transferSize ?? 0)
    const type = String(item.resourceType ?? 'Other')
    byType[type] = (byType[type] ?? 0) + size
    total += size
  }
  return { total, byType, requests: items.length }
}

function extract(lhr: Lhr): Metrics {
  const score = (key: keyof typeof SCORE_KEYS) =>
    Math.round((lhr.categories[SCORE_KEYS[key]]?.score ?? 0) * 100)

  const bytes = byteBreakdown(lhr)

  const lcpElementItems = tableItems(lhr.audits['largest-contentful-paint-element'])
  const firstNode = lcpElementItems.find(item => 'node' in item)?.node as
    | { snippet?: string; nodeLabel?: string }
    | undefined

  // The LCP phase table lives in a sub-table on the element audit and, in
  // Lighthouse 13, also as an insight. Read whichever is present.
  const phaseRows = [
    ...(lcpElementItems.flatMap(item => tableItems({ details: item } as LhrAudit)) ?? []),
    ...tableItems(lhr.audits['lcp-breakdown-insight']),
    ...tableItems(lhr.audits['lcp-phases-insight']),
  ]
  const lcpPhases: Record<string, number> = {}
  for (const row of phaseRows) {
    const label = row.phase ?? row.label ?? row.name
    const value = row.timing ?? row.duration ?? row.value
    if (typeof label === 'string' && typeof value === 'number') lcpPhases[label] = value
  }

  const failedAudits = Object.entries(lhr.audits)
    .filter(
      ([, audit]) =>
        audit.score !== null &&
        audit.score < 1 &&
        audit.scoreDisplayMode !== 'informative' &&
        audit.scoreDisplayMode !== 'notApplicable' &&
        audit.scoreDisplayMode !== 'manual',
    )
    .map(([id]) => id)
    .sort()

  const consoleErrors = tableItems(lhr.audits['errors-in-console'])
    .map(item => String(item.description ?? item.source ?? ''))
    .filter(Boolean)

  const mainThread = tableItems(lhr.audits['mainthread-work-breakdown'])
  const mainThreadMs = mainThread.length
    ? mainThread.reduce((sum, item) => sum + Number(item.duration ?? 0), 0)
    : (lhr.audits['mainthread-work-breakdown']?.numericValue ?? null)

  return {
    performance: score('performance'),
    accessibility: score('accessibility'),
    bestPractices: score('bestPractices'),
    seo: score('seo'),
    fcp: numeric(lhr, 'first-contentful-paint'),
    lcp: numeric(lhr, 'largest-contentful-paint'),
    speedIndex: numeric(lhr, 'speed-index'),
    tbt: numeric(lhr, 'total-blocking-time'),
    cls: numeric(lhr, 'cumulative-layout-shift'),
    tti: numeric(lhr, 'interactive'),
    serverResponseMs: lhr.audits['server-response-time']?.numericValue ?? null,
    mainThreadMs,
    scriptEvalMs: lhr.audits['bootup-time']?.numericValue ?? null,
    totalBytes: bytes.total,
    scriptBytes: bytes.byType.Script ?? null,
    stylesheetBytes: bytes.byType.Stylesheet ?? null,
    imageBytes: bytes.byType.Image ?? null,
    fontBytes: bytes.byType.Font ?? null,
    documentBytes: bytes.byType.Document ?? null,
    requests: bytes.requests,
    domElements: lhr.audits['dom-size']?.numericValue ?? null,
    longTasks: tableItems(lhr.audits['long-tasks']).length,
    lcpElement: firstNode?.snippet ?? firstNode?.nodeLabel ?? null,
    lcpPhases: Object.keys(lcpPhases).length ? lcpPhases : null,
    failedAudits,
    consoleErrors,
    runtimeError: lhr.runtimeError ? `${lhr.runtimeError.code}: ${lhr.runtimeError.message}` : null,
  }
}

const slug = (route: string) =>
  route === '/' ? 'index' : route.replace(/^\//, '').replace(/\/$/, '').replaceAll('/', '_')

export async function auditRoute(options: {
  readonly origin: string
  readonly route: string
  readonly mode: Mode
  readonly run: number
  readonly browser: BrowserHandle
  readonly outputDir: string
  readonly keepReport: boolean
}): Promise<AuditResult> {
  const { origin, route, mode, run, browser, outputDir, keepReport } = options
  const url = `${origin}${route}`

  const result = await lighthouse(
    url,
    {
      port: browser.port,
      output: 'json',
      logLevel: 'silent',
      // Every stable category. A run that skips one cannot report on it, and a
      // regression in accessibility or SEO caused by a performance change is
      // exactly what this loop has to catch.
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      // Cold, every time: default storage reset, default simulated throttling,
      // default viewport for the mode. Nothing weakened.
      disableStorageReset: false,
    },
    mode === 'desktop' ? desktopConfig : undefined,
  )

  if (!result) throw new Error(`Lighthouse returned nothing for ${url}`)
  const lhr = result.lhr as unknown as Lhr

  mkdirSync(outputDir, { recursive: true })
  const reportPath = join(outputDir, `${slug(route)}.${mode}.${run}.json`)
  // A failed run's report is kept whatever the caller asked for: it is the only
  // evidence of why it failed, and the caller who did not ask for reports is
  // exactly the caller who will not have one.
  if (keepReport || lhr.runtimeError) writeFileSync(reportPath, JSON.stringify(lhr))

  return {
    route,
    mode,
    run,
    lighthouseVersion: lhr.lighthouseVersion,
    benchmarkIndex: lhr.environment.benchmarkIndex,
    fetchTime: lhr.fetchTime,
    metrics: extract(lhr),
    reportPath: keepReport ? reportPath : '',
  }
}

// --- provenance ------------------------------------------------------------

export interface Provenance {
  readonly commit: string
  readonly dirty: boolean
  readonly buildId: string
  readonly bun: string
  readonly node: string
  readonly next: string
  readonly lighthouse: string
  readonly chrome: string
  readonly platform: string
  readonly cpu: string
  readonly cores: number
  readonly headless: true
  readonly motionPreference: 'no-preference'
  readonly storageReset: true
  readonly target: 'local' | 'deployed'
  readonly origin: string
}

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export function provenance(server: ServerHandle, browser: BrowserHandle): Provenance {
  const appPackage = JSON.parse(readFileSync(join(APP_ROOT, 'package.json'), 'utf8')) as {
    dependencies: Record<string, string>
  }
  const rootPackage = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
    devDependencies: Record<string, string>
  }
  return {
    commit: git(['rev-parse', 'HEAD']),
    dirty: git(['status', '--porcelain']).length > 0,
    buildId: server.buildId,
    bun: Bun.version,
    node: process.versions.node,
    next: appPackage.dependencies.next as string,
    lighthouse: rootPackage.devDependencies.lighthouse as string,
    chrome: browser.version,
    platform: `${os.platform()} ${os.release()}`,
    cpu: os.cpus()[0]?.model ?? 'unknown',
    cores: os.cpus().length,
    headless: true,
    motionPreference: 'no-preference',
    storageReset: true,
    target: 'local',
    origin: server.origin,
  }
}

// --- statistics ------------------------------------------------------------

export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2
}

/**
 * Median absolute deviation.
 *
 * The decision rule needs a spread that a single slow run cannot inflate,
 * because on a laptop one run in five is slow for reasons that have nothing to
 * do with the site. A standard deviation would let that run decide whether a
 * real improvement counts.
 */
export function mad(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN
  const centre = median(values)
  return median(values.map(value => Math.abs(value - centre)))
}
