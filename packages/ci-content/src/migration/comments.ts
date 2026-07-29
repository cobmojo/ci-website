import type { CommentLedgerEntry } from '@ci/content-schema'

/**
 * Disposition of every editorial comment in the source document.
 *
 * The source file carries 30 Word comments and replies. They are private
 * editorial correspondence, so this ledger records what happened to each one
 * without identifying who wrote it. `author` holds a role label only:
 * "The author" for Phil Welch, "A reviewer" for anyone else. The full mapping
 * of comment ids to real names stays in `private/source/`, which no
 * application code imports.
 *
 * Comments are grouped by thread: a comment and its reply share one entry
 * where they concern the same point.
 */
export const COMMENT_LEDGER: readonly CommentLedgerEntry[] = [
  {
    commentId: '0/1',
    author: 'A reviewer',
    date: '2024-05-12',
    anchorParagraphIds: ['p81'],
    summary:
      'Noted that Irenaeus, in the same chapter of Against Heresies where he affirms conditionalism, also discusses God sustaining creatures for as long as he wills and not sustaining the wicked for ever.',
    disposition: 'incorporated',
    destinationSectionId: 'RB2',
    reason:
      'The author read the reference and added it to Roadblock 2. It is also used in S09 on delayed judgment, where the point about sustaining is directly relevant.',
  },
  {
    commentId: '2/3',
    author: 'A reviewer',
    date: '2024-05-12',
    anchorParagraphIds: ['p99'],
    summary:
      'Observed that the argument about the two destinies not being equal opposites connects to Romans 5:15 on the free gift being greater than the trespass.',
    disposition: 'incorporated',
    destinationSectionId: 'S19',
    reason: 'Romans 5:15-18 is the opening passage of S19 and carries the argument on that page.',
  },
  {
    commentId: '4/5',
    author: 'A reviewer',
    date: '2024-05-12',
    anchorParagraphIds: ['p106'],
    summary:
      'Asked what "spiritually immortal" means, and whether it refers to the soul living on and only for the saved.',
    disposition: 'incorporated',
    destinationSectionId: 'S22',
    reason:
      'The author clarified that he was describing what happens at conversion, drawing on the imperishable seed of 1 Peter 1:23, while the body remains perishable until the resurrection. S22 now states this distinction explicitly rather than using the compressed phrase.',
  },
  {
    commentId: '6',
    author: 'The author',
    date: '2024-05-13',
    anchorParagraphIds: ['p115'],
    summary:
      'Noted that the summary section omitted Scripture references and wondered whether adding them would hurt readability.',
    disposition: 'incorporated',
    destinationSectionId: 'P00',
    reason:
      'Resolved by the structure of the web edition. Summaries stay short and every claim links to the section page where the references are set out in full, so nothing is lost and the summary stays readable.',
  },
  {
    commentId: '7/8',
    author: 'A reviewer',
    date: '2024-05-12',
    anchorParagraphIds: ['p124'],
    summary:
      'Argued that the position lets evangelism focus on the goodness of what is gained rather than on what is escaped, and that the author had changed how he evangelises as a result.',
    disposition: 'incorporated',
    destinationSectionId: 'S29',
    reason:
      'The substance is carried in S29. The reviewer’s personal account and the author’s account of his own door-to-door practice are private correspondence and are not reproduced.',
  },
  {
    commentId: '9/10',
    author: 'A reviewer',
    date: '2024-05-12',
    anchorParagraphIds: ['p132'],
    summary:
      'Registered disagreement about the fate of the devil, holding that Satan and the fallen angels will also be destroyed.',
    disposition: 'incorporated',
    destinationSectionId: 'S32',
    reason:
      'S32 now presents this as a live disagreement among conditionalists rather than as a settled point, states the alternative reading fairly, and records the author’s own statement that he holds his view loosely here and is open to correction.',
  },
  {
    commentId: '11/12',
    author: 'A reviewer',
    date: '2024-05-12',
    anchorParagraphIds: ['p138'],
    summary:
      'Questioned the three-to-one figure for how often Jesus spoke about heaven compared with hell, and asked whether a verse list had been assembled.',
    disposition: 'addressed-as-caveat',
    destinationSectionId: 'S34',
    reason:
      'The author recorded that he did not do the count himself and relied on a published article. S34 therefore states only the modest claim, declines to assert the ratio, and sets out what would be needed to settle it. The section carries a revision-needed status.',
  },
  {
    commentId: '13',
    author: 'The author',
    date: '2023-11-16',
    anchorParagraphIds: ['p157', 'p158'],
    summary:
      'A note to consider adding a section on the age of accountability, and on what Scripture says about the children of unbelieving parents.',
    disposition: 'research-backlog',
    reason:
      'The source document contains no developed argument on this, so there is nothing to migrate. Inventing a page would go beyond the source. It is recorded as an open research question rather than published as a settled position.',
  },
  {
    commentId: '14/15',
    author: 'A reviewer',
    date: '2024-05-31',
    anchorParagraphIds: ['p193'],
    summary:
      'Supplied the Augustine reference recording that very many in his day denied eternal torment, with the full Nicene and Post-Nicene Fathers citation.',
    disposition: 'incorporated',
    destinationSectionId: 'RB1',
    reason:
      'Added to RB1 with the volume, editor, publisher, year, page and chapter, and an archive link to the public-domain edition.',
  },
  {
    commentId: '16/17',
    author: 'A reviewer',
    date: '2024-05-31',
    anchorParagraphIds: ['p306'],
    summary:
      'Pointed out that the Aquinas passage on infinite punishment is stated by Aquinas as an objection he then rebuts, and supplied the article reference.',
    disposition: 'incorporated',
    destinationSectionId: 'RB3',
    reason:
      'A substantive correction. RB3 now gives the quotation in its actual context with the article and objection number, and the change is recorded in the public changelog.',
  },
  {
    commentId: '18',
    author: 'The author',
    date: '2026-07-25',
    anchorParagraphIds: ['p343'],
    summary:
      'The author records that he is not confident how much the argument from the phrase "eternal sin" in Mark 3:29 actually contributes.',
    disposition: 'open-question',
    destinationSectionId: 'RB3',
    reason:
      'Moved out of the backbone of the argument. It appears in RB3 and S04 as a supporting observation about how "eternal" functions, never as a decisive step, and the author’s own doubt is preserved.',
  },
  {
    commentId: '19/20',
    author: 'A reviewer',
    date: '2024-05-31',
    anchorParagraphIds: ['p357'],
    summary:
      'Agreed that "God is completely holy, therefore punishment must be complete" is a better formulation than the appeal to infinite holiness.',
    disposition: 'incorporated',
    destinationSectionId: 'RB3',
    reason: 'Retained as the concluding formulation of RB3.',
  },
  {
    commentId: '21/22',
    author: 'A reviewer',
    date: '2024-05-31',
    anchorParagraphIds: ['p362'],
    summary:
      'Argued that the continued-sinning defence undercuts its own proof texts, renders the finite-sin argument pointless, and leaves the phrase "eternal fire" hard to account for.',
    disposition: 'incorporated',
    destinationSectionId: 'RB3',
    reason:
      'Added to the RB3 response to the continued-sinning argument, alongside the objections the source already raised.',
  },
  {
    commentId: '23/24',
    author: 'A reviewer',
    date: '2024-06-23',
    anchorParagraphIds: ['p409'],
    summary:
      'Asked whether the destruction of Edom is future, since if it is past then the smoke rising for ever was never literal.',
    disposition: 'incorporated',
    destinationSectionId: 'S02',
    reason:
      'The author agreed that the event is past and that the smoke language is not literal, and added that to the document. S02 now makes this explicit, which strengthens the parallel rather than weakening it.',
  },
  {
    commentId: '25/26',
    author: 'A reviewer',
    date: '2024-06-26',
    anchorParagraphIds: ['p443'],
    summary:
      'Questioned the basis for treating the beast and the false prophet as spiritual beings, given the angel’s explanation of the beast in Revelation 17.',
    disposition: 'open-question',
    destinationSectionId: 'S03',
    reason:
      'The author answered candidly that he finds Revelation difficult here, favours reading the beast as a spiritual entity composed of human rulers, and is open to correction. S03 presents the reading as his present interpretation and states that the wider case does not depend on it.',
  },
  {
    commentId: '27/28',
    author: 'A reviewer',
    date: '2024-06-26',
    anchorParagraphIds: ['p467', 'p468'],
    summary:
      'Noted an inconsistency in how John 17:3 is used: the same interpreters who argue that eternal life means a quality of life rather than mere duration often insist that eternal punishment means duration.',
    disposition: 'incorporated',
    destinationSectionId: 'S04',
    reason:
      'The author agreed and connected the sections. The point is now part of the S04 argument about what the adjective is doing in Matthew 25:46.',
  },
  {
    commentId: '29',
    author: 'A reviewer',
    date: '2023-06-27',
    anchorParagraphIds: ['p610'],
    summary: 'A private bookmark recording where the reader had stopped.',
    disposition: 'private-archive-only',
    reason: 'Not editorial content. It carries no argument and has no public destination.',
  },
]
