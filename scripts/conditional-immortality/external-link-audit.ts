#!/usr/bin/env bun
/**
 * Fetch every external link the site publishes, and say which ones are gone.
 *
 * Deliberately *not* part of `validate`. Link rot is real and worth catching,
 * but a gate that depends on thirty third-party servers being up is a gate
 * that fails for reasons that have nothing to do with the change under review,
 * and a suite that cries wolf is one people learn to re-run rather than read.
 * So this is a release command and a scheduled workflow: run it before a
 * launch, and monthly after one.
 *
 * It never rewrites a link. A dead citation is an editorial decision — the
 * replacement has to be the same source, or the claim has to change — and
 * `docs/authoring-brief.md` is clear that a theological source is not
 * silently swapped. This reports; a person decides.
 *
 *   bun run content:links:external
 *   bun run content:links:external -- --json     machine-readable, for a workflow
 */
import { sources } from '@ci/content/sources'

interface Target {
  readonly sourceId: string
  readonly field: string
  readonly url: string
}

interface Result extends Target {
  readonly status: number | null
  readonly finalUrl: string | null
  readonly redirected: boolean
  readonly error: string | null
}

const TIMEOUT_MS = 20_000
/** Enough to be polite to one host, fast enough to finish in a coffee break. */
const CONCURRENCY = 6
/** A transient failure is not link rot; a persistent one is. */
const ATTEMPTS = 3

const asJson = process.argv.includes('--json')

function targets(): Target[] {
  const found: Target[] = []
  for (const source of sources) {
    for (const [field, url] of Object.entries({
      url: source.url,
      archiveUrl: source.archiveUrl,
      sourceDocumentUrl: source.sourceDocumentUrl,
    })) {
      if (typeof url === 'string' && /^https?:\/\//.test(url)) {
        found.push({ sourceId: source.id, field, url })
      }
    }
  }
  // One request per distinct URL, however many records cite it.
  const seen = new Set<string>()
  return found.filter(target => {
    if (seen.has(target.url)) return false
    seen.add(target.url)
    return true
  })
}

async function fetchOnce(url: string, method: 'HEAD' | 'GET'): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Some hosts answer a bare client with a 403. Identifying the audit is
        // both more honest and more likely to get a real answer.
        'user-agent':
          'conditional-immortality-link-audit/1.0 (+https://github.com/cobmojo/ci-website)',
        accept: '*/*',
      },
    })
  } finally {
    clearTimeout(timer)
  }
}

async function check(target: Target): Promise<Result> {
  let lastError: string | null = null

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      // HEAD first; a good number of hosts refuse it, so fall back to GET.
      let response = await fetchOnce(target.url, 'HEAD')
      if (response.status === 405 || response.status === 403 || response.status === 501) {
        response = await fetchOnce(target.url, 'GET')
      }
      return {
        ...target,
        status: response.status,
        finalUrl: response.url || target.url,
        redirected: (response.url || target.url) !== target.url,
        error: null,
      }
    } catch (error) {
      lastError = (error as Error).message
      if (attempt < ATTEMPTS) await new Promise(resolve => setTimeout(resolve, 1_000 * attempt))
    }
  }

  return { ...target, status: null, finalUrl: null, redirected: false, error: lastError }
}

async function run(): Promise<void> {
  const all = targets()
  const results: Result[] = []

  for (let start = 0; start < all.length; start += CONCURRENCY) {
    const batch = all.slice(start, start + CONCURRENCY)
    results.push(...(await Promise.all(batch.map(check))))
  }

  const dead = results.filter(result => result.error !== null || (result.status ?? 0) >= 400)
  const redirected = results.filter(result => result.error === null && result.redirected)
  const insecure = results.filter(result => result.url.startsWith('http://'))

  if (asJson) {
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2))
  } else {
    console.log('External link audit')
    console.log('===================')
    console.log(`  checked        ${results.length}`)
    console.log(`  reachable      ${results.length - dead.length}`)
    console.log(`  unreachable    ${dead.length}`)
    console.log(`  redirected     ${redirected.length}`)
    console.log(`  plain http     ${insecure.length}`)
    console.log('')

    for (const result of dead) {
      console.log(`  x ${result.sourceId}.${result.field}`)
      console.log(`      ${result.url}`)
      console.log(`      ${result.error ?? `HTTP ${result.status}`}`)
    }
    for (const result of redirected) {
      console.log(`  > ${result.sourceId}.${result.field} now resolves to`)
      console.log(`      ${result.finalUrl}`)
    }
    for (const result of insecure) {
      console.log(`  ! ${result.sourceId}.${result.field} is plain http: ${result.url}`)
    }
    if (dead.length === 0) {
      console.log('')
      console.log('Every published external link answered.')
      console.log('Redirects are reported, not corrected: a citation is only')
      console.log('repointed by someone who has read what it now points at.')
    }
  }

  // A dead link fails the audit. A redirect does not: it is information for a
  // person, and hosts move things for good reasons.
  process.exit(dead.length > 0 ? 1 : 0)
}

await run()
