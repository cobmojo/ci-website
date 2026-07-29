import type { VideoChapter } from '@ci/content-schema'

/**
 * Chapters for the 28-minute overview.
 *
 * Boundaries are taken from the author's own published caption track, by
 * locating the cue in which he announces each part. They are not estimates.
 * The chapters cover the whole video, from 0 to 1712 seconds, with no gaps.
 *
 * `sectionIds` records only exact correspondences. Where the video runs
 * several parts together, as it does for the language of the fate of the
 * wicked, one chapter carries all the ids it genuinely covers.
 *
 * Note on the numbering: the first two parts the video calls "number one" and
 * "number two" are the roadblocks, not S01 and S02. The numbering restarts
 * when he reaches the passages usually cited for the traditional view.
 *
 * `visualDescription` is deliberately absent. Describing on-screen information
 * requires someone to watch the video, and this project will not invent those
 * descriptions. See the watch page and the accessibility statement, both of
 * which say so plainly.
 */
export const VIDEO_CHAPTERS: readonly VideoChapter[] = [
  {
    id: 'introduction',
    start: 0,
    end: 47,
    title: 'Introduction: thirty years of the traditional view',
    sectionIds: [],
  },
  {
    id: 'what-conditionalism-claims',
    start: 47,
    end: 86,
    title: 'What conditional immortality actually claims',
    sectionIds: ['S30', 'S22'],
  },
  {
    id: 'urgency-unchanged',
    start: 86,
    end: 107,
    title: 'The urgency is unchanged',
    sectionIds: ['S29'],
  },
  {
    id: 'how-the-argument-is-laid-out',
    start: 107,
    end: 122,
    title: 'How the argument is laid out',
    sectionIds: [],
  },
  {
    id: 'roadblock-tradition',
    start: 122,
    end: 144,
    title: 'Roadblock 1: is this a new teaching?',
    sectionIds: ['RB1'],
  },
  {
    id: 'roadblock-image-of-god',
    start: 144,
    end: 170,
    title: 'Roadblock 2: does the image of God make us immortal?',
    sectionIds: ['RB2'],
  },
  {
    id: 'roadblock-infinite-punishment',
    start: 170,
    end: 215,
    title: 'Roadblock 3: does infinite offence require infinite punishment?',
    sectionIds: ['RB3'],
  },
  {
    id: 'the-go-to-passages',
    start: 215,
    end: 245,
    title: 'The passages usually cited for eternal conscious torment',
    sectionIds: [],
  },
  {
    id: 'mark-9',
    start: 245,
    end: 378,
    title: 'Mark 9: undying worms and unquenchable fire',
    sectionIds: ['S01'],
  },
  {
    id: 'revelation-14',
    start: 378,
    end: 504,
    title: 'Revelation 14: the smoke of their torment',
    sectionIds: ['S02'],
  },
  {
    id: 'lake-of-fire',
    start: 504,
    end: 586,
    title: 'Revelation 20: the lake of fire and the second death',
    sectionIds: ['S03'],
  },
  {
    id: 'eternal-punishment',
    start: 586,
    end: 675,
    title: 'What eternal punishment means',
    sectionIds: ['S04'],
  },
  {
    id: 'rich-man-and-lazarus',
    start: 675,
    end: 715,
    title: 'The rich man and Lazarus',
    sectionIds: ['S05'],
  },
  {
    id: 'weeping-and-gnashing',
    start: 715,
    end: 805,
    title: 'Weeping, gnashing of teeth and outer darkness',
    sectionIds: ['S06'],
  },
  {
    id: 'language-of-the-fate-of-the-wicked',
    start: 805,
    end: 890,
    title: 'The language of the fate of the wicked',
    sectionIds: ['S07', 'S08', 'S09', 'S10', 'S11', 'S12'],
  },
  {
    id: 'fire-burns-up',
    start: 890,
    end: 927,
    title: 'What fire does in Scripture',
    sectionIds: ['S13'],
  },
  {
    id: 'sodom-and-gomorrah',
    start: 927,
    end: 971,
    title: 'Sodom and Gomorrah as the example',
    sectionIds: ['S14'],
  },
  {
    id: 'old-testament-judgment',
    start: 971,
    end: 994,
    title: 'Patterns of judgment in the Old Testament',
    sectionIds: ['S15'],
  },
  {
    id: 'sacrificial-system',
    start: 994,
    end: 1008,
    title: 'What the sacrificial system says about the penalty',
    sectionIds: ['S16'],
  },
  {
    id: 'jesus-death',
    start: 1008,
    end: 1042,
    title: 'What Jesus’ death says about the penalty for sin',
    sectionIds: ['S17'],
  },
  {
    id: 'physical-and-final-death',
    start: 1042,
    end: 1068,
    title: 'Physical death as a picture of final death',
    sectionIds: ['S18'],
  },
  {
    id: 'not-opposites',
    start: 1068,
    end: 1105,
    title: 'Hell is not the opposite of heaven',
    sectionIds: ['S19'],
  },
  {
    id: 'no-place-prepared',
    start: 1105,
    end: 1153,
    title: 'Why no place is prepared for the unrighteous',
    sectionIds: ['S20'],
  },
  {
    id: 'tree-of-life',
    start: 1153,
    end: 1177,
    title: 'The tree of life and conditional life',
    sectionIds: ['S21'],
  },
  {
    id: 'conditional-immortality',
    start: 1177,
    end: 1203,
    title: 'The biblical case for conditional immortality',
    sectionIds: ['S22'],
  },
  {
    id: 'day-of-judgment',
    start: 1203,
    end: 1260,
    title: 'The day of judgment',
    sectionIds: ['S23'],
  },
  {
    id: 'no-more-pain',
    start: 1260,
    end: 1278,
    title: 'No more death, mourning, crying or pain',
    sectionIds: ['S24'],
  },
  {
    id: 'all-in-all',
    start: 1278,
    end: 1304,
    title: 'How “all in all” fits after final judgment',
    sectionIds: ['S25'],
  },
  {
    id: 'suffering-does-not-pay',
    start: 1304,
    end: 1318,
    title: 'Why suffering does not pay for sin',
    sectionIds: ['S26'],
  },
  {
    id: 'better-not-born',
    start: 1318,
    end: 1361,
    title: '“Better for him if he had not been born”',
    sectionIds: ['S27'],
  },
  {
    id: 'after-revelation-20',
    start: 1361,
    end: 1381,
    title: 'Are the wicked still present after Revelation 20?',
    sectionIds: ['S28'],
  },
  {
    id: 'evangelism',
    start: 1381,
    end: 1445,
    title: 'Would this view weaken evangelism?',
    sectionIds: ['S29'],
  },
  {
    id: 'is-annihilation-punishment',
    start: 1445,
    end: 1469,
    title: 'Is annihilation really punishment?',
    sectionIds: ['S30'],
  },
  {
    id: 'image-bearers',
    start: 1469,
    end: 1481,
    title: 'Would God destroy his image-bearers?',
    sectionIds: ['S31'],
  },
  {
    id: 'satan-and-angels',
    start: 1481,
    end: 1500,
    title: 'Why might Satan and his angels have a different fate?',
    sectionIds: ['S32'],
  },
  {
    id: 'near-death-experiences',
    start: 1500,
    end: 1535,
    title: 'What about near-death experiences?',
    sectionIds: ['S33'],
  },
  {
    id: 'jesus-heaven-versus-hell',
    start: 1535,
    end: 1546,
    title: 'Did Jesus speak more about hell than heaven?',
    sectionIds: ['S34'],
  },
  {
    id: 'why-this-matters',
    start: 1546,
    end: 1688,
    title: 'Why this question matters',
    sectionIds: ['P00'],
  },
  { id: 'closing', start: 1688, end: 1712, title: 'Closing and further resources', sectionIds: [] },
]
