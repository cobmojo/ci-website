#!/usr/bin/env bun
/**
 * Content completeness audit.
 *
 * Reports what came across from the source document and what did not, and
 * fails the build when a substantive source element has no documented outcome.
 *
 * Writes a machine-readable report to `reports/content-audit.json` and the
 * reviewable ledger exports to `packages/ci-content/migration/`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  caseSections,
  commentLedger,
  glossary,
  LEDGER_SUMMARY,
  languageNotes,
  mediaDispositions,
  migrationLedger,
  migrationTotals,
  passages,
  revisions,
  scriptureIndex,
  sources,
  topics,
  video,
} from '@ci/content'
import { COMMENT_DISPOSITION_LABELS, type CommentDisposition } from '@ci/content-schema'
import { sectionsMissingBodies } from '../../apps/conditional-immortality/src/lib/sections.ts'

const REPO_ROOT = resolve(import.meta.dir, '..', '..')
const errors: string[] = []

const totals = migrationTotals()

/* ------------------------------------------------------------------ *
 * Element-level completeness
 * ------------------------------------------------------------------ */

const byTreatment = new Map<string, number>()
for (const entry of migrationLedger) {
  byTreatment.set(entry.treatment, (byTreatment.get(entry.treatment) ?? 0) + 1)
}

const unmapped = migrationLedger.filter(
  entry =>
    entry.treatment !== 'omitted-as-formatting-only' &&
    entry.treatment !== 'private-source-only' &&
    !entry.destinationRoute,
)
if (unmapped.length > 0) {
  errors.push(
    `${unmapped.length} substantive source elements have no destination route. ` +
      `First few: ${unmapped
        .slice(0, 5)
        .map(e => e.sourceId)
        .join(', ')}`,
  )
}

const missingRights = migrationLedger.filter(entry => !entry.rightsStatus)
if (missingRights.length > 0)
  errors.push(`${missingRights.length} ledger entries lack a rights status.`)

const missingCitation = migrationLedger.filter(entry => entry.citationStatus === 'missing')
if (missingCitation.length > 0) {
  errors.push(`${missingCitation.length} ledger entries are marked as missing a citation.`)
}

/* ------------------------------------------------------------------ *
 * Comments and media
 * ------------------------------------------------------------------ */

const byDisposition = new Map<CommentDisposition, number>()
for (const entry of commentLedger) {
  byDisposition.set(entry.disposition, (byDisposition.get(entry.disposition) ?? 0) + 1)
}
const undisposed = commentLedger.filter(entry => !entry.disposition)
if (undisposed.length > 0) errors.push(`${undisposed.length} source comments have no disposition.`)

if (mediaDispositions.length !== LEDGER_SUMMARY.imageCount) {
  errors.push(
    `The source contains ${LEDGER_SUMMARY.imageCount} media assets but ${mediaDispositions.length} dispositions are recorded.`,
  )
}

/* ------------------------------------------------------------------ *
 * Page bodies
 * ------------------------------------------------------------------ */

const missingBodies = sectionsMissingBodies()
if (missingBodies.length > 0) {
  errors.push(`Sections without an MDX body: ${missingBodies.map(s => s.id).join(', ')}`)
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const report = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: {
    sha256: LEDGER_SUMMARY.sourceSha256,
    bytes: LEDGER_SUMMARY.sourceBytes,
    paragraphs: LEDGER_SUMMARY.paragraphCount,
    nonEmptyParagraphs: LEDGER_SUMMARY.nonEmptyParagraphs,
    tables: LEDGER_SUMMARY.tableCount,
    hyperlinks: LEDGER_SUMMARY.hyperlinkCount,
    images: LEDGER_SUMMARY.imageCount,
    comments: LEDGER_SUMMARY.commentCount,
  },
  migration: {
    totalLedgerEntries: totals.totalElements,
    mapped: totals.mapped,
    privateOnly: totals.privateOnly,
    omittedFormattingOnly: totals.omittedFormattingOnly,
    unmapped: totals.unmapped,
    byTreatment: Object.fromEntries(byTreatment),
  },
  comments: {
    total: commentLedger.length,
    byDisposition: Object.fromEntries(
      [...byDisposition.entries()].map(([key, value]) => [COMMENT_DISPOSITION_LABELS[key], value]),
    ),
  },
  media: {
    total: mediaDispositions.length,
    byTreatment: Object.fromEntries(
      mediaDispositions.reduce((acc, item) => {
        acc.set(item.treatment, (acc.get(item.treatment) ?? 0) + 1)
        return acc
      }, new Map<string, number>()),
    ),
  },
  content: {
    sections: caseSections.length,
    sectionsWithBodies: caseSections.length - missingBodies.length,
    passages: passages.length,
    topics: topics.length,
    glossaryTerms: glossary.length,
    languageNotes: languageNotes.length,
    sources: sources.length,
    revisions: revisions.length,
    scriptureIndexEntries: scriptureIndex.length,
    transcriptCues: video.cues.length,
    videoChapters: video.chapters.length,
  },
}

const reportsDir = join(REPO_ROOT, 'reports')
mkdirSync(reportsDir, { recursive: true })
writeFileSync(join(reportsDir, 'content-audit.json'), `${JSON.stringify(report, null, 2)}\n`)

/* Reviewable ledger exports. */
const migrationDir = join(REPO_ROOT, 'packages', 'ci-content', 'migration')
mkdirSync(migrationDir, { recursive: true })

writeFileSync(
  join(migrationDir, 'migration-ledger.json'),
  `${JSON.stringify(migrationLedger, null, 1)}\n`,
)

const CSV_COLUMNS = [
  'sourceId',
  'sourcePage',
  'sourceType',
  'treatment',
  'destinationSectionId',
  'destinationRoute',
  'citationStatus',
  'rightsStatus',
  'publicPrivacyStatus',
  'migrationStatus',
  'editorialNote',
] as const

function csvCell(value: unknown): string {
  if (value === undefined || value === null) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const csv = [
  CSV_COLUMNS.join(','),
  ...migrationLedger.map(entry =>
    CSV_COLUMNS.map(column => csvCell((entry as Record<string, unknown>)[column])).join(','),
  ),
].join('\n')
writeFileSync(join(migrationDir, 'migration-ledger.csv'), `${csv}\n`)

writeFileSync(
  join(migrationDir, 'source-inventory.json'),
  `${JSON.stringify({ summary: LEDGER_SUMMARY, media: mediaDispositions, comments: commentLedger }, null, 2)}\n`,
)

/*
 * Hand the two committed JSON exports to the formatter.
 *
 * They are generated here but checked in, and `JSON.stringify` does not
 * produce what biome considers formatted — `migration-ledger.json` is written
 * with one-space indent, which biome rewrites to two. Since `content:audit`
 * runs *after* `lint` in the validate chain, the effect was that a clean run of
 * `bun run validate` left the working tree dirty and the next `bun run lint`
 * red, with no indication of why.
 *
 * The CSV is not formatted: biome does not handle CSV, and it is excluded in
 * biome.json for that reason.
 */
const formatted = [
  join(migrationDir, 'migration-ledger.json'),
  join(migrationDir, 'source-inventory.json'),
]
const format = Bun.spawnSync(['bunx', 'biome', 'check', '--write', ...formatted], {
  cwd: REPO_ROOT,
  stdout: 'pipe',
  stderr: 'pipe',
})
if (format.exitCode !== 0) {
  console.error(`biome could not format the ledger exports:\n${format.stderr}`)
  process.exit(1)
}

/* ------------------------------------------------------------------ *
 * Console summary
 * ------------------------------------------------------------------ */

console.log('Content audit')
console.log('=============')
console.log(`  source sha256        ${LEDGER_SUMMARY.sourceSha256.slice(0, 16)}…`)
console.log(
  `  source paragraphs    ${LEDGER_SUMMARY.paragraphCount} (${LEDGER_SUMMARY.nonEmptyParagraphs} non-empty)`,
)
console.log(`  source tables        ${LEDGER_SUMMARY.tableCount}`)
console.log(`  source hyperlinks    ${LEDGER_SUMMARY.hyperlinkCount}`)
console.log(`  source images        ${LEDGER_SUMMARY.imageCount}`)
console.log(`  source comments      ${LEDGER_SUMMARY.commentCount}`)
console.log('')
console.log(`  ledger entries       ${totals.totalElements}`)
console.log(`    mapped             ${totals.mapped}`)
console.log(`    private only       ${totals.privateOnly}`)
console.log(`    formatting only    ${totals.omittedFormattingOnly}`)
console.log(`    unmapped           ${totals.unmapped}`)
console.log('')
console.log('  comment dispositions')
for (const [key, value] of byDisposition) {
  console.log(`    ${COMMENT_DISPOSITION_LABELS[key].padEnd(42)} ${value}`)
}
console.log('')
console.log(`  sections with bodies ${report.content.sectionsWithBodies}/${caseSections.length}`)
console.log(`  passages             ${passages.length}`)
console.log(`  topics               ${topics.length}`)
console.log(`  sources              ${sources.length}`)
console.log('')
console.log('  wrote reports/content-audit.json')
console.log('  wrote packages/ci-content/migration/migration-ledger.json')
console.log('  wrote packages/ci-content/migration/migration-ledger.csv')
console.log('  wrote packages/ci-content/migration/source-inventory.json')
console.log('')

if (errors.length > 0) {
  console.error(`${errors.length} error(s):`)
  for (const error of errors) console.error(`  x ${error}`)
  process.exit(1)
}

console.log('Content audit passed.')
