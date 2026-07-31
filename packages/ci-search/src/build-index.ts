import {
  appendixSections,
  caseSections,
  extractHeadings,
  formatCitation,
  glossary,
  languageNotes,
  mdxExists,
  mdxToPlainText,
  passages,
  readMdx,
  sectionFileName,
  sources,
  topics,
  video,
} from '@ci/content'
import { CASE_GROUP_LABELS, parseReference } from '@ci/content-schema'
import type { SearchDoc, SearchIndex } from './types'

/**
 * Build the search index from the content registries.
 *
 * Runs at build time and is written out as a static JSON asset, so there is no
 * hosted search service to depend on and no query ever reaches a third party.
 *
 * Two surfaces score against it. The quick panel fetches the file and scores
 * in the reader's browser, so what they type there is never transmitted. The
 * `/search/` page is a Server Component scoring the same index on this site's
 * own server, which is what makes it work without scripting and makes a page
 * of results linkable — at the cost of the term travelling in the URL. The
 * privacy page states that distinction; keep the two in step.
 */

const appendixIds = new Set(appendixSections.map(section => section.id))

/**
 * Headings on the templated pages are listed by hand, because those pages are
 * TSX rather than MDX and there is no body to extract them from. Several of
 * the sections are conditional, so the lists have to be conditional too: a
 * heading claimed for a page that does not render it makes search report
 * "matched in heading" against text the reader will never find, and one left
 * out makes a real heading unfindable. `tests/e2e/content.spec.ts` fetches
 * every route in the index and fails if either happens.
 *
 * Chrome that every page of a kind carries — the sources panel, the feedback
 * form — is deliberately left out. Indexing it would match every passage on
 * the word "sources" without telling a reader anything.
 */
const sectionIds = new Set(caseSections.map(section => section.id))
const topicIds = new Set(topics.map(topic => topic.id))
const passageSlugs = new Set(passages.map(passage => passage.slug))

/** Does any of these ids resolve, as the page's own `.filter(Boolean)` asks? */
const anyResolves = (ids: readonly string[], known: ReadonlySet<string>) =>
  ids.some(id => known.has(id))

/** A heading, but only when the section that carries it is rendered. */
const headingIf = (rendered: boolean, heading: string) => (rendered ? [heading] : [])

/** `86` -> `1:26`, matching how `/watch/` prints its timestamps. */
const timestamp = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function booksIn(references: readonly string[]): string[] {
  const books = new Set<string>()
  for (const reference of references) {
    const parsed = parseReference(reference)
    if (parsed) books.add(parsed.book)
  }
  return [...books]
}

function normaliseRefs(references: readonly string[]): string[] {
  const out = new Set<string>()
  for (const reference of references) {
    const parsed = parseReference(reference)
    if (!parsed) continue
    out.add(parsed.normalized)
    // Chapter-level form so "Revelation 20" finds "Revelation 20:10-15".
    out.add(`${parsed.book} ${parsed.chapter}`)
  }
  return [...out]
}

function caseSectionDocs(): SearchDoc[] {
  return caseSections.map(section => {
    const collection = section.group === 'appendix' ? 'appendices' : 'case'
    const file = sectionFileName(section.id, section.slug)
    const body = mdxExists(collection, file) ? readMdx(collection, file) : ''
    const references = [...section.primaryPassages, ...section.relatedPassages]

    return {
      id: `section:${section.id}`,
      type: appendixIds.has(section.id)
        ? 'appendix'
        : section.group === 'objection'
          ? 'objection'
          : 'case-section',
      route: section.route,
      title: section.title,
      sectionId: section.id,
      breadcrumb: CASE_GROUP_LABELS[section.group],
      summary: `${section.thesis} ${section.shortSummary}`,
      headings: extractHeadings(body).map(heading => heading.text),
      scriptureRefs: normaliseRefs(references),
      body: mdxToPlainText(body),
      notes: [
        ...section.establishes,
        ...section.doesNotEstablish,
        ...section.caveats,
        section.ectPosition ?? '',
        section.conditionalistResponse ?? '',
      ].join(' '),
      aliases: [section.id, ...section.aliases, section.question ?? ''].filter(Boolean),
      caseGroup: section.group,
      bibleBooks: booksIn(references),
      topicIds: [...section.topicIds],
      evidenceRole: section.evidenceRole,
    }
  })
}

function passageDocs(): SearchDoc[] {
  return passages.map(passage => {
    const references = [passage.normalizedReference, ...passage.additionalReferences]
    return {
      id: `passage:${passage.id}`,
      type: 'passage',
      route: `/passages/${passage.slug}/`,
      title: passage.normalizedReference,
      breadcrumb: 'Key passage',
      summary: passage.shortDescription,
      headings: [
        'The text',
        'The immediate context',
        ...headingIf(Boolean(passage.canonicalContext), 'Where it sits in the canon'),
        'Why it matters',
        'How the passage is interpreted',
        ...headingIf(passage.languageNotes.length > 0, 'Notes on the wording'),
        ...headingIf(passage.notes.length > 0, 'Editorial notes'),
        // This heading sits outside its own conditional: a passage with no
        // section to point at still gets the heading, and a line saying so.
        'Where this passage appears in the case',
        ...headingIf(anyResolves(passage.relatedPassages, passageSlugs), 'Related passages'),
      ],
      scriptureRefs: normaliseRefs(references),
      body: [
        passage.immediateContext,
        passage.canonicalContext ?? '',
        passage.whyItMatters,
        passage.ectReading,
        passage.conditionalistReading,
        passage.disagreement,
        ...passage.agreements,
        ...passage.languageNotes,
        ...passage.notes,
      ].join(' '),
      notes: passage.notes.join(' '),
      aliases: references,
      bibleBooks: booksIn(references),
      topicIds: [...passage.topicIds],
    }
  })
}

function topicDocs(): SearchDoc[] {
  return topics.map(topic => ({
    id: `topic:${topic.id}`,
    type: 'topic',
    route: `/topics/${topic.slug}/`,
    title: topic.title,
    breadcrumb: 'Topic',
    summary: topic.definition,
    headings: [
      ...headingIf(topic.distinctions.length > 0, 'What this is not'),
      ...headingIf(topic.principalPassages.length > 0, 'Principal passages'),
      ...headingIf(
        anyResolves(topic.relatedSections, sectionIds),
        'Where this is argued in the case',
      ),
      ...headingIf(
        anyResolves(topic.relatedObjections, sectionIds),
        'Objections that turn on this',
      ),
      ...headingIf(anyResolves(topic.relatedTerms, topicIds), 'Related topics'),
    ],
    scriptureRefs: normaliseRefs(topic.principalPassages),
    body: [...topic.body, ...topic.distinctions, ...topic.openQuestions].join(' '),
    notes: topic.openQuestions.join(' '),
    aliases: [...topic.aliases, topic.slug],
    bibleBooks: booksIn(topic.principalPassages),
    topicIds: [topic.id],
  }))
}

function glossaryDocs(): SearchDoc[] {
  return glossary.map(term => ({
    id: `glossary:${term.id}`,
    type: 'glossary',
    route: `/glossary/#${term.id}`,
    title: term.term,
    breadcrumb: 'Glossary',
    summary: term.definition,
    headings: [],
    scriptureRefs: [],
    body: term.definition,
    notes: '',
    aliases: [...term.aliases, term.transliteration ?? '', term.original ?? ''].filter(Boolean),
    bibleBooks: [],
    topicIds: term.topicId ? [term.topicId] : [],
  }))
}

function sourceDocs(): SearchDoc[] {
  return sources.map(source => ({
    id: `source:${source.id}`,
    type: 'source',
    route: `/sources/#${source.id}`,
    title: source.title,
    breadcrumb: 'Source',
    summary: formatCitation(source),
    headings: [],
    scriptureRefs: [],
    body: [formatCitation(source), source.note ?? ''].join(' '),
    notes: source.note ?? '',
    aliases: [source.author ?? '', source.publication ?? '', source.id].filter(Boolean),
    bibleBooks: [],
    topicIds: [],
    sourceType: source.type,
    author: source.author,
    perspective: source.perspective,
  }))
}

function languageDocs(): SearchDoc[] {
  return languageNotes.map(note => ({
    id: `language:${note.id}`,
    type: 'language-note',
    route: `/glossary/#note-${note.id}`,
    title: `${note.transliteration} (${note.lemma})`,
    breadcrumb: 'Language note',
    summary: note.gloss,
    headings: [],
    scriptureRefs: normaliseRefs(note.occurrences),
    body: [note.contextualArgument, ...note.lexicalRange, ...note.competingInterpretations].join(
      ' ',
    ),
    notes: note.competingInterpretations.join(' '),
    aliases: [note.lemma, note.transliteration, note.id],
    bibleBooks: booksIn(note.occurrences),
    topicIds: [],
  }))
}

/**
 * Transcript documents, one per chapter rather than one per cue.
 *
 * A cue is about six seconds of speech, which is too small to make a useful
 * result. Grouping by chapter gives a result the reader can act on, and the
 * chapter start time is carried so the result can deep-link into the video.
 */
function transcriptDocs(): SearchDoc[] {
  return video.chapters.map(chapter => {
    const text = video.cues
      .filter(cue => cue.start >= chapter.start && cue.start < chapter.end)
      .map(cue => cue.text)
      .join(' ')
    return {
      id: `transcript:${chapter.id}`,
      type: 'transcript',
      route: `/watch/#${chapter.id}`,
      title: chapter.title,
      breadcrumb: 'Video transcript',
      // A search row shows this whole string, so "1 minutes 26 seconds" was
      // reaching readers. The site writes timestamps as `1:26` everywhere else.
      summary: `Video overview, from ${timestamp(chapter.start)}.`,
      headings: [],
      scriptureRefs: [],
      body: text,
      notes: chapter.visualDescription ?? '',
      aliases: chapter.sectionIds,
      bibleBooks: [],
      topicIds: [],
      timestamp: chapter.start,
    }
  })
}

/** Landing and reference pages that carry no content record of their own. */
const STATIC_PAGE_DOCS: SearchDoc[] = [
  {
    id: 'page:start',
    type: 'page',
    route: '/start/',
    title: 'Start Here',
    breadcrumb: 'Start',
    summary:
      'A short orientation: what conditional immortality claims, how it differs from eternal conscious torment and from universal reconciliation, and where to begin reading.',
    headings: [
      'What conditional immortality is',
      'How it differs from the two neighbouring views',
      'A cumulative case, not one isolated proof text',
      'The six principal claims',
      'The essential reading path',
      'Other ways in',
    ],
    scriptureRefs: [],
    body: 'orientation summary three minutes what is conditional immortality compare the views case map essential reading path cumulative case',
    notes: '',
    aliases: ['start here', 'three minute summary', 'orientation'],
    bibleBooks: [],
    topicIds: [],
  },
  {
    id: 'page:compare',
    type: 'page',
    route: '/start/compare-the-views/',
    title: 'Compare the Views',
    breadcrumb: 'Start',
    summary:
      'Eternal conscious torment, conditional immortality and universal reconciliation set side by side on human immortality, resurrection, judgment, the nature of punishment and the final fate of the unrighteous.',
    headings: [
      'Seven questions, three answers',
      'What all three views agree on',
      'Where the argument is made',
    ],
    scriptureRefs: [],
    body: 'comparison table eternal conscious torment conditional immortality universal reconciliation universalism traditional view differences agreements',
    notes: '',
    aliases: ['compare', 'ect vs ci', 'three views', 'comparison'],
    bibleBooks: [],
    topicIds: ['eternal-conscious-torment', 'conditional-immortality', 'universal-reconciliation'],
  },
  {
    id: 'page:method',
    type: 'page',
    route: '/method/',
    title: 'Method',
    breadcrumb: 'About',
    summary:
      'How this site handles Scripture, translations, original languages, historical claims, evidence-role labels, review statuses, corrections and unresolved questions.',
    headings: [
      'The authority given to Scripture',
      'Why the case is cumulative',
      'Direct evidence and inference',
      'How the opposing view is presented',
      'How Bible translations are handled',
      'How original languages are handled',
      'How historical claims are reviewed',
      'The evidence-role labels',
      'The review-status labels',
      'The source hierarchy',
      'Corrections and revisions',
      'How unresolved issues are shown',
      'Why philosophy is not treated as proof',
      'Why this stays open to correction',
    ],
    scriptureRefs: [],
    body: 'method editorial policy evidence role review status source hierarchy correction process translation policy public domain world english bible cumulative case inference',
    notes: '',
    aliases: ['method', 'editorial policy', 'how this was made'],
    bibleBooks: [],
    topicIds: [],
  },
  {
    id: 'page:about',
    type: 'page',
    route: '/about/',
    title: 'About',
    breadcrumb: 'About',
    summary:
      'Who wrote the source document, how the position was reached, and how to send a correction.',
    headings: [
      'Who wrote this',
      'How he came to this position',
      'What this site is for',
      'What kind of case this is',
      'Independence',
      'How to make contact',
    ],
    scriptureRefs: [],
    body: 'about the author Phil Welch thirty five years eternal conscious torment November 2022 Preston Sprinkle skeptical persuaded open to correction',
    notes: '',
    aliases: ['about', 'author', 'phil welch'],
    bibleBooks: [],
    topicIds: [],
  },
]

export function buildSearchIndex(): SearchIndex {
  const docs: SearchDoc[] = [
    ...caseSectionDocs(),
    ...passageDocs(),
    ...topicDocs(),
    ...glossaryDocs(),
    ...sourceDocs(),
    ...languageDocs(),
    ...transcriptDocs(),
    ...STATIC_PAGE_DOCS,
  ]

  const seen = new Set<string>()
  for (const doc of docs) {
    if (seen.has(doc.id)) throw new Error(`Duplicate search document id: ${doc.id}`)
    seen.add(doc.id)
  }

  return { builtAt: new Date().toISOString().slice(0, 10), docs }
}
