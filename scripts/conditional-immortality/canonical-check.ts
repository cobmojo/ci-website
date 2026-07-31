#!/usr/bin/env bun
/**
 * The canonical origin, checked against what the build actually emitted.
 *
 * `site-url.ts` refuses to resolve a nonsense origin, which stops the worst
 * case at the door. This is the other half: proof that the origin it resolved
 * is the one that reached the output, in every place the output claims it.
 *
 * It exists because the failure it guards is invisible. A build with the wrong
 * canonical origin succeeds, renders, passes every accessibility and geometry
 * gate, and looks correct in a browser — while being un-indexable, serving
 * social cards that never resolve, and printing a QR code that goes nowhere.
 * Nothing about a green run distinguishes it from a correct one.
 *
 * Run after `next build`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { resolveSiteUrl } from '../../apps/conditional-immortality/src/lib/site-url'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const APP_OUTPUT = join(REPO_ROOT, 'apps', 'conditional-immortality', '.next', 'server', 'app')

const expectedOrigin = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL: process.env.NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  VERCEL_URL: process.env.VERCEL_URL,
})

if (!existsSync(APP_OUTPUT)) {
  console.error(`No build output at ${APP_OUTPUT}.`)
  console.error('Run `bun run build` before the canonical check.')
  process.exit(1)
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const files = walk(APP_OUTPUT)
const problems: string[] = []
const relative = (file: string) => file.slice(APP_OUTPUT.length + 1).replaceAll('\\', '/')

/** Every absolute URL this site claims as its own, by the tag that claims it. */
const CLAIMS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: 'canonical', pattern: /<link rel="canonical" href="([^"]+)"/g },
  { label: 'og:url', pattern: /<meta property="og:url" content="([^"]+)"/g },
  { label: 'og:image', pattern: /<meta property="og:image" content="([^"]+)"/g },
  { label: 'sitemap <loc>', pattern: /<loc>([^<]+)<\/loc>/g },
]

let canonicalCount = 0
let sitemapCount = 0
let htmlCount = 0

for (const file of files) {
  const isHtml = file.endsWith('.html')
  const isBody = file.endsWith('.body')
  if (!isHtml && !isBody) continue

  const source = readFileSync(file, 'utf8')
  if (isHtml) htmlCount += 1

  for (const { label, pattern } of CLAIMS) {
    for (const match of source.matchAll(pattern)) {
      const url = match[1] as string
      if (label === 'canonical') canonicalCount += 1
      if (label === 'sitemap <loc>') sitemapCount += 1
      if (!url.startsWith(`${expectedOrigin}/`)) {
        problems.push(
          `${relative(file)}: ${label} is ${url}, expected an origin of ${expectedOrigin}`,
        )
      }
    }
  }
}

/**
 * The localhost default reaching a released build is the specific accident this
 * whole check exists for, so it is called out by name rather than left to the
 * per-claim comparison — a hardcoded localhost in a download or a QR payload
 * carries no tag for the patterns above to match.
 */
if (!expectedOrigin.includes('localhost')) {
  for (const file of files) {
    const source = readFileSync(file, 'latin1')
    if (source.includes('localhost:321')) {
      problems.push(`${relative(file)}: contains a localhost address in a released build`)
    }
  }
}

const robotsFile = join(APP_OUTPUT, 'robots.txt.body')
if (existsSync(robotsFile)) {
  const robots = readFileSync(robotsFile, 'utf8')
  for (const directive of ['Host', 'Sitemap']) {
    const line = robots.split('\n').find(candidate => candidate.startsWith(`${directive}:`))
    if (line && !line.includes(expectedOrigin)) {
      problems.push(`robots.txt: ${line.trim()} does not use ${expectedOrigin}`)
    }
  }
}

console.log('Canonical origin')
console.log('================')
console.log(`  origin         ${expectedOrigin}`)
console.log(`  html pages     ${htmlCount}`)
console.log(`  canonical tags ${canonicalCount}`)
console.log(`  sitemap urls   ${sitemapCount}`)
console.log('')

if (canonicalCount === 0 || sitemapCount === 0) {
  console.error('Found no canonical tags or no sitemap entries. Refusing to report success.')
  process.exit(1)
}

if (problems.length > 0) {
  console.error(`${problems.length} canonical problem(s):`)
  for (const problem of problems.slice(0, 40)) console.error(`  x ${problem}`)
  if (problems.length > 40) console.error(`  ... and ${problems.length - 40} more`)
  console.error('')
  console.error('Set NEXT_PUBLIC_SITE_URL to the canonical production origin and rebuild.')
  process.exit(1)
}

console.log('Every canonical URL, Open Graph URL, sitemap entry and robots directive')
console.log(`agrees with ${expectedOrigin}.`)
