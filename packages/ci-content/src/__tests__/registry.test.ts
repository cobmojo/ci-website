import { parseReference } from '@ci/content-schema'
import { describe, expect, it } from 'vitest'
import {
  caseSections,
  caseSectionsByGroup,
  ESSENTIAL_PATH,
  getSection,
  nextSection,
  PRINCIPAL_CLAIMS,
  previousSection,
} from '../case/index'
import { glossary } from '../glossary/index'
import { languageNotes } from '../language/index'
import { commentLedger, mediaDispositions, migrationTotals } from '../migration/index'
import { passages, scriptureIndex } from '../passages/index'
import { revisions } from '../revisions/index'
import {
  getScripture,
  hasScripture,
  requireScripture,
  scriptureReferences,
} from '../scripture/web-text'
import { getSource, sources } from '../sources/index'
import { getTopic, topics } from '../topics/index'
import { video } from '../video/index'

const REQUIRED_IDS = [
  'P00',
  'RB1',
  'RB2',
  'RB3',
  ...Array.from({ length: 34 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`),
  'APP1',
  'APP2',
]

describe('the permanent section registry', () => {
  it('contains exactly the required identifiers', () => {
    expect(caseSections.map(section => section.id).sort()).toEqual([...REQUIRED_IDS].sort())
  })

  it('assigns each section a unique route, slug and order', () => {
    const routes = caseSections.map(section => section.route)
    const orders = caseSections.map(section => section.canonicalOrder)
    const slugKeys = caseSections.map(section => `${section.group}/${section.slug}`)

    expect(new Set(routes).size).toBe(routes.length)
    expect(new Set(orders).size).toBe(orders.length)
    expect(new Set(slugKeys).size).toBe(slugKeys.length)
  })

  it('orders sections canonically with no gaps', () => {
    const orders = caseSections.map(section => section.canonicalOrder)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(orders[0]).toBe(0)
    expect(orders[orders.length - 1]).toBe(caseSections.length - 1)
  })

  it('keeps S17 as Jesus’ death and S18 as physical death', () => {
    // The source document's table of contents reverses these two. The body
    // headings are canonical, and this must not drift back.
    expect(getSection('S17')?.slug).toBe('jesus-death')
    expect(getSection('S17')?.title).toContain('Jesus')
    expect(getSection('S18')?.slug).toBe('physical-and-final-death')
    expect(getSection('S18')?.title).toContain('Physical Death')
  })

  it('routes every route under its declared group', () => {
    for (const section of caseSections) {
      expect(section.route.endsWith('/')).toBe(true)
      expect(section.route).toContain(section.slug)
      if (section.group === 'objection') expect(section.route.startsWith('/objections/')).toBe(true)
      else if (section.group === 'appendix')
        expect(section.route.startsWith('/appendix/')).toBe(true)
      else expect(section.route.startsWith('/case/')).toBe(true)
    }
  })

  it('links previous and next across the whole reading order', () => {
    expect(previousSection('P00')).toBeUndefined()
    expect(nextSection('APP2')).toBeUndefined()

    let cursor = getSection('P00')
    let visited = 0
    while (cursor) {
      visited += 1
      const following = nextSection(cursor.id)
      if (following) expect(previousSection(following.id)?.id).toBe(cursor.id)
      cursor = following
    }
    expect(visited).toBe(caseSections.length)
  })

  it('buckets every section into exactly one group', () => {
    const bucketed = caseSectionsByGroup.flatMap(bucket => bucket.sections.map(s => s.id))
    expect(bucketed.sort()).toEqual(caseSections.map(s => s.id).sort())
  })
})

describe('cross-references', () => {
  it('resolves every related section', () => {
    for (const section of caseSections) {
      for (const related of section.relatedSections) {
        expect(getSection(related), `${section.id} -> ${related}`).toBeDefined()
        expect(related).not.toBe(section.id)
      }
    }
  })

  it('resolves every source and topic id', () => {
    for (const section of caseSections) {
      for (const id of section.sourceIds) {
        expect(getSource(id), `${section.id} source ${id}`).toBeDefined()
      }
      for (const id of section.topicIds) {
        expect(getTopic(id), `${section.id} topic ${id}`).toBeDefined()
      }
    }
  })

  it('keeps citedBy and sourceIds in step', () => {
    for (const source of sources) {
      for (const sectionId of source.citedBy) {
        const section = getSection(sectionId)
        expect(section, `${source.id} citedBy ${sectionId}`).toBeDefined()
        expect(section?.sourceIds).toContain(source.id)
      }
    }
  })

  it('keeps sourceIds and citedBy in step, which is the direction that drifted', () => {
    // Only the first direction was checked, so a source could be dropped from
    // `citedBy` and left behind on the section. One was: P00 went on listing
    // `sprinkle-introduction` after that record was corrected to
    // `citedBy: []` with the note that "it was listed against P00, whose text
    // never mentions it". Nothing renders `CaseSection.sourceIds`, so the two
    // could disagree indefinitely without a page ever showing it.
    const known = new Map(sources.map(source => [source.id, source]))
    for (const section of caseSections) {
      for (const sourceId of section.sourceIds) {
        const source = known.get(sourceId)
        expect(source, `${section.id} lists unknown source ${sourceId}`).toBeDefined()
        expect(source?.citedBy, `${section.id} lists ${sourceId}`).toContain(section.id)
      }
    }
  })

  it('normalises every Scripture reference in the registry', () => {
    for (const section of caseSections) {
      for (const reference of [...section.primaryPassages, ...section.relatedPassages]) {
        expect(parseReference(reference), `${section.id}: ${reference}`).toBeDefined()
      }
    }
  })

  it('normalises every reference in the Scripture corpus and index', () => {
    // If the versification table and the corpus disagree, the parser rejects
    // text the site can render. Fail here rather than on the page.
    for (const reference of scriptureReferences) {
      expect(parseReference(reference), `corpus: ${reference}`).toBeDefined()
    }
    for (const entry of scriptureIndex) {
      expect(parseReference(entry.reference), `index: ${entry.reference}`).toBeDefined()
    }
  })

  it('points every revision at a real section', () => {
    for (const revision of revisions) {
      if (revision.sectionId) expect(getSection(revision.sectionId)).toBeDefined()
    }
  })
})

describe('the six principal claims', () => {
  it('are numbered one to six', () => {
    expect(PRINCIPAL_CLAIMS.map(claim => claim.number)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('reference only real sections', () => {
    for (const claim of PRINCIPAL_CLAIMS) {
      expect(claim.sectionIds.length).toBeGreaterThan(0)
      for (const id of claim.sectionIds) expect(getSection(id), `${claim.id}: ${id}`).toBeDefined()
    }
  })

  it('cover every load-bearing pillar in the essential path', () => {
    for (const id of ESSENTIAL_PATH) expect(getSection(id), id).toBeDefined()
    expect(new Set(ESSENTIAL_PATH).size).toBe(ESSENTIAL_PATH.length)
  })
})

describe('passages and the Scripture index', () => {
  it('gives every passage verified, rights-bearing quotations', () => {
    for (const passage of passages) {
      expect(passage.quotations.length).toBeGreaterThan(0)
      for (const quotation of passage.quotations) {
        expect(hasScripture(quotation.reference), `${passage.id}: ${quotation.reference}`).toBe(
          true,
        )
        expect(quotation.translation).toBeTruthy()
        expect(quotation.licenseId).toBeTruthy()
        expect(quotation.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    }
  })

  it('states both readings and a point of disagreement for every passage', () => {
    for (const passage of passages) {
      expect(passage.ectReading.length, passage.id).toBeGreaterThan(120)
      expect(passage.conditionalistReading.length, passage.id).toBeGreaterThan(120)
      expect(passage.disagreement.length, passage.id).toBeGreaterThan(60)
      expect(passage.agreements.length, passage.id).toBeGreaterThan(0)
    }
  })

  it('sorts the Scripture index canonically', () => {
    const keys = scriptureIndex.map(entry => entry.sortKey)
    expect(keys).toEqual([...keys].sort((a, b) => a - b))
  })

  it('records at least one use for every index entry', () => {
    for (const entry of scriptureIndex) {
      expect(entry.uses.length, entry.reference).toBeGreaterThan(0)
      expect(entry.useCount).toBe(entry.uses.length)
      for (const use of entry.uses) expect(getSection(use.sectionId)).toBeDefined()
    }
  })
})

describe('editorial integrity', () => {
  it('gives every section a role, a status and a thesis', () => {
    for (const section of caseSections) {
      expect(section.evidenceRole).toBeTruthy()
      expect(section.reviewStatus).toBeTruthy()
      expect(section.thesis.length).toBeGreaterThan(40)
      expect(section.shortSummary.length).toBeGreaterThan(40)
      expect(section.originalPages.length).toBeGreaterThan(0)
    }
  })

  it('states what each core argument does not establish', () => {
    for (const section of caseSections) {
      if (section.evidenceRole !== 'core-biblical') continue
      expect(
        section.doesNotEstablish.length,
        `${section.id} must state its limits`,
      ).toBeGreaterThan(0)
    }
  })

  it('carries a caveat wherever review is outstanding', () => {
    for (const section of caseSections) {
      if (
        section.reviewStatus === 'specialist-review-pending' ||
        section.reviewStatus === 'revision-needed' ||
        section.reviewStatus === 'authors-present-interpretation' ||
        section.reviewStatus === 'alternative-conditionalist-reading'
      ) {
        expect(section.caveats.length, `${section.id} needs a caveat`).toBeGreaterThan(0)
      }
    }
  })

  it('gives disputed passages a fair statement of the opposing reading', () => {
    for (const id of ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S10']) {
      const section = getSection(id)
      expect(section?.ectPosition, `${id} must state the ECT reading`).toBeTruthy()
      expect((section?.ectPosition ?? '').length).toBeGreaterThan(120)
    }
  })

  it('never contains an em dash in registry prose', () => {
    for (const section of caseSections) {
      const prose = [
        section.title,
        section.thesis,
        section.shortSummary,
        section.ectPosition ?? '',
        section.conditionalistResponse ?? '',
        ...section.establishes,
        ...section.doesNotEstablish,
        ...section.caveats,
      ].join(' ')
      expect(prose, section.id).not.toContain('—')
    }
  })
})

describe('topics, glossary and language notes', () => {
  it('keeps the four final-state terms distinct', () => {
    for (const id of ['hades', 'sheol', 'gehenna', 'lake-of-fire']) {
      const topic = getTopic(id)
      expect(topic, id).toBeDefined()
      expect(topic?.distinctions.length, `${id} must state what it is not`).toBeGreaterThan(0)
    }
  })

  it('keeps glossary entries short', () => {
    for (const term of glossary) {
      expect(term.definition.length, term.id).toBeGreaterThan(40)
      expect(
        term.definition.length,
        `${term.id} should link to a topic instead of expanding`,
      ).toBeLessThan(700)
    }
  })

  it('marks language notes that depend on Greek or Hebrew for specialist review', () => {
    for (const note of languageNotes) {
      expect(note.competingInterpretations.length, note.id).toBeGreaterThan(0)
      expect(note.sourceIds.length, note.id).toBeGreaterThan(0)
      expect(note.lexicalRange.length, note.id).toBeGreaterThan(0)
    }
  })

  it('resolves every topic cross-reference', () => {
    for (const topic of topics) {
      for (const related of topic.relatedTerms) expect(getTopic(related), related).toBeDefined()
      for (const id of [...topic.relatedSections, ...topic.relatedObjections]) {
        expect(getSection(id), `${topic.id} -> ${id}`).toBeDefined()
      }
    }
  })
})

describe('migration completeness', () => {
  it('maps every substantive source element', () => {
    expect(migrationTotals().unmapped).toBe(0)
  })

  it('gives every source comment a disposition and a reason', () => {
    expect(commentLedger.length).toBeGreaterThan(0)
    for (const entry of commentLedger) {
      expect(entry.disposition, entry.commentId).toBeTruthy()
      expect(entry.reason.length, entry.commentId).toBeGreaterThan(15)
      if (entry.destinationSectionId) {
        expect(getSection(entry.destinationSectionId), entry.commentId).toBeDefined()
      }
    }
  })

  it('names no commenter', () => {
    // Comment authors are role labels only. Real names stay in private/source.
    for (const entry of commentLedger) {
      expect(['The author', 'A reviewer']).toContain(entry.author)
    }
  })

  it('accounts for all eight embedded media assets', () => {
    expect(mediaDispositions).toHaveLength(8)
    for (const media of mediaDispositions) {
      expect(media.treatment).toBeTruthy()
      expect(media.note.length).toBeGreaterThan(20)
    }
  })
})

describe('the featured video', () => {
  it('carries a complete transcript with real timings', () => {
    expect(video.cues.length).toBeGreaterThan(200)
    expect(video.durationSeconds).toBe(1712)

    let previous = -1
    for (const cue of video.cues) {
      expect(cue.start).toBeGreaterThanOrEqual(previous)
      previous = cue.start
    }
    const last = video.cues[video.cues.length - 1]
    expect(last).toBeDefined()
    expect((last?.start ?? 0) + (last?.duration ?? 0)).toBeLessThanOrEqual(
      video.durationSeconds + 1,
    )
  })

  it('keeps chapters in order, inside the video, and pointing at real sections', () => {
    let previousEnd = -1
    for (const chapter of video.chapters) {
      expect(chapter.end).toBeGreaterThan(chapter.start)
      expect(chapter.start).toBeGreaterThanOrEqual(previousEnd)
      expect(chapter.end).toBeLessThanOrEqual(video.durationSeconds)
      previousEnd = chapter.end
      for (const id of chapter.sectionIds) expect(getSection(id), chapter.id).toBeDefined()
    }
  })
})

describe('rights metadata', () => {
  it('gives every source a rights status', () => {
    for (const source of sources) {
      expect(source.rightsStatus, source.id).toBeTruthy()
    }
  })

  it('records an access date for anything cited by URL', () => {
    for (const source of sources) {
      if (source.url) expect(source.accessedAt, source.id).toBeTruthy()
    }
  })

  it('never publishes a mailto or tel link as a source URL', () => {
    for (const source of sources) {
      expect(source.url ?? '').not.toMatch(/^(mailto|tel):/i)
      expect(source.sourceDocumentUrl ?? '').not.toMatch(/^(mailto|tel):/i)
    }
  })

  /**
   * A published citation must say where it goes.
   *
   * `/sources/` renders every one of these URLs as a link, the downloadable
   * bibliography prints them, and the search index carries them, so a source
   * URL is public by construction. A shortener or a shared-drive link hides its
   * destination behind a redirect, which means the registry cannot be reviewed
   * by reading it — and this is not hypothetical: `tinyurl.com/ECTvsCI` was
   * published here and resolved, in one hop, to the private working document
   * that `docs/rights-audit.md` withholds precisely because it opens with a
   * personal email address and phone number and carries thirty unconsented
   * third-party comments.
   */
  const OPAQUE_OR_PRIVATE_HOSTS = [
    'tinyurl.com',
    'bit.ly',
    'goo.gl',
    't.co',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'rebrand.ly',
    'docs.google.com',
    'drive.google.com',
    'dropbox.com',
    '1drv.ms',
    'onedrive.live.com',
    'sharepoint.com',
  ]

  it('never publishes a shortened or shared-drive URL, which could resolve anywhere', () => {
    for (const source of sources) {
      for (const [field, value] of Object.entries({
        url: source.url,
        archiveUrl: source.archiveUrl,
        sourceDocumentUrl: source.sourceDocumentUrl,
      })) {
        if (!value) continue
        const host = new URL(value).hostname.replace(/^www\./, '')
        for (const forbidden of OPAQUE_OR_PRIVATE_HOSTS) {
          expect(
            host === forbidden || host.endsWith(`.${forbidden}`),
            `${source.id}.${field} points at ${host}, whose destination the registry cannot show`,
          ).toBe(false)
        }
      }
    }
  })
})

/**
 * The corpus is a plain object literal, so a bare `in` check or index reaches
 * its prototype and every accessor has to guard against it.
 */
describe('the Scripture corpus does not answer for its prototype', () => {
  const INHERITED = [
    'constructor',
    'toString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    '__proto__',
    '__defineGetter__',
  ]

  it('reports no passage for an inherited property name', () => {
    for (const name of INHERITED) {
      expect(hasScripture(name), name).toBe(false)
    }
  })

  it('returns nothing for an inherited property name', () => {
    for (const name of INHERITED) {
      expect(getScripture(name), name).toBeUndefined()
    }
  })

  it('throws for an inherited property name, as it does for any unknown reference', () => {
    for (const name of INHERITED) {
      expect(() => requireScripture(name), name).toThrow(/No verified Scripture text/)
    }
    expect(() => requireScripture('Nowhere 1:1')).toThrow(/No verified Scripture text/)
  })

  it('still finds a real passage', () => {
    expect(hasScripture('Mark 9:42-48')).toBe(true)
    expect(getScripture('Mark 9:42-48')?.reference).toBe('Mark 9:42-48')
    expect(requireScripture('Mark 9:42-48').text.length).toBeGreaterThan(0)
  })
})

/**
 * The Scripture corpus is quoted, not written.
 *
 * Every full Scripture display on the site renders from this corpus under an
 * attribution naming the World English Bible, so a transcription slip is a
 * misquotation of a named translation on a site whose whole argument is that
 * its sources can be checked. Four verses had lost the space after a comma or
 * a full stop — "sorcerers,idolaters", "denarii,and he grabbed",
 * "commandments,that they may", "Gehenna.Yes, I tell you" — across eight
 * routes, and the project's own migration ledger carried the correct text for
 * the one it covers.
 *
 * Punctuation is never immediately followed by a letter in running English
 * prose, so the whole class is checkable without a second copy of the Bible.
 */
describe('the quoted Scripture text', () => {
  it('never runs punctuation into the next word', () => {
    const offenders: string[] = []
    for (const reference of scriptureReferences) {
      const quotation = getScripture(reference)
      const bodies = [quotation?.text ?? '', ...(quotation?.verses ?? []).map(verse => verse.text)]
      for (const body of bodies) {
        for (const match of body.matchAll(/[\p{L}\u2019][,;:.!?][\p{L}]/gu)) {
          const at = match.index ?? 0
          offenders.push(`${reference}: ...${body.slice(Math.max(0, at - 30), at + 30)}...`)
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([])
  })

  it('never carries a doubled space or a space before punctuation', () => {
    const offenders: string[] = []
    for (const reference of scriptureReferences) {
      const quotation = getScripture(reference)
      const bodies = [quotation?.text ?? '', ...(quotation?.verses ?? []).map(verse => verse.text)]
      for (const body of bodies) {
        if (/ {2}/.test(body)) offenders.push(`${reference}: doubled space`)
        if (/\s[,;:.!?]/.test(body)) offenders.push(`${reference}: space before punctuation`)
      }
    }
    expect([...new Set(offenders)]).toEqual([])
  })
})
