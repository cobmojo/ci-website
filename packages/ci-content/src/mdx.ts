import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * Locate `packages/ci-content` on disk.
 *
 * MDX bodies are authored as real `.mdx` files rather than TypeScript strings,
 * so editors get proper syntax handling. They are read at build time from the
 * package directory, which is found by walking up from the current working
 * directory until the package is seen. That works whether the process was
 * started from the app directory (`next build`, `next start`, `vitest`) or
 * from the repository root (`turbo run …`).
 */
let cachedRoot: string | null = null

export function contentRoot(): string {
  if (cachedRoot) return cachedRoot

  const candidates: string[] = []
  let dir = resolve(process.cwd())
  for (let i = 0; i < 8; i += 1) {
    candidates.push(join(dir, 'packages', 'ci-content'))
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  for (const candidate of candidates) {
    if (existsSync(join(candidate, 'package.json'))) {
      cachedRoot = candidate
      return candidate
    }
  }

  throw new Error(
    `Could not locate packages/ci-content from ${process.cwd()}. Tried:\n${candidates.join('\n')}`,
  )
}

export type MdxCollection = 'case' | 'appendices' | 'pages'

function collectionDir(collection: MdxCollection): string {
  return join(contentRoot(), collection)
}

/** Read a raw MDX body by collection and file stem. */
export function readMdx(collection: MdxCollection, name: string): string {
  const path = join(collectionDir(collection), `${name}.mdx`)
  if (!existsSync(path)) {
    throw new Error(`Missing MDX body: ${collection}/${name}.mdx (looked in ${path})`)
  }
  return readFileSync(path, 'utf8')
}

export function mdxExists(collection: MdxCollection, name: string): boolean {
  return existsSync(join(collectionDir(collection), `${name}.mdx`))
}

export function listMdx(collection: MdxCollection): readonly string[] {
  const dir = collectionDir(collection)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace(/\.mdx$/, ''))
    .sort()
}

/**
 * File stem for a section's MDX body: `s04-eternal-punishment`.
 * Lower-cased id plus slug keeps the directory sorted in reading order.
 */
export function sectionFileName(id: string, slug: string): string {
  return `${id.toLowerCase()}-${slug}`
}

/** Heading text and slug pairs, for building "On this page" without a parser. */
export interface ExtractedHeading {
  readonly depth: 2 | 3
  readonly text: string
  readonly id: string
}

/**
 * A markdown heading, or a callout that renders one at level 2.
 *
 * Both are matched by a single alternation so `matchAll` yields them in
 * document order. A `<Callout as="h2">` is a real `<h2>` on the page, and
 * because it is literal JSX rather than markdown, neither this function nor
 * `rehype-slug` used to see it: both appendices opened on a level-2 heading —
 * "A psychological illustration, not evidence", the caveat that says the page
 * proves nothing about what Scripture teaches — that carried no id, could not
 * be linked, and left "On this page" starting at the *second* heading.
 *
 * Level-3 callouts are left out deliberately. There are thirty of them across
 * twenty-four pages, and listing every aside would change what the contents
 * are for; they take an id from the component so they can still be linked.
 */
const HEADING_PATTERN = /^(#{2,3})\s+(.+?)\s*$|<Callout\b([^>]*\bas="h2"[^>]*)>/gm

/** Read one attribute out of a JSX opening tag's attribute text. */
function attribute(attributes: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(attributes)?.[1]
}
/** Strip inline MDX/markdown syntax so heading text reads as plain prose. */
function plainText(value: string): string {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Heading ids, matching `github-slugger` exactly.
 *
 * This must agree character for character with what `rehype-slug` writes into
 * the rendered HTML, because the "On this page" navigation is built from these
 * ids. The two algorithms differ in an easy-to-miss way: punctuation is
 * *removed*, not replaced with a hyphen. So "John 10:10" becomes `john-1010`,
 * not `john-10-10`. Only whitespace becomes a hyphen.
 *
 * The link checker catches any drift between the two, and did.
 */
const PUNCTUATION = /[ -⁯⸀-⹿\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~‘’“”]/g

export function slugifyHeading(value: string): string {
  return plainText(value).toLowerCase().replace(PUNCTUATION, '').replace(/\s/g, '-')
}

/**
 * Extract level-2 and level-3 headings from an MDX body.
 *
 * Fenced code blocks are removed first so a `##` inside a fence is not
 * mistaken for a heading.
 */
export function extractHeadings(mdx: string): readonly ExtractedHeading[] {
  const withoutFences = mdx.replace(/^```[\s\S]*?^```/gm, '')
  const headings: ExtractedHeading[] = []
  const seen = new Map<string, number>()

  for (const match of withoutFences.matchAll(HEADING_PATTERN)) {
    const [, hashes, raw, calloutAttributes] = match

    // A callout brings its own id, because the component renders the heading
    // and nothing downstream can slug it.
    if (calloutAttributes !== undefined) {
      const text = plainText(attribute(calloutAttributes, 'title') ?? '')
      const id = attribute(calloutAttributes, 'id')
      if (!text || !id) continue
      // Deliberately not seeded into `seen`: `rehype-slug` never sees a
      // callout, so seeding it here would make a later markdown heading of the
      // same slug come out `open-questions-1` while the rendered page says
      // `open-questions`, and this function's whole contract is to agree with
      // it character for character. A genuine collision is caught by the
      // duplicate-id check instead.
      headings.push({ depth: 2, text, id })
      continue
    }

    if (!hashes || !raw) continue
    const text = plainText(raw)
    if (!text) continue

    const base = slugifyHeading(text)
    // github-slugger suffixes the *second* occurrence with -1, not -2.
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const id = count > 0 ? `${base}-${count}` : base

    headings.push({ depth: hashes.length === 2 ? 2 : 3, text, id })
  }

  return headings
}

/** Approximate plain-text body, used for reading time and the search index. */
export function mdxToPlainText(mdx: string): string {
  return mdx
    .replace(/^```[\s\S]*?^```/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/\|/g, ' ')
    .replace(/^\s*[-–—]{3,}\s*$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
