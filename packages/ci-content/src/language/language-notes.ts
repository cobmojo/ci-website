import type { LanguageNote } from '@ci/content-schema'

/**
 * Original-language notes.
 *
 * A note exists here only where the source document actually makes an argument
 * from a Greek or Hebrew word. Each one states the standard range of meaning
 * honestly, gives the argument this site makes from the word in its context,
 * and sets out how other interpreters read the same word.
 *
 * Three rules govern this file:
 *
 * 1. No note treats a root or an etymology as if it determined meaning, and no
 *    note lets a count of occurrences stand in for reading a word in context.
 * 2. `morphology` is omitted wherever a parsing would be a guess. An absent
 *    field is better than a confident-sounding invention.
 * 3. Every note whose argument depends on the Greek or the Hebrew carries
 *    `specialist-review-pending`. That is all of them, which is the honest
 *    status for a site written by people without formal training in these
 *    languages.
 */
export const LANGUAGE_NOTES: readonly LanguageNote[] = [
  {
    id: 'apollumi',
    lemma: 'ἀπόλλυμι',
    lang: 'grc',
    transliteration: 'apollumi',
    gloss: 'destroy, kill, ruin, lose',
    lexicalRange: [
      'destroy or bring to ruin',
      'put to death, kill',
      'lose something one had',
      'be lost or perish, in the middle voice',
      'spoil or render useless',
    ],
    contextualArgument:
      'In Matthew 10:28 Jesus sets his warning alongside those who kill the body: they can kill the body but cannot kill the soul, so fear the one who can destroy both soul and body in Gehenna. The comparison is with the ending of life, and the word chosen for what God is able to do is meant to be more severe than killing rather than less. In John 3:16 the same word group supplies the stated alternative to eternal life, where it keeps company with death, not seeing life, passing away and destruction. Chris Date has noted that in the Synoptic Gospels this verb appears in the active voice with one agent acting on another in nine places, and that in the eight besides Matthew 10:28 it refers to putting a person to death. That is a pattern within a limited body of texts, not a rule about what the word must mean, and the argument here rests on the comparison Jesus himself draws rather than on the tally.',
    competingInterpretations: [
      'Many interpreters read destroy in Matthew 10:28 as ruin rather than cessation, so that God consigns the whole person to a condition of everlasting loss without ending their existence.',
      'Others point out that the same verb is used of a lost sheep, a lost coin and spoiled wineskins, none of which cease to exist, and conclude that the word by itself settles nothing either way.',
      'Some hold that the nine-instance pattern is drawn from too small a sample, and that Matthew 10:28 is precisely the case where a familiar word is stretched to describe something without earthly parallel.',
    ],
    occurrences: [
      'Matthew 10:28',
      'John 3:16',
      'Matthew 2:13',
      'Matthew 22:7',
      'Mark 3:6',
      'Luke 6:9',
      'Luke 15:4',
      'Mark 2:22',
    ],
    relatedSections: ['S10', 'S11', 'S08'],
    sourceIds: ['rethinking-hell', 'dear-bible-teaches-annihilationism'],
    reviewStatus: 'specialist-review-pending',
  },
  {
    id: 'aionios',
    lemma: 'αἰώνιος',
    lang: 'grc',
    transliteration: 'aiōnios',
    gloss: 'eternal, everlasting, of the age to come',
    lexicalRange: [
      'without end, everlasting',
      'belonging to the age to come',
      'lasting for an age or a long period',
      'permanent in its effect',
    ],
    contextualArgument:
      'Matthew 25:46 sets eternal punishment in parallel with eternal life, and conditionalism affirms that both are eternal. The argument this site makes is not that the adjective is weak but that the two nouns name different kinds of thing: life is a state that is lived, and punishment is a sentence whose result stands. Elsewhere in the New Testament the same adjective qualifies salvation, redemption, inheritance and judgment, each of which is accomplished at a point and stands permanently afterwards. On that pattern an eternal punishment can be a punishment carried out once whose effect never reverses. This is an argument about the noun in each phrase and about the wider usage of the adjective, not a claim that it cannot mean unending duration, which it plainly does of eternal life.',
    competingInterpretations: [
      'The traditional reading holds that one adjective in one sentence must carry the same force in both halves, so that if the life is consciously enjoyed without end the punishment is consciously endured without end.',
      'Some universalist writers argue that the adjective means pertaining to an age and can therefore mark a bounded period, a reading that standard lexicons treat as too narrow for its New Testament use.',
      'Others hold that duration and quality are both present in the word, and that pressing either sense on its own misdescribes how it functions in the Gospels.',
    ],
    occurrences: [
      'Matthew 25:46',
      'Hebrews 5:9',
      'Hebrews 9:12',
      'Hebrews 9:15',
      'Hebrews 6:2',
      '2 Thessalonians 1:9',
      'Jude 7',
    ],
    relatedSections: ['S04', 'S14', 'S02'],
    sourceIds: ['dear-bible-teaches-annihilationism', 'rethinking-hell-2-thess-1-9-part-2'],
    reviewStatus: 'specialist-review-pending',
  },
  {
    id: 'apo',
    lemma: 'ἀπό',
    lang: 'grc',
    transliteration: 'apo',
    gloss: 'from, away from, out of, by',
    lexicalRange: [
      'separation, away from',
      'source or origin, from',
      'agency or cause, at the hands of',
      'a starting point in place or time',
      'material out of which something is made',
    ],
    contextualArgument:
      '2 Thessalonians 1:9 identifies the punishment as eternal destruction and then adds a phrase governed by this preposition: from the presence of the Lord and from the glory of his might. Translations divide. Some render it away from or shut out from, which reads the phrase as locating the wicked during their punishment; others render it simply from, which allows the presence of the Lord to be the source of the destruction rather than the place where it happens. The author of the source document suggests the second reading, points to Acts 3:19 where the same preposition marks a source, and states plainly that he is no Greek scholar and offers it with hesitancy. The wider case does not depend on the outcome, since the verse names the punishment as destruction on either rendering. A concordance entry lists glosses; it cannot establish how a preposition of this range functions in a particular clause, which is why this note is flagged for specialist review rather than presented as settled.',
    competingInterpretations: [
      'Most modern English versions render the phrase as separation, away from or shut out from the presence of the Lord, which is a natural reading of the preposition alongside language of exclusion.',
      'Others note the close verbal similarity to Isaiah 2:10 and 2:19 in the Greek Old Testament, where people hide from the terror of the Lord and from the glory of his majesty, and read the phrase in 2 Thessalonians as an allusion carrying the separation sense.',
      'Some hold that the preposition is genuinely ambiguous here and that the sentence is decided by what destruction means rather than the other way round.',
    ],
    occurrences: [
      '2 Thessalonians 1:9',
      'Acts 3:19',
      'Isaiah 2:10 in the Greek Old Testament',
      'Isaiah 2:19 in the Greek Old Testament',
    ],
    relatedSections: ['S04'],
    sourceIds: [
      'biblehub-apo-575',
      'rethinking-hell-2-thess-1-9-part-2',
      'rethinking-hell-2-thess-1-9-part-1',
    ],
    reviewStatus: 'specialist-review-pending',
  },
  {
    id: 'cherpah',
    lemma: 'חֶרְפָּה',
    lang: 'he',
    transliteration: 'cherpah',
    gloss: 'reproach, disgrace, shame',
    lexicalRange: [
      'reproach or taunt directed at someone',
      'disgrace or dishonour',
      'the state of being an object of scorn',
      'an insult spoken against a person or a people',
    ],
    contextualArgument:
      'Daniel 12:2 says that many who sleep in the dust of the earth will awake, some to everlasting life and some to shame and everlasting contempt. The Hebrew noun rendered shame here is more often rendered reproach, and reproach names something directed at a person by others rather than something felt inside them. On that reading the verse describes how the unrighteous are regarded rather than what they undergo, and a person does not need to be conscious in order to be an object of reproach. The same construction appears in Jeremiah 23:40, where God speaks of bringing an everlasting reproach upon a people. This observation does not settle the verse on its own, because a word that usually carries one sense can carry another in a particular clause, and English versions differ here for good reasons.',
    competingInterpretations: [
      'Many interpreters take shame in Daniel 12:2 as the experience of the person raised, which would require continued conscious existence for that shame to be felt.',
      'Others hold that the pairing with everlasting life sets two conscious states side by side, and that the parallel carries the weight rather than the individual noun.',
      'Some argue that the distinction between an emotion felt and an emotion directed is too tidy for Hebrew usage, where reproach can involve both at once.',
    ],
    occurrences: ['Daniel 12:2', 'Jeremiah 23:40', 'Joshua 5:9', 'Psalms 69:9'],
    relatedSections: ['S01', 'S04'],
    sourceIds: ['strongs-h2781', 'dear-bible-teaches-annihilationism'],
    reviewStatus: 'specialist-review-pending',
  },
  {
    id: 'deraon',
    lemma: 'דֵּרָאוֹן',
    lang: 'he',
    transliteration: 'dera’on',
    gloss: 'abhorrence, loathing, contempt',
    lexicalRange: [
      'abhorrence or revulsion',
      'an object of loathing',
      'contempt directed at something',
    ],
    contextualArgument:
      'The Hebrew noun rendered contempt in Daniel 12:2 is a rare word that the Hebrew Bible uses in only one other place, Isaiah 66:24, where it is rendered loathsome or abhorrent. In Isaiah the objects of that loathing are dead bodies, which the living go out and look upon. If Daniel is drawing on the same picture, then everlasting contempt in Daniel 12:2 describes how the unrighteous are permanently regarded rather than what they permanently feel, and a name can carry contempt long after the person is dead. The link between the two verses is a textual observation any reader can check. What Daniel intends by the allusion is a matter of judgement, and this site does not treat one rare word as sufficient to settle the meaning of the verse.',
    competingInterpretations: [
      'Many interpreters read everlasting contempt in Daniel 12:2 as a conscious state of disgrace endured by those who are raised, parallel to the everlasting life of the righteous.',
      'Others accept the link with Isaiah 66:24 and argue that Daniel nevertheless extends the image, since Daniel speaks of people awaking rather than of corpses being looked upon.',
      'Some hold that Daniel 12:2 is deliberately reticent about the state of the unrighteous, and that no view should build its case on this verse.',
    ],
    occurrences: ['Daniel 12:2', 'Isaiah 66:24'],
    relatedSections: ['S01', 'S04'],
    sourceIds: ['dear-bible-teaches-annihilationism', 'rethinking-hell-worm-does-not-die'],
    reviewStatus: 'specialist-review-pending',
  },
  {
    id: 'katakaio',
    lemma: 'κατακαίω',
    lang: 'grc',
    transliteration: 'katakaio',
    gloss: 'burn up, burn down, consume with fire',
    lexicalRange: ['burn up completely', 'consume with fire', 'burn down or destroy by burning'],
    contextualArgument:
      'In the parable of the weeds the reapers gather the weeds and burn them while the wheat goes into the barn, and Matthew 13:40 uses a compound verb that English versions render burned or burned up. The same verb describes the scrolls burned at Ephesus, the bodies burned outside the camp, and a third of the earth burned in Revelation, and in each of those the thing burned does not survive the burning. The weight of the argument here falls on the parable rather than on the verb: weeds gathered for burning are not preserved in the fire, and Jesus supplies the interpretation himself. The verse that follows, about weeping and gnashing of teeth, marks a conscious response, and this site takes that as a stated limit on the analogy rather than as a reversal of it.',
    competingInterpretations: [
      'Defenders of the traditional view hold that a parable illustrates one point, and that the fate of vegetation cannot be pressed into a full account of what happens to persons.',
      'Others note that the weeping and gnashing of teeth in the following verse implies continuing consciousness in the furnace, which any burning-up reading has to accommodate.',
      'Some argue that the compound verb carries no settled emphasis on completion in Greek usage, so nothing should be built on the form of the word itself.',
    ],
    occurrences: [
      'Matthew 13:30',
      'Matthew 13:40',
      'Acts 19:19',
      'Hebrews 13:11',
      'Revelation 8:7',
    ],
    relatedSections: ['S13', 'S06', 'S08'],
    sourceIds: ['dear-bible-teaches-annihilationism', 'welch-source-document'],
    reviewStatus: 'specialist-review-pending',
  },
  {
    id: 'anapausis',
    lemma: 'ἀνάπαυσις',
    lang: 'grc',
    transliteration: 'anapausis',
    gloss: 'rest, respite, cessation',
    lexicalRange: [
      'rest or repose',
      'cessation from an activity',
      'relief or intermission',
      'a place or time of rest',
    ],
    contextualArgument:
      'Revelation 14:11 says that those who worship the beast have no rest day and night, and Revelation 4:8 says that the four living creatures have no rest day and night as they say Holy, holy, holy. The wording is closely similar in Greek, and in 4:8 it describes unbroken activity rather than suffering. The source document offers three readings of 14:11 on that basis: that the clause describes the worshippers of the beast before their judgment, as a dark counterpart to the creatures around the throne; that it describes their state while their torment lasts; or that, since the original text carried no punctuation, the clause may attach to the smoke that rises rather than to the worshippers. The author sets these out as suggestions and settles on none of them, and this site keeps them at exactly that weight. A verbal similarity is a real observation about the text, but it does not by itself determine how the later verse should be read.',
    competingInterpretations: [
      'The common reading is that the clause describes the unending restlessness of those who worship the beast, and that no rest day or night is a natural way of saying their torment has no intermission.',
      'Others accept the verbal parallel with Revelation 4:8 and read it as deliberate irony that intensifies rather than qualifies the torment, setting false worship against true worship.',
      'Some hold that the phrase is Old Testament judgment language drawn from Isaiah 34, where a fire is not quenched night or day over a land already laid waste, and that it marks finality rather than duration.',
    ],
    occurrences: ['Revelation 14:11', 'Revelation 4:8', 'Matthew 11:29', 'Matthew 12:43'],
    relatedSections: ['S02'],
    sourceIds: [
      'dear-bible-teaches-annihilationism',
      'rethinking-hell-bible-fellowship-church',
      'welch-source-document',
    ],
    reviewStatus: 'specialist-review-pending',
  },
  {
    id: 'asbestos',
    lemma: 'ἄσβεστος',
    lang: 'grc',
    transliteration: 'asbestos',
    gloss: 'unquenchable, not put out',
    lexicalRange: [
      'unquenchable, unable to be put out',
      'inextinguishable',
      'not extinguished by anyone',
    ],
    contextualArgument:
      'Mark 9:43 speaks of unquenchable fire, and Mark 9:48 closes the warning with the related verb in a quotation of Isaiah 66:24, where the fire is not quenched and the objects of the fire are dead bodies. In the Hebrew prophets this language describes a fire that nobody can put out before it has finished consuming what it burns. Ezekiel’s fire consumes every tree, green and dry alike; Isaiah’s tinder burns with none to quench it; Jeremiah warns of a fire in the gates of Jerusalem that will not be quenched. Each of those is a statement about what cannot interrupt the fire, not a statement about how long the fire burns. Some modern versions render Mark 9:43 as the fire that never goes out, which is an interpretive rendering rather than a literal one, and this site sets out the difference rather than quietly relying on it.',
    competingInterpretations: [
      'Interpreters who hold eternal conscious torment read unquenchable fire in an eschatological setting as fire that does not end, reinforced by the worm that does not die standing alongside it.',
      'Others argue that the prophetic parallels concern temporal judgments on cities and nations, and that Jesus may be intensifying the image rather than simply repeating it.',
      'Some hold that the word says nothing either way about duration, and that its force is the certainty and irresistibility of the judgment rather than its length.',
    ],
    occurrences: [
      'Mark 9:43',
      'Mark 9:48',
      'Matthew 3:12',
      'Luke 3:17',
      'Isaiah 66:24',
      'Ezekiel 20:47-48',
      'Jeremiah 17:27',
    ],
    relatedSections: ['S01', 'S13', 'S08'],
    sourceIds: [
      'rethinking-hell-fire-not-quenched',
      'rethinking-hell-worm-does-not-die',
      'dear-bible-teaches-annihilationism',
    ],
    reviewStatus: 'specialist-review-pending',
  },
]
