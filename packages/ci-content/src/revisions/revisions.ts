import type { RevisionRecord } from '@ci/content-schema'

/**
 * The public revision record.
 *
 * Every entry is a real editorial decision taken while moving the source
 * document to this web edition. Where a claim in the source was narrowed,
 * relocated or withdrawn, the reason is recorded here and shown on the
 * corresponding page and in the changelog.
 *
 * Submitter identities are never published without explicit consent. Where a
 * correction originated in the private source document's comment thread, the
 * entry says so without naming the person.
 */
export const REVISION_RECORDS: readonly RevisionRecord[] = [
  {
    id: 'rb1-early-church-majority-claim',
    sectionId: 'RB1',
    date: '2026-07-29',
    type: 'correction',
    summary:
      'Narrowed the early-church claim from a counted majority to the narrower claim the evidence supports.',
    issue:
      'The source document states that conditional immortality was apparently the majority view until at least AD 300. The surviving corpus from that period is small, much of it is indirect, and several figures say nothing usable about final punishment, so a counted majority is not demonstrable.',
    decision:
      'The public wording now says that eternal conscious torment was not the universal or uncontested position of the earliest centuries, and that identifiable early writers describe the end of the wicked as the loss of life. The original wording is preserved in the migration ledger.',
    details:
      'The evidence table distinguishes clear, probable, disputed and indeterminate cases rather than assigning every figure to a side.',
  },
  {
    id: 'rb1-augustine-attribution',
    sectionId: 'RB1',
    date: '2026-07-29',
    type: 'clarification',
    summary: 'Reframed Augustine as a decisive influence within a longer development.',
    issue:
      'The source document says Augustine appears to be the one who established eternal conscious torment as the predominant view, which compresses a long development into a single figure.',
    decision:
      'Augustine is presented as an important and probably decisive influence, within a development that runs well beyond him. His own remark that very many in his day denied eternal torment is retained with its full locator.',
  },
  {
    id: 'rb3-aquinas-context',
    sectionId: 'RB3',
    date: '2026-07-29',
    type: 'source-update',
    summary: 'Corrected the context of the Aquinas quotation on infinite punishment.',
    issue:
      'The passage widely quoted as Aquinas asserting that sin against an infinite God deserves infinite punishment is stated by Aquinas as an objection, which he then answers.',
    decision:
      'The quotation is retained because it is the form in which the argument circulates, but the page now states its actual context and cites the article and objection number.',
    details:
      'Raised in the private comment thread on the source document and accepted by the author, who added the reference and a note at the time.',
  },
  {
    id: 'rb2-plato-claim-split',
    sectionId: 'RB2',
    date: '2026-07-29',
    type: 'clarification',
    summary:
      'Separated the biblical claim about immortality from the historical claim about Greek influence.',
    issue:
      'The source states flatly that the immortality of the soul comes from Plato and not the Bible. The biblical claim and the historical claim have different kinds of support and were argued together.',
    decision:
      'The biblical argument stands on its own. The historical claim is retained but qualified: the development involves Second Temple Jewish anthropology and centuries of Christian reflection, not a single line of influence.',
  },
  {
    id: 's15-gehenna-rubbish-dump',
    sectionId: 'S15',
    date: '2026-07-29',
    type: 'correction',
    summary: 'Withdrew the claim that Gehenna was a burning rubbish dump in the first century.',
    issue:
      'The source states that in Jesus’ day Gehenna was a place where trash and dead bodies were burned. There is no support for a perpetually burning refuse dump in primary sources from the period; the tradition appears to be a much later inference.',
    decision:
      'The claim is not repeated. The well-attested associations are kept: the Valley of Hinnom, child sacrifice under Ahaz and Manasseh, Jeremiah renaming it the Valley of Slaughter, unburied corpses, and prophetic judgment imagery. The uncertainty is stated on the page.',
  },
  {
    id: 's15-satan-motive-removed',
    sectionId: 'S15',
    date: '2026-07-29',
    type: 'substantive-revision',
    summary:
      'Removed the inference that Satan wants people to believe in eternal conscious torment.',
    issue:
      'The source observes that the only sustained physical torment in the Old Testament is inflicted on Job by Satan, and infers that this is why Satan would want people to believe God punishes by torment. The inference is speculative and it attributes the beliefs of other Christians to deception.',
    decision:
      'Removed from the public site entirely. It is recorded in the migration ledger as a personal reflection retained in the private source record only.',
  },
  {
    id: 's04-2-thess-apo-flagged',
    sectionId: 'S04',
    date: '2026-07-29',
    type: 'translation-update',
    summary:
      'Labelled the proposed reading of the preposition in 2 Thessalonians 1:9 as a suggestion pending specialist review.',
    issue:
      'The source proposes that the preposition identifies the presence of the Lord as the source of the destruction rather than the place the wicked are sent away from. Standard translations divide on this verse, and a concordance entry is not a grammar.',
    decision:
      'The reading is presented as the author’s own suggestion, with his stated hesitancy preserved, alongside the standard translation options and the reading his opponents work from. The page carries a specialist-review-pending status.',
  },
  {
    id: 's03-beast-false-prophet',
    sectionId: 'S03',
    date: '2026-07-29',
    type: 'clarification',
    summary:
      'Marked the reading of the beast and false prophet as the author’s present interpretation.',
    issue:
      'The source treats the beast and the false prophet as spiritual rather than human figures, which carries weight in the argument about Revelation 20:10. The author recorded in the private comment thread that he holds this loosely and finds Revelation difficult here.',
    decision:
      'Presented as the author’s present interpretation with his stated uncertainty visible, alongside the alternative conditionalist reading. The wider human case is explicitly stated not to depend on it.',
  },
  {
    id: 's32-angel-time-speculation',
    sectionId: 'S32',
    date: '2026-07-29',
    type: 'substantive-revision',
    summary:
      'Removed the speculative aside about angels and the experience of time from the public pages.',
    issue:
      'The source labels this passage as a wild random thought without scriptural support. Presenting it alongside biblical arguments risks it being read as evidence.',
    decision:
      'Not reproduced on any public page, and excluded from summaries, metadata and the case map. Its existence is recorded in the migration ledger.',
  },
  {
    id: 's34-heaven-hell-ratio',
    sectionId: 'S34',
    date: '2026-07-29',
    type: 'correction',
    summary:
      'Withdrew the specific claim that Jesus spoke three times more about heaven than hell.',
    issue:
      'The figure comes from a single popular article that does not publish its verse list, its definition of what counts as a reference to hell, its treatment of kingdom language, or its handling of Gospel parallels and repeated sayings. The author recorded that he did not reproduce the count himself.',
    decision:
      'The page states the modest claim that the familiar assertion is not well supported, and explicitly declines to assert the ratio. What would be needed to settle it is set out on the page. The section carries a revision-needed status until a count with published methodology exists.',
  },
  {
    id: 's33-nde-proportion',
    sectionId: 'S33',
    date: '2026-07-29',
    type: 'correction',
    summary: 'Reframed the claim about the proportion of near-death experiences that are positive.',
    issue:
      'The source states that most such experiences are positive and portray a universalist afterlife. No evidence base is cited, and the argument does not need the quantitative claim.',
    decision:
      'Rewritten in conditional form: to the extent that reported experiences of heaven are set aside for conflicting with Scripture, consistency requires the same treatment of reported experiences of hell. The withdrawn quantitative claim is noted on the page.',
  },
  {
    id: 's17-s18-ordering',
    date: '2026-07-29',
    type: 'correction',
    summary:
      'Resolved the reversed numbering of sections 17 and 18 between the source table of contents and its body.',
    issue:
      'The source document’s table of contents lists physical death before Jesus’ death, while the body headings number them the other way. Two internal cross-references point at the wrong section as a result.',
    decision:
      'The body headings are canonical: S17 is Jesus’ death and S18 is physical death as a parallel to final death. The affected cross-references were corrected, and both pages carry a note recording the discrepancy.',
  },
  {
    id: 's10-anthropology-colour',
    sectionId: 'S10',
    date: '2026-07-29',
    type: 'accessibility',
    summary: 'Rebuilt the body, soul and spirit matrices so no meaning depends on colour.',
    issue:
      'The source conveys alive and dead by green and red text, and mortal and immortal by capitalisation. Neither is available to a reader using a screen reader, a greyscale display, or with a colour vision deficiency.',
    decision:
      'Rebuilt as semantic tables with explicit word values in their own columns. The material is placed in a disclosure after the main argument, matching the source’s own note that readers may skip it.',
  },
  {
    id: 'app1-charts-rebuilt',
    sectionId: 'APP1',
    date: '2026-07-29',
    type: 'accessibility',
    summary: 'Rebuilt the outcome charts as accessible tables and prose.',
    issue:
      'The illustration existed only as raster images in the source document, which carry no text alternative and cannot be read by assistive technology.',
    decision:
      'Rebuilt as a semantic table with the assumptions stated in prose, and prefaced with a prominent statement that the illustration is psychological rather than evidential.',
  },
  {
    id: 's02-greek-screenshots-replaced',
    sectionId: 'S02',
    date: '2026-07-29',
    type: 'accessibility',
    summary:
      'Replaced the Greek comparison screenshots with text, and flagged the argument for review.',
    issue:
      'The verbal parallel between Revelation 14:11 and Revelation 4:8 was carried entirely in two screenshots. Screenshots cannot be read, searched, or checked.',
    decision:
      'The parallel is stated in words with both verses quoted in full. Because the detailed Greek comparison could not be reconstructed from the images with confidence, the page states the parallel at the level the text supports and carries a specialist-review-pending status.',
  },
  {
    id: 'privacy-contact-details',
    date: '2026-07-29',
    type: 'substantive-revision',
    summary:
      'Replaced the invitation to email or comment directly with a structured correction form.',
    issue:
      'The source document opens with a personal email address and phone number and invites readers to comment in the document itself.',
    decision:
      'Neither contact detail appears anywhere in the published output, and a build-time scan fails the build if either ever does. Feedback is collected through a form instead, and accepted corrections are published in this changelog.',
  },
  {
    id: 'bible-translation-policy',
    date: '2026-07-29',
    type: 'translation-update',
    summary: 'Adopted a public-domain base text for all full Scripture displays.',
    issue:
      'The source document quotes copyrighted modern translations extensively. A reference work of this size quotes Scripture well beyond what incidental-quotation allowances for those translations cover.',
    decision:
      'All full passage displays render the World English Bible, which is public domain, from a verified corpus that authors cannot edit by hand. Where an argument turns on a specific modern rendering, only the few words at issue are quoted, the translation is named, and the difference is explained in the site’s own prose.',
  },
  {
    id: 'qr-code-regenerated',
    date: '2026-07-29',
    type: 'substantive-revision',
    summary: 'Retired the original short link and generated a new QR code for print use.',
    issue:
      'The source document carries a QR code pointing at a shortened URL for the shared working document. A QR code is also of no use on a page the reader is already viewing.',
    decision:
      'The QR code appears only on the printable handout and print cover sheet, and encodes the canonical site URL rather than the retired short link.',
  },
]
