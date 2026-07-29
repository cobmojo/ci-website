#!/usr/bin/env bun
/**
 * Source document import and audit.
 *
 * Opens the original DOCX, reads the WordprocessingML directly, and produces:
 *
 *   private/source/source-report.json      counts, checksum, relationships
 *   private/source/source-elements.json    every paragraph, table cell and link
 *   private/source/source-comments.json    every editorial comment
 *   private/source/source-text-redacted.md a reviewable plain-text rendering
 *   private/source/media/*                 the embedded assets
 *
 * Personal contact details are redacted from every derived artefact. The raw
 * DOCX is never copied into the repository or into any public directory.
 *
 * Usage:
 *   bun run scripts/conditional-immortality/import-source.ts [path-to-docx]
 *
 * The path defaults to SOURCE_DOCX_PATH, then to the location the document was
 * originally imported from. Re-run this whenever the source document changes;
 * the checksum in the report will differ and the content audit will show what
 * moved.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { parseComments, parseDocument, parseRelationships } from './lib/docx.ts'
import { readZip } from './lib/zip.ts'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const OUT_DIR = join(REPO_ROOT, 'private', 'source')

const DEFAULT_PATH =
  process.env.SOURCE_DOCX_PATH ??
  join(
    process.env.USERPROFILE ?? process.env.HOME ?? '',
    'Downloads',
    'My case for Conditional Immortality.docx',
  )

const docxPath = process.argv[2] ?? DEFAULT_PATH

/* ------------------------------------------------------------------ *
 * Redaction
 *
 * The values are read from the source itself rather than stored here, so this
 * script does not become a place the contact details live.
 * ------------------------------------------------------------------ */

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const PHONE_PATTERN = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g

function redact(value: string): string {
  return value
    .replace(EMAIL_PATTERN, '[email redacted]')
    .replace(PHONE_PATTERN, '[phone redacted]')
    .replace(/mailto:[^\s"|}]+/gi, 'mailto:[redacted]')
}

/* ------------------------------------------------------------------ *
 * Read
 * ------------------------------------------------------------------ */

let raw: Buffer
try {
  raw = readFileSync(docxPath)
} catch {
  console.error(`Could not read the source document at:\n  ${docxPath}\n`)
  console.error('Pass the path as an argument, or set SOURCE_DOCX_PATH.')
  console.error('The DOCX is intentionally not committed to this repository.')
  process.exit(1)
}

const sha256 = createHash('sha256').update(raw).digest('hex')
const files = readZip(raw)

const documentXml = files.get('word/document.xml')?.toString('utf8')
if (!documentXml) {
  console.error('word/document.xml is missing. This does not look like a Word document.')
  process.exit(1)
}

const relsXml = files.get('word/_rels/document.xml.rels')?.toString('utf8') ?? ''
const commentsXml = files.get('word/comments.xml')?.toString('utf8') ?? ''

const relationships = parseRelationships(relsXml)
const comments = parseComments(commentsXml)
const elements = parseDocument(documentXml, relationships)

const mediaFiles = [...files.keys()].filter(name => name.startsWith('word/media/')).sort()

/* ------------------------------------------------------------------ *
 * Counts
 * ------------------------------------------------------------------ */

const paragraphs = elements.filter(element => element.kind === 'paragraph')
const nonEmpty = paragraphs.filter(element => element.text.trim().length > 0)
const tableCount = elements.filter(element => element.kind === 'table-start').length
const hyperlinkInstances = paragraphs.reduce((sum, e) => sum + e.hyperlinks.length, 0)
const imageInstances = paragraphs.reduce((sum, e) => sum + e.images.length, 0)
const hyperlinkRelationships = [...relationships.values()].filter(
  r => r.type === 'hyperlink',
).length
const externalTargets = [
  ...new Set(
    paragraphs
      .flatMap(e => e.hyperlinks)
      .map(link => link.target)
      .filter((t): t is string => Boolean(t) && /^https?:/i.test(t ?? '')),
  ),
].sort()

/* ------------------------------------------------------------------ *
 * Write
 * ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(join(OUT_DIR, 'media'), { recursive: true })

const report = {
  source: basename(docxPath),
  sha256,
  bytes: raw.length,
  importedAt: new Date().toISOString().slice(0, 10),
  paragraphCount: paragraphs.length,
  nonEmptyParagraphs: nonEmpty.length,
  tableCount,
  hyperlinkInstances,
  hyperlinkRelationships,
  imageInstances,
  mediaFiles,
  commentCount: comments.size,
  uniqueExternalTargets: externalTargets,
  relationships: Object.fromEntries(relationships),
}

writeFileSync(join(OUT_DIR, 'source-report.json'), `${redact(JSON.stringify(report, null, 2))}\n`)

writeFileSync(
  join(OUT_DIR, 'source-elements.json'),
  `${redact(JSON.stringify(elements, null, 1))}\n`,
)

writeFileSync(
  join(OUT_DIR, 'source-comments.json'),
  `${redact(JSON.stringify(Object.fromEntries(comments), null, 2))}\n`,
)

for (const name of mediaFiles) {
  const data = files.get(name)
  if (data) writeFileSync(join(OUT_DIR, 'media', basename(name)), data)
}

/* Reviewable plain-text rendering with paragraph markers. */
const lines: string[] = [
  '<!--',
  'Redacted plain-text rendering of the source document.',
  'Generated by scripts/conditional-immortality/import-source.ts.',
  'Personal email address and phone number have been removed.',
  'Paragraph markers [n] correspond to sourceParagraphIds (pN) in the registry.',
  '-->',
  '',
]

for (const element of elements) {
  if (element.kind === 'table-start') {
    lines.push('', `[[TABLE START #${element.index}]]`)
    continue
  }
  if (element.kind === 'table-end') {
    lines.push(`[[TABLE END #${element.tableRef} rows=${element.rows}]]`, '')
    continue
  }

  const marks: string[] = []
  if (element.style) marks.push(`style=${element.style}`)
  if (element.numId) marks.push(`list=${element.numId}/${element.ilvl}`)
  if (element.images.length) {
    marks.push(`IMAGES=${element.images.map(i => i.target ?? '?').join(',')}`)
  }
  if (element.commentRefs.length) marks.push(`COMMENT_REF=${element.commentRefs.join(',')}`)
  if (element.openComments.length) marks.push(`IN_COMMENT=${element.openComments.join(',')}`)
  if (element.hyperlinks.length) {
    marks.push(`LINKS=${element.hyperlinks.map(h => h.target ?? '').join(' | ')}`)
  }

  let prefix = `[${element.index}]`
  if (marks.length) prefix += `{${marks.join('; ')}}`
  if (element.container.startsWith('table')) {
    prefix += `(${element.container} r${element.row} c${element.col})`
  }
  lines.push(`${prefix} ${element.text}`)
}

writeFileSync(join(OUT_DIR, 'source-text-redacted.md'), redact(lines.join('\n')))

/* ------------------------------------------------------------------ *
 * Verify the redaction actually worked before reporting success.
 * ------------------------------------------------------------------ */

const rendered = readFileSync(join(OUT_DIR, 'source-text-redacted.md'), 'utf8')
const residualEmails = rendered.match(EMAIL_PATTERN) ?? []
if (residualEmails.length > 0) {
  console.error('Redaction failed: an email address survived into the rendered output.')
  process.exit(1)
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log('Source import')
console.log('=============')
console.log(`  file                 ${basename(docxPath)}`)
console.log(`  sha256               ${sha256}`)
console.log(`  bytes                ${raw.length}`)
console.log('')
console.log(`  paragraphs           ${paragraphs.length} (${nonEmpty.length} non-empty)`)
console.log(`  tables               ${tableCount}`)
console.log(`  hyperlink rels       ${hyperlinkRelationships}`)
console.log(`  hyperlink instances  ${hyperlinkInstances}`)
console.log(`  external targets     ${externalTargets.length}`)
console.log(`  images               ${imageInstances} instances, ${mediaFiles.length} assets`)
console.log(`  comments             ${comments.size}`)
console.log('')
console.log(`  wrote ${OUT_DIR}`)
console.log('')
console.log('Contact details were redacted from every derived artefact.')
console.log('The raw DOCX was not copied into the repository.')
console.log('')
console.log('Next: bun run content:audit to regenerate the migration ledger exports.')
