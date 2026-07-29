#!/usr/bin/env bun
/**
 * Public-output PII scan.
 *
 * The source document opens with the author's personal email address and phone
 * number. Neither may appear anywhere a visitor, a crawler or a downloaded
 * artefact could reach.
 *
 * The values themselves are deliberately NOT stored in this repository. They
 * are matched by SHA-256 digest instead, so the scanner is exact without the
 * repository ever containing the thing it is protecting.
 *
 * Run after `next build`. Exits non-zero on any hit.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const APP_ROOT = join(REPO_ROOT, 'apps', 'conditional-immortality')

/**
 * SHA-256 of the lower-cased source contact details, in the formats a leak
 * would plausibly take. Digests, not the values.
 */
const FORBIDDEN_DIGESTS = new Map<string, string>([
  ['965484742601cf669b7d170c95abe76176a88fe8969622abe5763de2949b0948', 'source email address'],
  ['7fbc3ec3b10e723fe72beb59e0a27de03f21a22be281074e270e0aa4eefe3b4b', 'source phone number'],
  [
    '4cfedacddbe39f113ac7f6d81eaa0851495f32029387855464bcfde607da63c3',
    'source phone number, unpunctuated',
  ],
  [
    '28bc605042ffa86c06689ab74f0fe3e6616b7b4976cc5c73f1338cdcade905ba',
    'source phone number, parenthesised',
  ],
  [
    '2f9675bcfdf89c32d7c3e3680064fb382cb3bee3b68838956a5fa3c1a70ffadf',
    'source phone number, dotted',
  ],
])

/** Candidate substrings that could be a contact detail, for digest checking. */
const CANDIDATE_PATTERNS: RegExp[] = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
  /\b\d{10}\b/g,
]

const SCAN_DIRECTORIES = [
  join(APP_ROOT, '.next', 'server'),
  join(APP_ROOT, '.next', 'static'),
  join(APP_ROOT, 'public'),
  join(REPO_ROOT, 'packages', 'ci-content', 'case'),
  join(REPO_ROOT, 'packages', 'ci-content', 'appendices'),
  join(REPO_ROOT, 'packages', 'ci-content', 'src'),
  join(APP_ROOT, 'src'),
]

const TEXT_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.txt',
  '.xml',
  '.css',
  '.md',
  '.mdx',
  '.ts',
  '.tsx',
  '.rsc',
  '.map',
  '.svg',
  '.webmanifest',
  '',
])

interface Hit {
  readonly file: string
  readonly what: string
  readonly context: string
}

const hits: Hit[] = []
let filesScanned = 0

function digest(value: string): string {
  return createHash('sha256').update(value.toLowerCase()).digest('hex')
}

function scanFile(path: string) {
  const ext = extname(path).toLowerCase()
  if (!TEXT_EXTENSIONS.has(ext)) return

  let content: string
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    return
  }
  filesScanned += 1

  for (const pattern of CANDIDATE_PATTERNS) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      const candidate = match[0]
      const what = FORBIDDEN_DIGESTS.get(digest(candidate))
      if (!what) continue

      const at = match.index ?? 0
      const before = content.slice(Math.max(0, at - 60), at).replace(/\s+/g, ' ')
      hits.push({
        file: relative(REPO_ROOT, path),
        what,
        // The value itself is never echoed, only its surroundings.
        context: `…${before}[REDACTED]…`,
      })
    }
  }
}

function walk(dir: string) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'cache') continue
    const path = join(dir, entry)
    let stats: ReturnType<typeof statSync>
    try {
      stats = statSync(path)
    } catch {
      continue
    }
    if (stats.isDirectory()) walk(path)
    else scanFile(path)
  }
}

for (const dir of SCAN_DIRECTORIES) walk(dir)

/* ------------------------------------------------------------------ *
 * The private archive must stay out of the published app.
 * ------------------------------------------------------------------ */

const privateSource = join(REPO_ROOT, 'private', 'source')
const publicDir = join(APP_ROOT, 'public')
if (existsSync(privateSource) && existsSync(publicDir)) {
  const leaked = readdirSync(publicDir).filter(
    entry =>
      entry.endsWith('.docx') || entry.includes('source-text') || entry.includes('source-elements'),
  )
  for (const entry of leaked) {
    hits.push({
      file: relative(REPO_ROOT, join(publicDir, entry)),
      what: 'private source artefact inside public/',
      context: 'The raw source material must not be served publicly.',
    })
  }
}

console.log('PII scan')
console.log('========')
console.log(`  files scanned  ${filesScanned}`)
console.log(
  `  directories    ${SCAN_DIRECTORIES.filter(existsSync).length} of ${SCAN_DIRECTORIES.length} present`,
)
console.log('')

if (filesScanned === 0) {
  console.error('No files were scanned. Run `bun run build` before the PII scan.')
  process.exit(1)
}

if (hits.length > 0) {
  console.error(`${hits.length} leak(s) of source contact details:`)
  for (const hit of hits) {
    console.error(`  x ${hit.file}`)
    console.error(`      ${hit.what}`)
    console.error(`      ${hit.context}`)
  }
  process.exit(1)
}

console.log('No source contact details found in any scanned output.')
