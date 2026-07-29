import type { PassageRecord } from '@ci/content-schema'

/**
 * The passage library.
 *
 * One record per disputed or load-bearing passage in the case. Each record
 * states the eternal conscious torment (ECT) reading before the conditional
 * immortality (CI) response, names what both sides agree on, and isolates the
 * single point where the two readings actually diverge.
 *
 * No Scripture text is typed here. Every `quotations` entry carries the rights
 * record only; the renderer looks up the verified World English Bible text by
 * reference from `packages/ci-content/src/scripture/web-text.ts`, which is why
 * each `reference` must exist in that corpus.
 */
export const PASSAGE_RECORDS: readonly PassageRecord[] = [
  /* ------------------------------ Old Testament ------------------------------ */
  {
    id: 'isaiah-66-15-24',
    slug: 'isaiah-66-15-24',
    normalizedReference: 'Isaiah 66:15-24',
    book: 'Isaiah',
    bookOrder: 23,
    chapter: 66,
    verseStart: 15,
    verseEnd: 24,
    additionalReferences: [],

    shortDescription:
      'The scene of corpses, undying worms and unquenched fire that Jesus quotes when he speaks of Gehenna.',
    quotations: [
      {
        reference: 'Isaiah 66:15-24',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['background', 'primary-support'],
    usedInSections: ['S01', 'S04', 'S10'],
    relatedPassages: [
      'mark-9-42-48',
      'daniel-12-2',
      'matthew-10-28',
      'second-thessalonians-1-5-10',
    ],
    topicIds: ['fire', 'destruction', 'death', 'final-judgment', 'day-of-the-lord', 'gehenna'],

    immediateContext:
      'The closing oracle of Isaiah. The Lord comes in fire to judge all flesh, the nations are gathered to see his glory, and the book ends with worshippers going out to look at the corpses of those who rebelled against him.',
    canonicalContext:
      'Jesus quotes the last verse of this chapter in Mark 9:48. The source document also notes that the combination of flaming fire and vengeance in 2 Thessalonians 1:7-8 appears together elsewhere only at Isaiah 66:15, at the head of this same oracle. Jeremiah 7:32-33 uses comparable imagery of unburied bodies in the valley that gives Gehenna its name.',
    whyItMatters:
      'Because Mark 9:48 quotes verse 24 word for word, whatever this verse pictures is what Jesus brings with him into his warning about Gehenna. The whole dispute over the undying worm and the unquenchable fire starts here rather than in the Gospels.',
    ectReading:
      'Defenders of eternal conscious torment note that Isaiah sets the scene inside the new heavens and new earth of verses 22 and 23, where worship is continual. If in that setting the worm does not die and the fire is not quenched, the imagery is deliberately unending, and Jesus intensifies rather than softens it when he applies the words to Gehenna. On this reading the loathsome sight is a permanent condition, which requires something that permanently remains to be loathed.',
    conditionalistReading:
      'Conditionalists answer that the objects of the worm and the fire in verse 24 are dead bodies, not living people, and that both agents are described by their thoroughness rather than by their duration. A worm that does not die finishes eating, and a fire that is not quenched cannot be put out before it finishes burning. Ezekiel 20:47-48, Isaiah 1:31 and Jeremiah 4:4 use unquenchable fire for judgments that plainly completed their work.',
    agreements: [
      'This is a real picture of divine judgment and not an image emptied of consequence.',
      'Verse 24 is the text Jesus quotes in Mark 9:48.',
      'The worm and the fire are unstoppable, in the sense that nothing interrupts them.',
      'Those in view are objects of lasting abhorrence to the redeemed.',
    ],
    disagreement:
      'Whether the undying worm and unquenched fire describe agents that never finish their work on the living, or agents that cannot be stopped until nothing of the dead remains.',
    languageNotes: [
      'The Hebrew word rendered loathsome in verse 24 is the same word rendered contempt in Daniel 12:2.',
      'Unquenchable describes a fire that cannot be put out, which is a narrower claim than a fire that never goes out.',
    ],

    notes: [
      'The source document argues that the redeemed go out to look on the bodies at one point rather than perpetually, since verse 23 places them at worship before the Lord.',
    ],
    sourceIds: [
      'welch-source-document',
      'rethinking-hell-worm-does-not-die',
      'rethinking-hell-fire-not-quenched',
      'dear-bible-teaches-annihilationism',
    ],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'daniel-12-2',
    slug: 'daniel-12-2',
    normalizedReference: 'Daniel 12:2',
    book: 'Daniel',
    bookOrder: 27,
    chapter: 12,
    verseStart: 2,
    additionalReferences: [],

    shortDescription:
      'The clearest Old Testament statement of a two-outcome resurrection: everlasting life or everlasting contempt.',
    quotations: [
      {
        reference: 'Daniel 12:2',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text'],
    usedInSections: ['S01', 'S12'],
    relatedPassages: ['isaiah-66-15-24', 'mark-9-42-48', 'matthew-25-31-46'],
    topicIds: [
      'resurrection',
      'eternal-life',
      'eternal-and-everlasting',
      'final-judgment',
      'death',
    ],

    immediateContext:
      "The close of Daniel's final vision. After a time of distress without precedent, many who sleep in the dust of the earth awake, some to everlasting life and some to shame and everlasting contempt.",
    canonicalContext:
      'This is the Old Testament text that most plainly sets a resurrection to life alongside a resurrection to judgment. The word rendered contempt appears again in Isaiah 66:24, where it describes corpses that are loathsome to all flesh, and a comparable idea of everlasting reproach appears in Jeremiah 23:40.',
    whyItMatters:
      'It is regularly listed beside Mark 9:48 as the Old Testament anchor for endless punishment, because everlasting contempt stands in the same sentence, under the same modifier, as everlasting life.',
    ectReading:
      'Defenders of eternal conscious torment point to the parallel structure of the verse. One group awakes to everlasting life and the other to everlasting shame and contempt, and the same modifier governs both halves. If the life of the first group is an unending conscious state, the natural reading is that the shame of the second group is an unending conscious state too, otherwise the verse balances a permanent experience against a permanent absence.',
    conditionalistReading:
      'Conditionalists answer that the word rendered shame is more often rendered reproach, and that reproach and contempt are both attitudes held toward someone rather than sensations felt by them. A person need not be conscious, or even present, for contempt toward him to continue. The source document adds, citing Joseph Dear, that the Hebrew word for life used here carries the basic sense of being alive, so those who do not receive it do not go on living.',
    agreements: [
      'Daniel describes a genuine resurrection of both the righteous and the wicked.',
      'The contempt in view really does last for ever.',
      'The two outcomes are deliberately set in parallel.',
    ],
    disagreement:
      'Whether everlasting contempt describes an ongoing conscious experience of those who are raised, or the lasting judgement of others upon them.',
    languageNotes: [
      'The Hebrew word rendered shame here is more often rendered reproach in English versions.',
      'The word rendered contempt is the same word rendered loathsome in Isaiah 66:24.',
      'The Hebrew word for life here carries the basic sense of being alive rather than the fuller sense of knowing God.',
    ],

    notes: [
      'The source document treats this verse as a secondary rather than a primary text for eternal conscious torment, listing it as one that possibly supports that view.',
    ],
    sourceIds: ['welch-source-document', 'strongs-h2781', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  /* ------------------------------ Gospels ------------------------------ */
  {
    id: 'matthew-7-13-14',
    slug: 'matthew-7-13-14',
    normalizedReference: 'Matthew 7:13-14',
    book: 'Matthew',
    bookOrder: 40,
    chapter: 7,
    verseStart: 13,
    verseEnd: 14,
    additionalReferences: [],

    shortDescription:
      'The two ways, one leading to destruction and the other to life, with few finding the narrow one.',
    quotations: [
      {
        reference: 'Matthew 7:13-14',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'pastoral'],
    usedInSections: ['P00', 'S08', 'S11', 'S19', 'S33', 'APP1', 'APP2'],
    relatedPassages: ['john-3-16-36', 'romans-6-23', 'matthew-25-31-46'],
    topicIds: ['destruction', 'perishing', 'eternal-life', 'final-judgment'],

    immediateContext:
      'Near the close of the Sermon on the Mount. Jesus contrasts a wide gate and an easy road with a narrow gate and a hard road, and names the outcome of each: destruction on one side, life on the other.',
    canonicalContext:
      'The pairing of destruction with life belongs to a wider New Testament pattern in which the alternative to eternal life is named by loss of life rather than by a different quality of continued life. John 3:16 uses perishing, Romans 6:23 uses death, and Philippians 3:19 says of the enemies of the cross that their end is destruction.',
    whyItMatters:
      'It supplies the word Jesus chooses for the outcome of the broad road, and it also supplies the observation that the group on that road is the larger one. Both claims shape almost every downstream argument about the justice and the character of God.',
    ectReading:
      'Defenders of eternal conscious torment read destruction here as ruin rather than extinction, in the way a building can be a ruin and still stand, or a lost coin can be lost without ceasing to exist. On this reading Jesus is naming an outcome of total loss without naming its metaphysics, and the force of the saying lies in the seriousness of the road and the fewness of those who avoid it.',
    conditionalistReading:
      'Conditionalists take the word in its ordinary sense and note that it stands opposite life rather than opposite joy. The source document counts roughly ten New Testament contrasts with eternal life and observes that they use perishing, death, passing away, not having life, wrath, judgment and destruction. Reading destruction here as ruined but surviving forces the same rereading on every other member of that set.',
    agreements: [
      'The two roads have genuinely different destinations.',
      'The road that does not lead to life is the one most people take.',
      'The outcome is final and is to be avoided at all costs.',
    ],
    disagreement:
      'Whether the destruction at the end of the broad road is a permanent condition of ruin that the person continues to undergo, or the ending of the person as a living being.',
    languageNotes: [],

    notes: [
      'The case uses this passage in its preface and appendices as the basis for the claim that the group facing judgment is the larger one.',
      'The source document labels the net-outcome argument built on this verse as a philosophical argument that carries no evidential weight of its own.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'matthew-10-28',
    slug: 'matthew-10-28',
    normalizedReference: 'Matthew 10:28',
    book: 'Matthew',
    bookOrder: 40,
    chapter: 10,
    verseStart: 28,
    additionalReferences: [],

    shortDescription:
      'Jesus tells his disciples to fear the one who can destroy both soul and body in Gehenna.',
    quotations: [
      {
        reference: 'Matthew 10:28',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'definition'],
    usedInSections: ['S10', 'S22'],
    relatedPassages: ['luke-12-4-5', 'first-corinthians-15', 'revelation-20-10-15'],
    topicIds: ['destruction', 'gehenna', 'body-soul-and-spirit', 'death', 'immortality'],

    immediateContext:
      'Part of the commissioning of the Twelve. Jesus warns them of coming persecution, tells them not to fear those who can kill only the body, and directs their fear instead to the one who is able to destroy both soul and body in Gehenna.',
    canonicalContext:
      'The case reads it beside Luke 12:4-5, which states the same warning as a sequence of killing and then casting into Gehenna, and beside 1 Corinthians 15, where an imperishable body is promised to those in Christ rather than assumed for everyone.',
    whyItMatters:
      'It is the one saying in which Jesus states directly what becomes of the soul in Gehenna, and the verb he uses there is destroy rather than torment.',
    ectReading:
      "Defenders of eternal conscious torment hold that the verb here means to ruin or to render useless rather than to end, the sense it carries when wineskins are destroyed or a life is lost. On this reading the saying contrasts a limited human power over the body with God's authority over the whole person, and what it points to is the everlasting ruin of body and soul together rather than their extinction.",
    conditionalistReading:
      'Conditionalists note that Jesus sets the two halves in parallel: what people can do to the body, God can do to body and soul. If the human half means literal killing, the divine half is naturally read as the ending of the whole person, and Jesus reaches for a stronger word to say so. The source document cites Chris Date for the observation that in the Synoptic Gospels this verb in the active voice, used of one agent acting on another, otherwise always refers to killing a person.',
    agreements: [
      "God's authority over the final fate of a person exceeds any human power.",
      'The warning concerns Gehenna and not merely the death of the body.',
      'Body and soul share a single fate in what Jesus says here.',
    ],
    disagreement:
      'Whether destroying soul and body names a ruin the person continues to undergo, or the ending of the person as a living being.',
    languageNotes: [
      'The Greek verb rendered destroy here is apollumi, the root behind perish in John 3:16.',
      'Jesus uses one verb for what people do to the body, kill, and a different and stronger verb for what God can do to body and soul.',
    ],

    notes: [
      'The source document works through the possible states of body, soul and spirit after the lake of fire, and treats this verse as the constraint that ties the fate of body and soul together.',
      'The author presents the three-part account of the person as his own framework and tells readers who do not find it helpful to move on to the next section.',
    ],
    sourceIds: ['welch-source-document', 'rethinking-hell', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'matthew-13-24-43',
    slug: 'matthew-13-24-43',
    normalizedReference: 'Matthew 13:24-43',
    book: 'Matthew',
    bookOrder: 40,
    chapter: 13,
    verseStart: 24,
    verseEnd: 43,
    additionalReferences: [],

    shortDescription:
      'The parable of the weeds and its explanation, ending in a fiery furnace with weeping and gnashing of teeth.',
    quotations: [
      {
        reference: 'Matthew 13:24-30',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
      {
        reference: 'Matthew 13:36-43',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text', 'primary-support'],
    usedInSections: ['S06', 'S13', 'S20', 'S30'],
    relatedPassages: ['matthew-25-31-46', 'luke-16-19-31', 'revelation-20-10-15'],
    topicIds: [
      'fire',
      'destruction',
      'weeping-and-gnashing-of-teeth',
      'final-judgment',
      'outer-darkness',
    ],

    immediateContext:
      "Two units of Matthew's parable chapter: the parable of the weeds sown among the wheat, and the private explanation Jesus gives his disciples, which identifies the field as the world, the harvest as the end of the age and the reapers as angels.",
    canonicalContext:
      'The same furnace and the same closing sentence appear in the parable of the net later in the chapter. The phrase about weeping and gnashing of teeth also recurs where no fire is mentioned at all, in Luke 13:28, Matthew 22:13 and Matthew 25:30.',
    whyItMatters:
      'This is the one place where a fiery furnace and weeping and gnashing of teeth stand in the same sentence, so it carries much of the weight in arguments that the fire of judgment does not consume what is thrown into it.',
    ectReading:
      'Defenders of eternal conscious torment observe that Jesus does not stop at the burning of the weeds. He adds a human response, weeping and gnashing of teeth, which presupposes people who are conscious in that place. A parable drawn from vegetation has limits, and verse 42 is precisely where Jesus states what the vegetation could not show, namely that those thrown in experience their punishment.',
    conditionalistReading:
      'Conditionalists answer that the verb behind burned in verse 40 carries the sense of burning up, and that the point of choosing weeds is that weeds are consumed. The source document argues that the phrase in that place most likely covers the whole judgment scene, since the identical phrase appears in Luke 13 and Matthew 22 and 25 with no furnace present. It also grants a second reading: a conscious response is possible even inside the furnace while a person is being destroyed.',
    agreements: [
      'The weeds stand for people, and the harvest is the final judgment.',
      'The response in verse 42 is genuinely conscious and genuinely dreadful.',
      'The parable teaches a real separation with two different outcomes.',
      'Judgment here is executed by the Son of Man through his angels at the end of the age.',
    ],
    disagreement:
      'Whether weeping and gnashing of teeth describes a permanent condition inside the furnace, or the reaction of the condemned at the judgment itself and as they are destroyed.',
    languageNotes: [
      'The verb rendered burned in verse 40 is katakaio, which carries the sense of burning something up.',
    ],

    notes: [
      'The verified Scripture corpus stores this passage as two units, Matthew 13:24-30 and Matthew 13:36-43, which are quoted here in place of the combined reference.',
      'The source document reads verse 42 as marking the limits of the parable rather than reversing it, since conditional immortality does not teach a painless ceasing to exist.',
    ],
    sourceIds: [
      'welch-source-document',
      'rethinking-hell-weeping-gnashing',
      'dear-bible-teaches-annihilationism',
    ],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'matthew-25-31-46',
    slug: 'matthew-25-31-46',
    normalizedReference: 'Matthew 25:31-46',
    book: 'Matthew',
    bookOrder: 40,
    chapter: 25,
    verseStart: 31,
    verseEnd: 46,
    additionalReferences: [],

    shortDescription:
      'The sheep and the goats, closing with eternal punishment set against eternal life.',
    quotations: [
      {
        reference: 'Matthew 25:31-46',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text', 'definition'],
    usedInSections: ['S03', 'S04', 'S11', 'S12', 'S20', 'S30', 'S32'],
    relatedPassages: [
      'second-thessalonians-1-5-10',
      'revelation-20-10-15',
      'matthew-13-24-43',
      'matthew-7-13-14',
    ],
    topicIds: [
      'eternal-and-everlasting',
      'punishment',
      'eternal-life',
      'final-judgment',
      'lake-of-fire',
      'fire',
    ],

    immediateContext:
      "The last of Jesus' judgment discourses in Matthew. The Son of Man takes his throne, separates the nations, sends one group into the kingdom prepared for them from the foundation of the world, and sends the other into the eternal fire prepared for the devil and his angels.",
    canonicalContext:
      'Verse 46 is the verse most often paired with 2 Thessalonians 1:9, which names the punishment as destruction. The phrase eternal punishment also sits beside a group of New Testament phrases that use eternal of a completed act with a permanent result: eternal salvation in Hebrews 5:9, eternal redemption in Hebrews 9:12, eternal inheritance in Hebrews 9:15 and eternal judgment in Hebrews 6:2.',
    whyItMatters:
      'The parallel between eternal punishment and eternal life inside a single sentence is the strongest verbal argument on the traditional side, and it forces both positions to say plainly what the word eternal is doing.',
    ectReading:
      'Defenders of eternal conscious torment argue from the symmetry of verse 46. One adjective governs both halves, so whatever eternal means for the life of the righteous it must mean for the punishment of the wicked. Since no Christian holds that eternal life is a completed act with no ongoing experience, eternal punishment cannot be one either. Jesus also assigns the wicked to the fire prepared for the devil and his angels, whose torment Revelation 20:10 describes as unending.',
    conditionalistReading:
      'Conditionalists accept the symmetry and locate the difference in the nouns. The text says punishment and not punishing, and 2 Thessalonians 1:9 states what that punishment is: destruction. On this reading the punishing happens once and the punishment stands for ever, in the way eternal redemption describes a redeeming accomplished once. The source document adds that if eternal life meant only living that continues without end, the traditional view would be attributing eternal life to the lost as well.',
    agreements: [
      'One adjective governs both punishment and life in verse 46.',
      'Both outcomes are final, irreversible and everlasting.',
      'The righteous inherit a kingdom prepared for them from the foundation of the world.',
      'The fire named in verse 41 was prepared for the devil and his angels.',
    ],
    disagreement:
      'Whether eternal punishment names a punishing that continues without end, or a punishment inflicted once whose effect stands without end.',
    languageNotes: [
      'Verse 46 uses nouns for both outcomes, punishment and life, rather than the verbal forms punishing and living.',
      'The Greek adjective rendered eternal can carry the sense of belonging to the age to come as well as the sense of unending duration.',
    ],

    notes: [
      'The source document holds that both sides can agree eternal punishment lasts for ever, and that the real question is what the punishment consists of.',
      'The author reads the fire of verse 41 as prepared for the devil and his angels, and notes that some conditionalists instead read the reference to the devil as a way of saying the wicked share his fate.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'mark-9-42-48',
    slug: 'mark-9-42-48',
    normalizedReference: 'Mark 9:42-48',
    book: 'Mark',
    bookOrder: 41,
    chapter: 9,
    verseStart: 42,
    verseEnd: 48,
    additionalReferences: [],

    shortDescription:
      "Jesus' warning about Gehenna, where the worm does not die and the fire is not quenched.",
    quotations: [
      {
        reference: 'Mark 9:42-48',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text'],
    usedInSections: ['S01', 'S12'],
    relatedPassages: ['isaiah-66-15-24', 'daniel-12-2', 'matthew-13-24-43', 'revelation-20-10-15'],
    topicIds: ['gehenna', 'fire', 'destruction', 'death', 'eternal-conscious-torment'],

    immediateContext:
      'Jesus warns against causing a little one to stumble, then presses the warning home with a series of hard sayings. It is better to enter life maimed than to keep hand, foot or eye and be thrown whole into Gehenna, where the worm does not die and the fire is not quenched.',
    canonicalContext:
      'Verse 48 is a direct quotation of Isaiah 66:24, and Jesus adds no qualification to it, so the corpses and the unquenched fire of that closing scene come along with the words. Gehenna itself takes its name from the Valley of the Son of Hinnom, which Jeremiah 7:32-33 renames the Valley of Slaughter and fills with unburied dead.',
    whyItMatters:
      "This is the first of the four passages the case identifies as the traditional view's principal texts, and the one place where Jesus himself uses the language of an undying worm and an unquenchable fire.",
    ectReading:
      'Defenders of eternal conscious torment read the doubled negative as deliberate. The worm does not die and the fire is not quenched because there is always something for them to work on. Jesus repeats the line for emphasis at the end of a passage about cutting off a hand or a foot, which makes sense only if what awaits is worse than any loss in this life, and an unending ruin that never completes is worse than a swift end.',
    conditionalistReading:
      'Conditionalists answer from the verse Jesus is quoting. In Isaiah 66:24 the worm and the fire are working on dead bodies, and both images describe agents that cannot be stopped short of finishing rather than agents that never finish. Ezekiel 20:47-48, Isaiah 1:31 and Jeremiah 4:4 use unquenchable fire of judgments that plainly did their work. The source document adds that even a worm or fire that persisted would not require a living person to persist under it.',
    agreements: [
      'Verse 48 is a quotation of Isaiah 66:24 and must be read together with it.',
      'Gehenna is a real and dreadful outcome that Jesus tells his hearers to avoid at any cost.',
      'The worm and the fire are described as unstoppable.',
      'Entering life maimed is genuinely better than the alternative Jesus names.',
    ],
    disagreement:
      'Whether the undying worm and unquenchable fire imply a person who remains alive under them, or agents that cannot be stopped until nothing of the dead remains.',
    languageNotes: [
      'Unquenchable describes a fire that cannot be put out, which is not the same claim as a fire that never goes out.',
      'Gehenna transliterates the Greek name of the Valley of the Son of Hinnom and is distinct from Hades and from the lake of fire.',
    ],

    notes: [
      'The source document notes that the NIV renders the phrase in Mark 9:43 as the fire that never goes out, which asserts more than unquenchable does, so that wording should not be treated on its own as evidence.',
      'The site keeps Hades, Sheol, Gehenna and the lake of fire distinct rather than letting one English word carry all four.',
    ],
    sourceIds: [
      'welch-source-document',
      'rethinking-hell-worm-does-not-die',
      'rethinking-hell-fire-not-quenched',
      'dear-bible-teaches-annihilationism',
    ],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'luke-12-4-5',
    slug: 'luke-12-4-5',
    normalizedReference: 'Luke 12:4-5',
    book: 'Luke',
    bookOrder: 42,
    chapter: 12,
    verseStart: 4,
    verseEnd: 5,
    additionalReferences: [],

    shortDescription:
      "Luke's form of the warning to fear the one who has authority to cast into Gehenna after killing.",
    quotations: [
      {
        reference: 'Luke 12:4-5',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'parallel'],
    usedInSections: ['S10'],
    relatedPassages: ['matthew-10-28', 'isaiah-66-15-24', 'revelation-20-10-15'],
    topicIds: ['gehenna', 'death', 'destruction', 'body-soul-and-spirit'],

    immediateContext:
      'Jesus is speaking to a crowd of thousands and turns aside to address his friends. He tells them not to fear those who kill the body and after that can do nothing more, and directs their fear to the one who has authority to cast into Gehenna after he has killed.',
    canonicalContext:
      'The Matthew form of the same warning, in Matthew 10:28, speaks of destroying soul and body. The order in Luke, killing first and casting into Gehenna afterwards, matches the sequence in Isaiah 66:24, where the fire and the worms work on bodies that are already dead.',
    whyItMatters:
      'The order of the two verbs carries the argument. If the killing precedes the casting, then Gehenna is not being described as a place where the living are held.',
    ectReading:
      "Defenders of eternal conscious torment read the killing here as the ordinary death of the body, the same death the persecutors can inflict, and take the point of the saying to be the contrast in authority rather than a timetable for the last judgment. God's power does not stop at the grave, and the fear Jesus commands is fear of what lies beyond it, which the tradition understands as unending punishment in Gehenna.",
    conditionalistReading:
      'Conditionalists read the sequence as significant in its own right. God kills and then casts into Gehenna, which lines up with Isaiah 66:24, where the bodies are already dead when the fire and the worms reach them, and with Matthew 10:28, where the destruction covers soul as well as body. On this reading Gehenna receives the dead rather than holding the living.',
    agreements: [
      'The fear Jesus commands is directed to God and not to human persecutors.',
      'Human power over a person stops at the body and at death.',
      'Gehenna is the outcome to be feared above every earthly threat.',
    ],
    disagreement:
      'Whether the killing in view is the ordinary death that precedes judgment, or an act of God at the judgment that precedes the casting into Gehenna.',
    languageNotes: [],

    notes: [
      'The source document treats this verse as support for its reading of Matthew 10:28 rather than as an independent argument.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'luke-16-19-31',
    slug: 'luke-16-19-31',
    normalizedReference: 'Luke 16:19-31',
    book: 'Luke',
    bookOrder: 42,
    chapter: 16,
    verseStart: 19,
    verseEnd: 31,
    additionalReferences: [],

    shortDescription:
      'The rich man and Lazarus, the passage most often cited as a picture of conscious suffering after death.',
    quotations: [
      {
        reference: 'Luke 16:19-31',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text', 'background'],
    usedInSections: ['S05', 'S09', 'S13', 'S33'],
    relatedPassages: ['revelation-20-10-15', 'second-peter-3-7-13', 'matthew-13-24-43'],
    topicIds: ['hades', 'intermediate-state', 'sheol', 'eternal-conscious-torment', 'death'],

    immediateContext:
      "Jesus tells of a rich man and a beggar who both die. The beggar is carried to Abraham's side, the rich man is in torment in Hades, and the exchange turns on his request that his five brothers, who are still living, be warned.",
    canonicalContext:
      "The word used for the rich man's location is Hades, which is neither Gehenna nor the lake of fire. Revelation 20:13-14 has Hades give up its dead and then be thrown into the lake of fire, which places it before the final judgment rather than after it.",
    whyItMatters:
      'It is the only extended narrative in the Gospels of a person conscious and suffering after death, so it does more work in popular argument than almost any other passage.',
    ectReading:
      'Defenders of eternal conscious torment point out that Jesus depicts a man who is conscious, in pain, aware of his condition, able to speak and remember, with a great chasm fixed so that no one can cross. Whether or not the account is a parable, Jesus chose to describe the state of the unrighteous dead in exactly these terms, and nothing in the passage suggests the condition is temporary.',
    conditionalistReading:
      'Conditionalists agree that the man is conscious and suffering, and place him in Hades before the resurrection and the last judgment, since his brothers are still alive and can still be warned. The source document holds that the passage describes the intermediate state rather than the final one, that nothing in it says the rich man will live for ever, and that God sustains the unrighteous dead until the day of judgment.',
    agreements: [
      'The rich man is conscious and genuinely suffering.',
      "The scene takes place while the rich man's five brothers are still alive.",
      'The word used for his location is Hades, not Gehenna.',
      'The chasm between the two men is fixed and cannot be crossed.',
    ],
    disagreement:
      'Whether the scene describes the final state of the unrighteous, or the intermediate state that precedes the resurrection and the last judgment.',
    languageNotes: [
      'Some English versions render Hades, Sheol and Gehenna alike as hell, which flattens three distinct words into one.',
    ],

    notes: [
      'The source document holds that the interpretation does not depend on whether this is a parable or a report of real people.',
      'The case treats continued existence in the intermediate state as God sustaining the dead until judgment rather than as evidence of an inherently immortal soul.',
      'The author observes that if the intermediate state already involves this suffering, the traditional view leaves the lake of fire adding nothing to it.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'john-3-16-36',
    slug: 'john-3-16-36',
    normalizedReference: 'John 3:16',
    book: 'John',
    bookOrder: 43,
    chapter: 3,
    verseStart: 16,
    additionalReferences: ['John 3:36'],

    shortDescription:
      'Perishing set against eternal life, and not seeing life set against wrath that remains.',
    quotations: [
      {
        reference: 'John 3:16',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
      {
        reference: 'John 3:36',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'definition'],
    usedInSections: ['S11', 'S34'],
    relatedPassages: ['romans-6-23', 'matthew-7-13-14', 'matthew-10-28', 'matthew-25-31-46'],
    topicIds: ['eternal-life', 'perishing', 'death', 'destruction'],

    immediateContext:
      "The close of Jesus' night conversation with Nicodemus, and the closing testimony of John the Baptist later in the same chapter. Both state the alternative to believing, and both state it as the loss of life rather than as a different kind of continued life.",
    canonicalContext:
      'These verses belong to a set of roughly ten New Testament contrasts with eternal life. The others speak of death, passing away, not having life, wrath and fury, judgment, being told to depart, and destruction. Romans 6:23 sets the same contrast in a single sentence.',
    whyItMatters:
      'If the alternative to eternal life is named nine or ten times over, and almost always with words for the loss of life, then the one place where it is named eternal punishment has a large set of neighbours that ought to inform how it is read.',
    ectReading:
      'Defenders of eternal conscious torment read perish as the ruin of a person rather than the end of a person, on the same principle by which lost sheep and lost coins are lost without ceasing to exist. John 3:36 supports the reading, they argue, because the wrath of God is said to remain on the one who does not obey, which describes an ongoing state resting on someone who is there to bear it.',
    conditionalistReading:
      'Conditionalists note that the verb rendered perish in John 3:16 is a form of the same root rendered destroy in Matthew 10:28, and that John 3:36 states the alternative as not seeing life. The source document argues that if eternal punishment in Matthew 25:46 is redefined as conscious torment, then perishing, death, passing away, not having life and destruction all have to be redefined along with it.',
    agreements: [
      'The alternative to eternal life is stated twice in this chapter and is severe both times.',
      'Believing in the Son is what determines which outcome a person receives.',
      'The wrath of God on the disobedient is real and it remains.',
    ],
    disagreement:
      'Whether perishing and not seeing life describe a ruined existence that continues without end, or the loss of existence itself.',
    languageNotes: [
      'The verb rendered perish in John 3:16 is a form of apollumi, the root rendered destroy in Matthew 10:28.',
    ],

    notes: [
      'The source document lists John 6:27, John 10:28 and 2 Peter 3:9 as further uses of perishing in the same contrast.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  /* ------------------------------ Epistles ------------------------------ */
  {
    id: 'romans-6-23',
    slug: 'romans-6-23',
    normalizedReference: 'Romans 6:23',
    book: 'Romans',
    bookOrder: 45,
    chapter: 6,
    verseStart: 23,
    additionalReferences: [],

    shortDescription:
      'The wages of sin is death, set against eternal life as the free gift of God.',
    quotations: [
      {
        reference: 'Romans 6:23',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'definition'],
    usedInSections: ['S07', 'S11', 'S26'],
    relatedPassages: ['john-3-16-36', 'revelation-20-10-15', 'matthew-7-13-14'],
    topicIds: ['death', 'second-death', 'eternal-life', 'punishment'],

    immediateContext:
      "The end of Paul's argument that believers have been set free from sin and bound to God. He contrasts the fruit borne under each master and closes with wages on one side and a free gift on the other.",
    canonicalContext:
      'It restates the penalty attached to sin in Genesis 2:17 and Ezekiel 18:20, and matches James 1:15, where sin fully grown brings forth death. Revelation 20:14 names the final form of that death as the second death.',
    whyItMatters:
      'It is the plainest statement in the New Testament of what sin earns, and the word Paul chooses for it is death rather than torment.',
    ectReading:
      'Defenders of eternal conscious torment hold that death in the biblical vocabulary regularly means separation rather than extinction. Adam died on the day he ate and yet went on living, so death names alienation from the God who is life. Eternal death is then the endless continuation of that separation, and the contrast Paul draws is between two relationships rather than between existing and not existing.',
    conditionalistReading:
      'Conditionalists agree that the death in view is more than bodily death, since the righteous die physically too and the physical death of the wicked would otherwise settle the account. They identify it instead with the second death of Revelation 20:14. The source document adds that even if death means separation, the separated are not thereby sustained, since Scripture presents Christ as the one who holds all things together.',
    agreements: [
      'The death in view is more than the death of the body.',
      'Eternal life is a gift and not a wage.',
      'Sin genuinely earns a penalty, and God will impose it in full.',
    ],
    disagreement:
      'Whether the death that sin earns is unending separation from God consciously undergone, or the ending of the sinner at the second death.',
    languageNotes: [],

    notes: [
      'The source document observes that when Paul describes what believers have been rescued from, he names death rather than torment.',
      'The case argues that suffering does not discharge a debt, so the penalty is not a quantity of pain that could eventually be paid off.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'first-corinthians-15',
    slug: 'first-corinthians-15',
    normalizedReference: '1 Corinthians 15:42-44',
    book: '1 Corinthians',
    bookOrder: 46,
    chapter: 15,
    verseStart: 42,
    verseEnd: 44,
    additionalReferences: ['1 Corinthians 15:50-57', '1 Corinthians 15:20-28'],

    shortDescription:
      'The resurrection chapter, where imperishability and immortality are given rather than assumed.',
    quotations: [
      {
        reference: '1 Corinthians 15:42-44',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
      {
        reference: '1 Corinthians 15:50-57',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
      {
        reference: '1 Corinthians 15:20-28',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'definition'],
    usedInSections: ['RB2', 'S22', 'S24', 'S25', 'S32'],
    relatedPassages: ['matthew-10-28', 'revelation-21-22', 'revelation-20-10-15'],
    topicIds: ['immortality', 'conditional-immortality', 'resurrection', 'eternal-life', 'death'],

    immediateContext:
      "Paul's long argument for the resurrection of the dead. He answers the question of what body the dead are raised with, contrasts what is sown perishable with what is raised imperishable, and ends with the mortal putting on immortality and death being swallowed up in victory.",
    canonicalContext:
      'It stands with 1 Timothy 6:16, where God alone has immortality, and 2 Timothy 1:10, where Christ brings life and immortality to light through the gospel. Verses 20 to 28 also supply the language of God being all in all, which the case reads as fitting a creation from which evil has been removed rather than relocated.',
    whyItMatters:
      'The whole question of conditional immortality turns on whether unending existence belongs to human beings by nature or is granted, and this chapter is where the granting is described.',
    ectReading:
      'Defenders of eternal conscious torment reply that Paul is answering a question about the resurrection body of believers, not about human nature as such, so the chapter says nothing directly about the unrighteous. They add that the tradition does not claim human beings are immortal in the way God is. It holds that God created human souls to continue and will sustain the raised bodies of the lost for judgment, as Daniel 12:2 assumes a resurrection of both groups.',
    conditionalistReading:
      'Conditionalists read the promise as bounded by its recipients. What is raised imperishable in verses 42 to 44 is described in terms of glory and power, and verse 50 says the perishable does not inherit the imperishable. The source document argues that the unrighteous are not given an imperishable body, that Matthew 10:28 ties the fate of body and soul together, and that the conclusion follows: they do not go on living.',
    agreements: [
      'The chapter promises a raised, imperishable body to those who are in Christ.',
      'Immortality here is described as something put on rather than something possessed.',
      'Both readings affirm a real bodily resurrection of the dead.',
      'Death is the last enemy and is finally destroyed.',
    ],
    disagreement:
      'Whether the silence of this chapter about an imperishable body for the unrighteous leaves their continued existence an open question, or rules it out.',
    languageNotes: [
      'Paul uses the language of putting on imperishability and immortality, which presents both as given rather than native.',
    ],

    notes: [
      'The source document reads verses 24 to 28 as Christ destroying his enemies rather than holding them in permanent subjugation.',
      "The source document argues that an inherently immortal soul is a Platonic idea rather than a biblical one, and the site reports that as the author's argument rather than as a settled historical consensus.",
    ],
    sourceIds: [
      'welch-source-document',
      'afterlife-god-alone-is-immortal',
      'dear-bible-teaches-annihilationism',
    ],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'second-thessalonians-1-5-10',
    slug: 'second-thessalonians-1-5-10',
    normalizedReference: '2 Thessalonians 1:5-10',
    book: '2 Thessalonians',
    bookOrder: 53,
    chapter: 1,
    verseStart: 5,
    verseEnd: 10,
    additionalReferences: [],

    shortDescription:
      'Paul names the penalty imposed at the appearing of Christ as eternal destruction.',
    quotations: [
      {
        reference: '2 Thessalonians 1:5-10',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text', 'primary-support', 'definition'],
    usedInSections: ['S04', 'S30'],
    relatedPassages: ['matthew-25-31-46', 'isaiah-66-15-24', 'revelation-14-9-11'],
    topicIds: ['destruction', 'eternal-and-everlasting', 'punishment', 'final-judgment', 'fire'],

    immediateContext:
      'Paul comforts a persecuted church with the justice of God. When the Lord Jesus is revealed from heaven with his mighty angels in flaming fire, he repays those who afflict them, and those who do not know God suffer the punishment of eternal destruction.',
    canonicalContext:
      'The source document notes that the combination of flaming fire and vengeance in verses 7 and 8 appears together elsewhere only in Isaiah 66:15, at the head of the chapter whose last verse Jesus quotes in Mark 9:48. The phrase eternal destruction is also the clearest New Testament gloss on the eternal punishment of Matthew 25:46.',
    whyItMatters:
      'It supplies the noun the case uses to define eternal punishment, and it also contains the disputed phrase about the presence of the Lord, where translations diverge and the argument turns on a single preposition.',
    ectReading:
      'Defenders of eternal conscious torment read the phrase as banishment: the lost suffer everlasting destruction away from the presence of the Lord and from the glory of his might. On that reading Paul is describing where they will be for ever, which presupposes that they are somewhere, so destruction must name a ruin compatible with continued existence rather than the end of it.',
    conditionalistReading:
      'Conditionalists answer in two ways. If the sense is away from, the source document notes the strain this puts on reading Revelation 14:10 as unending torment in the presence of the Lamb, since no one can be permanently in and permanently away from the same presence. If the sense is simply from, then the presence of the Lord is the source of the destruction rather than the place of it, which fits Nahum 1:6 and the Old Testament scenes in which no one survives an encounter with God.',
    agreements: [
      'The passage describes a real and just penalty imposed when Christ is revealed.',
      'The penalty is named with the noun destruction rather than with a verb.',
      'The penalty is eternal in the sense that it is never reversed.',
      'The affliction of the church will be repaid by God and not by the church.',
    ],
    disagreement:
      'Whether the preposition marks the place where the lost remain for ever, or the source from which their destruction proceeds.',
    languageNotes: [
      'The preposition at issue is apo, which most often marks a source or origin unless another word modifies it.',
      'The connective and in the NIV rendering of verse 9 is not present in the Greek, as the source document points out.',
    ],

    notes: [
      'The author offers his own suggested rendering of verse 9 and expressly labels it as his suggestion, made with hesitancy because he is not a Greek scholar.',
      'The site treats the direction of the preposition as an open question and does not rest the case on either answer, since both align with conditional immortality.',
      'A concordance entry is a starting point rather than a substitute for a standard lexicon or grammar, and the page says so where it cites one.',
    ],
    sourceIds: [
      'welch-source-document',
      'rethinking-hell-2-thess-1-9-part-1',
      'rethinking-hell-2-thess-1-9-part-2',
      'biblehub-apo-575',
    ],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'second-peter-2-6',
    slug: 'second-peter-2-6',
    normalizedReference: '2 Peter 2:6',
    book: '2 Peter',
    bookOrder: 61,
    chapter: 2,
    verseStart: 6,
    additionalReferences: [],

    shortDescription:
      'Sodom and Gomorrah turned to ashes and set out as an example of what is coming to the ungodly.',
    quotations: [
      {
        reference: '2 Peter 2:6',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'parallel'],
    usedInSections: ['S03', 'S14'],
    relatedPassages: ['second-peter-3-7-13', 'revelation-20-10-15', 'matthew-25-31-46'],
    topicIds: [
      'sodom-and-gomorrah',
      'destruction',
      'fire',
      'final-judgment',
      'eternal-and-everlasting',
    ],

    immediateContext:
      'Peter is arguing that God knows how to rescue the godly and to keep the unrighteous under punishment until the day of judgment. He gives three examples in sequence: the angels who sinned, the flood, and the cities of Sodom and Gomorrah.',
    canonicalContext:
      'Jude 7 calls the same event a punishment of eternal fire. Genesis 19:24-28 records that Abraham saw smoke going up from the plain the next morning, and Ezekiel 16:49-50 says that God did away with Sodom as Israel had seen.',
    whyItMatters:
      'Peter says outright that these cities are an example of what is going to happen to the ungodly, so the features he selects as the point of comparison carry real evidential weight.',
    ectReading:
      'Defenders of eternal conscious torment reply that Jude describes the same event as a punishment of eternal fire, which points beyond the historical burning to the final fire itself. On this reading the cities function as a visible sign of a judgment whose full form is spiritual and unending, and Peter is making the point that judgment is certain rather than describing how long it lasts.',
    conditionalistReading:
      'Conditionalists press what Peter actually names. He selects two features, being turned to ashes and being condemned to extinction, and mentions neither ongoing burning nor ongoing torment. The source document argues that the cities were destroyed in a day and never rebuilt, so they illustrate a completed destruction with a permanent result rather than a ruin that persists in a fixed state.',
    agreements: [
      'Peter presents these cities as a deliberate example of the judgment to come.',
      'The historical destruction of the cities was complete and was never reversed.',
      'The example is offered as a warning and not as a historical curiosity.',
      'God preserves the unrighteous under punishment until the day of judgment.',
    ],
    disagreement:
      'Whether the point of comparison is the certainty of a judgment whose real form lies beyond the event, or the shape of the judgment as Peter actually describes it.',
    languageNotes: [],

    notes: [
      'The source document argues that eternal fire in Jude 7 describes a fire whose effect is permanent rather than a fire that is still burning.',
      'The source document notes that no passage about these cities dwells on the suffering of their inhabitants, though it grants that suffering occurred.',
      'The verified Scripture corpus stores Jude 7 under the reference Jude 1:7, following the versification used there.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'second-peter-3-7-13',
    slug: 'second-peter-3-7-13',
    normalizedReference: '2 Peter 3:7-13',
    book: '2 Peter',
    bookOrder: 61,
    chapter: 3,
    verseStart: 7,
    verseEnd: 13,
    additionalReferences: [],

    shortDescription:
      'The present order kept for the day of judgment and destruction of the ungodly.',
    quotations: [
      {
        reference: '2 Peter 3:7-13',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'background'],
    usedInSections: ['S08', 'S09', 'S23', 'S28'],
    relatedPassages: ['second-peter-2-6', 'revelation-21-22', 'luke-16-19-31'],
    topicIds: ['day-of-the-lord', 'final-judgment', 'destruction', 'fire', 'intermediate-state'],

    immediateContext:
      "Peter answers scoffers who ask where the promise of Christ's coming has gone. He points back to the flood, says the present heavens and earth are stored up for fire, explains the delay as patience toward those who have not yet repented, and describes the day of the Lord coming like a thief.",
    canonicalContext:
      "The comparison with the flood is Peter's own. He also promises new heavens and a new earth in which righteousness dwells, which the case sets beside Revelation 21 and reads as excluding a surviving population of the unrighteous.",
    whyItMatters:
      'It ties the judgment and the destruction of the ungodly to one day, and it supplies the reason the case gives for why the unrighteous are sustained at all before that day.',
    ectReading:
      'Defenders of eternal conscious torment note that Peter is describing the dissolution of the present created order rather than the annihilation of persons, and that destruction of the ungodly on the day of judgment can name the beginning of a sentence as easily as its completion. What Peter delays is the judgment, and what follows the judgment is not stated in this passage.',
    conditionalistReading:
      'Conditionalists take the flood comparison as controlling. Peter sets the destruction of the ancient world by water beside the coming destruction by fire, and no one reads the flood as the opening of unending conscious suffering. The source document also uses this passage to explain why the unrighteous are preserved beforehand: they are kept until that day, which is a reason for their continued existence rather than evidence of an immortal nature.',
    agreements: [
      'The delay in judgment is the patience of God and is meant to lead to repentance.',
      'A real day of judgment is coming and the present order will not survive it.',
      'The new heavens and the new earth are where righteousness dwells.',
      'The ungodly are kept until that day rather than judged piecemeal before it.',
    ],
    disagreement:
      'Whether destruction of the ungodly on that day names the opening of an unending sentence, or the judgment and its execution within the same day.',
    languageNotes: [],

    notes: [
      'The source document reads 2 Peter as running roughly in chronological order, so the darkness of 2 Peter 2:17 falls before the day described in chapter 3.',
      'The case uses this passage together with 2 Peter 2:9 to argue that the wicked are sustained until judgment rather than for ever.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  /* ------------------------------ Revelation ------------------------------ */
  {
    id: 'revelation-14-9-11',
    slug: 'revelation-14-9-11',
    normalizedReference: 'Revelation 14:9-11',
    book: 'Revelation',
    bookOrder: 66,
    chapter: 14,
    verseStart: 9,
    verseEnd: 11,
    additionalReferences: [],

    shortDescription:
      'The worshippers of the beast tormented with fire and sulfur, with the smoke rising for ever.',
    quotations: [
      {
        reference: 'Revelation 14:9-11',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text'],
    usedInSections: ['S02', 'S12'],
    relatedPassages: ['revelation-20-10-15', 'second-thessalonians-1-5-10', 'matthew-25-31-46'],
    topicIds: [
      'eternal-conscious-torment',
      'fire',
      'eternal-and-everlasting',
      'final-judgment',
      'destruction',
    ],

    immediateContext:
      'The third of three angelic announcements in the middle of Revelation. The angel warns that anyone who worships the beast and receives its mark will drink the wine of the wrath of God and be tormented with fire and sulfur in the presence of the holy angels and of the Lamb.',
    canonicalContext:
      'Isaiah 34:9-10 uses the image of smoke rising for ever for the desolation of Edom, and Revelation 19:3 uses it of Babylon, whose fall in Revelation 18 is complete before the smoke goes up. Revelation 4:8 supplies the closest verbal parallel to the clause about having no rest day or night.',
    whyItMatters:
      'It is the only passage in the New Testament that puts torment, fire and the words for ever and ever in one breath about human beings, which is why it carries so much of the traditional case.',
    ectReading:
      'Defenders of eternal conscious torment read the elements together. There is torment, it is in the presence of the Lamb, the smoke of it rises for ever and ever, and those who bear the mark have no rest day or night. Smoke rising without end most naturally implies a fire still burning, and the added clause about rest is hard to apply to people who no longer exist, since the dead have no need of rest.',
    conditionalistReading:
      'Conditionalists observe that what rises for ever is the smoke of the torment rather than the torment itself, and that Scripture uses rising smoke elsewhere as a monument to a destruction already completed. Edom in Isaiah 34 lies desolate rather than perpetually burning, and Babylon in Revelation 18 and 19 has already fallen when her smoke goes up. The source document also notes that the warning addresses those who bear the mark of the beast rather than all the unrighteous.',
    agreements: [
      'The torment described here is real, conscious and terrible.',
      'The smoke of the torment is said to rise for ever and ever.',
      'The warning is addressed to those who worship the beast and take its mark.',
      'The scene takes place in the presence of the holy angels and of the Lamb.',
    ],
    disagreement:
      'Whether the everlasting smoke marks a fire that never stops burning its victims, or a completed judgment whose memorial stands for ever.',
    languageNotes: [
      'The Greek of the clause about having no rest day or night closely resembles the clause used of the living creatures in Revelation 4:8.',
    ],

    notes: [
      'The source document offers three readings of the clause about having no rest and holds that each of them is compatible with conditional immortality.',
      'The source document points out that sentence punctuation in this passage is an editorial decision, since the earliest Greek manuscripts did not use it.',
      'The author states his reading of the everlasting smoke as a permanent monument to judgment as his own view rather than as a settled conclusion.',
    ],
    sourceIds: [
      'welch-source-document',
      'rethinking-hell-bible-fellowship-church',
      'dear-bible-teaches-annihilationism',
    ],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'revelation-20-10-15',
    slug: 'revelation-20-10-15',
    normalizedReference: 'Revelation 20:10-15',
    book: 'Revelation',
    bookOrder: 66,
    chapter: 20,
    verseStart: 10,
    verseEnd: 15,
    additionalReferences: [],

    shortDescription:
      'The lake of fire, the great white throne, and the naming of the second death.',
    quotations: [
      {
        reference: 'Revelation 20:10-15',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['ect-proof-text'],
    usedInSections: ['S03', 'S05', 'S07', 'S10', 'S12', 'S18', 'S32'],
    relatedPassages: [
      'matthew-25-31-46',
      'revelation-14-9-11',
      'revelation-21-22',
      'luke-16-19-31',
      'romans-6-23',
    ],
    topicIds: [
      'lake-of-fire',
      'second-death',
      'hades',
      'death',
      'eternal-conscious-torment',
      'final-judgment',
    ],

    immediateContext:
      'The close of the millennium vision. The devil is thrown into the lake of fire where the beast and the false prophet are, the dead are judged before the great white throne according to their works, and Death and Hades are thrown into the lake of fire, which John calls the second death.',
    canonicalContext:
      'Matthew 25:41 says the eternal fire was prepared for the devil and his angels. Revelation 21:4 announces that death shall be no more, which the case reads together with the throwing of Death and Hades into the lake here.',
    whyItMatters:
      'This is the passage the traditional view most often treats as decisive, and it is also where the case makes its most contested structural argument about which verse the torment clause governs.',
    ectReading:
      'Defenders of eternal conscious torment argue from location and from parallel. Those whose names are not written in the book of life are thrown into the same lake as the devil, the beast and the false prophet, whose torment is stated to be day and night for ever and ever. The natural inference is that the lake does to all who enter it what verse 10 says it does, and calling it the second death names the state rather than denies consciousness within it.',
    conditionalistReading:
      'Conditionalists note where the clause sits. The words about torment day and night for ever and ever stand in verse 10, when only the devil, the beast and the false prophet are in the lake, and they are not repeated at verse 15. When Death and Hades are thrown in, John gives a different description: this is the second death. The source document argues that the lake destroys Death itself, so it is not a place that preserves whatever is thrown into it.',
    agreements: [
      'The lake of fire is the final destiny of the unrighteous.',
      'The devil, the beast and the false prophet are tormented day and night for ever and ever.',
      'Every person is judged by works before the great white throne.',
      'John names the lake of fire the second death.',
    ],
    disagreement:
      'Whether the torment stated of the devil, the beast and the false prophet in verse 10 extends to the human beings thrown in at verse 15.',
    languageNotes: [
      'The lake of fire is a distinct image from Hades, which is thrown into it, and from Gehenna in the Gospels.',
    ],

    notes: [
      'The source document argues that the devil and his angels may be treated differently because they are spiritual beings who saw God clearly and rejected him.',
      'The source document notes that some conditionalists read the lake of fire in Revelation 20:10 as part of a symbolic vision and expect Satan to be destroyed as well, a reading the author does not hold.',
      'The author labels his argument from the placement of the torment clause as an inference from the structure of the passage.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },

  {
    id: 'revelation-21-22',
    slug: 'revelation-21-22',
    normalizedReference: 'Revelation 21:1-8',
    book: 'Revelation',
    bookOrder: 66,
    chapter: 21,
    verseStart: 1,
    verseEnd: 8,
    additionalReferences: ['Revelation 22:1-5', 'Revelation 22:14-15', 'Revelation 21:4'],

    shortDescription:
      'The new heaven and new earth, the second death, and the tree of life inside the city.',
    quotations: [
      {
        reference: 'Revelation 21:1-8',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
      {
        reference: 'Revelation 22:1-5',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
      {
        reference: 'Revelation 22:14-15',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
      {
        reference: 'Revelation 21:4',
        translation: 'World English Bible',
        licenseId: 'web-public-domain',
        text: '[rendered from the verified public-domain corpus]',
        verifiedAt: '2026-07-29',
      },
    ],

    roles: ['primary-support', 'objection'],
    usedInSections: ['S03', 'S21', 'S24', 'S28'],
    relatedPassages: ['revelation-20-10-15', 'first-corinthians-15', 'second-peter-3-7-13'],
    topicIds: ['tree-of-life', 'second-death', 'lake-of-fire', 'death', 'conditional-immortality'],

    immediateContext:
      'John sees the new heaven and the new earth and the holy city coming down. Death, mourning, crying and pain are gone, the one who conquers inherits, and a list of the cowardly, the faithless and the immoral is assigned a portion in the lake that burns with fire and sulfur, which is the second death. In the following chapter the tree of life stands inside the city.',
    canonicalContext:
      'The tree of life returns from Genesis 2 and 3, where access to it was barred so that fallen humanity would not live for ever. Here it stands inside the city, and those said to be outside the gates are described in terms that match the list in Revelation 21:8.',
    whyItMatters:
      'The case has to answer two questions here: whether the passing away of death and pain is universal or local, and whether the people listed outside the city are still alive after Revelation 20.',
    ectReading:
      'Defenders of eternal conscious torment read the lists in Revelation 21:8 and 22:15 as describing the lost in their final condition, outside the city while the redeemed are within, which presupposes that they continue to exist. On this reading the promise that death and mourning are no more is made to the redeemed inside the city, which is what the text says, and is not a claim about every corner of the new creation.',
    conditionalistReading:
      'Conditionalists reply that both lists describe people as they now are and recapitulate the fate announced in Revelation 20:15 rather than reporting a surviving population. The source document argues that the same Greek verb describes the first heaven and earth passing away and the old order of death and pain passing away, so neither is merely relocated, and that those outside have no access to the tree of life and therefore do not live for ever.',
    agreements: [
      'The tree of life stands inside the city and the unrighteous have no access to it.',
      'The second death is the portion of those named in Revelation 21:8.',
      'Death, mourning, crying and pain are said to have passed away.',
      'The new creation is where righteousness dwells.',
    ],
    disagreement:
      'Whether the lists outside the city describe people who remain alive in the new creation, or recapitulate the fate of the ungodly as they are described now.',
    languageNotes: [
      'The verb used of the old order passing away in Revelation 21:4 is the same verb used of the first heaven and the first earth in Revelation 21:1.',
    ],

    notes: [
      'The source document treats access to the tree of life as the means by which bodily life is sustained, in Eden and in the city alike.',
      'The case reads the exclusion lists as recapitulation rather than as a chronological report, and presents that as its reading rather than as a settled conclusion.',
      'The author asks how the redeemed could be without mourning if their loved ones were consciously suffering, and offers it as a consideration rather than as evidence.',
    ],
    sourceIds: ['welch-source-document', 'dear-bible-teaches-annihilationism'],
    lastReviewed: '2026-07-29',
  },
]
