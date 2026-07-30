/**
 * Typed content models for The Case for Conditional Immortality.
 *
 * Every content record in `@ci/content` is validated against these schemas at
 * build time. A schema failure fails the build rather than shipping a page with
 * a missing thesis, an unknown source id or an unnormalisable Scripture reference.
 */
import { z } from 'zod'
import { feedbackStatuses, feedbackTypes, publicationConsents } from './feedback-vocabulary'

export * from './bible'
export * from './feedback-vocabulary'

/* ------------------------------------------------------------------ *
 * Editorial vocabularies
 * ------------------------------------------------------------------ */

export const evidenceRoles = [
  'core-biblical',
  'supporting-biblical',
  'historical-linguistic',
  'theological-inference',
  'further-consideration',
] as const
export const EvidenceRoleSchema = z.enum(evidenceRoles)
export type EvidenceRole = z.infer<typeof EvidenceRoleSchema>

export const EVIDENCE_ROLE_LABELS: Record<EvidenceRole, string> = {
  'core-biblical': 'Core biblical argument',
  'supporting-biblical': 'Supporting biblical argument',
  'historical-linguistic': 'Historical or linguistic argument',
  'theological-inference': 'Theological inference',
  'further-consideration': 'Further consideration',
}

export const EVIDENCE_ROLE_DEFINITIONS: Record<EvidenceRole, string> = {
  'core-biblical':
    'The argument rests directly on what a biblical text says, read in its own literary context. If this argument fails, the cumulative case is materially weaker.',
  'supporting-biblical':
    'The argument draws on biblical material, but it reinforces a conclusion established elsewhere rather than carrying weight on its own.',
  'historical-linguistic':
    'The argument depends on evidence about history, or about how a Greek or Hebrew word is used. It is only as strong as the sources cited, which are named in full.',
  'theological-inference':
    'The conclusion is inferred from several biblical claims taken together. Scripture does not state it in so many words, and the inference is identified as an inference.',
  'further-consideration':
    'An observation, illustration or pastoral reflection. It is offered as something worth thinking about, not as evidence that the position is true.',
}

export const reviewStatuses = [
  'source-checked',
  'specialist-review-pending',
  'reviewed',
  'revision-needed',
  'authors-present-interpretation',
  'alternative-conditionalist-reading',
] as const
export const ReviewStatusSchema = z.enum(reviewStatuses)
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  'source-checked': 'Source checked',
  'specialist-review-pending': 'Specialist review pending',
  reviewed: 'Reviewed',
  'revision-needed': 'Revision needed',
  'authors-present-interpretation': "Author's present interpretation",
  'alternative-conditionalist-reading': 'Alternative conditionalist reading',
}

export const REVIEW_STATUS_DEFINITIONS: Record<ReviewStatus, string> = {
  'source-checked':
    'Every source cited on this page has been retrieved and checked against the claim it supports.',
  'specialist-review-pending':
    'The page makes a claim about Greek, Hebrew or primary historical texts that would benefit from review by someone with formal training in that field.',
  reviewed: 'The page has been read end to end against the source document and its own citations.',
  'revision-needed': 'A known problem with this page is recorded and a revision is outstanding.',
  'authors-present-interpretation':
    "This is the author's current reading, offered as his own judgement rather than as a settled conclusion. Other conditionalists read it differently.",
  'alternative-conditionalist-reading':
    'The page sets out a reading that some conditionalists hold and others do not. It is not required by the wider case.',
}

export const caseGroups = [
  'preface',
  'roadblock',
  'key-text',
  'biblical-language',
  'biblical-pattern',
  'final-destiny',
  'further-reasoning',
  'objection',
  'appendix',
] as const
export const CaseGroupSchema = z.enum(caseGroups)
export type CaseGroup = z.infer<typeof CaseGroupSchema>

export const CASE_GROUP_LABELS: Record<CaseGroup, string> = {
  preface: 'Preface',
  roadblock: 'Roadblock',
  'key-text': 'Key Text',
  'biblical-language': 'Biblical Language',
  'biblical-pattern': 'Biblical Pattern',
  'final-destiny': 'Final Destiny',
  'further-reasoning': 'Further Reasoning',
  objection: 'Objection',
  appendix: 'Appendix',
}

/* ------------------------------------------------------------------ *
 * Shared primitives
 * ------------------------------------------------------------------ */

const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be ISO calendar dates (YYYY-MM-DD)')

const SectionId = z
  .string()
  .regex(/^(P00|RB[1-3]|S(0[1-9]|[12]\d|3[0-4])|APP[12])$/, 'Unknown permanent section id')

const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slugs are lower-case words joined by single hyphens')

const Route = z
  .string()
  .regex(
    /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/,
    'Routes are lower-case, slash-delimited and end in /',
  )

const NonEmpty = z.string().trim().min(1)

/**
 * Prose fields must be real sentences, never a placeholder. The content audit
 * scans rendered output too, but catching it in the schema gives a far better
 * error message pointing at the offending record.
 */
const PLACEHOLDER_PATTERN =
  /\b(lorem ipsum|coming soon|todo|tbd|fixme|placeholder|xxx+|to be written|wip)\b/i

const Prose = (min: number) =>
  NonEmpty.min(min).refine(value => !PLACEHOLDER_PATTERN.test(value), {
    message: 'Prose field contains placeholder text',
  })

/* ------------------------------------------------------------------ *
 * Case sections
 * ------------------------------------------------------------------ */

export const CaseSectionSchema = z
  .object({
    id: SectionId,
    canonicalOrder: z.number().int().min(0),
    group: CaseGroupSchema,

    slug: Slug,
    route: Route,
    title: Prose(4),
    /** Optional question form used for card headings and search aliases. */
    question: Prose(8).optional(),
    thesis: Prose(40),
    shortSummary: Prose(40),

    evidenceRole: EvidenceRoleSchema,
    reviewStatus: ReviewStatusSchema,

    /** Page numbers in the original 52-page DOCX, for traceability. */
    originalPages: z.array(z.number().int().positive()).min(1),
    /** `p123` ids from the source inventory that this page carries. */
    sourceParagraphIds: z.array(z.string().regex(/^p\d+$/)).min(1),

    primaryPassages: z.array(NonEmpty).default([]),
    relatedPassages: z.array(NonEmpty).default([]),
    relatedSections: z.array(SectionId).default([]),
    topicIds: z.array(Slug).default([]),
    sourceIds: z.array(NonEmpty).default([]),

    /** Fair statement of how ECT interpreters read the material on this page. */
    ectPosition: Prose(40).optional(),
    conditionalistResponse: Prose(40).optional(),

    establishes: z.array(Prose(15)).default([]),
    doesNotEstablish: z.array(Prose(15)).default([]),
    caveats: z.array(Prose(15)).default([]),
    aliases: z.array(NonEmpty).default([]),

    firstPublished: IsoDate.optional(),
    lastReviewed: IsoDate.optional(),
    lastSubstantiveRevision: IsoDate.optional(),
  })
  .strict()

export type CaseSection = z.infer<typeof CaseSectionSchema>

/* ------------------------------------------------------------------ *
 * Passages
 * ------------------------------------------------------------------ */

export const passageRoles = [
  'primary-support',
  'ect-proof-text',
  'parallel',
  'definition',
  'objection',
  'pastoral',
  'background',
] as const
export const PassageRoleSchema = z.enum(passageRoles)
export type PassageRole = z.infer<typeof PassageRoleSchema>

export const PASSAGE_ROLE_LABELS: Record<PassageRole, string> = {
  'primary-support': 'Primary support for conditional immortality',
  'ect-proof-text': 'Eternal conscious torment proof text being addressed',
  parallel: 'Parallel or example',
  definition: 'Definition or word study',
  objection: 'Objection',
  pastoral: 'Pastoral implication',
  background: 'Background context',
}

/**
 * A Scripture quotation carries its own rights record. The build refuses any
 * quotation without a translation and a licence id, because the site publishes
 * biblical text at scale and cannot rely on incidental-quotation allowances.
 */
export const ScriptureQuotationSchema = z
  .object({
    reference: NonEmpty,
    translation: NonEmpty,
    licenseId: NonEmpty,
    text: Prose(10),
    sourceUrl: z.string().url().optional(),
    verifiedAt: IsoDate,
  })
  .strict()

export type ScriptureQuotation = z.infer<typeof ScriptureQuotationSchema>

export const PassageRecordSchema = z
  .object({
    id: Slug,
    slug: Slug,
    normalizedReference: NonEmpty,

    book: NonEmpty,
    bookOrder: z.number().int().min(1).max(66),
    chapter: z.number().int().min(1),
    verseStart: z.number().int().min(1).optional(),
    verseEnd: z.number().int().min(1).optional(),
    /** Additional references covered by the same page, e.g. Rev 21-22. */
    additionalReferences: z.array(NonEmpty).default([]),

    shortDescription: Prose(30),
    quotations: z.array(ScriptureQuotationSchema).min(1),

    roles: z.array(PassageRoleSchema).min(1),
    usedInSections: z.array(SectionId).default([]),
    relatedPassages: z.array(Slug).default([]),
    topicIds: z.array(Slug).default([]),

    immediateContext: Prose(80),
    canonicalContext: Prose(80).optional(),
    whyItMatters: Prose(80),
    ectReading: Prose(120),
    conditionalistReading: Prose(120),
    agreements: z.array(Prose(15)).min(1),
    disagreement: Prose(60),
    languageNotes: z.array(Prose(30)).default([]),

    notes: z.array(Prose(20)).default([]),
    sourceIds: z.array(NonEmpty).default([]),
    lastReviewed: IsoDate,
  })
  .strict()

export type PassageRecord = z.infer<typeof PassageRecordSchema>

/** A citation of a passage from inside a case section, with its role there. */
export const PassageUsageSchema = z
  .object({
    reference: NonEmpty,
    sectionId: SectionId,
    role: PassageRoleSchema,
    note: NonEmpty.optional(),
  })
  .strict()

export type PassageUsage = z.infer<typeof PassageUsageSchema>

/* ------------------------------------------------------------------ *
 * Sources
 * ------------------------------------------------------------------ */

export const sourceTypes = [
  'biblical-text',
  'primary-historical',
  'academic',
  'commentary',
  'book',
  'article',
  'sermon',
  'video',
  'lexicon',
  'website',
  'source-document',
] as const
export const SourceTypeSchema = z.enum(sourceTypes)
export type SourceType = z.infer<typeof SourceTypeSchema>

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  'biblical-text': 'Biblical text',
  'primary-historical': 'Primary historical source',
  academic: 'Academic scholarship',
  commentary: 'Commentary',
  book: 'Book',
  article: 'Article',
  sermon: 'Sermon',
  video: 'Video',
  lexicon: 'Lexicon or language reference',
  website: 'Website',
  'source-document': 'Original source document',
}

export const perspectives = [
  'CI',
  'ECT',
  'universalist',
  'mixed',
  'historical',
  'lexical',
  'reference',
] as const
export const PerspectiveSchema = z.enum(perspectives)
export type Perspective = z.infer<typeof PerspectiveSchema>

export const PERSPECTIVE_LABELS: Record<Perspective, string> = {
  CI: 'Conditional immortality',
  ECT: 'Eternal conscious torment',
  universalist: 'Universal reconciliation',
  mixed: 'Mixed or multi-view',
  historical: 'Historical',
  lexical: 'Lexical',
  reference: 'Reference',
}

export const rightsStatuses = [
  'public-domain',
  'cleared',
  'permission-needed',
  'quoted-briefly',
  'paraphrased',
  'link-only',
] as const
export const RightsStatusSchema = z.enum(rightsStatuses)
export type RightsStatus = z.infer<typeof RightsStatusSchema>

export const RIGHTS_STATUS_LABELS: Record<RightsStatus, string> = {
  'public-domain': 'Public domain',
  cleared: 'Cleared for use',
  'permission-needed': 'Permission needed before quoting',
  'quoted-briefly': 'Quoted briefly with attribution',
  paraphrased: 'Paraphrased rather than quoted',
  'link-only': 'Linked rather than quoted',
}

export const RIGHTS_STATUS_DEFINITIONS: Record<RightsStatus, string> = {
  'public-domain': 'Out of copyright, or released into the public domain. May be quoted at length.',
  cleared: 'The site has the right to use this material.',
  'permission-needed': 'Permission has not been obtained. Not quoted on the public site.',
  'quoted-briefly':
    'In copyright. Only a short excerpt appears, attributed, for criticism and commentary.',
  paraphrased: 'In copyright. The substance is restated in this site’s own words, with a citation.',
  'link-only': 'In copyright. The site links to it and does not reproduce any of it.',
}

export const linkStatuses = ['live', 'redirected', 'archived-only', 'dead', 'not-checked'] as const
export const LinkStatusSchema = z.enum(linkStatuses)
export type LinkStatus = z.infer<typeof LinkStatusSchema>

export const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  live: 'Link checked and live',
  redirected: 'Link redirects to a new location',
  'archived-only': 'Available through an archive only',
  dead: 'Link no longer resolves',
  'not-checked': 'Link not checked',
}

/** Shown where a source record leaves `perspective` unset. */
export const PERSPECTIVE_UNSTATED_LABEL = 'Perspective not stated'

export const SourceRecordSchema = z
  .object({
    id: Slug,
    type: SourceTypeSchema,

    author: NonEmpty.optional(),
    title: Prose(3),
    publication: NonEmpty.optional(),
    publisher: NonEmpty.optional(),
    date: NonEmpty.optional(),
    edition: NonEmpty.optional(),
    /** Page, chapter, section or paragraph locator. */
    locator: NonEmpty.optional(),

    perspective: PerspectiveSchema.optional(),

    url: z.string().url().optional(),
    archiveUrl: z.string().url().optional(),
    accessedAt: IsoDate.optional(),
    linkStatus: LinkStatusSchema.default('not-checked'),

    rightsStatus: RightsStatusSchema,
    citedBy: z.array(SectionId).default([]),
    note: Prose(20).optional(),
    /**
     * Disposition for links carried over from the original document, so every
     * original hyperlink can be shown to have been considered.
     */
    sourceDocumentUrl: z.string().url().optional(),
  })
  .strict()

export type SourceRecord = z.infer<typeof SourceRecordSchema>

/* ------------------------------------------------------------------ *
 * Topics and glossary
 * ------------------------------------------------------------------ */

export const TopicRecordSchema = z
  .object({
    id: Slug,
    slug: Slug,
    title: Prose(3),
    definition: Prose(60),
    body: z.array(Prose(40)).min(1),
    aliases: z.array(NonEmpty).default([]),
    relatedTerms: z.array(Slug).default([]),
    distinctions: z.array(Prose(25)).default([]),
    principalPassages: z.array(NonEmpty).default([]),
    relatedSections: z.array(SectionId).default([]),
    relatedObjections: z.array(SectionId).default([]),
    sourceIds: z.array(Slug).default([]),
    openQuestions: z.array(Prose(25)).default([]),
  })
  .strict()

export type TopicRecord = z.infer<typeof TopicRecordSchema>

export const GlossaryTermSchema = z
  .object({
    id: Slug,
    term: Prose(2),
    /** Greek/Hebrew original where the term is a transliteration. */
    original: NonEmpty.optional(),
    originalLang: z.enum(['grc', 'he']).optional(),
    transliteration: NonEmpty.optional(),
    definition: Prose(40),
    aliases: z.array(NonEmpty).default([]),
    topicId: Slug.optional(),
    relatedSections: z.array(SectionId).default([]),
  })
  .strict()

export type GlossaryTerm = z.infer<typeof GlossaryTermSchema>

/* ------------------------------------------------------------------ *
 * Original-language notes
 * ------------------------------------------------------------------ */

export const LanguageNoteSchema = z
  .object({
    id: Slug,
    lemma: NonEmpty,
    lang: z.enum(['grc', 'he']),
    transliteration: NonEmpty,
    gloss: Prose(10),
    lexicalRange: z.array(Prose(5)).min(1),
    morphology: NonEmpty.optional(),
    /** The argument the site actually makes from this word, in context. */
    contextualArgument: Prose(80),
    competingInterpretations: z.array(Prose(30)).min(1),
    occurrences: z.array(NonEmpty).default([]),
    relatedSections: z.array(SectionId).default([]),
    sourceIds: z.array(Slug).min(1),
    reviewStatus: ReviewStatusSchema,
  })
  .strict()

export type LanguageNote = z.infer<typeof LanguageNoteSchema>

/* ------------------------------------------------------------------ *
 * Revisions and feedback
 * ------------------------------------------------------------------ */

export const revisionTypes = [
  'correction',
  'source-update',
  'clarification',
  'translation-update',
  'substantive-revision',
  'accessibility',
] as const
export const RevisionTypeSchema = z.enum(revisionTypes)
export type RevisionType = z.infer<typeof RevisionTypeSchema>

export const REVISION_TYPE_LABELS: Record<RevisionType, string> = {
  correction: 'Correction',
  'source-update': 'Source update',
  clarification: 'Clarification',
  'translation-update': 'Translation update',
  'substantive-revision': 'Substantive revision',
  accessibility: 'Accessibility',
}

export const RevisionRecordSchema = z
  .object({
    id: Slug,
    sectionId: SectionId.optional(),
    date: IsoDate,
    type: RevisionTypeSchema,
    summary: Prose(20),
    issue: Prose(20),
    decision: Prose(20),
    details: Prose(30).optional(),
    sourceSubmissionId: NonEmpty.optional(),
    /** Attribution for an accepted correction, only with explicit consent. */
    creditedTo: NonEmpty.optional(),
  })
  .strict()

export type RevisionRecord = z.infer<typeof RevisionRecordSchema>

/** The vocabularies live in `./feedback-vocabulary`, which imports nothing. */
export const FeedbackTypeSchema = z.enum(feedbackTypes)
export const PublicationConsentSchema = z.enum(publicationConsents)
export const FeedbackStatusSchema = z.enum(feedbackStatuses)
export type FeedbackStatus = z.infer<typeof FeedbackStatusSchema>

/** What the public form accepts. Server-side validation uses exactly this. */
export const FeedbackSubmissionInputSchema = z
  .object({
    sectionId: z.string().max(16).optional(),
    headingId: z.string().max(128).optional(),
    type: FeedbackTypeSchema,
    message: z
      .string()
      .trim()
      .min(20, 'Please give us at least a sentence or two so we can act on it.')
      .max(8000, 'Please keep submissions under 8000 characters.'),
    sourceUrl: z
      .union([
        // Web addresses only. The form's client-side validator refuses any
        // other scheme, and this schema is documented as its mirror; without
        // the refinement a no-JS submission could store a `javascript:` URL.
        z
          .string()
          .url()
          .refine(value => /^https?:\/\//i.test(value), {
            message: 'Please give a web address beginning with http:// or https://.',
          }),
        z.literal(''),
      ])
      .optional(),
    name: z.string().trim().max(120).optional(),
    email: z.union([z.email(), z.literal('')]).optional(),
    publicationConsent: PublicationConsentSchema,
  })
  .strict()

export type FeedbackSubmissionInput = z.infer<typeof FeedbackSubmissionInputSchema>

export const FeedbackSubmissionSchema = FeedbackSubmissionInputSchema.extend({
  id: NonEmpty,
  status: FeedbackStatusSchema,
  createdAt: NonEmpty,
  reviewedAt: NonEmpty.optional(),
  reviewerId: NonEmpty.optional(),
  privateReviewNote: NonEmpty.optional(),
  publicDecisionSummary: NonEmpty.optional(),
})

export type FeedbackSubmission = z.infer<typeof FeedbackSubmissionSchema>

/* ------------------------------------------------------------------ *
 * Video
 * ------------------------------------------------------------------ */

export const TranscriptCueSchema = z
  .object({
    start: z.number().min(0),
    duration: z.number().min(0),
    text: NonEmpty,
  })
  .strict()

export type TranscriptCue = z.infer<typeof TranscriptCueSchema>

export const VideoChapterSchema = z
  .object({
    id: Slug,
    start: z.number().int().min(0),
    end: z.number().int().min(1),
    title: Prose(3),
    /** Permanent section ids this chapter covers, where the mapping is exact. */
    sectionIds: z.array(SectionId).default([]),
    /** Visual information the narration does not convey. */
    visualDescription: Prose(20).optional(),
  })
  .strict()

export type VideoChapter = z.infer<typeof VideoChapterSchema>

export const VideoRecordSchema = z
  .object({
    youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    originalTitle: NonEmpty,
    siteTitle: NonEmpty,
    description: Prose(60),
    durationSeconds: z.number().int().positive(),
    publishedAt: IsoDate,
    transcriptSource: NonEmpty,
    transcriptRetrievedAt: IsoDate,
    chapters: z.array(VideoChapterSchema).min(1),
    cues: z.array(TranscriptCueSchema).min(1),
    sourceIds: z.array(Slug).default([]),
  })
  .strict()

export type VideoRecord = z.infer<typeof VideoRecordSchema>

/* ------------------------------------------------------------------ *
 * Migration ledger
 * ------------------------------------------------------------------ */

export const sourceElementTypes = [
  'heading',
  'paragraph',
  'list-item',
  'table',
  'image',
  'hyperlink',
  'comment',
  'quotation',
  'scripture',
  'footnote',
  'other',
] as const
export const SourceElementTypeSchema = z.enum(sourceElementTypes)

export const treatments = [
  'preserved',
  'lightly-edited',
  'rewritten-for-clarity',
  'summarized',
  'relocated',
  'qualified',
  'appendix',
  'private-source-only',
  'omitted-as-formatting-only',
] as const
export const TreatmentSchema = z.enum(treatments)
export type Treatment = z.infer<typeof TreatmentSchema>

export const MigrationLedgerEntrySchema = z
  .object({
    sourceId: NonEmpty,
    sourcePage: z.number().int().positive().optional(),
    sourceParagraphIndex: z.number().int().min(0).optional(),
    sourceType: SourceElementTypeSchema,
    sourceText: z.string().optional(),

    destinationRoute: z.string().optional(),
    destinationSectionId: z.string().optional(),
    destinationHeadingId: z.string().optional(),

    treatment: TreatmentSchema,
    evidenceRole: EvidenceRoleSchema.optional(),
    citationStatus: z.enum(['not-required', 'verified', 'pending', 'missing', 'replaced']),
    rightsStatus: z.enum([
      'not-applicable',
      'public-domain',
      'cleared',
      'permission-needed',
      'paraphrased',
    ]),
    publicPrivacyStatus: z.enum(['safe', 'redacted', 'private']),
    editorialNote: z.string().optional(),
    migrationStatus: z.enum(['not-started', 'drafted', 'reviewed', 'approved']),
  })
  .strict()

export type MigrationLedgerEntry = z.infer<typeof MigrationLedgerEntrySchema>

/** Disposition recorded for each of the 30 Word comments in the source file. */
export const commentDispositions = [
  'incorporated',
  'addressed-as-caveat',
  'open-question',
  'research-backlog',
  'rejected',
  'private-archive-only',
] as const
export const CommentDispositionSchema = z.enum(commentDispositions)
export type CommentDisposition = z.infer<typeof CommentDispositionSchema>

export const COMMENT_DISPOSITION_LABELS: Record<CommentDisposition, string> = {
  incorporated: 'Incorporated into revised copy',
  'addressed-as-caveat': 'Addressed in a caveat',
  'open-question': 'Added as an open question',
  'research-backlog': 'Added to internal research backlog',
  rejected: 'Rejected with reason',
  'private-archive-only': 'Preserved only in the private source archive',
}

export const CommentLedgerEntrySchema = z
  .object({
    commentId: NonEmpty,
    /** Author names are kept in the private ledger only, never rendered. */
    author: NonEmpty,
    date: NonEmpty,
    anchorParagraphIds: z.array(NonEmpty).default([]),
    summary: Prose(15),
    disposition: CommentDispositionSchema,
    destinationSectionId: z.string().optional(),
    reason: Prose(15),
  })
  .strict()

export type CommentLedgerEntry = z.infer<typeof CommentLedgerEntrySchema>

/* ------------------------------------------------------------------ *
 * Media
 * ------------------------------------------------------------------ */

export const MediaDispositionSchema = z
  .object({
    file: NonEmpty,
    description: Prose(10),
    widthPx: z.number().int().positive().optional(),
    heightPx: z.number().int().positive().optional(),
    treatment: z.enum([
      'rebuilt-as-semantic-html',
      'rebuilt-as-accessible-svg',
      'used-as-poster',
      'replaced-with-icon-system',
      'regenerated',
      'omitted-formatting-artifact',
    ]),
    destination: z.string().optional(),
    /**
     * Media may legitimately have no rights question at all (a QR code, a
     * toolbar screenshot), so this enum extends the source rights vocabulary
     * with `not-applicable`.
     */
    rightsStatus: z.enum([...rightsStatuses, 'not-applicable']),
    note: Prose(20),
  })
  .strict()

export type MediaDisposition = z.infer<typeof MediaDispositionSchema>
