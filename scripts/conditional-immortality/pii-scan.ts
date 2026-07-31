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
 *
 * Two groups, with different failure semantics. Build output must exist and
 * yield files, or the scan has proved nothing and says so. The repository group
 * comes from `git ls-files` rather than a list of directories, so it cannot fall
 * behind as the repository grows — the migration ledger, which holds 1,034
 * migrated comment entries, is the likeliest place for a personal detail to sit.
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

/**
 * The build output: everything a visitor can reach, and so the group whose
 * absence has to be an error rather than a quiet zero.
 */
const BUILD_OUTPUT_ROOTS = [
  join(APP_ROOT, '.next', 'server'),
  join(APP_ROOT, '.next', 'static'),
  join(APP_ROOT, 'public'),
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
  '.csv',
  '.yml',
  '.yaml',
  /*
   * Next writes every prerendered non-HTML route as `<name>.body`, so this one
   * extension is the whole of `robots.txt`, `sitemap.xml`, the public search
   * index and all three downloads. Without it the scan walked 1,753 files and
   * skipped precisely the ones a contact detail was most likely to reach: the
   * bibliography prints a URL for every source, and the search index carries
   * registry prose verbatim.
   */
  '.body',
  '',
])

interface Hit {
  readonly file: string
  readonly what: string
  readonly where: string
  readonly context: string
}

const hits: Hit[] = []

function digest(value: string): string {
  return createHash('sha256').update(value.toLowerCase()).digest('hex')
}

/** Scan one file. Returns whether it was actually read. */
function scanFile(path: string, where: string): boolean {
  const ext = extname(path).toLowerCase()
  if (!TEXT_EXTENSIONS.has(ext)) return false

  let content: string
  try {
    content = readFileSync(path, 'utf8')
  } catch {
    return false
  }

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
        where,
        // The value itself is never echoed, only its surroundings.
        context: `…${before}[REDACTED]…`,
      })
    }
  }
  return true
}

function walk(dir: string, where: string): number {
  if (!existsSync(dir)) return 0
  let scanned = 0
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git' || entry === 'cache') continue
    const path = join(dir, entry)
    let stats: ReturnType<typeof statSync>
    try {
      stats = statSync(path)
    } catch {
      continue
    }
    if (stats.isDirectory()) scanned += walk(path, where)
    else if (scanFile(path, where)) scanned += 1
  }
  return scanned
}

/* ------------------------------------------------------------------ *
 * Group 1: build output. Must exist, must be non-empty.
 * ------------------------------------------------------------------ */

let outputFiles = 0
const missingOutputRoots: string[] = []
for (const root of BUILD_OUTPUT_ROOTS) {
  if (!existsSync(root)) missingOutputRoots.push(relative(REPO_ROOT, root))
  outputFiles += walk(root, 'build output')
}

/* ------------------------------------------------------------------ *
 * Group 2: everything committed to the repository.
 * ------------------------------------------------------------------ */

function committedFiles(): string[] | undefined {
  const result = Bun.spawnSync(['git', 'ls-files', '-z'], { cwd: REPO_ROOT, stdout: 'pipe' })
  if (result.exitCode !== 0) return undefined
  return new TextDecoder()
    .decode(result.stdout)
    .split('\0')
    .filter(entry => entry.length > 0)
}

const tracked = committedFiles()
let repositoryFiles = 0
if (tracked) {
  for (const entry of tracked) {
    if (scanFile(join(REPO_ROOT, entry), 'repository')) repositoryFiles += 1
  }
}

/* ------------------------------------------------------------------ *
 * The private archive must also stay out of the repository.
 *
 * `docs/rights-audit.md` withholds the source document for two reasons: it
 * opens with a personal email address and phone number, and it carries thirty
 * editorial comments by named third parties who did not consent to
 * publication. That decision was about the website. It was not applied to the
 * repository, which is public — so the extracted comments, the comment-bearing
 * element tree and the redacted rendering were all committed, names and full
 * text included, and the scan that exists to catch exactly this was told to
 * skip two of the three by name.
 *
 * The derived artefacts are outputs of `bun run source:import`; nothing in the
 * build, the validation chain or any test reads them. They belong on the
 * author's disk.
 * ------------------------------------------------------------------ */

const UNPUBLISHABLE_PRIVATE_ARTEFACTS = [
  'private/source/source-comments.json',
  'private/source/source-elements.json',
  'private/source/source-text-redacted.md',
]

if (tracked) {
  for (const entry of tracked) {
    const normalised = entry.replaceAll('\\', '/')
    if (!UNPUBLISHABLE_PRIVATE_ARTEFACTS.includes(normalised)) continue
    hits.push({
      file: normalised,
      what: 'private source artefact tracked by git',
      where: 'repository',
      context:
        'It carries third-party editorial comments that were never cleared for publication, ' +
        'and this repository is public. Run `git rm --cached` on it; it is regenerated by ' +
        '`bun run source:import`.',
    })
  }
}

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
      where: 'build output',
      context: 'The raw source material must not be served publicly.',
    })
  }
}

console.log('PII scan')
console.log('========')
console.log(`  build output   ${outputFiles} file(s)`)
console.log(`  repository     ${repositoryFiles} file(s)${tracked ? '' : ' (git unavailable)'}`)
console.log('')

/* Fail closed: without the build output this scan has proved nothing. */
if (missingOutputRoots.length > 0) {
  console.error('Build output is missing, so nothing published has been checked:')
  for (const root of missingOutputRoots) console.error(`  x ${root}`)
  console.error('Run `bun run build` before the PII scan.')
  process.exit(1)
}

if (outputFiles === 0) {
  console.error('Build output contains no readable files, so nothing published has been checked.')
  console.error('Run `bun run build` before the PII scan.')
  process.exit(1)
}

if (!tracked) {
  console.error('`git ls-files` failed, so the committed files have not been checked.')
  process.exit(1)
}

if (repositoryFiles === 0) {
  console.error('No committed files were read, which cannot be right. Refusing to report success.')
  process.exit(1)
}

if (hits.length > 0) {
  console.error(`${hits.length} leak(s) of source contact details:`)
  for (const hit of hits) {
    console.error(`  x ${hit.file}  (${hit.where})`)
    console.error(`      ${hit.what}`)
    console.error(`      ${hit.context}`)
  }
  process.exit(1)
}

console.log(
  `No source contact details in ${outputFiles} built file(s) or ${repositoryFiles} committed file(s).`,
)
