import type { GlossaryTerm } from '@ci/content-schema'

/**
 * The glossary.
 *
 * Entries here are deliberately short. A reader who meets an unfamiliar term
 * mid-sentence needs one or two sentences and a way through to the full
 * treatment, which is what `topicId` provides. Anything longer belongs on the
 * topic page, not here.
 */
export const GLOSSARY_TERMS: readonly GlossaryTerm[] = [
  {
    id: 'annihilationism',
    term: 'Annihilationism',
    definition:
      'The view that those who are finally impenitent are destroyed rather than kept alive in unending torment. It covers several positions, of which conditional immortality is one.',
    aliases: ['annihilation', 'extinctionism', 'destructionism'],
    topicId: 'annihilationism',
    relatedSections: ['RB1', 'S08', 'S30'],
  },
  {
    id: 'conditional-immortality',
    term: 'Conditional Immortality',
    definition:
      'The view that immortality is given through Christ rather than held by nature, so that those who are finally lost do not live for ever. It is the position argued for on this site.',
    aliases: ['CI'],
    topicId: 'conditional-immortality',
    relatedSections: ['S22', 'RB2', 'S21'],
  },
  {
    id: 'conditionalism',
    term: 'Conditionalism',
    definition:
      'Shorthand for conditional immortality. It names the same position and the two terms are used interchangeably in most conditionalist writing.',
    aliases: ['conditionalist'],
    topicId: 'conditional-immortality',
    relatedSections: ['S22', 'RB1'],
  },
  {
    id: 'evangelical-conditionalism',
    term: 'Evangelical Conditionalism',
    definition:
      'Conditional immortality held within evangelical commitments, arguing the case from Scripture as the final authority. It is the term the Rethinking Hell project uses of its own position.',
    aliases: ['evangelical conditionalist'],
    topicId: 'conditional-immortality',
    relatedSections: ['RB1', 'S22'],
  },
  {
    id: 'eternal-conscious-torment',
    term: 'Eternal Conscious Torment',
    definition:
      'The view that the lost are raised and consciously suffer the just judgment of God without end. It has been the majority position of the Western church for many centuries.',
    aliases: ['ECT', 'eternal torment'],
    topicId: 'eternal-conscious-torment',
    relatedSections: ['RB3', 'S04', 'S12'],
  },
  {
    id: 'traditionalism',
    term: 'Traditionalism',
    definition:
      'A common label for the eternal conscious torment position, used because it has been the majority view of the Western church. Many who hold it prefer to call it the traditional view.',
    aliases: ['traditional view', 'traditionalist'],
    topicId: 'eternal-conscious-torment',
    relatedSections: ['RB1', 'S12'],
  },
  {
    id: 'universal-reconciliation',
    term: 'Universal Reconciliation',
    definition:
      'The view that God will finally reconcile every person to himself, so that punishment after death is corrective and no one is lost for ever. This site does not hold it.',
    aliases: ['universalism', 'universal salvation', 'apokatastasis'],
    topicId: 'universal-reconciliation',
    relatedSections: ['S25', 'S26', 'S27'],
  },
  {
    id: 'intermediate-state',
    term: 'Intermediate State',
    definition:
      'The condition of the dead between death and the resurrection. It is nobody’s final state, and conditionalists differ over whether it is consciously experienced.',
    aliases: ['the state of the dead'],
    topicId: 'intermediate-state',
    relatedSections: ['S05', 'S09'],
  },
  {
    id: 'hades',
    term: 'Hades',
    definition:
      'The Greek term for the realm of the dead before the resurrection. It is not Gehenna and not the lake of fire, into which Revelation says Hades itself is thrown.',
    aliases: ['the realm of the dead'],
    topicId: 'hades',
    relatedSections: ['S05', 'S03', 'S09'],
  },
  {
    id: 'sheol',
    term: 'Sheol',
    definition:
      'The Hebrew term for the realm of the dead, entered by the righteous and the wicked alike. English versions render it grave, pit and hell, which hides the fact that it is one word.',
    aliases: ['the pit'],
    topicId: 'sheol',
    relatedSections: ['S05', 'S09'],
  },
  {
    id: 'gehenna',
    term: 'Gehenna',
    definition:
      'The word Jesus uses for the place of final destruction. It transliterates the Valley of the Son of Hinnom, a ravine outside Jerusalem associated with child sacrifice and slaughter.',
    aliases: ['valley of hinnom', 'topheth'],
    topicId: 'gehenna',
    relatedSections: ['S15', 'S10', 'S01'],
  },
  {
    id: 'lake-of-fire',
    term: 'Lake of Fire',
    definition:
      'The image in Revelation for the final destiny of the devil, of Death and Hades, and of those not written in the book of life. Revelation names it the second death.',
    aliases: ['the fiery lake', 'lake of burning sulphur'],
    topicId: 'lake-of-fire',
    relatedSections: ['S03', 'S20', 'S13'],
  },
  {
    id: 'second-death',
    term: 'Second Death',
    definition:
      'The name Revelation gives to the outcome of the last judgment. It is distinguished from the death every person dies before the resurrection.',
    aliases: ['the second death'],
    topicId: 'second-death',
    relatedSections: ['S03', 'S07', 'S18'],
  },
  {
    id: 'immortality',
    term: 'Immortality',
    definition:
      'Deathlessness. Scripture attributes it to God alone and presents it as a gift brought to light through the gospel rather than a property of human nature.',
    aliases: ['deathlessness', 'imperishability'],
    topicId: 'immortality',
    relatedSections: ['RB2', 'S22'],
  },
  {
    id: 'resurrection',
    term: 'Resurrection',
    definition:
      'The bodily raising of the dead. Scripture describes a resurrection of both the righteous and the unrighteous, and only the former is said to be raised imperishable.',
    aliases: ['raising of the dead'],
    topicId: 'resurrection',
    relatedSections: ['S22', 'S23'],
  },
  {
    id: 'final-judgment',
    term: 'Final Judgment',
    definition:
      'The judgment of all people after the resurrection, when each receives what is due for what was done in the body.',
    aliases: ['last judgment', 'judgment day'],
    topicId: 'final-judgment',
    relatedSections: ['S23', 'S03'],
  },
  {
    id: 'apollumi',
    term: 'apollumi',
    original: 'ἀπόλλυμι',
    originalLang: 'grc',
    transliteration: 'apollumi',
    definition:
      'A Greek verb covering destroy, kill, ruin and lose. It stands behind perish in John 3:16 and destroy in Matthew 10:28.',
    aliases: ['apolesai', 'perish', 'destroy'],
    topicId: 'perishing',
    relatedSections: ['S10', 'S11', 'S08'],
  },
  {
    id: 'aionios',
    term: 'aionios',
    original: 'αἰώνιος',
    originalLang: 'grc',
    transliteration: 'aiōnios',
    definition:
      'The Greek adjective rendered eternal or everlasting. It can mark unending duration and it can mark what belongs to the age to come.',
    aliases: ['aionion', 'eternal', 'everlasting'],
    topicId: 'eternal-and-everlasting',
    relatedSections: ['S04', 'S14'],
  },
  {
    id: 'unquenchable-fire',
    term: 'Unquenchable Fire',
    definition:
      'Fire that cannot be put out before it has consumed what it is burning. In the Hebrew prophets the phrase describes fire nobody can stop, not fire that never ends.',
    aliases: ['fire that is not quenched', 'asbestos'],
    topicId: 'fire',
    relatedSections: ['S01', 'S13'],
  },
  {
    id: 'image-of-god',
    term: 'Image of God',
    definition:
      'The biblical description of human beings as made to reflect God. Scripture never defines it as inherent immortality, and every view in this debate affirms that human beings bear it.',
    aliases: ['imago dei'],
    relatedSections: ['RB2', 'S31'],
  },
]
