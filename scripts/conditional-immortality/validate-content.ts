#!/usr/bin/env bun
/**
 * Build-time content validation.
 *
 * Fails with a non-zero exit code, and an actionable message, when the content
 * registries are internally inconsistent. This runs before the Next.js build in
 * CI, so a broken cross-reference never reaches a rendered page.
 */
import {
  appendixSections,
  caseSections,
  commentLedger,
  extractHeadings,
  getSection,
  getSource,
  getTopic,
  glossary,
  languageNotes,
  mdxExists,
  mdxToPlainText,
  mediaDispositions,
  migrationTotals,
  passages,
  readMdx,
  revisions,
  scriptureIndex,
  sectionFileName,
  sources,
  topics,
  video,
} from '@ci/content'
import { hasScripture } from '@ci/content/scripture'
import { parseReference } from '@ci/content-schema'

const errors: string[] = []
const warnings: string[] = []

function fail(message: string) {
  errors.push(message)
}
function warn(message: string) {
  warnings.push(message)
}

/* ------------------------------------------------------------------ *
 * 1. The permanent section registry
 * ------------------------------------------------------------------ */

const REQUIRED_IDS = [
  'P00',
  'RB1',
  'RB2',
  'RB3',
  ...Array.from({ length: 34 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`),
  'APP1',
  'APP2',
]

const presentIds = new Set(caseSections.map(section => section.id))
for (const id of REQUIRED_IDS) {
  if (!presentIds.has(id)) fail(`Missing required permanent section id: ${id}`)
}
if (caseSections.length !== REQUIRED_IDS.length) {
  fail(
    `Expected ${REQUIRED_IDS.length} sections, found ${caseSections.length}. ` +
      'The registry must contain P00, RB1-RB3, S01-S34, APP1 and APP2 and nothing else.',
  )
}

const seenIds = new Set<string>()
const seenSlugs = new Set<string>()
const seenRoutes = new Set<string>()
const seenOrders = new Set<number>()
for (const section of caseSections) {
  if (seenIds.has(section.id)) fail(`Duplicate section id: ${section.id}`)
  seenIds.add(section.id)

  const slugKey = `${section.group}/${section.slug}`
  if (seenSlugs.has(slugKey)) fail(`Duplicate slug within group: ${slugKey}`)
  seenSlugs.add(slugKey)

  if (seenRoutes.has(section.route)) fail(`Duplicate route: ${section.route}`)
  seenRoutes.add(section.route)

  if (seenOrders.has(section.canonicalOrder)) {
    fail(`Duplicate canonicalOrder ${section.canonicalOrder} on ${section.id}`)
  }
  seenOrders.add(section.canonicalOrder)

  if (!section.route.endsWith('/')) fail(`Route must end with a slash: ${section.route}`)
  if (!section.route.includes(section.slug)) {
    fail(`Route ${section.route} does not contain its slug "${section.slug}" (${section.id})`)
  }
}

/**
 * The source document's table of contents reverses sections 17 and 18. The
 * body headings are canonical, so this must not silently drift back.
 */
const s17 = getSection('S17')
const s18 = getSection('S18')
if (!s17 || !/jesus/i.test(s17.slug)) {
  fail(
    'S17 must be Jesus’ death. The source table of contents reverses S17 and S18; the body headings are canonical.',
  )
}
if (!s18 || !/physical/i.test(s18.slug)) {
  fail('S18 must be physical death as a parallel to final death. See the S17/S18 migration note.')
}

/* ------------------------------------------------------------------ *
 * 2. Cross-references
 * ------------------------------------------------------------------ */

for (const section of caseSections) {
  for (const related of section.relatedSections) {
    if (!getSection(related))
      fail(`${section.id} relatedSections references unknown id: ${related}`)
    if (related === section.id) fail(`${section.id} lists itself in relatedSections`)
  }
  for (const sourceId of section.sourceIds) {
    if (!getSource(sourceId)) fail(`${section.id} sourceIds references unknown source: ${sourceId}`)
  }
  for (const topicId of section.topicIds) {
    if (!getTopic(topicId)) fail(`${section.id} topicIds references unknown topic: ${topicId}`)
  }
  for (const reference of [...section.primaryPassages, ...section.relatedPassages]) {
    if (!parseReference(reference)) {
      fail(`${section.id} has an unnormalisable Scripture reference: "${reference}"`)
    }
  }
}

// A source that says it is cited by a section must appear in that section's list.
for (const source of sources) {
  for (const sectionId of source.citedBy) {
    const section = getSection(sectionId)
    if (!section) {
      fail(`Source "${source.id}" citedBy references unknown section: ${sectionId}`)
      continue
    }
    if (!section.sourceIds.includes(source.id)) {
      fail(
        `Source "${source.id}" claims to be cited by ${sectionId}, but ${sectionId}.sourceIds ` +
          'does not list it. Keep both sides in step.',
      )
    }
  }
}

for (const topic of topics) {
  for (const sectionId of [...topic.relatedSections, ...topic.relatedObjections]) {
    if (!getSection(sectionId)) fail(`Topic "${topic.id}" references unknown section: ${sectionId}`)
  }
  for (const related of topic.relatedTerms) {
    if (!getTopic(related))
      fail(`Topic "${topic.id}" relatedTerms references unknown topic: ${related}`)
  }
  for (const sourceId of topic.sourceIds) {
    if (!getSource(sourceId)) fail(`Topic "${topic.id}" references unknown source: ${sourceId}`)
  }
  for (const reference of topic.principalPassages) {
    if (!parseReference(reference)) {
      fail(`Topic "${topic.id}" has an unnormalisable reference: "${reference}"`)
    }
  }
}

for (const term of glossary) {
  if (term.topicId && !getTopic(term.topicId)) {
    fail(`Glossary term "${term.id}" references unknown topic: ${term.topicId}`)
  }
  for (const sectionId of term.relatedSections) {
    if (!getSection(sectionId)) {
      fail(`Glossary term "${term.id}" references unknown section: ${sectionId}`)
    }
  }
}

for (const note of languageNotes) {
  for (const sectionId of note.relatedSections) {
    if (!getSection(sectionId))
      fail(`Language note "${note.id}" references unknown section: ${sectionId}`)
  }
  for (const sourceId of note.sourceIds) {
    if (!getSource(sourceId))
      fail(`Language note "${note.id}" references unknown source: ${sourceId}`)
  }
}

for (const revision of revisions) {
  if (revision.sectionId && !getSection(revision.sectionId)) {
    fail(`Revision "${revision.id}" references unknown section: ${revision.sectionId}`)
  }
}

for (const passage of passages) {
  for (const sectionId of passage.usedInSections) {
    if (!getSection(sectionId))
      fail(`Passage "${passage.id}" references unknown section: ${sectionId}`)
  }
  for (const topicId of passage.topicIds) {
    if (!getTopic(topicId)) fail(`Passage "${passage.id}" references unknown topic: ${topicId}`)
  }
  for (const sourceId of passage.sourceIds) {
    if (!getSource(sourceId)) fail(`Passage "${passage.id}" references unknown source: ${sourceId}`)
  }
  for (const quotation of passage.quotations) {
    if (!hasScripture(quotation.reference)) {
      fail(
        `Passage "${passage.id}" quotes "${quotation.reference}", absent from the Scripture corpus.`,
      )
    }
    if (!quotation.translation) fail(`Passage "${passage.id}" quotation lacks a translation.`)
    if (!quotation.licenseId) fail(`Passage "${passage.id}" quotation lacks rights metadata.`)
  }
}

/* ------------------------------------------------------------------ *
 * 3. MDX bodies
 * ------------------------------------------------------------------ */

const PLACEHOLDER = /\b(TODO|FIXME|TBD|lorem ipsum|coming soon|to be written|placeholder)\b/i
const SCRIPTURE_TAG = /<Scripture\s+reference="([^"]+)"/g
const CITE_TAG = /<Cite\s+id="([^"]+)"/g

for (const section of caseSections) {
  const collection = section.group === 'appendix' ? 'appendices' : 'case'
  const file = sectionFileName(section.id, section.slug)

  if (!mdxExists(collection, file)) {
    fail(`${section.id} has no MDX body at packages/ci-content/${collection}/${file}.mdx`)
    continue
  }

  const body = readMdx(collection, file)
  const plain = mdxToPlainText(body)

  if (plain.length < 400) {
    fail(`${section.id} body is only ${plain.length} characters. Every page must be substantive.`)
  }
  if (PLACEHOLDER.test(body)) {
    fail(`${section.id} body contains placeholder text.`)
  }
  if (/^# /m.test(body)) {
    fail(`${section.id} body contains an h1. The template supplies the h1; bodies start at h2.`)
  }
  if (body.trimStart().startsWith('---')) {
    fail(`${section.id} body starts with frontmatter. Metadata belongs in the registry.`)
  }
  if (body.includes('—')) {
    fail(`${section.id} body contains an em dash, which the style guide forbids.`)
  }

  // Heading hierarchy: no h3 before the first h2.
  const headings = extractHeadings(body)
  if (headings.length > 0 && headings[0]?.depth !== 2) {
    fail(`${section.id} body starts with an h3. Heading levels must not skip.`)
  }

  for (const match of body.matchAll(SCRIPTURE_TAG)) {
    const reference = match[1]
    if (!reference) continue
    if (!hasScripture(reference)) {
      fail(
        `${section.id} renders <Scripture reference="${reference}" />, which is not in the ` +
          'verified corpus. Add it to scripts/conditional-immortality/fetch-scripture.ts.',
      )
    }
  }

  for (const match of body.matchAll(CITE_TAG)) {
    const id = match[1]
    if (!id) continue
    if (!getSource(id)) fail(`${section.id} cites unknown source id: ${id}`)
  }
}

/* ------------------------------------------------------------------ *
 * 4. Video and transcript
 * ------------------------------------------------------------------ */

if (video.cues.length < 50) fail('The video transcript looks truncated.')
if (video.chapters.length < 5) fail('The video needs a usable set of chapters.')

let lastEnd = -1
for (const chapter of video.chapters) {
  if (chapter.end <= chapter.start) {
    fail(`Video chapter "${chapter.id}" ends at or before it starts.`)
  }
  if (chapter.start < lastEnd) {
    fail(`Video chapter "${chapter.id}" overlaps the previous chapter.`)
  }
  if (chapter.end > video.durationSeconds) {
    fail(`Video chapter "${chapter.id}" ends after the video does.`)
  }
  lastEnd = chapter.end
  for (const sectionId of chapter.sectionIds) {
    if (!getSection(sectionId)) {
      fail(`Video chapter "${chapter.id}" references unknown section: ${sectionId}`)
    }
  }
}

const lastCue = video.cues[video.cues.length - 1]
if (lastCue && lastCue.start > video.durationSeconds) {
  fail('The last transcript cue starts after the video ends.')
}

/* ------------------------------------------------------------------ *
 * 5. Migration completeness
 * ------------------------------------------------------------------ */

const totals = migrationTotals()
if (totals.unmapped > 0) {
  fail(
    `${totals.unmapped} substantive source elements have no destination. ` +
      'Every substantive element must be mapped, kept private, or marked formatting-only.',
  )
}
if (totals.comments !== commentLedger.length) fail('Comment ledger count mismatch.')
for (const entry of commentLedger) {
  if (entry.destinationSectionId && !getSection(entry.destinationSectionId)) {
    fail(`Comment ledger entry ${entry.commentId} references unknown section.`)
  }
}
if (mediaDispositions.length !== 8) {
  fail(`Expected 8 media dispositions, found ${mediaDispositions.length}.`)
}

/* ------------------------------------------------------------------ *
 * 6. Coverage warnings
 * ------------------------------------------------------------------ */

if (appendixSections.length !== 2) fail('Expected exactly two appendices.')

const referencedTopics = new Set(caseSections.flatMap(section => section.topicIds))
for (const topic of topics) {
  if (!referencedTopics.has(topic.id) && topic.relatedSections.length === 0) {
    warn(`Topic "${topic.id}" is not referenced by any section.`)
  }
}

for (const source of sources) {
  if (source.citedBy.length === 0 && source.type !== 'biblical-text') {
    warn(`Source "${source.id}" is not cited by any section. It will still appear in the library.`)
  }
}

if (scriptureIndex.length < 100) {
  warn(`The Scripture index has only ${scriptureIndex.length} entries, which looks low.`)
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log('Content validation')
console.log('==================')
console.log(`  sections           ${caseSections.length}`)
console.log(`  passages           ${passages.length}`)
console.log(`  topics             ${topics.length}`)
console.log(`  glossary terms     ${glossary.length}`)
console.log(`  language notes     ${languageNotes.length}`)
console.log(`  sources            ${sources.length}`)
console.log(`  revisions          ${revisions.length}`)
console.log(`  Scripture index    ${scriptureIndex.length}`)
console.log(`  transcript cues    ${video.cues.length}`)
console.log(`  ledger entries     ${totals.totalElements} (${totals.unmapped} unmapped)`)
console.log('')

if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s):`)
  for (const warning of warnings) console.log(`  ! ${warning}`)
  console.log('')
}

if (errors.length > 0) {
  console.error(`${errors.length} error(s):`)
  for (const error of errors) console.error(`  x ${error}`)
  process.exit(1)
}

console.log('All content checks passed.')
