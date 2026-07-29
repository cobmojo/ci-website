import type { ScriptureQuotation } from '@ci/content-schema'

/**
 * Verified public-domain Scripture text.
 *
 * Every full Scripture display on this site is rendered from this corpus. No
 * author ever types a verse by hand, which removes any possibility of a
 * misquoted or misremembered passage reaching a page.
 *
 * Translation: World English Bible (WEB), a public-domain modern English
 * revision of the American Standard Version, released into the public domain
 * by Rainbow Missions, Inc. It was chosen precisely because a reference work
 * of this size quotes Scripture far beyond what incidental-quotation
 * allowances for copyrighted modern translations would permit.
 *
 * Retrieved 2026-07-29. Regenerate with
 * `bun run scripts/conditional-immortality/fetch-scripture.ts`.
 */

export const WEB_LICENSE_ID = 'web-public-domain'
export const WEB_TRANSLATION = 'World English Bible'
export const WEB_TRANSLATION_SHORT = 'WEB'
export const WEB_VERIFIED_AT = '2026-07-29'

export interface ScriptureVerse {
  readonly verse: number
  readonly text: string
}

export interface ScripturePassage {
  readonly reference: string
  readonly book: string
  readonly chapter: number
  readonly verses: readonly ScriptureVerse[]
  readonly text: string
}

const PASSAGES: Record<string, ScripturePassage> = {
  '1 Corinthians 11:7': {
    reference: '1 Corinthians 11:7',
    book: '1 Corinthians',
    chapter: 11,
    verses: [
      {
        verse: 7,
        text: 'For a man indeed ought not to have his head covered, because he is the image and glory of God, but the woman is the glory of the man.',
      },
    ],
    text: 'For a man indeed ought not to have his head covered, because he is the image and glory of God, but the woman is the glory of the man.',
  },
  '1 Corinthians 13:12': {
    reference: '1 Corinthians 13:12',
    book: '1 Corinthians',
    chapter: 13,
    verses: [
      {
        verse: 12,
        text: 'For now we see in a mirror, dimly, but then face to face. Now I know in part, but then I will know fully, even as I was also fully known.',
      },
    ],
    text: 'For now we see in a mirror, dimly, but then face to face. Now I know in part, but then I will know fully, even as I was also fully known.',
  },
  '1 Corinthians 15:20-28': {
    reference: '1 Corinthians 15:20-28',
    book: '1 Corinthians',
    chapter: 15,
    verses: [
      {
        verse: 20,
        text: 'But now Christ has been raised from the dead. He became the first fruits of those who are asleep.',
      },
      {
        verse: 21,
        text: 'For since death came by man, the resurrection of the dead also came by man.',
      },
      { verse: 22, text: 'For as in Adam all die, so also in Christ all will be made alive.' },
      {
        verse: 23,
        text: 'But each in his own order: Christ the first fruits, then those who are Christ’s, at his coming.',
      },
      {
        verse: 24,
        text: 'Then the end comes, when he will deliver up the Kingdom to God, even the Father; when he will have abolished all rule and all authority and power.',
      },
      { verse: 25, text: 'For he must reign until he has put all his enemies under his feet.' },
      { verse: 26, text: 'The last enemy that will be abolished is death.' },
      {
        verse: 27,
        text: 'For, “He put all things in subjection under his feet.” But when he says, “All things are put in subjection”, it is evident that he is excepted who subjected all things to him.',
      },
      {
        verse: 28,
        text: 'When all things have been subjected to him, then the Son will also himself be subjected to him who subjected all things to him, that God may be all in all.',
      },
    ],
    text: 'But now Christ has been raised from the dead. He became the first fruits of those who are asleep. For since death came by man, the resurrection of the dead also came by man. For as in Adam all die, so also in Christ all will be made alive. But each in his own order: Christ the first fruits, then those who are Christ’s, at his coming. Then the end comes, when he will deliver up the Kingdom to God, even the Father; when he will have abolished all rule and all authority and power. For he must reign until he has put all his enemies under his feet. The last enemy that will be abolished is death. For, “He put all things in subjection under his feet.” But when he says, “All things are put in subjection”, it is evident that he is excepted who subjected all things to him. When all things have been subjected to him, then the Son will also himself be subjected to him who subjected all things to him, that God may be all in all.',
  },
  '1 Corinthians 15:24-26': {
    reference: '1 Corinthians 15:24-26',
    book: '1 Corinthians',
    chapter: 15,
    verses: [
      {
        verse: 24,
        text: 'Then the end comes, when he will deliver up the Kingdom to God, even the Father; when he will have abolished all rule and all authority and power.',
      },
      { verse: 25, text: 'For he must reign until he has put all his enemies under his feet.' },
      { verse: 26, text: 'The last enemy that will be abolished is death.' },
    ],
    text: 'Then the end comes, when he will deliver up the Kingdom to God, even the Father; when he will have abolished all rule and all authority and power. For he must reign until he has put all his enemies under his feet. The last enemy that will be abolished is death.',
  },
  '1 Corinthians 15:3': {
    reference: '1 Corinthians 15:3',
    book: '1 Corinthians',
    chapter: 15,
    verses: [
      {
        verse: 3,
        text: 'For I delivered to you first of all that which I also received: that Christ died for our sins according to the Scriptures,',
      },
    ],
    text: 'For I delivered to you first of all that which I also received: that Christ died for our sins according to the Scriptures,',
  },
  '1 Corinthians 15:42-43': {
    reference: '1 Corinthians 15:42-43',
    book: '1 Corinthians',
    chapter: 15,
    verses: [
      {
        verse: 42,
        text: 'So also is the resurrection of the dead. The body is sown perishable; it is raised imperishable.',
      },
      {
        verse: 43,
        text: 'It is sown in dishonor; it is raised in glory. It is sown in weakness; it is raised in power.',
      },
    ],
    text: 'So also is the resurrection of the dead. The body is sown perishable; it is raised imperishable. It is sown in dishonor; it is raised in glory. It is sown in weakness; it is raised in power.',
  },
  '1 Corinthians 15:42-44': {
    reference: '1 Corinthians 15:42-44',
    book: '1 Corinthians',
    chapter: 15,
    verses: [
      {
        verse: 42,
        text: 'So also is the resurrection of the dead. The body is sown perishable; it is raised imperishable.',
      },
      {
        verse: 43,
        text: 'It is sown in dishonor; it is raised in glory. It is sown in weakness; it is raised in power.',
      },
      {
        verse: 44,
        text: 'It is sown a natural body; it is raised a spiritual body. There is a natural body and there is also a spiritual body.',
      },
    ],
    text: 'So also is the resurrection of the dead. The body is sown perishable; it is raised imperishable. It is sown in dishonor; it is raised in glory. It is sown in weakness; it is raised in power. It is sown a natural body; it is raised a spiritual body. There is a natural body and there is also a spiritual body.',
  },
  '1 Corinthians 15:50': {
    reference: '1 Corinthians 15:50',
    book: '1 Corinthians',
    chapter: 15,
    verses: [
      {
        verse: 50,
        text: 'Now I say this, brothers, that flesh and blood can’t inherit the Kingdom of God; neither does the perishable inherit imperishable.',
      },
    ],
    text: 'Now I say this, brothers, that flesh and blood can’t inherit the Kingdom of God; neither does the perishable inherit imperishable.',
  },
  '1 Corinthians 15:50-57': {
    reference: '1 Corinthians 15:50-57',
    book: '1 Corinthians',
    chapter: 15,
    verses: [
      {
        verse: 50,
        text: 'Now I say this, brothers, that flesh and blood can’t inherit the Kingdom of God; neither does the perishable inherit imperishable.',
      },
      {
        verse: 51,
        text: 'Behold, I tell you a mystery. We will not all sleep, but we will all be changed,',
      },
      {
        verse: 52,
        text: 'in a moment, in the twinkling of an eye, at the last trumpet. For the trumpet will sound, and the dead will be raised incorruptible, and we will be changed.',
      },
      {
        verse: 53,
        text: 'For this perishable body must become imperishable, and this mortal must put on immortality.',
      },
      {
        verse: 54,
        text: 'But when this perishable body will have become imperishable, and this mortal will have put on immortality, then what is written will happen: “Death is swallowed up in victory.”',
      },
      { verse: 55, text: '“Death, where is your sting? Hades, where is your victory?”' },
      { verse: 56, text: 'The sting of death is sin, and the power of sin is the law.' },
      {
        verse: 57,
        text: 'But thanks be to God, who gives us the victory through our Lord Jesus Christ.',
      },
    ],
    text: 'Now I say this, brothers, that flesh and blood can’t inherit the Kingdom of God; neither does the perishable inherit imperishable. Behold, I tell you a mystery. We will not all sleep, but we will all be changed, in a moment, in the twinkling of an eye, at the last trumpet. For the trumpet will sound, and the dead will be raised incorruptible, and we will be changed. For this perishable body must become imperishable, and this mortal must put on immortality. But when this perishable body will have become imperishable, and this mortal will have put on immortality, then what is written will happen: “Death is swallowed up in victory.” “Death, where is your sting? Hades, where is your victory?” The sting of death is sin, and the power of sin is the law. But thanks be to God, who gives us the victory through our Lord Jesus Christ.',
  },
  '1 Corinthians 3:11-15': {
    reference: '1 Corinthians 3:11-15',
    book: '1 Corinthians',
    chapter: 3,
    verses: [
      {
        verse: 11,
        text: 'For no one can lay any other foundation than that which has been laid, which is Jesus Christ.',
      },
      {
        verse: 12,
        text: 'But if anyone builds on the foundation with gold, silver, costly stones, wood, hay, or stubble;',
      },
      {
        verse: 13,
        text: 'each man’s work will be revealed. For the Day will declare it, because it is revealed in fire; and the fire itself will test what sort of work each man’s work is.',
      },
      {
        verse: 14,
        text: 'If any man’s work remains which he built on it, he will receive a reward.',
      },
      {
        verse: 15,
        text: 'If any man’s work is burned, he will suffer loss, but he himself will be saved, but as through fire.',
      },
    ],
    text: 'For no one can lay any other foundation than that which has been laid, which is Jesus Christ. But if anyone builds on the foundation with gold, silver, costly stones, wood, hay, or stubble; each man’s work will be revealed. For the Day will declare it, because it is revealed in fire; and the fire itself will test what sort of work each man’s work is. If any man’s work remains which he built on it, he will receive a reward. If any man’s work is burned, he will suffer loss, but he himself will be saved, but as through fire.',
  },
  '1 Corinthians 6:9-10': {
    reference: '1 Corinthians 6:9-10',
    book: '1 Corinthians',
    chapter: 6,
    verses: [
      {
        verse: 9,
        text: 'Or don’t you know that the unrighteous will not inherit the Kingdom of God? Don’t be deceived. Neither the sexually immoral, nor idolaters, nor adulterers, nor male prostitutes, nor homosexuals,',
      },
      {
        verse: 10,
        text: 'nor thieves, nor covetous, nor drunkards, nor slanderers, nor extortionists, will inherit the Kingdom of God.',
      },
    ],
    text: 'Or don’t you know that the unrighteous will not inherit the Kingdom of God? Don’t be deceived. Neither the sexually immoral, nor idolaters, nor adulterers, nor male prostitutes, nor homosexuals, nor thieves, nor covetous, nor drunkards, nor slanderers, nor extortionists, will inherit the Kingdom of God.',
  },
  '1 Corinthians 8:6': {
    reference: '1 Corinthians 8:6',
    book: '1 Corinthians',
    chapter: 8,
    verses: [
      {
        verse: 6,
        text: 'yet to us there is one God, the Father, of whom are all things, and we for him; and one Lord, Jesus Christ, through whom are all things, and we live through him.',
      },
    ],
    text: 'yet to us there is one God, the Father, of whom are all things, and we for him; and one Lord, Jesus Christ, through whom are all things, and we live through him.',
  },
  '1 John 2:17': {
    reference: '1 John 2:17',
    book: '1 John',
    chapter: 2,
    verses: [
      {
        verse: 17,
        text: 'The world is passing away with its lusts, but he who does God’s will remains forever.',
      },
    ],
    text: 'The world is passing away with its lusts, but he who does God’s will remains forever.',
  },
  '1 John 5:12': {
    reference: '1 John 5:12',
    book: '1 John',
    chapter: 5,
    verses: [
      {
        verse: 12,
        text: 'He who has the Son has the life. He who doesn’t have God’s Son doesn’t have the life.',
      },
    ],
    text: 'He who has the Son has the life. He who doesn’t have God’s Son doesn’t have the life.',
  },
  '1 Peter 1:23-24': {
    reference: '1 Peter 1:23-24',
    book: '1 Peter',
    chapter: 1,
    verses: [
      {
        verse: 23,
        text: 'having been born again, not of corruptible seed, but of incorruptible, through the word of God, which lives and remains forever.',
      },
      {
        verse: 24,
        text: 'For, “All flesh is like grass, and all of man’s glory like the flower in the grass. The grass withers, and its flower falls;',
      },
    ],
    text: 'having been born again, not of corruptible seed, but of incorruptible, through the word of God, which lives and remains forever. For, “All flesh is like grass, and all of man’s glory like the flower in the grass. The grass withers, and its flower falls;',
  },
  '1 Thessalonians 5:3': {
    reference: '1 Thessalonians 5:3',
    book: '1 Thessalonians',
    chapter: 5,
    verses: [
      {
        verse: 3,
        text: 'For when they are saying, “Peace and safety,” then sudden destruction will come on them, like birth pains on a pregnant woman; and they will in no way escape.',
      },
    ],
    text: 'For when they are saying, “Peace and safety,” then sudden destruction will come on them, like birth pains on a pregnant woman; and they will in no way escape.',
  },
  '1 Timothy 1:13': {
    reference: '1 Timothy 1:13',
    book: '1 Timothy',
    chapter: 1,
    verses: [
      {
        verse: 13,
        text: 'although I was before a blasphemer, a persecutor, and insolent. However, I obtained mercy, because I did it ignorantly in unbelief.',
      },
    ],
    text: 'although I was before a blasphemer, a persecutor, and insolent. However, I obtained mercy, because I did it ignorantly in unbelief.',
  },
  '1 Timothy 2:4': {
    reference: '1 Timothy 2:4',
    book: '1 Timothy',
    chapter: 2,
    verses: [
      {
        verse: 4,
        text: 'who desires all people to be saved and come to full knowledge of the truth.',
      },
    ],
    text: 'who desires all people to be saved and come to full knowledge of the truth.',
  },
  '1 Timothy 6:15-16': {
    reference: '1 Timothy 6:15-16',
    book: '1 Timothy',
    chapter: 6,
    verses: [
      {
        verse: 15,
        text: 'which in its own times he will show, who is the blessed and only Ruler, the King of kings, and Lord of lords;',
      },
      {
        verse: 16,
        text: 'who alone has immortality, dwelling in unapproachable light; whom no man has seen, nor can see: to whom be honor and eternal power. Amen.',
      },
    ],
    text: 'which in its own times he will show, who is the blessed and only Ruler, the King of kings, and Lord of lords; who alone has immortality, dwelling in unapproachable light; whom no man has seen, nor can see: to whom be honor and eternal power. Amen.',
  },
  '2 Corinthians 3:18': {
    reference: '2 Corinthians 3:18',
    book: '2 Corinthians',
    chapter: 3,
    verses: [
      {
        verse: 18,
        text: 'But we all, with unveiled face seeing the glory of the Lord as in a mirror, are transformed into the same image from glory to glory, even as from the Lord, the Spirit.',
      },
    ],
    text: 'But we all, with unveiled face seeing the glory of the Lord as in a mirror, are transformed into the same image from glory to glory, even as from the Lord, the Spirit.',
  },
  '2 Corinthians 4:4': {
    reference: '2 Corinthians 4:4',
    book: '2 Corinthians',
    chapter: 4,
    verses: [
      {
        verse: 4,
        text: 'in whom the god of this world has blinded the minds of the unbelieving, that the light of the Good News of the glory of Christ, who is the image of God, should not dawn on them.',
      },
    ],
    text: 'in whom the god of this world has blinded the minds of the unbelieving, that the light of the Good News of the glory of Christ, who is the image of God, should not dawn on them.',
  },
  '2 Corinthians 5:10': {
    reference: '2 Corinthians 5:10',
    book: '2 Corinthians',
    chapter: 5,
    verses: [
      {
        verse: 10,
        text: 'For we must all be revealed before the judgment seat of Christ; that each one may receive the things in the body, according to what he has done, whether good or bad.',
      },
    ],
    text: 'For we must all be revealed before the judgment seat of Christ; that each one may receive the things in the body, according to what he has done, whether good or bad.',
  },
  '2 Kings 1:10': {
    reference: '2 Kings 1:10',
    book: '2 Kings',
    chapter: 1,
    verses: [
      {
        verse: 10,
        text: 'Elijah answered to the captain of fifty, “If I am a man of God, let fire come down from the sky, and consume you and your fifty!” Fire came down from the sky, and consumed him and his fifty.',
      },
    ],
    text: 'Elijah answered to the captain of fifty, “If I am a man of God, let fire come down from the sky, and consume you and your fifty!” Fire came down from the sky, and consumed him and his fifty.',
  },
  '2 Peter 2:1': {
    reference: '2 Peter 2:1',
    book: '2 Peter',
    chapter: 2,
    verses: [
      {
        verse: 1,
        text: 'But false prophets also arose among the people, as false teachers will also be among you, who will secretly bring in destructive heresies, denying even the Master who bought them, bringing on themselves swift destruction.',
      },
    ],
    text: 'But false prophets also arose among the people, as false teachers will also be among you, who will secretly bring in destructive heresies, denying even the Master who bought them, bringing on themselves swift destruction.',
  },
  '2 Peter 2:12': {
    reference: '2 Peter 2:12',
    book: '2 Peter',
    chapter: 2,
    verses: [
      {
        verse: 12,
        text: 'But these, as unreasoning creatures, born natural animals to be taken and destroyed, speaking evil in matters about which they are ignorant, will in their destroying surely be destroyed,',
      },
    ],
    text: 'But these, as unreasoning creatures, born natural animals to be taken and destroyed, speaking evil in matters about which they are ignorant, will in their destroying surely be destroyed,',
  },
  '2 Peter 2:17': {
    reference: '2 Peter 2:17',
    book: '2 Peter',
    chapter: 2,
    verses: [
      {
        verse: 17,
        text: 'These are wells without water, clouds driven by a storm; for whom the blackness of darkness has been reserved forever.',
      },
    ],
    text: 'These are wells without water, clouds driven by a storm; for whom the blackness of darkness has been reserved forever.',
  },
  '2 Peter 2:6': {
    reference: '2 Peter 2:6',
    book: '2 Peter',
    chapter: 2,
    verses: [
      {
        verse: 6,
        text: 'and turning the cities of Sodom and Gomorrah into ashes, condemned them to destruction, having made them an example to those who would live ungodly;',
      },
    ],
    text: 'and turning the cities of Sodom and Gomorrah into ashes, condemned them to destruction, having made them an example to those who would live ungodly;',
  },
  '2 Peter 2:9': {
    reference: '2 Peter 2:9',
    book: '2 Peter',
    chapter: 2,
    verses: [
      {
        verse: 9,
        text: 'the Lord knows how to deliver the godly out of temptation and to keep the unrighteous under punishment for the day of judgment;',
      },
    ],
    text: 'the Lord knows how to deliver the godly out of temptation and to keep the unrighteous under punishment for the day of judgment;',
  },
  '2 Peter 3:13': {
    reference: '2 Peter 3:13',
    book: '2 Peter',
    chapter: 3,
    verses: [
      {
        verse: 13,
        text: 'But, according to his promise, we look for new heavens and a new earth, in which righteousness dwells.',
      },
    ],
    text: 'But, according to his promise, we look for new heavens and a new earth, in which righteousness dwells.',
  },
  '2 Peter 3:7-13': {
    reference: '2 Peter 3:7-13',
    book: '2 Peter',
    chapter: 3,
    verses: [
      {
        verse: 7,
        text: 'But the heavens that now are, and the earth, by the same word have been stored up for fire, being reserved against the day of judgment and destruction of ungodly men.',
      },
      {
        verse: 8,
        text: 'But don’t forget this one thing, beloved, that one day is with the Lord as a thousand years, and a thousand years as one day.',
      },
      {
        verse: 9,
        text: 'The Lord is not slow concerning his promise, as some count slowness; but is patient with us, not wishing that any should perish, but that all should come to repentance.',
      },
      {
        verse: 10,
        text: 'But the day of the Lord will come as a thief in the night; in which the heavens will pass away with a great noise, and the elements will be dissolved with fervent heat, and the earth and the works that are in it will be burned up.',
      },
      {
        verse: 11,
        text: 'Therefore since all these things will be destroyed like this, what kind of people ought you to be in holy living and godliness,',
      },
      {
        verse: 12,
        text: 'looking for and earnestly desiring the coming of the day of God, which will cause the burning heavens to be dissolved, and the elements will melt with fervent heat?',
      },
      {
        verse: 13,
        text: 'But, according to his promise, we look for new heavens and a new earth, in which righteousness dwells.',
      },
    ],
    text: 'But the heavens that now are, and the earth, by the same word have been stored up for fire, being reserved against the day of judgment and destruction of ungodly men. But don’t forget this one thing, beloved, that one day is with the Lord as a thousand years, and a thousand years as one day. The Lord is not slow concerning his promise, as some count slowness; but is patient with us, not wishing that any should perish, but that all should come to repentance. But the day of the Lord will come as a thief in the night; in which the heavens will pass away with a great noise, and the elements will be dissolved with fervent heat, and the earth and the works that are in it will be burned up. Therefore since all these things will be destroyed like this, what kind of people ought you to be in holy living and godliness, looking for and earnestly desiring the coming of the day of God, which will cause the burning heavens to be dissolved, and the elements will melt with fervent heat? But, according to his promise, we look for new heavens and a new earth, in which righteousness dwells.',
  },
  '2 Peter 3:9': {
    reference: '2 Peter 3:9',
    book: '2 Peter',
    chapter: 3,
    verses: [
      {
        verse: 9,
        text: 'The Lord is not slow concerning his promise, as some count slowness; but is patient with us, not wishing that any should perish, but that all should come to repentance.',
      },
    ],
    text: 'The Lord is not slow concerning his promise, as some count slowness; but is patient with us, not wishing that any should perish, but that all should come to repentance.',
  },
  '2 Thessalonians 1:5-10': {
    reference: '2 Thessalonians 1:5-10',
    book: '2 Thessalonians',
    chapter: 1,
    verses: [
      {
        verse: 5,
        text: 'This is an obvious sign of the righteous judgment of God, to the end that you may be counted worthy of the Kingdom of God, for which you also suffer.',
      },
      {
        verse: 6,
        text: 'Since it is a righteous thing with God to repay affliction to those who afflict you,',
      },
      {
        verse: 7,
        text: 'and to give relief to you who are afflicted with us, when the Lord Jesus is revealed from heaven with his mighty angels in flaming fire,',
      },
      {
        verse: 8,
        text: 'giving vengeance to those who don’t know God, and to those who don’t obey the Good News of our Lord Jesus,',
      },
      {
        verse: 9,
        text: 'who will pay the penalty: eternal destruction from the face of the Lord and from the glory of his might,',
      },
      {
        verse: 10,
        text: 'when he comes to be glorified in his saints, and to be admired among all those who have believed (because our testimony to you was believed) in that day.',
      },
    ],
    text: 'This is an obvious sign of the righteous judgment of God, to the end that you may be counted worthy of the Kingdom of God, for which you also suffer. Since it is a righteous thing with God to repay affliction to those who afflict you, and to give relief to you who are afflicted with us, when the Lord Jesus is revealed from heaven with his mighty angels in flaming fire, giving vengeance to those who don’t know God, and to those who don’t obey the Good News of our Lord Jesus, who will pay the penalty: eternal destruction from the face of the Lord and from the glory of his might, when he comes to be glorified in his saints, and to be admired among all those who have believed (because our testimony to you was believed) in that day.',
  },
  '2 Timothy 1:10': {
    reference: '2 Timothy 1:10',
    book: '2 Timothy',
    chapter: 1,
    verses: [
      {
        verse: 10,
        text: 'but has now been revealed by the appearing of our Savior, Christ Jesus, who abolished death, and brought life and immortality to light through the Good News.',
      },
    ],
    text: 'but has now been revealed by the appearing of our Savior, Christ Jesus, who abolished death, and brought life and immortality to light through the Good News.',
  },
  'Acts 20:37': {
    reference: 'Acts 20:37',
    book: 'Acts',
    chapter: 20,
    verses: [{ verse: 37, text: 'They all wept a lot, and fell on Paul’s neck and kissed him,' }],
    text: 'They all wept a lot, and fell on Paul’s neck and kissed him,',
  },
  'Acts 7:54': {
    reference: 'Acts 7:54',
    book: 'Acts',
    chapter: 7,
    verses: [
      {
        verse: 54,
        text: 'Now when they heard these things, they were cut to the heart, and they gnashed at him with their teeth.',
      },
    ],
    text: 'Now when they heard these things, they were cut to the heart, and they gnashed at him with their teeth.',
  },
  'Amos 5:6': {
    reference: 'Amos 5:6',
    book: 'Amos',
    chapter: 5,
    verses: [
      {
        verse: 6,
        text: 'Seek Yahweh, and you will live; lest he break out like fire in the house of Joseph, and it devour, and there be no one to quench it in Bethel.',
      },
    ],
    text: 'Seek Yahweh, and you will live; lest he break out like fire in the house of Joseph, and it devour, and there be no one to quench it in Bethel.',
  },
  'Colossians 1:15': {
    reference: 'Colossians 1:15',
    book: 'Colossians',
    chapter: 1,
    verses: [
      { verse: 15, text: 'who is the image of the invisible God, the firstborn of all creation.' },
    ],
    text: 'who is the image of the invisible God, the firstborn of all creation.',
  },
  'Colossians 1:17': {
    reference: 'Colossians 1:17',
    book: 'Colossians',
    chapter: 1,
    verses: [
      { verse: 17, text: 'He is before all things, and in him all things are held together.' },
    ],
    text: 'He is before all things, and in him all things are held together.',
  },
  'Daniel 12:2': {
    reference: 'Daniel 12:2',
    book: 'Daniel',
    chapter: 12,
    verses: [
      {
        verse: 2,
        text: 'Many of those who sleep in the dust of the earth shall awake, some to everlasting life, and some to shame and everlasting contempt.',
      },
    ],
    text: 'Many of those who sleep in the dust of the earth shall awake, some to everlasting life, and some to shame and everlasting contempt.',
  },
  'Deuteronomy 20:16-17': {
    reference: 'Deuteronomy 20:16-17',
    book: 'Deuteronomy',
    chapter: 20,
    verses: [
      {
        verse: 16,
        text: 'But of the cities of these peoples, that Yahweh your God gives you for an inheritance, you shall save alive nothing that breathes;',
      },
      {
        verse: 17,
        text: 'but you shall utterly destroy them: the Hittite, the Amorite, the Canaanite, the Perizzite, the Hivite, and the Jebusite; as Yahweh your God has commanded you;',
      },
    ],
    text: 'But of the cities of these peoples, that Yahweh your God gives you for an inheritance, you shall save alive nothing that breathes; but you shall utterly destroy them: the Hittite, the Amorite, the Canaanite, the Perizzite, the Hivite, and the Jebusite; as Yahweh your God has commanded you;',
  },
  'Deuteronomy 29:22-23': {
    reference: 'Deuteronomy 29:22-23',
    book: 'Deuteronomy',
    chapter: 29,
    verses: [
      {
        verse: 22,
        text: 'The generation to come, your children who will rise up after you, and the foreigner who will come from a far land, will say, when they see the plagues of that land, and the sicknesses with which Yahweh has made it sick;',
      },
      {
        verse: 23,
        text: 'and that all of its land is sulfur, salt, and burning, that it is not sown, doesn’t produce, nor does any grass grow in it, like the overthrow of Sodom, Gomorrah, Admah, and Zeboiim, which Yahweh overthrew in his anger, and in his wrath;',
      },
    ],
    text: 'The generation to come, your children who will rise up after you, and the foreigner who will come from a far land, will say, when they see the plagues of that land, and the sicknesses with which Yahweh has made it sick; and that all of its land is sulfur, salt, and burning, that it is not sown, doesn’t produce, nor does any grass grow in it, like the overthrow of Sodom, Gomorrah, Admah, and Zeboiim, which Yahweh overthrew in his anger, and in his wrath;',
  },
  'Deuteronomy 29:23': {
    reference: 'Deuteronomy 29:23',
    book: 'Deuteronomy',
    chapter: 29,
    verses: [
      {
        verse: 23,
        text: 'and that all of its land is sulfur, salt, and burning, that it is not sown, doesn’t produce, nor does any grass grow in it, like the overthrow of Sodom, Gomorrah, Admah, and Zeboiim, which Yahweh overthrew in his anger, and in his wrath;',
      },
    ],
    text: 'and that all of its land is sulfur, salt, and burning, that it is not sown, doesn’t produce, nor does any grass grow in it, like the overthrow of Sodom, Gomorrah, Admah, and Zeboiim, which Yahweh overthrew in his anger, and in his wrath;',
  },
  'Deuteronomy 7:1-2': {
    reference: 'Deuteronomy 7:1-2',
    book: 'Deuteronomy',
    chapter: 7,
    verses: [
      {
        verse: 1,
        text: 'When Yahweh your God brings you into the land where you go to possess it, and casts out many nations before you, the Hittite, the Girgashite, the Amorite, the Canaanite, the Perizzite, the Hivite, and the Jebusite, seven nations greater and mightier than you;',
      },
      {
        verse: 2,
        text: 'and when Yahweh your God delivers them up before you, and you strike them; then you shall utterly destroy them. You shall make no covenant with them, nor show mercy to them;',
      },
    ],
    text: 'When Yahweh your God brings you into the land where you go to possess it, and casts out many nations before you, the Hittite, the Girgashite, the Amorite, the Canaanite, the Perizzite, the Hivite, and the Jebusite, seven nations greater and mightier than you; and when Yahweh your God delivers them up before you, and you strike them; then you shall utterly destroy them. You shall make no covenant with them, nor show mercy to them;',
  },
  'Ecclesiastes 3:11': {
    reference: 'Ecclesiastes 3:11',
    book: 'Ecclesiastes',
    chapter: 3,
    verses: [
      {
        verse: 11,
        text: 'He has made everything beautiful in its time. He has also set eternity in their hearts, yet so that man can’t find out the work that God has done from the beginning even to the end.',
      },
    ],
    text: 'He has made everything beautiful in its time. He has also set eternity in their hearts, yet so that man can’t find out the work that God has done from the beginning even to the end.',
  },
  'Ephesians 1:10': {
    reference: 'Ephesians 1:10',
    book: 'Ephesians',
    chapter: 1,
    verses: [
      {
        verse: 10,
        text: 'to an administration of the fullness of the times, to sum up all things in Christ, the things in the heavens, and the things on the earth, in him;',
      },
    ],
    text: 'to an administration of the fullness of the times, to sum up all things in Christ, the things in the heavens, and the things on the earth, in him;',
  },
  'Ephesians 5:5': {
    reference: 'Ephesians 5:5',
    book: 'Ephesians',
    chapter: 5,
    verses: [
      {
        verse: 5,
        text: 'Know this for sure, that no sexually immoral person, nor unclean person, nor covetous man, who is an idolater, has any inheritance in the Kingdom of Christ and God.',
      },
    ],
    text: 'Know this for sure, that no sexually immoral person, nor unclean person, nor covetous man, who is an idolater, has any inheritance in the Kingdom of Christ and God.',
  },
  'Exodus 12:29-30': {
    reference: 'Exodus 12:29-30',
    book: 'Exodus',
    chapter: 12,
    verses: [
      {
        verse: 29,
        text: 'At midnight, Yahweh struck all the firstborn in the land of Egypt, from the firstborn of Pharaoh who sat on his throne to the firstborn of the captive who was in the dungeon; and all the firstborn of livestock.',
      },
      {
        verse: 30,
        text: 'Pharaoh rose up in the night, he, and all his servants, and all the Egyptians; and there was a great cry in Egypt, for there was not a house where there was not one dead.',
      },
    ],
    text: 'At midnight, Yahweh struck all the firstborn in the land of Egypt, from the firstborn of Pharaoh who sat on his throne to the firstborn of the captive who was in the dungeon; and all the firstborn of livestock. Pharaoh rose up in the night, he, and all his servants, and all the Egyptians; and there was a great cry in Egypt, for there was not a house where there was not one dead.',
  },
  'Exodus 3:2': {
    reference: 'Exodus 3:2',
    book: 'Exodus',
    chapter: 3,
    verses: [
      {
        verse: 2,
        text: 'Yahweh’s angel appeared to him in a flame of fire out of the midst of a bush. He looked, and behold, the bush burned with fire, and the bush was not consumed.',
      },
    ],
    text: 'Yahweh’s angel appeared to him in a flame of fire out of the midst of a bush. He looked, and behold, the bush burned with fire, and the bush was not consumed.',
  },
  'Ezekiel 16:49-50': {
    reference: 'Ezekiel 16:49-50',
    book: 'Ezekiel',
    chapter: 16,
    verses: [
      {
        verse: 49,
        text: 'Behold, this was the iniquity of your sister Sodom: pride, fullness of bread, and prosperous ease was in her and in her daughters; neither did she strengthen the hand of the poor and needy.',
      },
      {
        verse: 50,
        text: 'They were haughty, and committed abomination before me: therefore I took them away when I saw it.',
      },
    ],
    text: 'Behold, this was the iniquity of your sister Sodom: pride, fullness of bread, and prosperous ease was in her and in her daughters; neither did she strengthen the hand of the poor and needy. They were haughty, and committed abomination before me: therefore I took them away when I saw it.',
  },
  'Ezekiel 18:20': {
    reference: 'Ezekiel 18:20',
    book: 'Ezekiel',
    chapter: 18,
    verses: [
      {
        verse: 20,
        text: 'The soul who sins, he shall die: the son shall not bear the iniquity of the father, neither shall the father bear the iniquity of the son; the righteousness of the righteous shall be on him, and the wickedness of the wicked shall be on him.',
      },
    ],
    text: 'The soul who sins, he shall die: the son shall not bear the iniquity of the father, neither shall the father bear the iniquity of the son; the righteousness of the righteous shall be on him, and the wickedness of the wicked shall be on him.',
  },
  'Ezekiel 18:23': {
    reference: 'Ezekiel 18:23',
    book: 'Ezekiel',
    chapter: 18,
    verses: [
      {
        verse: 23,
        text: 'Have I any pleasure in the death of the wicked? says the Lord Yahweh; and not rather that he should return from his way, and live?',
      },
    ],
    text: 'Have I any pleasure in the death of the wicked? says the Lord Yahweh; and not rather that he should return from his way, and live?',
  },
  'Ezekiel 20:47-48': {
    reference: 'Ezekiel 20:47-48',
    book: 'Ezekiel',
    chapter: 20,
    verses: [
      {
        verse: 47,
        text: 'and tell the forest of the South, Hear Yahweh’s word: Thus says the Lord Yahweh, Behold, I will kindle a fire in you, and it shall devour every green tree in you, and every dry tree: the flaming flame shall not be quenched, and all faces from the south to the north shall be burnt thereby.',
      },
      {
        verse: 48,
        text: 'All flesh shall see that I, Yahweh, have kindled it; it shall not be quenched.',
      },
    ],
    text: 'and tell the forest of the South, Hear Yahweh’s word: Thus says the Lord Yahweh, Behold, I will kindle a fire in you, and it shall devour every green tree in you, and every dry tree: the flaming flame shall not be quenched, and all faces from the south to the north shall be burnt thereby. All flesh shall see that I, Yahweh, have kindled it; it shall not be quenched.',
  },
  'Ezekiel 33:11': {
    reference: 'Ezekiel 33:11',
    book: 'Ezekiel',
    chapter: 33,
    verses: [
      {
        verse: 11,
        text: 'Tell them, As I live, says the Lord Yahweh, I have no pleasure in the death of the wicked; but that the wicked turn from his way and live: turn, turn from your evil ways; for why will you die, house of Israel?',
      },
    ],
    text: 'Tell them, As I live, says the Lord Yahweh, I have no pleasure in the death of the wicked; but that the wicked turn from his way and live: turn, turn from your evil ways; for why will you die, house of Israel?',
  },
  'Galatians 1:8': {
    reference: 'Galatians 1:8',
    book: 'Galatians',
    chapter: 1,
    verses: [
      {
        verse: 8,
        text: 'But even though we, or an angel from heaven, should preach to you any “good news” other than that which we preached to you, let him be cursed.',
      },
    ],
    text: 'But even though we, or an angel from heaven, should preach to you any “good news” other than that which we preached to you, let him be cursed.',
  },
  'Galatians 5:19-21': {
    reference: 'Galatians 5:19-21',
    book: 'Galatians',
    chapter: 5,
    verses: [
      {
        verse: 19,
        text: 'Now the works of the flesh are obvious, which are: adultery, sexual immorality, uncleanness, lustfulness,',
      },
      {
        verse: 20,
        text: 'idolatry, sorcery, hatred, strife, jealousies, outbursts of anger, rivalries, divisions, heresies,',
      },
      {
        verse: 21,
        text: 'envyings, murders, drunkenness, orgies, and things like these; of which I forewarn you, even as I also forewarned you, that those who practice such things will not inherit the Kingdom of God.',
      },
    ],
    text: 'Now the works of the flesh are obvious, which are: adultery, sexual immorality, uncleanness, lustfulness, idolatry, sorcery, hatred, strife, jealousies, outbursts of anger, rivalries, divisions, heresies, envyings, murders, drunkenness, orgies, and things like these; of which I forewarn you, even as I also forewarned you, that those who practice such things will not inherit the Kingdom of God.',
  },
  'Galatians 6:8': {
    reference: 'Galatians 6:8',
    book: 'Galatians',
    chapter: 6,
    verses: [
      {
        verse: 8,
        text: 'For he who sows to his own flesh will from the flesh reap corruption. But he who sows to the Spirit will from the Spirit reap eternal life.',
      },
    ],
    text: 'For he who sows to his own flesh will from the flesh reap corruption. But he who sows to the Spirit will from the Spirit reap eternal life.',
  },
  'Genesis 19:24-28': {
    reference: 'Genesis 19:24-28',
    book: 'Genesis',
    chapter: 19,
    verses: [
      {
        verse: 24,
        text: 'Then Yahweh rained on Sodom and on Gomorrah sulfur and fire from Yahweh out of the sky.',
      },
      {
        verse: 25,
        text: 'He overthrew those cities, all the plain, all the inhabitants of the cities, and that which grew on the ground.',
      },
      {
        verse: 26,
        text: 'But his wife looked back from behind him, and she became a pillar of salt.',
      },
      {
        verse: 27,
        text: 'Abraham got up early in the morning to the place where he had stood before Yahweh.',
      },
      {
        verse: 28,
        text: 'He looked toward Sodom and Gomorrah, and toward all the land of the plain, and looked, and saw that the smoke of the land went up as the smoke of a furnace.',
      },
    ],
    text: 'Then Yahweh rained on Sodom and on Gomorrah sulfur and fire from Yahweh out of the sky. He overthrew those cities, all the plain, all the inhabitants of the cities, and that which grew on the ground. But his wife looked back from behind him, and she became a pillar of salt. Abraham got up early in the morning to the place where he had stood before Yahweh. He looked toward Sodom and Gomorrah, and toward all the land of the plain, and looked, and saw that the smoke of the land went up as the smoke of a furnace.',
  },
  'Genesis 19:28': {
    reference: 'Genesis 19:28',
    book: 'Genesis',
    chapter: 19,
    verses: [
      {
        verse: 28,
        text: 'He looked toward Sodom and Gomorrah, and toward all the land of the plain, and looked, and saw that the smoke of the land went up as the smoke of a furnace.',
      },
    ],
    text: 'He looked toward Sodom and Gomorrah, and toward all the land of the plain, and looked, and saw that the smoke of the land went up as the smoke of a furnace.',
  },
  'Genesis 1:26-27': {
    reference: 'Genesis 1:26-27',
    book: 'Genesis',
    chapter: 1,
    verses: [
      {
        verse: 26,
        text: 'God said, “Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the birds of the sky, and over the livestock, and over all the earth, and over every creeping thing that creeps on the earth.”',
      },
      {
        verse: 27,
        text: 'God created man in his own image. In God’s image he created him; male and female he created them.',
      },
    ],
    text: 'God said, “Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the birds of the sky, and over the livestock, and over all the earth, and over every creeping thing that creeps on the earth.” God created man in his own image. In God’s image he created him; male and female he created them.',
  },
  'Genesis 22:1-14': {
    reference: 'Genesis 22:1-14',
    book: 'Genesis',
    chapter: 22,
    verses: [
      {
        verse: 1,
        text: 'After these things, God tested Abraham, and said to him, “Abraham!” He said, “Here I am.”',
      },
      {
        verse: 2,
        text: 'He said, “Now take your son, your only son, whom you love, even Isaac, and go into the land of Moriah. Offer him there for a burnt offering on one of the mountains which I will tell you of.”',
      },
      {
        verse: 3,
        text: 'Abraham rose early in the morning, and saddled his donkey, and took two of his young men with him, and Isaac his son. He split the wood for the burnt offering, and rose up, and went to the place of which God had told him.',
      },
      { verse: 4, text: 'On the third day Abraham lifted up his eyes, and saw the place far off.' },
      {
        verse: 5,
        text: 'Abraham said to his young men, “Stay here with the donkey. The boy and I will go yonder. We will worship, and come back to you.”',
      },
      {
        verse: 6,
        text: 'Abraham took the wood of the burnt offering and laid it on Isaac his son. He took in his hand the fire and the knife. They both went together.',
      },
      {
        verse: 7,
        text: 'Isaac spoke to Abraham his father, and said, “My father?” He said, “Here I am, my son.” He said, “Here is the fire and the wood, but where is the lamb for a burnt offering?”',
      },
      {
        verse: 8,
        text: 'Abraham said, “God will provide himself the lamb for a burnt offering, my son.” So they both went together.',
      },
      {
        verse: 9,
        text: 'They came to the place which God had told him of. Abraham built the altar there, and laid the wood in order, bound Isaac his son, and laid him on the altar, on the wood.',
      },
      { verse: 10, text: 'Abraham stretched out his hand, and took the knife to kill his son.' },
      {
        verse: 11,
        text: 'Yahweh’s angel called to him out of the sky, and said, “Abraham, Abraham!” He said, “Here I am.”',
      },
      {
        verse: 12,
        text: 'He said, “Don’t lay your hand on the boy, neither do anything to him. For now I know that you fear God, since you have not withheld your son, your only son, from me.”',
      },
      {
        verse: 13,
        text: 'Abraham lifted up his eyes, and looked, and saw that behind him was a ram caught in the thicket by his horns. Abraham went and took the ram, and offered him up for a burnt offering instead of his son.',
      },
      {
        verse: 14,
        text: 'Abraham called the name of that place Yahweh Will Provide. As it is said to this day, “On Yahweh’s mountain, it will be provided.”',
      },
    ],
    text: 'After these things, God tested Abraham, and said to him, “Abraham!” He said, “Here I am.” He said, “Now take your son, your only son, whom you love, even Isaac, and go into the land of Moriah. Offer him there for a burnt offering on one of the mountains which I will tell you of.” Abraham rose early in the morning, and saddled his donkey, and took two of his young men with him, and Isaac his son. He split the wood for the burnt offering, and rose up, and went to the place of which God had told him. On the third day Abraham lifted up his eyes, and saw the place far off. Abraham said to his young men, “Stay here with the donkey. The boy and I will go yonder. We will worship, and come back to you.” Abraham took the wood of the burnt offering and laid it on Isaac his son. He took in his hand the fire and the knife. They both went together. Isaac spoke to Abraham his father, and said, “My father?” He said, “Here I am, my son.” He said, “Here is the fire and the wood, but where is the lamb for a burnt offering?” Abraham said, “God will provide himself the lamb for a burnt offering, my son.” So they both went together. They came to the place which God had told him of. Abraham built the altar there, and laid the wood in order, bound Isaac his son, and laid him on the altar, on the wood. Abraham stretched out his hand, and took the knife to kill his son. Yahweh’s angel called to him out of the sky, and said, “Abraham, Abraham!” He said, “Here I am.” He said, “Don’t lay your hand on the boy, neither do anything to him. For now I know that you fear God, since you have not withheld your son, your only son, from me.” Abraham lifted up his eyes, and looked, and saw that behind him was a ram caught in the thicket by his horns. Abraham went and took the ram, and offered him up for a burnt offering instead of his son. Abraham called the name of that place Yahweh Will Provide. As it is said to this day, “On Yahweh’s mountain, it will be provided.”',
  },
  'Genesis 2:17': {
    reference: 'Genesis 2:17',
    book: 'Genesis',
    chapter: 2,
    verses: [
      {
        verse: 17,
        text: 'but you shall not eat of the tree of the knowledge of good and evil; for in the day that you eat of it, you will surely die.”',
      },
    ],
    text: 'but you shall not eat of the tree of the knowledge of good and evil; for in the day that you eat of it, you will surely die.”',
  },
  'Genesis 2:9': {
    reference: 'Genesis 2:9',
    book: 'Genesis',
    chapter: 2,
    verses: [
      {
        verse: 9,
        text: 'Out of the ground Yahweh God made every tree to grow that is pleasant to the sight, and good for food, including the tree of life in the middle of the garden and the tree of the knowledge of good and evil.',
      },
    ],
    text: 'Out of the ground Yahweh God made every tree to grow that is pleasant to the sight, and good for food, including the tree of life in the middle of the garden and the tree of the knowledge of good and evil.',
  },
  'Genesis 3:22-24': {
    reference: 'Genesis 3:22-24',
    book: 'Genesis',
    chapter: 3,
    verses: [
      {
        verse: 22,
        text: 'Yahweh God said, “Behold, the man has become like one of us, knowing good and evil. Now, lest he reach out his hand, and also take of the tree of life, and eat, and live forever...”',
      },
      {
        verse: 23,
        text: 'Therefore Yahweh God sent him out from the garden of Eden, to till the ground from which he was taken.',
      },
      {
        verse: 24,
        text: 'So he drove out the man; and he placed cherubim/f + cherubim are powerful angelic creatures, messengers of God with wings. See Ezekiel 10./f* at the east of the garden of Eden, and a flaming sword which turned every way, to guard the way to the tree of life.',
      },
    ],
    text: 'Yahweh God said, “Behold, the man has become like one of us, knowing good and evil. Now, lest he reach out his hand, and also take of the tree of life, and eat, and live forever...” Therefore Yahweh God sent him out from the garden of Eden, to till the ground from which he was taken. So he drove out the man; and he placed cherubim/f + cherubim are powerful angelic creatures, messengers of God with wings. See Ezekiel 10./f* at the east of the garden of Eden, and a flaming sword which turned every way, to guard the way to the tree of life.',
  },
  'Genesis 3:4': {
    reference: 'Genesis 3:4',
    book: 'Genesis',
    chapter: 3,
    verses: [{ verse: 4, text: 'The serpent said to the woman, “You won’t surely die,' }],
    text: 'The serpent said to the woman, “You won’t surely die,',
  },
  'Genesis 6:5-8': {
    reference: 'Genesis 6:5-8',
    book: 'Genesis',
    chapter: 6,
    verses: [
      {
        verse: 5,
        text: 'Yahweh saw that the wickedness of man was great in the earth, and that every imagination of the thoughts of man’s heart was continually only evil.',
      },
      {
        verse: 6,
        text: 'Yahweh was sorry that he had made man on the earth, and it grieved him in his heart.',
      },
      {
        verse: 7,
        text: 'Yahweh said, “I will destroy man whom I have created from the surface of the ground—man, along with animals, creeping things, and birds of the sky—for I am sorry that I have made them.”',
      },
      { verse: 8, text: 'But Noah found favor in Yahweh’s eyes.' },
    ],
    text: 'Yahweh saw that the wickedness of man was great in the earth, and that every imagination of the thoughts of man’s heart was continually only evil. Yahweh was sorry that he had made man on the earth, and it grieved him in his heart. Yahweh said, “I will destroy man whom I have created from the surface of the ground—man, along with animals, creeping things, and birds of the sky—for I am sorry that I have made them.” But Noah found favor in Yahweh’s eyes.',
  },
  'Hebrews 10:1-14': {
    reference: 'Hebrews 10:1-14',
    book: 'Hebrews',
    chapter: 10,
    verses: [
      {
        verse: 1,
        text: 'For the law, having a shadow of the good to come, not the very image of the things, can never with the same sacrifices year by year, which they offer continually, make perfect those who draw near.',
      },
      {
        verse: 2,
        text: 'Or else wouldn’t they have ceased to be offered, because the worshipers, having been once cleansed, would have had no more consciousness of sins?',
      },
      { verse: 3, text: 'But in those sacrifices there is a yearly reminder of sins.' },
      {
        verse: 4,
        text: 'For it is impossible that the blood of bulls and goats should take away sins.',
      },
      {
        verse: 5,
        text: 'Therefore when he comes into the world, he says, “Sacrifice and offering you didn’t desire, but you prepared a body for me;',
      },
      { verse: 6, text: 'You had no pleasure in whole burnt offerings and sacrifices for sin.' },
      {
        verse: 7,
        text: 'Then I said, ‘Behold, I have come (in the scroll of the book it is written of me) to do your will, O God.’”',
      },
      {
        verse: 8,
        text: 'Previously saying, “Sacrifices and offerings and whole burnt offerings and sacrifices for sin you didn’t desire, neither had pleasure in them” (those which are offered according to the law),',
      },
      {
        verse: 9,
        text: 'then he has said, “Behold, I have come to do your will.” He takes away the first, that he may establish the second,',
      },
      {
        verse: 10,
        text: 'by which will we have been sanctified through the offering of the body of Jesus Christ once for all.',
      },
      {
        verse: 11,
        text: 'Every priest indeed stands day by day serving and often offering the same sacrifices, which can never take away sins,',
      },
      {
        verse: 12,
        text: 'but he, when he had offered one sacrifice for sins forever, sat down on the right hand of God;',
      },
      {
        verse: 13,
        text: 'from that time waiting until his enemies are made the footstool of his feet.',
      },
      {
        verse: 14,
        text: 'For by one offering he has perfected forever those who are being sanctified.',
      },
    ],
    text: 'For the law, having a shadow of the good to come, not the very image of the things, can never with the same sacrifices year by year, which they offer continually, make perfect those who draw near. Or else wouldn’t they have ceased to be offered, because the worshipers, having been once cleansed, would have had no more consciousness of sins? But in those sacrifices there is a yearly reminder of sins. For it is impossible that the blood of bulls and goats should take away sins. Therefore when he comes into the world, he says, “Sacrifice and offering you didn’t desire, but you prepared a body for me; You had no pleasure in whole burnt offerings and sacrifices for sin. Then I said, ‘Behold, I have come (in the scroll of the book it is written of me) to do your will, O God.’” Previously saying, “Sacrifices and offerings and whole burnt offerings and sacrifices for sin you didn’t desire, neither had pleasure in them” (those which are offered according to the law), then he has said, “Behold, I have come to do your will.” He takes away the first, that he may establish the second, by which will we have been sanctified through the offering of the body of Jesus Christ once for all. Every priest indeed stands day by day serving and often offering the same sacrifices, which can never take away sins, but he, when he had offered one sacrifice for sins forever, sat down on the right hand of God; from that time waiting until his enemies are made the footstool of his feet. For by one offering he has perfected forever those who are being sanctified.',
  },
  'Hebrews 12:26-29': {
    reference: 'Hebrews 12:26-29',
    book: 'Hebrews',
    chapter: 12,
    verses: [
      {
        verse: 26,
        text: 'whose voice shook the earth then, but now he has promised, saying, “Yet once more I will shake not only the earth, but also the heavens.”',
      },
      {
        verse: 27,
        text: 'This phrase, “Yet once more”, signifies the removing of those things that are shaken, as of things that have been made, that those things which are not shaken may remain.',
      },
      {
        verse: 28,
        text: 'Therefore, receiving a Kingdom that can’t be shaken, let us have grace, through which we serve God acceptably, with reverence and awe,',
      },
      { verse: 29, text: 'for our God is a consuming fire.' },
    ],
    text: 'whose voice shook the earth then, but now he has promised, saying, “Yet once more I will shake not only the earth, but also the heavens.” This phrase, “Yet once more”, signifies the removing of those things that are shaken, as of things that have been made, that those things which are not shaken may remain. Therefore, receiving a Kingdom that can’t be shaken, let us have grace, through which we serve God acceptably, with reverence and awe, for our God is a consuming fire.',
  },
  'Hebrews 12:29': {
    reference: 'Hebrews 12:29',
    book: 'Hebrews',
    chapter: 12,
    verses: [{ verse: 29, text: 'for our God is a consuming fire.' }],
    text: 'for our God is a consuming fire.',
  },
  'Hebrews 1:3': {
    reference: 'Hebrews 1:3',
    book: 'Hebrews',
    chapter: 1,
    verses: [
      {
        verse: 3,
        text: 'His Son is the radiance of his glory, the very image of his substance, and upholding all things by the word of his power, when he had by himself purified us of our sins, sat down on the right hand of the Majesty on high;',
      },
    ],
    text: 'His Son is the radiance of his glory, the very image of his substance, and upholding all things by the word of his power, when he had by himself purified us of our sins, sat down on the right hand of the Majesty on high;',
  },
  'Hebrews 5:9': {
    reference: 'Hebrews 5:9',
    book: 'Hebrews',
    chapter: 5,
    verses: [
      {
        verse: 9,
        text: 'Having been made perfect, he became to all of those who obey him the author of eternal salvation,',
      },
    ],
    text: 'Having been made perfect, he became to all of those who obey him the author of eternal salvation,',
  },
  'Hebrews 6:2': {
    reference: 'Hebrews 6:2',
    book: 'Hebrews',
    chapter: 6,
    verses: [
      {
        verse: 2,
        text: 'of the teaching of baptisms, of laying on of hands, of resurrection of the dead, and of eternal judgment.',
      },
    ],
    text: 'of the teaching of baptisms, of laying on of hands, of resurrection of the dead, and of eternal judgment.',
  },
  'Hebrews 9:12': {
    reference: 'Hebrews 9:12',
    book: 'Hebrews',
    chapter: 9,
    verses: [
      {
        verse: 12,
        text: 'nor yet through the blood of goats and calves, but through his own blood, entered in once for all into the Holy Place, having obtained eternal redemption.',
      },
    ],
    text: 'nor yet through the blood of goats and calves, but through his own blood, entered in once for all into the Holy Place, having obtained eternal redemption.',
  },
  'Hebrews 9:15': {
    reference: 'Hebrews 9:15',
    book: 'Hebrews',
    chapter: 9,
    verses: [
      {
        verse: 15,
        text: 'For this reason he is the mediator of a new covenant, since a death has occurred for the redemption of the transgressions that were under the first covenant, that those who have been called may receive the promise of the eternal inheritance.',
      },
    ],
    text: 'For this reason he is the mediator of a new covenant, since a death has occurred for the redemption of the transgressions that were under the first covenant, that those who have been called may receive the promise of the eternal inheritance.',
  },
  'Hebrews 9:22': {
    reference: 'Hebrews 9:22',
    book: 'Hebrews',
    chapter: 9,
    verses: [
      {
        verse: 22,
        text: 'According to the law, nearly everything is cleansed with blood, and apart from shedding of blood there is no remission.',
      },
    ],
    text: 'According to the law, nearly everything is cleansed with blood, and apart from shedding of blood there is no remission.',
  },
  'Hebrews 9:27': {
    reference: 'Hebrews 9:27',
    book: 'Hebrews',
    chapter: 9,
    verses: [
      {
        verse: 27,
        text: 'Inasmuch as it is appointed for men to die once, and after this, judgment,',
      },
    ],
    text: 'Inasmuch as it is appointed for men to die once, and after this, judgment,',
  },
  'Isaiah 1:31': {
    reference: 'Isaiah 1:31',
    book: 'Isaiah',
    chapter: 1,
    verses: [
      {
        verse: 31,
        text: 'The strong will be like tinder, and his work like a spark. They will both burn together, and no one will quench them.”',
      },
    ],
    text: 'The strong will be like tinder, and his work like a spark. They will both burn together, and no one will quench them.”',
  },
  'Isaiah 33:12': {
    reference: 'Isaiah 33:12',
    book: 'Isaiah',
    chapter: 33,
    verses: [
      {
        verse: 12,
        text: 'The peoples will be like the burning of lime, like thorns that are cut down and burned in the fire.',
      },
    ],
    text: 'The peoples will be like the burning of lime, like thorns that are cut down and burned in the fire.',
  },
  'Isaiah 34:9-10': {
    reference: 'Isaiah 34:9-10',
    book: 'Isaiah',
    chapter: 34,
    verses: [
      {
        verse: 9,
        text: 'Its streams will be turned into pitch, its dust into sulfur, And its land will become burning pitch.',
      },
      {
        verse: 10,
        text: 'It won’t be quenched night nor day. Its smoke will go up forever. From generation to generation, it will lie waste. No one will pass through it forever and ever.',
      },
    ],
    text: 'Its streams will be turned into pitch, its dust into sulfur, And its land will become burning pitch. It won’t be quenched night nor day. Its smoke will go up forever. From generation to generation, it will lie waste. No one will pass through it forever and ever.',
  },
  'Isaiah 40:6-8': {
    reference: 'Isaiah 40:6-8',
    book: 'Isaiah',
    chapter: 40,
    verses: [
      {
        verse: 6,
        text: 'The voice of one saying, “Cry!” One said, “What shall I cry?” “All flesh is like grass, and all its glory is like the flower of the field.',
      },
      {
        verse: 7,
        text: 'The grass withers, the flower fades, because Yahweh’s breath blows on it. Surely the people are like grass.',
      },
      {
        verse: 8,
        text: 'The grass withers, the flower fades; but the word of our God stands forever.”',
      },
    ],
    text: 'The voice of one saying, “Cry!” One said, “What shall I cry?” “All flesh is like grass, and all its glory is like the flower of the field. The grass withers, the flower fades, because Yahweh’s breath blows on it. Surely the people are like grass. The grass withers, the flower fades; but the word of our God stands forever.”',
  },
  'Isaiah 43:2': {
    reference: 'Isaiah 43:2',
    book: 'Isaiah',
    chapter: 43,
    verses: [
      {
        verse: 2,
        text: 'When you pass through the waters, I will be with you; and through the rivers, they will not overflow you. When you walk through the fire, you will not be burned, and flame will not scorch you.',
      },
    ],
    text: 'When you pass through the waters, I will be with you; and through the rivers, they will not overflow you. When you walk through the fire, you will not be burned, and flame will not scorch you.',
  },
  'Isaiah 66:15': {
    reference: 'Isaiah 66:15',
    book: 'Isaiah',
    chapter: 66,
    verses: [
      {
        verse: 15,
        text: 'For, behold, Yahweh will come with fire, and his chariots shall be like the whirlwind; to render his anger with fierceness, and his rebuke with flames of fire.',
      },
    ],
    text: 'For, behold, Yahweh will come with fire, and his chariots shall be like the whirlwind; to render his anger with fierceness, and his rebuke with flames of fire.',
  },
  'Isaiah 66:15-24': {
    reference: 'Isaiah 66:15-24',
    book: 'Isaiah',
    chapter: 66,
    verses: [
      {
        verse: 15,
        text: 'For, behold, Yahweh will come with fire, and his chariots shall be like the whirlwind; to render his anger with fierceness, and his rebuke with flames of fire.',
      },
      {
        verse: 16,
        text: 'For by fire will Yahweh execute judgment, and by his sword, on all flesh; and the slain of Yahweh shall be many.',
      },
      {
        verse: 17,
        text: '“Those who sanctify themselves and purify themselves to go to the gardens, behind one in the midst, eating pig’s flesh, and the abomination, and the mouse, they shall come to an end together,” says Yahweh.',
      },
      {
        verse: 18,
        text: '“For I know their works and their thoughts: the time comes, that I will gather all nations and languages; and they shall come, and shall see my glory.',
      },
      {
        verse: 19,
        text: '“I will set a sign among them, and I will send such as escape of them to the nations, to Tarshish, Pul, and Lud, who draw the bow, to Tubal and Javan, to the islands afar off, who have not heard my fame, neither have seen my glory; and they shall declare my glory among the nations.',
      },
      {
        verse: 20,
        text: 'They shall bring all your brothers out of all the nations for an offering to Yahweh, on horses, and in chariots, and in litters, and on mules, and on dromedaries, to my holy mountain Jerusalem, says Yahweh, as the children of Israel bring their offering in a clean vessel into Yahweh’s house.',
      },
      { verse: 21, text: 'Of them also will I take for priests and for Levites,” says Yahweh.' },
      {
        verse: 22,
        text: '“For as the new heavens and the new earth, which I will make, shall remain before me,” says Yahweh, “so your seed and your name shall remain.',
      },
      {
        verse: 23,
        text: 'It shall happen, that from one new moon to another, and from one Sabbath to another, shall all flesh come to worship before me,” says Yahweh.',
      },
      {
        verse: 24,
        text: '“They shall go out, and look on the dead bodies of the men who have transgressed against me: for their worm shall not die, neither shall their fire be quenched; and they will be loathsome to all mankind.”',
      },
    ],
    text: 'For, behold, Yahweh will come with fire, and his chariots shall be like the whirlwind; to render his anger with fierceness, and his rebuke with flames of fire. For by fire will Yahweh execute judgment, and by his sword, on all flesh; and the slain of Yahweh shall be many. “Those who sanctify themselves and purify themselves to go to the gardens, behind one in the midst, eating pig’s flesh, and the abomination, and the mouse, they shall come to an end together,” says Yahweh. “For I know their works and their thoughts: the time comes, that I will gather all nations and languages; and they shall come, and shall see my glory. “I will set a sign among them, and I will send such as escape of them to the nations, to Tarshish, Pul, and Lud, who draw the bow, to Tubal and Javan, to the islands afar off, who have not heard my fame, neither have seen my glory; and they shall declare my glory among the nations. They shall bring all your brothers out of all the nations for an offering to Yahweh, on horses, and in chariots, and in litters, and on mules, and on dromedaries, to my holy mountain Jerusalem, says Yahweh, as the children of Israel bring their offering in a clean vessel into Yahweh’s house. Of them also will I take for priests and for Levites,” says Yahweh. “For as the new heavens and the new earth, which I will make, shall remain before me,” says Yahweh, “so your seed and your name shall remain. It shall happen, that from one new moon to another, and from one Sabbath to another, shall all flesh come to worship before me,” says Yahweh. “They shall go out, and look on the dead bodies of the men who have transgressed against me: for their worm shall not die, neither shall their fire be quenched; and they will be loathsome to all mankind.”',
  },
  'Isaiah 66:24': {
    reference: 'Isaiah 66:24',
    book: 'Isaiah',
    chapter: 66,
    verses: [
      {
        verse: 24,
        text: '“They shall go out, and look on the dead bodies of the men who have transgressed against me: for their worm shall not die, neither shall their fire be quenched; and they will be loathsome to all mankind.”',
      },
    ],
    text: '“They shall go out, and look on the dead bodies of the men who have transgressed against me: for their worm shall not die, neither shall their fire be quenched; and they will be loathsome to all mankind.”',
  },
  'Isaiah 8:20': {
    reference: 'Isaiah 8:20',
    book: 'Isaiah',
    chapter: 8,
    verses: [
      {
        verse: 20,
        text: 'Turn to the law and to the testimony! If they don’t speak according to this word, surely there is no morning for them.',
      },
    ],
    text: 'Turn to the law and to the testimony! If they don’t speak according to this word, surely there is no morning for them.',
  },
  'James 1:15': {
    reference: 'James 1:15',
    book: 'James',
    chapter: 1,
    verses: [
      {
        verse: 15,
        text: 'Then the lust, when it has conceived, bears sin; and the sin, when it is full grown, produces death.',
      },
    ],
    text: 'Then the lust, when it has conceived, bears sin; and the sin, when it is full grown, produces death.',
  },
  'James 2:26': {
    reference: 'James 2:26',
    book: 'James',
    chapter: 2,
    verses: [
      {
        verse: 26,
        text: 'For as the body apart from the spirit is dead, even so faith apart from works is dead.',
      },
    ],
    text: 'For as the body apart from the spirit is dead, even so faith apart from works is dead.',
  },
  'James 4:12': {
    reference: 'James 4:12',
    book: 'James',
    chapter: 4,
    verses: [
      {
        verse: 12,
        text: 'Only one is the lawgiver, who is able to save and to destroy. But who are you to judge another?',
      },
    ],
    text: 'Only one is the lawgiver, who is able to save and to destroy. But who are you to judge another?',
  },
  'James 4:14': {
    reference: 'James 4:14',
    book: 'James',
    chapter: 4,
    verses: [
      {
        verse: 14,
        text: 'Whereas you don’t know what your life will be like tomorrow. For what is your life? For you are a vapor, that appears for a little time, and then vanishes away.',
      },
    ],
    text: 'Whereas you don’t know what your life will be like tomorrow. For what is your life? For you are a vapor, that appears for a little time, and then vanishes away.',
  },
  'James 4:17': {
    reference: 'James 4:17',
    book: 'James',
    chapter: 4,
    verses: [
      {
        verse: 17,
        text: 'To him therefore who knows to do good, and doesn’t do it, to him it is sin.',
      },
    ],
    text: 'To him therefore who knows to do good, and doesn’t do it, to him it is sin.',
  },
  'Jeremiah 17:27': {
    reference: 'Jeremiah 17:27',
    book: 'Jeremiah',
    chapter: 17,
    verses: [
      {
        verse: 27,
        text: 'But if you will not listen to me to make the Sabbath day holy, and not to bear a burden and enter in at the gates of Jerusalem on the Sabbath day; then I will kindle a fire in its gates, and it shall devour the palaces of Jerusalem, and it shall not be quenched.',
      },
    ],
    text: 'But if you will not listen to me to make the Sabbath day holy, and not to bear a burden and enter in at the gates of Jerusalem on the Sabbath day; then I will kindle a fire in its gates, and it shall devour the palaces of Jerusalem, and it shall not be quenched.',
  },
  'Jeremiah 4:4': {
    reference: 'Jeremiah 4:4',
    book: 'Jeremiah',
    chapter: 4,
    verses: [
      {
        verse: 4,
        text: 'Circumcise yourselves to Yahweh, and take away the foreskins of your heart, you men of Judah and inhabitants of Jerusalem; lest my wrath go out like fire, and burn so that no one can quench it, because of the evil of your doings.',
      },
    ],
    text: 'Circumcise yourselves to Yahweh, and take away the foreskins of your heart, you men of Judah and inhabitants of Jerusalem; lest my wrath go out like fire, and burn so that no one can quench it, because of the evil of your doings.',
  },
  'Jeremiah 7:32-33': {
    reference: 'Jeremiah 7:32-33',
    book: 'Jeremiah',
    chapter: 7,
    verses: [
      {
        verse: 32,
        text: 'Therefore behold, the days come”, says Yahweh, “that it shall no more be called Topheth, nor The valley of the son of Hinnom, but The valley of Slaughter; for they shall bury in Topheth, until there is no place to bury.',
      },
      {
        verse: 33,
        text: 'The dead bodies of this people shall be food for the birds of the sky, and for the animals of the earth; and no one shall frighten them away.',
      },
    ],
    text: 'Therefore behold, the days come”, says Yahweh, “that it shall no more be called Topheth, nor The valley of the son of Hinnom, but The valley of Slaughter; for they shall bury in Topheth, until there is no place to bury. The dead bodies of this people shall be food for the birds of the sky, and for the animals of the earth; and no one shall frighten them away.',
  },
  'Job 16:9': {
    reference: 'Job 16:9',
    book: 'Job',
    chapter: 16,
    verses: [
      {
        verse: 9,
        text: 'He has torn me in his wrath, and persecuted me. He has gnashed on me with his teeth. My adversary sharpens his eyes on me.',
      },
    ],
    text: 'He has torn me in his wrath, and persecuted me. He has gnashed on me with his teeth. My adversary sharpens his eyes on me.',
  },
  'John 10:10': {
    reference: 'John 10:10',
    book: 'John',
    chapter: 10,
    verses: [
      {
        verse: 10,
        text: 'The thief only comes to steal, kill, and destroy. I came that they may have life, and may have it abundantly.',
      },
    ],
    text: 'The thief only comes to steal, kill, and destroy. I came that they may have life, and may have it abundantly.',
  },
  'John 15:22': {
    reference: 'John 15:22',
    book: 'John',
    chapter: 15,
    verses: [
      {
        verse: 22,
        text: 'If I had not come and spoken to them, they would not have had sin; but now they have no excuse for their sin.',
      },
    ],
    text: 'If I had not come and spoken to them, they would not have had sin; but now they have no excuse for their sin.',
  },
  'John 17:3': {
    reference: 'John 17:3',
    book: 'John',
    chapter: 17,
    verses: [
      {
        verse: 3,
        text: 'This is eternal life, that they should know you, the only true God, and him whom you sent, Jesus Christ.',
      },
    ],
    text: 'This is eternal life, that they should know you, the only true God, and him whom you sent, Jesus Christ.',
  },
  'John 3:16': {
    reference: 'John 3:16',
    book: 'John',
    chapter: 3,
    verses: [
      {
        verse: 16,
        text: 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.',
      },
    ],
    text: 'For God so loved the world, that he gave his one and only Son, that whoever believes in him should not perish, but have eternal life.',
  },
  'John 3:36': {
    reference: 'John 3:36',
    book: 'John',
    chapter: 3,
    verses: [
      {
        verse: 36,
        text: 'One who believes in the Son has eternal life, but one who disobeys the Son won’t see life, but the wrath of God remains on him.”',
      },
    ],
    text: 'One who believes in the Son has eternal life, but one who disobeys the Son won’t see life, but the wrath of God remains on him.”',
  },
  'John 5:24': {
    reference: 'John 5:24',
    book: 'John',
    chapter: 5,
    verses: [
      {
        verse: 24,
        text: '“Most certainly I tell you, he who hears my word, and believes him who sent me, has eternal life, and doesn’t come into judgment, but has passed out of death into life.',
      },
    ],
    text: '“Most certainly I tell you, he who hears my word, and believes him who sent me, has eternal life, and doesn’t come into judgment, but has passed out of death into life.',
  },
  'John 6:51': {
    reference: 'John 6:51',
    book: 'John',
    chapter: 6,
    verses: [
      {
        verse: 51,
        text: 'I am the living bread which came down out of heaven. If anyone eats of this bread, he will live forever. Yes, the bread which I will give for the life of the world is my flesh.”',
      },
    ],
    text: 'I am the living bread which came down out of heaven. If anyone eats of this bread, he will live forever. Yes, the bread which I will give for the life of the world is my flesh.”',
  },
  'John 9:41': {
    reference: 'John 9:41',
    book: 'John',
    chapter: 9,
    verses: [
      {
        verse: 41,
        text: 'Jesus said to them, “If you were blind, you would have no sin; but now you say, ‘We see.’ Therefore your sin remains.',
      },
    ],
    text: 'Jesus said to them, “If you were blind, you would have no sin; but now you say, ‘We see.’ Therefore your sin remains.',
  },
  'Jude 13': {
    reference: 'Jude 13',
    book: 'Jude',
    chapter: 1,
    verses: [
      {
        verse: 13,
        text: 'wild waves of the sea, foaming out their own shame; wandering stars, for whom the blackness of darkness has been reserved forever.',
      },
    ],
    text: 'wild waves of the sea, foaming out their own shame; wandering stars, for whom the blackness of darkness has been reserved forever.',
  },
  'Jude 1:12-13': {
    reference: 'Jude 1:12-13',
    book: 'Jude',
    chapter: 1,
    verses: [
      {
        verse: 12,
        text: 'These are hidden rocky reefs in your love feasts when they feast with you, shepherds who without fear feed themselves; clouds without water, carried along by winds; autumn leaves without fruit, twice dead, plucked up by the roots;',
      },
      {
        verse: 13,
        text: 'wild waves of the sea, foaming out their own shame; wandering stars, for whom the blackness of darkness has been reserved forever.',
      },
    ],
    text: 'These are hidden rocky reefs in your love feasts when they feast with you, shepherds who without fear feed themselves; clouds without water, carried along by winds; autumn leaves without fruit, twice dead, plucked up by the roots; wild waves of the sea, foaming out their own shame; wandering stars, for whom the blackness of darkness has been reserved forever.',
  },
  'Jude 1:15': {
    reference: 'Jude 1:15',
    book: 'Jude',
    chapter: 1,
    verses: [
      {
        verse: 15,
        text: 'to execute judgment on all, and to convict all the ungodly of all their works of ungodliness which they have done in an ungodly way, and of all the hard things which ungodly sinners have spoken against him.”',
      },
    ],
    text: 'to execute judgment on all, and to convict all the ungodly of all their works of ungodliness which they have done in an ungodly way, and of all the hard things which ungodly sinners have spoken against him.”',
  },
  'Jude 1:6': {
    reference: 'Jude 1:6',
    book: 'Jude',
    chapter: 1,
    verses: [
      {
        verse: 6,
        text: 'Angels who didn’t keep their first domain, but deserted their own dwelling place, he has kept in everlasting bonds under darkness for the judgment of the great day.',
      },
    ],
    text: 'Angels who didn’t keep their first domain, but deserted their own dwelling place, he has kept in everlasting bonds under darkness for the judgment of the great day.',
  },
  'Jude 1:7': {
    reference: 'Jude 1:7',
    book: 'Jude',
    chapter: 1,
    verses: [
      {
        verse: 7,
        text: 'Even as Sodom and Gomorrah, and the cities around them, having, in the same way as these, given themselves over to sexual immorality and gone after strange flesh, are shown as an example, suffering the punishment of eternal fire.',
      },
    ],
    text: 'Even as Sodom and Gomorrah, and the cities around them, having, in the same way as these, given themselves over to sexual immorality and gone after strange flesh, are shown as an example, suffering the punishment of eternal fire.',
  },
  'Jude 7': {
    reference: 'Jude 7',
    book: 'Jude',
    chapter: 1,
    verses: [
      {
        verse: 7,
        text: 'Even as Sodom and Gomorrah, and the cities around them, having, in the same way as these, given themselves over to sexual immorality and gone after strange flesh, are shown as an example, suffering the punishment of eternal fire.',
      },
    ],
    text: 'Even as Sodom and Gomorrah, and the cities around them, having, in the same way as these, given themselves over to sexual immorality and gone after strange flesh, are shown as an example, suffering the punishment of eternal fire.',
  },
  'Leviticus 17:11': {
    reference: 'Leviticus 17:11',
    book: 'Leviticus',
    chapter: 17,
    verses: [
      {
        verse: 11,
        text: 'For the life of the flesh is in the blood; and I have given it to you on the altar to make atonement for your souls: for it is the blood that makes atonement by reason of the life.',
      },
    ],
    text: 'For the life of the flesh is in the blood; and I have given it to you on the altar to make atonement for your souls: for it is the blood that makes atonement by reason of the life.',
  },
  'Luke 12:4-5': {
    reference: 'Luke 12:4-5',
    book: 'Luke',
    chapter: 12,
    verses: [
      {
        verse: 4,
        text: '“I tell you, my friends, don’t be afraid of those who kill the body, and after that have no more that they can do.',
      },
      {
        verse: 5,
        text: 'But I will warn you whom you should fear. Fear him, who after he has killed, has power to cast into Gehenna.Yes, I tell you, fear him.',
      },
    ],
    text: '“I tell you, my friends, don’t be afraid of those who kill the body, and after that have no more that they can do. But I will warn you whom you should fear. Fear him, who after he has killed, has power to cast into Gehenna.Yes, I tell you, fear him.',
  },
  'Luke 12:47-48': {
    reference: 'Luke 12:47-48',
    book: 'Luke',
    chapter: 12,
    verses: [
      {
        verse: 47,
        text: 'That servant, who knew his lord’s will, and didn’t prepare, nor do what he wanted, will be beaten with many stripes,',
      },
      {
        verse: 48,
        text: 'but he who didn’t know, and did things worthy of stripes, will be beaten with few stripes. To whomever much is given, of him will much be required; and to whom much was entrusted, of him more will be asked.',
      },
    ],
    text: 'That servant, who knew his lord’s will, and didn’t prepare, nor do what he wanted, will be beaten with many stripes, but he who didn’t know, and did things worthy of stripes, will be beaten with few stripes. To whomever much is given, of him will much be required; and to whom much was entrusted, of him more will be asked.',
  },
  'Luke 13:22-30': {
    reference: 'Luke 13:22-30',
    book: 'Luke',
    chapter: 13,
    verses: [
      {
        verse: 22,
        text: 'He went on his way through cities and villages, teaching, and traveling on to Jerusalem.',
      },
      { verse: 23, text: 'One said to him, “Lord, are they few who are saved?” He said to them,' },
      {
        verse: 24,
        text: '“Strive to enter in by the narrow door, for many, I tell you, will seek to enter in, and will not be able.',
      },
      {
        verse: 25,
        text: 'When once the master of the house has risen up, and has shut the door, and you begin to stand outside, and to knock at the door, saying, ‘Lord, Lord, open to us!’ then he will answer and tell you, ‘I don’t know you or where you come from.’',
      },
      {
        verse: 26,
        text: 'Then you will begin to say, ‘We ate and drank in your presence, and you taught in our streets.’',
      },
      {
        verse: 27,
        text: 'He will say, ‘I tell you, I don’t know where you come from. Depart from me, all you workers of iniquity.’',
      },
      {
        verse: 28,
        text: 'There will be weeping and gnashing of teeth, when you see Abraham, Isaac, Jacob, and all the prophets, in the Kingdom of God, and yourselves being thrown outside.',
      },
      {
        verse: 29,
        text: 'They will come from the east, west, north, and south, and will sit down in the Kingdom of God.',
      },
      {
        verse: 30,
        text: 'Behold, there are some who are last who will be first, and there are some who are first who will be last.”',
      },
    ],
    text: 'He went on his way through cities and villages, teaching, and traveling on to Jerusalem. One said to him, “Lord, are they few who are saved?” He said to them, “Strive to enter in by the narrow door, for many, I tell you, will seek to enter in, and will not be able. When once the master of the house has risen up, and has shut the door, and you begin to stand outside, and to knock at the door, saying, ‘Lord, Lord, open to us!’ then he will answer and tell you, ‘I don’t know you or where you come from.’ Then you will begin to say, ‘We ate and drank in your presence, and you taught in our streets.’ He will say, ‘I tell you, I don’t know where you come from. Depart from me, all you workers of iniquity.’ There will be weeping and gnashing of teeth, when you see Abraham, Isaac, Jacob, and all the prophets, in the Kingdom of God, and yourselves being thrown outside. They will come from the east, west, north, and south, and will sit down in the Kingdom of God. Behold, there are some who are last who will be first, and there are some who are first who will be last.”',
  },
  'Luke 13:25-28': {
    reference: 'Luke 13:25-28',
    book: 'Luke',
    chapter: 13,
    verses: [
      {
        verse: 25,
        text: 'When once the master of the house has risen up, and has shut the door, and you begin to stand outside, and to knock at the door, saying, ‘Lord, Lord, open to us!’ then he will answer and tell you, ‘I don’t know you or where you come from.’',
      },
      {
        verse: 26,
        text: 'Then you will begin to say, ‘We ate and drank in your presence, and you taught in our streets.’',
      },
      {
        verse: 27,
        text: 'He will say, ‘I tell you, I don’t know where you come from. Depart from me, all you workers of iniquity.’',
      },
      {
        verse: 28,
        text: 'There will be weeping and gnashing of teeth, when you see Abraham, Isaac, Jacob, and all the prophets, in the Kingdom of God, and yourselves being thrown outside.',
      },
    ],
    text: 'When once the master of the house has risen up, and has shut the door, and you begin to stand outside, and to knock at the door, saying, ‘Lord, Lord, open to us!’ then he will answer and tell you, ‘I don’t know you or where you come from.’ Then you will begin to say, ‘We ate and drank in your presence, and you taught in our streets.’ He will say, ‘I tell you, I don’t know where you come from. Depart from me, all you workers of iniquity.’ There will be weeping and gnashing of teeth, when you see Abraham, Isaac, Jacob, and all the prophets, in the Kingdom of God, and yourselves being thrown outside.',
  },
  'Luke 16:19-31': {
    reference: 'Luke 16:19-31',
    book: 'Luke',
    chapter: 16,
    verses: [
      {
        verse: 19,
        text: '“Now there was a certain rich man, and he was clothed in purple and fine linen, living in luxury every day.',
      },
      { verse: 20, text: 'A certain beggar, named Lazarus, was laid at his gate, full of sores,' },
      {
        verse: 21,
        text: 'and desiring to be fed with the crumbs that fell from the rich man’s table. Yes, even the dogs came and licked his sores.',
      },
      {
        verse: 22,
        text: 'The beggar died, and he was carried away by the angels to Abraham’s bosom. The rich man also died, and was buried.',
      },
      {
        verse: 23,
        text: 'In Hades, he lifted up his eyes, being in torment, and saw Abraham far off, and Lazarus at his bosom.',
      },
      {
        verse: 24,
        text: 'He cried and said, ‘Father Abraham, have mercy on me, and send Lazarus, that he may dip the tip of his finger in water, and cool my tongue! For I am in anguish in this flame.’',
      },
      {
        verse: 25,
        text: '“But Abraham said, ‘Son, remember that you, in your lifetime, received your good things, and Lazarus, in the same way, bad things. But now here he is comforted and you are in anguish.',
      },
      {
        verse: 26,
        text: 'Besides all this, between us and you there is a great gulf fixed, that those who want to pass from here to you are not able, and that no one may cross over from there to us.’',
      },
      {
        verse: 27,
        text: '“He said, ‘I ask you therefore, father, that you would send him to my father’s house;',
      },
      {
        verse: 28,
        text: 'for I have five brothers, that he may testify to them, so they won’t also come into this place of torment.’',
      },
      {
        verse: 29,
        text: '“But Abraham said to him, ‘They have Moses and the prophets. Let them listen to them.’',
      },
      {
        verse: 30,
        text: '“He said, ‘No, father Abraham, but if one goes to them from the dead, they will repent.’',
      },
      {
        verse: 31,
        text: '“He said to him, ‘If they don’t listen to Moses and the prophets, neither will they be persuaded if one rises from the dead.’”',
      },
    ],
    text: '“Now there was a certain rich man, and he was clothed in purple and fine linen, living in luxury every day. A certain beggar, named Lazarus, was laid at his gate, full of sores, and desiring to be fed with the crumbs that fell from the rich man’s table. Yes, even the dogs came and licked his sores. The beggar died, and he was carried away by the angels to Abraham’s bosom. The rich man also died, and was buried. In Hades, he lifted up his eyes, being in torment, and saw Abraham far off, and Lazarus at his bosom. He cried and said, ‘Father Abraham, have mercy on me, and send Lazarus, that he may dip the tip of his finger in water, and cool my tongue! For I am in anguish in this flame.’ “But Abraham said, ‘Son, remember that you, in your lifetime, received your good things, and Lazarus, in the same way, bad things. But now here he is comforted and you are in anguish. Besides all this, between us and you there is a great gulf fixed, that those who want to pass from here to you are not able, and that no one may cross over from there to us.’ “He said, ‘I ask you therefore, father, that you would send him to my father’s house; for I have five brothers, that he may testify to them, so they won’t also come into this place of torment.’ “But Abraham said to him, ‘They have Moses and the prophets. Let them listen to them.’ “He said, ‘No, father Abraham, but if one goes to them from the dead, they will repent.’ “He said to him, ‘If they don’t listen to Moses and the prophets, neither will they be persuaded if one rises from the dead.’”',
  },
  'Luke 16:27-31': {
    reference: 'Luke 16:27-31',
    book: 'Luke',
    chapter: 16,
    verses: [
      {
        verse: 27,
        text: '“He said, ‘I ask you therefore, father, that you would send him to my father’s house;',
      },
      {
        verse: 28,
        text: 'for I have five brothers, that he may testify to them, so they won’t also come into this place of torment.’',
      },
      {
        verse: 29,
        text: '“But Abraham said to him, ‘They have Moses and the prophets. Let them listen to them.’',
      },
      {
        verse: 30,
        text: '“He said, ‘No, father Abraham, but if one goes to them from the dead, they will repent.’',
      },
      {
        verse: 31,
        text: '“He said to him, ‘If they don’t listen to Moses and the prophets, neither will they be persuaded if one rises from the dead.’”',
      },
    ],
    text: '“He said, ‘I ask you therefore, father, that you would send him to my father’s house; for I have five brothers, that he may testify to them, so they won’t also come into this place of torment.’ “But Abraham said to him, ‘They have Moses and the prophets. Let them listen to them.’ “He said, ‘No, father Abraham, but if one goes to them from the dead, they will repent.’ “He said to him, ‘If they don’t listen to Moses and the prophets, neither will they be persuaded if one rises from the dead.’”',
  },
  'Luke 17:26-30': {
    reference: 'Luke 17:26-30',
    book: 'Luke',
    chapter: 17,
    verses: [
      {
        verse: 26,
        text: 'As it was in the days of Noah, even so will it be also in the days of the Son of Man.',
      },
      {
        verse: 27,
        text: 'They ate, they drank, they married, they were given in marriage, until the day that Noah entered into the ship, and the flood came, and destroyed them all.',
      },
      {
        verse: 28,
        text: 'Likewise, even as it was in the days of Lot: they ate, they drank, they bought, they sold, they planted, they built;',
      },
      {
        verse: 29,
        text: 'but in the day that Lot went out from Sodom, it rained fire and sulfur from the sky, and destroyed them all.',
      },
      { verse: 30, text: 'It will be the same way in the day that the Son of Man is revealed.' },
    ],
    text: 'As it was in the days of Noah, even so will it be also in the days of the Son of Man. They ate, they drank, they married, they were given in marriage, until the day that Noah entered into the ship, and the flood came, and destroyed them all. Likewise, even as it was in the days of Lot: they ate, they drank, they bought, they sold, they planted, they built; but in the day that Lot went out from Sodom, it rained fire and sulfur from the sky, and destroyed them all. It will be the same way in the day that the Son of Man is revealed.',
  },
  'Luke 23:34': {
    reference: 'Luke 23:34',
    book: 'Luke',
    chapter: 23,
    verses: [
      {
        verse: 34,
        text: 'Jesus said, “Father, forgive them, for they don’t know what they are doing.” Dividing his garments among them, they cast lots.',
      },
    ],
    text: 'Jesus said, “Father, forgive them, for they don’t know what they are doing.” Dividing his garments among them, they cast lots.',
  },
  'Luke 3:17': {
    reference: 'Luke 3:17',
    book: 'Luke',
    chapter: 3,
    verses: [
      {
        verse: 17,
        text: 'whose fan is in his hand, and he will thoroughly cleanse his threshing floor, and will gather the wheat into his barn; but he will burn up the chaff with unquenchable fire.”',
      },
    ],
    text: 'whose fan is in his hand, and he will thoroughly cleanse his threshing floor, and will gather the wheat into his barn; but he will burn up the chaff with unquenchable fire.”',
  },
  'Luke 3:9': {
    reference: 'Luke 3:9',
    book: 'Luke',
    chapter: 3,
    verses: [
      {
        verse: 9,
        text: 'Even now the ax also lies at the root of the trees. Every tree therefore that doesn’t produce good fruit is cut down, and thrown into the fire.”',
      },
    ],
    text: 'Even now the ax also lies at the root of the trees. Every tree therefore that doesn’t produce good fruit is cut down, and thrown into the fire.”',
  },
  'Malachi 4:1-3': {
    reference: 'Malachi 4:1-3',
    book: 'Malachi',
    chapter: 4,
    verses: [
      {
        verse: 1,
        text: '“For, behold, the day comes, it burns as a furnace; and all the proud, and all who work wickedness, will be stubble; and the day that comes will burn them up,” says Yahweh of Armies, “that it shall leave them neither root nor branch.',
      },
      {
        verse: 2,
        text: 'But to you who fear my name shall the sun of righteousness arise with healing in its wings. You will go out, and leap like calves of the stall.',
      },
      {
        verse: 3,
        text: 'You shall tread down the wicked; for they will be ashes under the soles of your feet in the day that I make,” says Yahweh of Armies.',
      },
    ],
    text: '“For, behold, the day comes, it burns as a furnace; and all the proud, and all who work wickedness, will be stubble; and the day that comes will burn them up,” says Yahweh of Armies, “that it shall leave them neither root nor branch. But to you who fear my name shall the sun of righteousness arise with healing in its wings. You will go out, and leap like calves of the stall. You shall tread down the wicked; for they will be ashes under the soles of your feet in the day that I make,” says Yahweh of Armies.',
  },
  'Mark 3:28-30': {
    reference: 'Mark 3:28-30',
    book: 'Mark',
    chapter: 3,
    verses: [
      {
        verse: 28,
        text: 'Most certainly I tell you, all sins of the descendants of man will be forgiven, including their blasphemies with which they may blaspheme;',
      },
      {
        verse: 29,
        text: 'but whoever may blaspheme against the Holy Spirit never has forgiveness, but is subject to eternal condemnation.”',
      },
      { verse: 30, text: '—because they said, “He has an unclean spirit.”' },
    ],
    text: 'Most certainly I tell you, all sins of the descendants of man will be forgiven, including their blasphemies with which they may blaspheme; but whoever may blaspheme against the Holy Spirit never has forgiveness, but is subject to eternal condemnation.” —because they said, “He has an unclean spirit.”',
  },
  'Mark 3:29': {
    reference: 'Mark 3:29',
    book: 'Mark',
    chapter: 3,
    verses: [
      {
        verse: 29,
        text: 'but whoever may blaspheme against the Holy Spirit never has forgiveness, but is subject to eternal condemnation.”',
      },
    ],
    text: 'but whoever may blaspheme against the Holy Spirit never has forgiveness, but is subject to eternal condemnation.”',
  },
  'Mark 9:42-48': {
    reference: 'Mark 9:42-48',
    book: 'Mark',
    chapter: 9,
    verses: [
      {
        verse: 42,
        text: 'Whoever will cause one of these little ones who believe in me to stumble, it would be better for him if he were thrown into the sea with a millstone hung around his neck.',
      },
      {
        verse: 43,
        text: 'If your hand causes you to stumble, cut it off. It is better for you to enter into life maimed, rather than having your two hands to go into Gehenna, into the unquenchable fire,',
      },
      { verse: 44, text: '‘where their worm doesn’t die, and the fire is not quenched.’' },
      {
        verse: 45,
        text: 'If your foot causes you to stumble, cut it off. It is better for you to enter into life lame, rather than having your two feet to be cast into Gehenna, into the fire that will never be quenched—',
      },
      { verse: 46, text: '‘where their worm doesn’t die, and the fire is not quenched.’' },
      {
        verse: 47,
        text: 'If your eye causes you to stumble, cast it out. It is better for you to enter into the Kingdom of God with one eye, rather than having two eyes to be cast into the Gehenna of fire,',
      },
      { verse: 48, text: '‘where their worm doesn’t die, and the fire is not quenched.’' },
    ],
    text: 'Whoever will cause one of these little ones who believe in me to stumble, it would be better for him if he were thrown into the sea with a millstone hung around his neck. If your hand causes you to stumble, cut it off. It is better for you to enter into life maimed, rather than having your two hands to go into Gehenna, into the unquenchable fire, ‘where their worm doesn’t die, and the fire is not quenched.’ If your foot causes you to stumble, cut it off. It is better for you to enter into life lame, rather than having your two feet to be cast into Gehenna, into the fire that will never be quenched— ‘where their worm doesn’t die, and the fire is not quenched.’ If your eye causes you to stumble, cast it out. It is better for you to enter into the Kingdom of God with one eye, rather than having two eyes to be cast into the Gehenna of fire, ‘where their worm doesn’t die, and the fire is not quenched.’',
  },
  'Mark 9:47-48': {
    reference: 'Mark 9:47-48',
    book: 'Mark',
    chapter: 9,
    verses: [
      {
        verse: 47,
        text: 'If your eye causes you to stumble, cast it out. It is better for you to enter into the Kingdom of God with one eye, rather than having two eyes to be cast into the Gehenna of fire,',
      },
      { verse: 48, text: '‘where their worm doesn’t die, and the fire is not quenched.’' },
    ],
    text: 'If your eye causes you to stumble, cast it out. It is better for you to enter into the Kingdom of God with one eye, rather than having two eyes to be cast into the Gehenna of fire, ‘where their worm doesn’t die, and the fire is not quenched.’',
  },
  'Matthew 10:15': {
    reference: 'Matthew 10:15',
    book: 'Matthew',
    chapter: 10,
    verses: [
      {
        verse: 15,
        text: 'Most certainly I tell you, it will be more tolerable for the land of Sodom and Gomorrah in the day of judgment than for that city.',
      },
    ],
    text: 'Most certainly I tell you, it will be more tolerable for the land of Sodom and Gomorrah in the day of judgment than for that city.',
  },
  'Matthew 10:28': {
    reference: 'Matthew 10:28',
    book: 'Matthew',
    chapter: 10,
    verses: [
      {
        verse: 28,
        text: 'Don’t be afraid of those who kill the body, but are not able to kill the soul. Rather, fear him who is able to destroy both soul and body in Gehenna.',
      },
    ],
    text: 'Don’t be afraid of those who kill the body, but are not able to kill the soul. Rather, fear him who is able to destroy both soul and body in Gehenna.',
  },
  'Matthew 11:20-24': {
    reference: 'Matthew 11:20-24',
    book: 'Matthew',
    chapter: 11,
    verses: [
      {
        verse: 20,
        text: 'Then he began to denounce the cities in which most of his mighty works had been done, because they didn’t repent.',
      },
      {
        verse: 21,
        text: '“Woe to you, Chorazin! Woe to you, Bethsaida! For if the mighty works had been done in Tyre and Sidon which were done in you, they would have repented long ago in sackcloth and ashes.',
      },
      {
        verse: 22,
        text: 'But I tell you, it will be more tolerable for Tyre and Sidon on the day of judgment than for you.',
      },
      {
        verse: 23,
        text: 'You, Capernaum, who are exalted to heaven, you will go down to Hades. For if the mighty works had been done in Sodom which were done in you, it would have remained until this day.',
      },
      {
        verse: 24,
        text: 'But I tell you that it will be more tolerable for the land of Sodom, on the day of judgment, than for you.”',
      },
    ],
    text: 'Then he began to denounce the cities in which most of his mighty works had been done, because they didn’t repent. “Woe to you, Chorazin! Woe to you, Bethsaida! For if the mighty works had been done in Tyre and Sidon which were done in you, they would have repented long ago in sackcloth and ashes. But I tell you, it will be more tolerable for Tyre and Sidon on the day of judgment than for you. You, Capernaum, who are exalted to heaven, you will go down to Hades. For if the mighty works had been done in Sodom which were done in you, it would have remained until this day. But I tell you that it will be more tolerable for the land of Sodom, on the day of judgment, than for you.”',
  },
  'Matthew 13:24-30': {
    reference: 'Matthew 13:24-30',
    book: 'Matthew',
    chapter: 13,
    verses: [
      {
        verse: 24,
        text: 'He set another parable before them, saying, “The Kingdom of Heaven is like a man who sowed good seed in his field,',
      },
      {
        verse: 25,
        text: 'but while people slept, his enemy came and sowed darnel weeds also among the wheat, and went away.',
      },
      {
        verse: 26,
        text: 'But when the blade sprang up and produced fruit, then the darnel weeds appeared also.',
      },
      {
        verse: 27,
        text: 'The servants of the householder came and said to him, ‘Sir, didn’t you sow good seed in your field? Where did this darnel come from?’',
      },
      {
        verse: 28,
        text: '“He said to them, ‘An enemy has done this.’ “The servants asked him, ‘Do you want us to go and gather them up?’',
      },
      {
        verse: 29,
        text: '“But he said, ‘No, lest perhaps while you gather up the darnel weeds, you root up the wheat with them.',
      },
      {
        verse: 30,
        text: 'Let both grow together until the harvest, and in the harvest time I will tell the reapers, “First, gather up the darnel weeds, and bind them in bundles to burn them; but gather the wheat into my barn.”’”',
      },
    ],
    text: 'He set another parable before them, saying, “The Kingdom of Heaven is like a man who sowed good seed in his field, but while people slept, his enemy came and sowed darnel weeds also among the wheat, and went away. But when the blade sprang up and produced fruit, then the darnel weeds appeared also. The servants of the householder came and said to him, ‘Sir, didn’t you sow good seed in your field? Where did this darnel come from?’ “He said to them, ‘An enemy has done this.’ “The servants asked him, ‘Do you want us to go and gather them up?’ “But he said, ‘No, lest perhaps while you gather up the darnel weeds, you root up the wheat with them. Let both grow together until the harvest, and in the harvest time I will tell the reapers, “First, gather up the darnel weeds, and bind them in bundles to burn them; but gather the wheat into my barn.”’”',
  },
  'Matthew 13:24-43': {
    reference: 'Matthew 13:24-43',
    book: 'Matthew',
    chapter: 13,
    verses: [
      {
        verse: 24,
        text: 'He set another parable before them, saying, “The Kingdom of Heaven is like a man who sowed good seed in his field,',
      },
      {
        verse: 25,
        text: 'but while people slept, his enemy came and sowed darnel weeds also among the wheat, and went away.',
      },
      {
        verse: 26,
        text: 'But when the blade sprang up and produced fruit, then the darnel weeds appeared also.',
      },
      {
        verse: 27,
        text: 'The servants of the householder came and said to him, ‘Sir, didn’t you sow good seed in your field? Where did this darnel come from?’',
      },
      {
        verse: 28,
        text: '“He said to them, ‘An enemy has done this.’ “The servants asked him, ‘Do you want us to go and gather them up?’',
      },
      {
        verse: 29,
        text: '“But he said, ‘No, lest perhaps while you gather up the darnel weeds, you root up the wheat with them.',
      },
      {
        verse: 30,
        text: 'Let both grow together until the harvest, and in the harvest time I will tell the reapers, “First, gather up the darnel weeds, and bind them in bundles to burn them; but gather the wheat into my barn.”’”',
      },
      {
        verse: 31,
        text: 'He set another parable before them, saying, “The Kingdom of Heaven is like a grain of mustard seed, which a man took, and sowed in his field;',
      },
      {
        verse: 32,
        text: 'which indeed is smaller than all seeds. But when it is grown, it is greater than the herbs, and becomes a tree, so that the birds of the air come and lodge in its branches.”',
      },
      {
        verse: 33,
        text: 'He spoke another parable to them. “The Kingdom of Heaven is like yeast, which a woman took, and hid in three measuresof meal, until it was all leavened.”',
      },
      {
        verse: 34,
        text: 'Jesus spoke all these things in parables to the multitudes; and without a parable, he didn’t speak to them,',
      },
      {
        verse: 35,
        text: 'that it might be fulfilled which was spoken through the prophet, saying, “I will open my mouth in parables; I will utter things hidden from the foundation of the world.”',
      },
      {
        verse: 36,
        text: 'Then Jesus sent the multitudes away, and went into the house. His disciples came to him, saying, “Explain to us the parable of the darnel weeds of the field.”',
      },
      { verse: 37, text: 'He answered them, “He who sows the good seed is the Son of Man,' },
      {
        verse: 38,
        text: 'the field is the world; and the good seed, these are the children of the Kingdom; and the darnel weeds are the children of the evil one.',
      },
      {
        verse: 39,
        text: 'The enemy who sowed them is the devil. The harvest is the end of the age, and the reapers are angels.',
      },
      {
        verse: 40,
        text: 'As therefore the darnel weeds are gathered up and burned with fire; so will it be at the end of this age.',
      },
      {
        verse: 41,
        text: 'The Son of Man will send out his angels, and they will gather out of his Kingdom all things that cause stumbling, and those who do iniquity,',
      },
      {
        verse: 42,
        text: 'and will cast them into the furnace of fire. There will be weeping and the gnashing of teeth.',
      },
      {
        verse: 43,
        text: 'Then the righteous will shine like the sun in the Kingdom of their Father. He who has ears to hear, let him hear.',
      },
    ],
    text: 'He set another parable before them, saying, “The Kingdom of Heaven is like a man who sowed good seed in his field, but while people slept, his enemy came and sowed darnel weeds also among the wheat, and went away. But when the blade sprang up and produced fruit, then the darnel weeds appeared also. The servants of the householder came and said to him, ‘Sir, didn’t you sow good seed in your field? Where did this darnel come from?’ “He said to them, ‘An enemy has done this.’ “The servants asked him, ‘Do you want us to go and gather them up?’ “But he said, ‘No, lest perhaps while you gather up the darnel weeds, you root up the wheat with them. Let both grow together until the harvest, and in the harvest time I will tell the reapers, “First, gather up the darnel weeds, and bind them in bundles to burn them; but gather the wheat into my barn.”’” He set another parable before them, saying, “The Kingdom of Heaven is like a grain of mustard seed, which a man took, and sowed in his field; which indeed is smaller than all seeds. But when it is grown, it is greater than the herbs, and becomes a tree, so that the birds of the air come and lodge in its branches.” He spoke another parable to them. “The Kingdom of Heaven is like yeast, which a woman took, and hid in three measuresof meal, until it was all leavened.” Jesus spoke all these things in parables to the multitudes; and without a parable, he didn’t speak to them, that it might be fulfilled which was spoken through the prophet, saying, “I will open my mouth in parables; I will utter things hidden from the foundation of the world.” Then Jesus sent the multitudes away, and went into the house. His disciples came to him, saying, “Explain to us the parable of the darnel weeds of the field.” He answered them, “He who sows the good seed is the Son of Man, the field is the world; and the good seed, these are the children of the Kingdom; and the darnel weeds are the children of the evil one. The enemy who sowed them is the devil. The harvest is the end of the age, and the reapers are angels. As therefore the darnel weeds are gathered up and burned with fire; so will it be at the end of this age. The Son of Man will send out his angels, and they will gather out of his Kingdom all things that cause stumbling, and those who do iniquity, and will cast them into the furnace of fire. There will be weeping and the gnashing of teeth. Then the righteous will shine like the sun in the Kingdom of their Father. He who has ears to hear, let him hear.',
  },
  'Matthew 13:36-43': {
    reference: 'Matthew 13:36-43',
    book: 'Matthew',
    chapter: 13,
    verses: [
      {
        verse: 36,
        text: 'Then Jesus sent the multitudes away, and went into the house. His disciples came to him, saying, “Explain to us the parable of the darnel weeds of the field.”',
      },
      { verse: 37, text: 'He answered them, “He who sows the good seed is the Son of Man,' },
      {
        verse: 38,
        text: 'the field is the world; and the good seed, these are the children of the Kingdom; and the darnel weeds are the children of the evil one.',
      },
      {
        verse: 39,
        text: 'The enemy who sowed them is the devil. The harvest is the end of the age, and the reapers are angels.',
      },
      {
        verse: 40,
        text: 'As therefore the darnel weeds are gathered up and burned with fire; so will it be at the end of this age.',
      },
      {
        verse: 41,
        text: 'The Son of Man will send out his angels, and they will gather out of his Kingdom all things that cause stumbling, and those who do iniquity,',
      },
      {
        verse: 42,
        text: 'and will cast them into the furnace of fire. There will be weeping and the gnashing of teeth.',
      },
      {
        verse: 43,
        text: 'Then the righteous will shine like the sun in the Kingdom of their Father. He who has ears to hear, let him hear.',
      },
    ],
    text: 'Then Jesus sent the multitudes away, and went into the house. His disciples came to him, saying, “Explain to us the parable of the darnel weeds of the field.” He answered them, “He who sows the good seed is the Son of Man, the field is the world; and the good seed, these are the children of the Kingdom; and the darnel weeds are the children of the evil one. The enemy who sowed them is the devil. The harvest is the end of the age, and the reapers are angels. As therefore the darnel weeds are gathered up and burned with fire; so will it be at the end of this age. The Son of Man will send out his angels, and they will gather out of his Kingdom all things that cause stumbling, and those who do iniquity, and will cast them into the furnace of fire. There will be weeping and the gnashing of teeth. Then the righteous will shine like the sun in the Kingdom of their Father. He who has ears to hear, let him hear.',
  },
  'Matthew 13:41-42': {
    reference: 'Matthew 13:41-42',
    book: 'Matthew',
    chapter: 13,
    verses: [
      {
        verse: 41,
        text: 'The Son of Man will send out his angels, and they will gather out of his Kingdom all things that cause stumbling, and those who do iniquity,',
      },
      {
        verse: 42,
        text: 'and will cast them into the furnace of fire. There will be weeping and the gnashing of teeth.',
      },
    ],
    text: 'The Son of Man will send out his angels, and they will gather out of his Kingdom all things that cause stumbling, and those who do iniquity, and will cast them into the furnace of fire. There will be weeping and the gnashing of teeth.',
  },
  'Matthew 13:47-50': {
    reference: 'Matthew 13:47-50',
    book: 'Matthew',
    chapter: 13,
    verses: [
      {
        verse: 47,
        text: '“Again, the Kingdom of Heaven is like a dragnet, that was cast into the sea, and gathered some fish of every kind,',
      },
      {
        verse: 48,
        text: 'which, when it was filled, they drew up on the beach. They sat down, and gathered the good into containers, but the bad they threw away.',
      },
      {
        verse: 49,
        text: 'So will it be in the end of the world. The angels will come and separate the wicked from among the righteous,',
      },
      {
        verse: 50,
        text: 'and will cast them into the furnace of fire. There will be the weeping and the gnashing of teeth.”',
      },
    ],
    text: '“Again, the Kingdom of Heaven is like a dragnet, that was cast into the sea, and gathered some fish of every kind, which, when it was filled, they drew up on the beach. They sat down, and gathered the good into containers, but the bad they threw away. So will it be in the end of the world. The angels will come and separate the wicked from among the righteous, and will cast them into the furnace of fire. There will be the weeping and the gnashing of teeth.”',
  },
  'Matthew 18:23-35': {
    reference: 'Matthew 18:23-35',
    book: 'Matthew',
    chapter: 18,
    verses: [
      {
        verse: 23,
        text: 'Therefore the Kingdom of Heaven is like a certain king, who wanted to reconcile accounts with his servants.',
      },
      {
        verse: 24,
        text: 'When he had begun to reconcile, one was brought to him who owed him ten thousand talents.',
      },
      {
        verse: 25,
        text: 'But because he couldn’t pay, his lord commanded him to be sold, with his wife, his children, and all that he had, and payment to be made.',
      },
      {
        verse: 26,
        text: 'The servant therefore fell down and kneeled before him, saying, ‘Lord, have patience with me, and I will repay you all!’',
      },
      {
        verse: 27,
        text: 'The lord of that servant, being moved with compassion, released him, and forgave him the debt.',
      },
      {
        verse: 28,
        text: '“But that servant went out, and found one of his fellow servants, who owed him one hundred denarii,and he grabbed him, and took him by the throat, saying, ‘Pay me what you owe!’',
      },
      {
        verse: 29,
        text: '“So his fellow servant fell down at his feet and begged him, saying, ‘Have patience with me, and I will repay you!’',
      },
      {
        verse: 30,
        text: 'He would not, but went and cast him into prison, until he should pay back that which was due.',
      },
      {
        verse: 31,
        text: 'So when his fellow servants saw what was done, they were exceedingly sorry, and came and told to their lord all that was done.',
      },
      {
        verse: 32,
        text: 'Then his lord called him in, and said to him, ‘You wicked servant! I forgave you all that debt, because you begged me.',
      },
      {
        verse: 33,
        text: 'Shouldn’t you also have had mercy on your fellow servant, even as I had mercy on you?’',
      },
      {
        verse: 34,
        text: 'His lord was angry, and delivered him to the tormentors, until he should pay all that was due to him.',
      },
      {
        verse: 35,
        text: 'So my heavenly Father will also do to you, if you don’t each forgive your brother from your hearts for his misdeeds.”',
      },
    ],
    text: 'Therefore the Kingdom of Heaven is like a certain king, who wanted to reconcile accounts with his servants. When he had begun to reconcile, one was brought to him who owed him ten thousand talents. But because he couldn’t pay, his lord commanded him to be sold, with his wife, his children, and all that he had, and payment to be made. The servant therefore fell down and kneeled before him, saying, ‘Lord, have patience with me, and I will repay you all!’ The lord of that servant, being moved with compassion, released him, and forgave him the debt. “But that servant went out, and found one of his fellow servants, who owed him one hundred denarii,and he grabbed him, and took him by the throat, saying, ‘Pay me what you owe!’ “So his fellow servant fell down at his feet and begged him, saying, ‘Have patience with me, and I will repay you!’ He would not, but went and cast him into prison, until he should pay back that which was due. So when his fellow servants saw what was done, they were exceedingly sorry, and came and told to their lord all that was done. Then his lord called him in, and said to him, ‘You wicked servant! I forgave you all that debt, because you begged me. Shouldn’t you also have had mercy on your fellow servant, even as I had mercy on you?’ His lord was angry, and delivered him to the tormentors, until he should pay all that was due to him. So my heavenly Father will also do to you, if you don’t each forgive your brother from your hearts for his misdeeds.”',
  },
  'Matthew 22:1-14': {
    reference: 'Matthew 22:1-14',
    book: 'Matthew',
    chapter: 22,
    verses: [
      { verse: 1, text: 'Jesus answered and spoke again in parables to them, saying,' },
      {
        verse: 2,
        text: '“The Kingdom of Heaven is like a certain king, who made a marriage feast for his son,',
      },
      {
        verse: 3,
        text: 'and sent out his servants to call those who were invited to the marriage feast, but they would not come.',
      },
      {
        verse: 4,
        text: 'Again he sent out other servants, saying, ‘Tell those who are invited, “Behold, I have prepared my dinner. My cattle and my fatlings are killed, and all things are ready. Come to the marriage feast!”’',
      },
      {
        verse: 5,
        text: 'But they made light of it, and went their ways, one to his own farm, another to his merchandise,',
      },
      {
        verse: 6,
        text: 'and the rest grabbed his servants, and treated them shamefully, and killed them.',
      },
      {
        verse: 7,
        text: 'When the king heard that, he was angry, and sent his armies, destroyed those murderers, and burned their city.',
      },
      {
        verse: 8,
        text: '“Then he said to his servants, ‘The wedding is ready, but those who were invited weren’t worthy.',
      },
      {
        verse: 9,
        text: 'Go therefore to the intersections of the highways, and as many as you may find, invite to the marriage feast.’',
      },
      {
        verse: 10,
        text: 'Those servants went out into the highways, and gathered together as many as they found, both bad and good. The wedding was filled with guests.',
      },
      {
        verse: 11,
        text: 'But when the king came in to see the guests, he saw there a man who didn’t have on wedding clothing,',
      },
      {
        verse: 12,
        text: 'and he said to him, ‘Friend, how did you come in here not wearing wedding clothing?’ He was speechless.',
      },
      {
        verse: 13,
        text: 'Then the king said to the servants, ‘Bind him hand and foot, take him away, and throw him into the outer darkness; there is where the weeping and grinding of teeth will be.’',
      },
      { verse: 14, text: 'For many are called, but few chosen.”' },
    ],
    text: 'Jesus answered and spoke again in parables to them, saying, “The Kingdom of Heaven is like a certain king, who made a marriage feast for his son, and sent out his servants to call those who were invited to the marriage feast, but they would not come. Again he sent out other servants, saying, ‘Tell those who are invited, “Behold, I have prepared my dinner. My cattle and my fatlings are killed, and all things are ready. Come to the marriage feast!”’ But they made light of it, and went their ways, one to his own farm, another to his merchandise, and the rest grabbed his servants, and treated them shamefully, and killed them. When the king heard that, he was angry, and sent his armies, destroyed those murderers, and burned their city. “Then he said to his servants, ‘The wedding is ready, but those who were invited weren’t worthy. Go therefore to the intersections of the highways, and as many as you may find, invite to the marriage feast.’ Those servants went out into the highways, and gathered together as many as they found, both bad and good. The wedding was filled with guests. But when the king came in to see the guests, he saw there a man who didn’t have on wedding clothing, and he said to him, ‘Friend, how did you come in here not wearing wedding clothing?’ He was speechless. Then the king said to the servants, ‘Bind him hand and foot, take him away, and throw him into the outer darkness; there is where the weeping and grinding of teeth will be.’ For many are called, but few chosen.”',
  },
  'Matthew 22:11-13': {
    reference: 'Matthew 22:11-13',
    book: 'Matthew',
    chapter: 22,
    verses: [
      {
        verse: 11,
        text: 'But when the king came in to see the guests, he saw there a man who didn’t have on wedding clothing,',
      },
      {
        verse: 12,
        text: 'and he said to him, ‘Friend, how did you come in here not wearing wedding clothing?’ He was speechless.',
      },
      {
        verse: 13,
        text: 'Then the king said to the servants, ‘Bind him hand and foot, take him away, and throw him into the outer darkness; there is where the weeping and grinding of teeth will be.’',
      },
    ],
    text: 'But when the king came in to see the guests, he saw there a man who didn’t have on wedding clothing, and he said to him, ‘Friend, how did you come in here not wearing wedding clothing?’ He was speechless. Then the king said to the servants, ‘Bind him hand and foot, take him away, and throw him into the outer darkness; there is where the weeping and grinding of teeth will be.’',
  },
  'Matthew 23:37': {
    reference: 'Matthew 23:37',
    book: 'Matthew',
    chapter: 23,
    verses: [
      {
        verse: 37,
        text: '“Jerusalem, Jerusalem, who kills the prophets, and stones those who are sent to her! How often I would have gathered your children together, even as a hen gathers her chicks under her wings, and you would not!',
      },
    ],
    text: '“Jerusalem, Jerusalem, who kills the prophets, and stones those who are sent to her! How often I would have gathered your children together, even as a hen gathers her chicks under her wings, and you would not!',
  },
  'Matthew 25:14-30': {
    reference: 'Matthew 25:14-30',
    book: 'Matthew',
    chapter: 25,
    verses: [
      {
        verse: 14,
        text: '“For it is like a man, going into another country, who called his own servants, and entrusted his goods to them.',
      },
      {
        verse: 15,
        text: 'To one he gave five talents, to another two, to another one; to each according to his own ability. Then he went on his journey.',
      },
      {
        verse: 16,
        text: 'Immediately he who received the five talents went and traded with them, and made another five talents.',
      },
      { verse: 17, text: 'In the same way, he also who got the two gained another two.' },
      {
        verse: 18,
        text: 'But he who received the one went away and dug in the earth, and hid his lord’s money.',
      },
      {
        verse: 19,
        text: '“Now after a long time the lord of those servants came, and reconciled accounts with them.',
      },
      {
        verse: 20,
        text: 'He who received the five talents came and brought another five talents, saying, ‘Lord, you delivered to me five talents. Behold, I have gained another five talents besides them.’',
      },
      {
        verse: 21,
        text: '“His lord said to him, ‘Well done, good and faithful servant. You have been faithful over a few things, I will set you over many things. Enter into the joy of your lord.’',
      },
      {
        verse: 22,
        text: '“He also who got the two talents came and said, ‘Lord, you delivered to me two talents. Behold, I have gained another two talents besides them.’',
      },
      {
        verse: 23,
        text: '“His lord said to him, ‘Well done, good and faithful servant. You have been faithful over a few things, I will set you over many things. Enter into the joy of your lord.’',
      },
      {
        verse: 24,
        text: '“He also who had received the one talent came and said, ‘Lord, I knew you that you are a hard man, reaping where you did not sow, and gathering where you did not scatter.',
      },
      {
        verse: 25,
        text: 'I was afraid, and went away and hid your talent in the earth. Behold, you have what is yours.’',
      },
      {
        verse: 26,
        text: '“But his lord answered him, ‘You wicked and slothful servant. You knew that I reap where I didn’t sow, and gather where I didn’t scatter.',
      },
      {
        verse: 27,
        text: 'You ought therefore to have deposited my money with the bankers, and at my coming I should have received back my own with interest.',
      },
      {
        verse: 28,
        text: 'Take away therefore the talent from him, and give it to him who has the ten talents.',
      },
      {
        verse: 29,
        text: 'For to everyone who has will be given, and he will have abundance, but from him who doesn’t have, even that which he has will be taken away.',
      },
      {
        verse: 30,
        text: 'Throw out the unprofitable servant into the outer darkness, where there will be weeping and gnashing of teeth.’',
      },
    ],
    text: '“For it is like a man, going into another country, who called his own servants, and entrusted his goods to them. To one he gave five talents, to another two, to another one; to each according to his own ability. Then he went on his journey. Immediately he who received the five talents went and traded with them, and made another five talents. In the same way, he also who got the two gained another two. But he who received the one went away and dug in the earth, and hid his lord’s money. “Now after a long time the lord of those servants came, and reconciled accounts with them. He who received the five talents came and brought another five talents, saying, ‘Lord, you delivered to me five talents. Behold, I have gained another five talents besides them.’ “His lord said to him, ‘Well done, good and faithful servant. You have been faithful over a few things, I will set you over many things. Enter into the joy of your lord.’ “He also who got the two talents came and said, ‘Lord, you delivered to me two talents. Behold, I have gained another two talents besides them.’ “His lord said to him, ‘Well done, good and faithful servant. You have been faithful over a few things, I will set you over many things. Enter into the joy of your lord.’ “He also who had received the one talent came and said, ‘Lord, I knew you that you are a hard man, reaping where you did not sow, and gathering where you did not scatter. I was afraid, and went away and hid your talent in the earth. Behold, you have what is yours.’ “But his lord answered him, ‘You wicked and slothful servant. You knew that I reap where I didn’t sow, and gather where I didn’t scatter. You ought therefore to have deposited my money with the bankers, and at my coming I should have received back my own with interest. Take away therefore the talent from him, and give it to him who has the ten talents. For to everyone who has will be given, and he will have abundance, but from him who doesn’t have, even that which he has will be taken away. Throw out the unprofitable servant into the outer darkness, where there will be weeping and gnashing of teeth.’',
  },
  'Matthew 25:31-46': {
    reference: 'Matthew 25:31-46',
    book: 'Matthew',
    chapter: 25,
    verses: [
      {
        verse: 31,
        text: '“But when the Son of Man comes in his glory, and all the holy angels with him, then he will sit on the throne of his glory.',
      },
      {
        verse: 32,
        text: 'Before him all the nations will be gathered, and he will separate them one from another, as a shepherd separates the sheep from the goats.',
      },
      { verse: 33, text: 'He will set the sheep on his right hand, but the goats on the left.' },
      {
        verse: 34,
        text: 'Then the King will tell those on his right hand, ‘Come, blessed of my Father, inherit the Kingdom prepared for you from the foundation of the world;',
      },
      {
        verse: 35,
        text: 'for I was hungry, and you gave me food to eat. I was thirsty, and you gave me drink. I was a stranger, and you took me in.',
      },
      {
        verse: 36,
        text: 'I was naked, and you clothed me. I was sick, and you visited me. I was in prison, and you came to me.’',
      },
      {
        verse: 37,
        text: '“Then the righteous will answer him, saying, ‘Lord, when did we see you hungry, and feed you; or thirsty, and give you a drink?',
      },
      {
        verse: 38,
        text: 'When did we see you as a stranger, and take you in; or naked, and clothe you?',
      },
      { verse: 39, text: 'When did we see you sick, or in prison, and come to you?’' },
      {
        verse: 40,
        text: '“The King will answer them, ‘Most certainly I tell you, because you did it to one of the least of these my brothers, you did it to me.’',
      },
      {
        verse: 41,
        text: 'Then he will say also to those on the left hand, ‘Depart from me, you cursed, into the eternal fire which is prepared for the devil and his angels;',
      },
      {
        verse: 42,
        text: 'for I was hungry, and you didn’t give me food to eat; I was thirsty, and you gave me no drink;',
      },
      {
        verse: 43,
        text: 'I was a stranger, and you didn’t take me in; naked, and you didn’t clothe me; sick, and in prison, and you didn’t visit me.’',
      },
      {
        verse: 44,
        text: '“Then they will also answer, saying, ‘Lord, when did we see you hungry, or thirsty, or a stranger, or naked, or sick, or in prison, and didn’t help you?’',
      },
      {
        verse: 45,
        text: '“Then he will answer them, saying, ‘Most certainly I tell you, because you didn’t do it to one of the least of these, you didn’t do it to me.’',
      },
      {
        verse: 46,
        text: 'These will go away into eternal punishment, but the righteous into eternal life.”',
      },
    ],
    text: '“But when the Son of Man comes in his glory, and all the holy angels with him, then he will sit on the throne of his glory. Before him all the nations will be gathered, and he will separate them one from another, as a shepherd separates the sheep from the goats. He will set the sheep on his right hand, but the goats on the left. Then the King will tell those on his right hand, ‘Come, blessed of my Father, inherit the Kingdom prepared for you from the foundation of the world; for I was hungry, and you gave me food to eat. I was thirsty, and you gave me drink. I was a stranger, and you took me in. I was naked, and you clothed me. I was sick, and you visited me. I was in prison, and you came to me.’ “Then the righteous will answer him, saying, ‘Lord, when did we see you hungry, and feed you; or thirsty, and give you a drink? When did we see you as a stranger, and take you in; or naked, and clothe you? When did we see you sick, or in prison, and come to you?’ “The King will answer them, ‘Most certainly I tell you, because you did it to one of the least of these my brothers, you did it to me.’ Then he will say also to those on the left hand, ‘Depart from me, you cursed, into the eternal fire which is prepared for the devil and his angels; for I was hungry, and you didn’t give me food to eat; I was thirsty, and you gave me no drink; I was a stranger, and you didn’t take me in; naked, and you didn’t clothe me; sick, and in prison, and you didn’t visit me.’ “Then they will also answer, saying, ‘Lord, when did we see you hungry, or thirsty, or a stranger, or naked, or sick, or in prison, and didn’t help you?’ “Then he will answer them, saying, ‘Most certainly I tell you, because you didn’t do it to one of the least of these, you didn’t do it to me.’ These will go away into eternal punishment, but the righteous into eternal life.”',
  },
  'Matthew 25:41': {
    reference: 'Matthew 25:41',
    book: 'Matthew',
    chapter: 25,
    verses: [
      {
        verse: 41,
        text: 'Then he will say also to those on the left hand, ‘Depart from me, you cursed, into the eternal fire which is prepared for the devil and his angels;',
      },
    ],
    text: 'Then he will say also to those on the left hand, ‘Depart from me, you cursed, into the eternal fire which is prepared for the devil and his angels;',
  },
  'Matthew 25:46': {
    reference: 'Matthew 25:46',
    book: 'Matthew',
    chapter: 25,
    verses: [
      {
        verse: 46,
        text: 'These will go away into eternal punishment, but the righteous into eternal life.”',
      },
    ],
    text: 'These will go away into eternal punishment, but the righteous into eternal life.”',
  },
  'Matthew 26:24': {
    reference: 'Matthew 26:24',
    book: 'Matthew',
    chapter: 26,
    verses: [
      {
        verse: 24,
        text: 'The Son of Man goes, even as it is written of him, but woe to that man through whom the Son of Man is betrayed! It would be better for that man if he had not been born.”',
      },
    ],
    text: 'The Son of Man goes, even as it is written of him, but woe to that man through whom the Son of Man is betrayed! It would be better for that man if he had not been born.”',
  },
  'Matthew 26:39': {
    reference: 'Matthew 26:39',
    book: 'Matthew',
    chapter: 26,
    verses: [
      {
        verse: 39,
        text: 'He went forward a little, fell on his face, and prayed, saying, “My Father, if it is possible, let this cup pass away from me; nevertheless, not what I desire, but what you desire.”',
      },
    ],
    text: 'He went forward a little, fell on his face, and prayed, saying, “My Father, if it is possible, let this cup pass away from me; nevertheless, not what I desire, but what you desire.”',
  },
  'Matthew 27:46': {
    reference: 'Matthew 27:46',
    book: 'Matthew',
    chapter: 27,
    verses: [
      {
        verse: 46,
        text: 'About the ninth hour Jesus cried with a loud voice, saying, “Eli, Eli, limasabachthani?” That is, “My God, my God, why have you forsaken me?”',
      },
    ],
    text: 'About the ninth hour Jesus cried with a loud voice, saying, “Eli, Eli, limasabachthani?” That is, “My God, my God, why have you forsaken me?”',
  },
  'Matthew 2:18': {
    reference: 'Matthew 2:18',
    book: 'Matthew',
    chapter: 2,
    verses: [
      {
        verse: 18,
        text: '“A voice was heard in Ramah, lamentation, weeping and great mourning, Rachel weeping for her children; she wouldn’t be comforted, because they are no more.”',
      },
    ],
    text: '“A voice was heard in Ramah, lamentation, weeping and great mourning, Rachel weeping for her children; she wouldn’t be comforted, because they are no more.”',
  },
  'Matthew 3:17': {
    reference: 'Matthew 3:17',
    book: 'Matthew',
    chapter: 3,
    verses: [
      {
        verse: 17,
        text: 'Behold, a voice out of the heavens said, “This is my beloved Son, with whom I am well pleased.”',
      },
    ],
    text: 'Behold, a voice out of the heavens said, “This is my beloved Son, with whom I am well pleased.”',
  },
  'Matthew 4:17': {
    reference: 'Matthew 4:17',
    book: 'Matthew',
    chapter: 4,
    verses: [
      {
        verse: 17,
        text: 'From that time, Jesus began to preach, and to say, “Repent! For the Kingdom of Heaven is at hand.”',
      },
    ],
    text: 'From that time, Jesus began to preach, and to say, “Repent! For the Kingdom of Heaven is at hand.”',
  },
  'Matthew 7:13-14': {
    reference: 'Matthew 7:13-14',
    book: 'Matthew',
    chapter: 7,
    verses: [
      {
        verse: 13,
        text: '“Enter in by the narrow gate; for wide is the gate and broad is the way that leads to destruction, and many are those who enter in by it.',
      },
      {
        verse: 14,
        text: 'Hownarrow is the gate, and restricted is the way that leads to life! Few are those who find it.',
      },
    ],
    text: '“Enter in by the narrow gate; for wide is the gate and broad is the way that leads to destruction, and many are those who enter in by it. Hownarrow is the gate, and restricted is the way that leads to life! Few are those who find it.',
  },
  'Matthew 8:12': {
    reference: 'Matthew 8:12',
    book: 'Matthew',
    chapter: 8,
    verses: [
      {
        verse: 12,
        text: 'but the children of the Kingdom will be thrown out into the outer darkness. There will be weeping and gnashing of teeth.”',
      },
    ],
    text: 'but the children of the Kingdom will be thrown out into the outer darkness. There will be weeping and gnashing of teeth.”',
  },
  'Nahum 1:6': {
    reference: 'Nahum 1:6',
    book: 'Nahum',
    chapter: 1,
    verses: [
      {
        verse: 6,
        text: 'Who can stand before his indignation? Who can endure the fierceness of his anger? His wrath is poured out like fire, and the rocks are broken apart by him.',
      },
    ],
    text: 'Who can stand before his indignation? Who can endure the fierceness of his anger? His wrath is poured out like fire, and the rocks are broken apart by him.',
  },
  'Nahum 1:6-10': {
    reference: 'Nahum 1:6-10',
    book: 'Nahum',
    chapter: 1,
    verses: [
      {
        verse: 6,
        text: 'Who can stand before his indignation? Who can endure the fierceness of his anger? His wrath is poured out like fire, and the rocks are broken apart by him.',
      },
      {
        verse: 7,
        text: 'Yahweh is good, a stronghold in the day of trouble; and he knows those who take refuge in him.',
      },
      {
        verse: 8,
        text: 'But with an overflowing flood, he will make a full end of her place, and will pursue his enemies into darkness.',
      },
      {
        verse: 9,
        text: 'What do you plot against Yahweh? He will make a full end. Affliction won’t rise up the second time.',
      },
      {
        verse: 10,
        text: 'For entangled like thorns, and drunken as with their drink, they are consumed utterly like dry stubble.',
      },
    ],
    text: 'Who can stand before his indignation? Who can endure the fierceness of his anger? His wrath is poured out like fire, and the rocks are broken apart by him. Yahweh is good, a stronghold in the day of trouble; and he knows those who take refuge in him. But with an overflowing flood, he will make a full end of her place, and will pursue his enemies into darkness. What do you plot against Yahweh? He will make a full end. Affliction won’t rise up the second time. For entangled like thorns, and drunken as with their drink, they are consumed utterly like dry stubble.',
  },
  'Numbers 16:35': {
    reference: 'Numbers 16:35',
    book: 'Numbers',
    chapter: 16,
    verses: [
      {
        verse: 35,
        text: 'Fire came out from Yahweh, and devoured the two hundred fifty men who offered the incense.',
      },
    ],
    text: 'Fire came out from Yahweh, and devoured the two hundred fifty men who offered the incense.',
  },
  'Obadiah 1:15-18': {
    reference: 'Obadiah 1:15-18',
    book: 'Obadiah',
    chapter: 1,
    verses: [
      {
        verse: 15,
        text: 'For the day of Yahweh is near all the nations! As you have done, it will be done to you. Your deeds will return upon your own head.',
      },
      {
        verse: 16,
        text: 'For as you have drunk on my holy mountain, so will all the nations drink continually. Yes, they will drink, swallow down, and will be as though they had not been.',
      },
      {
        verse: 17,
        text: 'But in Mount Zion, there will be those who escape, and it will be holy. The house of Jacob will possess their possessions.',
      },
      {
        verse: 18,
        text: 'The house of Jacob will be a fire, the house of Joseph a flame, and the house of Esau for stubble. They will burn among them, and devour them. There will not be any remaining to the house of Esau.” Indeed, Yahweh has spoken.',
      },
    ],
    text: 'For the day of Yahweh is near all the nations! As you have done, it will be done to you. Your deeds will return upon your own head. For as you have drunk on my holy mountain, so will all the nations drink continually. Yes, they will drink, swallow down, and will be as though they had not been. But in Mount Zion, there will be those who escape, and it will be holy. The house of Jacob will possess their possessions. The house of Jacob will be a fire, the house of Joseph a flame, and the house of Esau for stubble. They will burn among them, and devour them. There will not be any remaining to the house of Esau.” Indeed, Yahweh has spoken.',
  },
  'Philippians 1:28': {
    reference: 'Philippians 1:28',
    book: 'Philippians',
    chapter: 1,
    verses: [
      {
        verse: 28,
        text: 'and in nothing frightened by the adversaries, which is for them a proof of destruction, but to you of salvation, and that from God.',
      },
    ],
    text: 'and in nothing frightened by the adversaries, which is for them a proof of destruction, but to you of salvation, and that from God.',
  },
  'Philippians 2:10-11': {
    reference: 'Philippians 2:10-11',
    book: 'Philippians',
    chapter: 2,
    verses: [
      {
        verse: 10,
        text: 'that at the name of Jesus every knee should bow, of those in heaven, those on earth, and those under the earth,',
      },
      {
        verse: 11,
        text: 'and that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.',
      },
    ],
    text: 'that at the name of Jesus every knee should bow, of those in heaven, those on earth, and those under the earth, and that every tongue should confess that Jesus Christ is Lord, to the glory of God the Father.',
  },
  'Philippians 3:18-19': {
    reference: 'Philippians 3:18-19',
    book: 'Philippians',
    chapter: 3,
    verses: [
      {
        verse: 18,
        text: 'For many walk, of whom I told you often, and now tell you even weeping, as the enemies of the cross of Christ,',
      },
      {
        verse: 19,
        text: 'whose end is destruction, whose god is the belly, and whose glory is in their shame, who think about earthly things.',
      },
    ],
    text: 'For many walk, of whom I told you often, and now tell you even weeping, as the enemies of the cross of Christ, whose end is destruction, whose god is the belly, and whose glory is in their shame, who think about earthly things.',
  },
  'Proverbs 14:12': {
    reference: 'Proverbs 14:12',
    book: 'Proverbs',
    chapter: 14,
    verses: [
      {
        verse: 12,
        text: 'There is a way which seems right to a man, but in the end it leads to death.',
      },
    ],
    text: 'There is a way which seems right to a man, but in the end it leads to death.',
  },
  'Psalms 112:10': {
    reference: 'Psalms 112:10',
    book: 'Psalms',
    chapter: 112,
    verses: [
      {
        verse: 10,
        text: 'The wicked will see it, and be grieved. He shall gnash with his teeth, and melt away. The desire of the wicked will perish.',
      },
    ],
    text: 'The wicked will see it, and be grieved. He shall gnash with his teeth, and melt away. The desire of the wicked will perish.',
  },
  'Psalms 144:4': {
    reference: 'Psalms 144:4',
    book: 'Psalms',
    chapter: 144,
    verses: [
      { verse: 4, text: 'Man is like a breath. His days are like a shadow that passes away.' },
    ],
    text: 'Man is like a breath. His days are like a shadow that passes away.',
  },
  'Psalms 145:20': {
    reference: 'Psalms 145:20',
    book: 'Psalms',
    chapter: 145,
    verses: [
      {
        verse: 20,
        text: 'Yahweh preserves all those who love him, but all the wicked he will destroy.',
      },
    ],
    text: 'Yahweh preserves all those who love him, but all the wicked he will destroy.',
  },
  'Psalms 34:16': {
    reference: 'Psalms 34:16',
    book: 'Psalms',
    chapter: 34,
    verses: [
      {
        verse: 16,
        text: 'Yahweh’s face is against those who do evil, to cut off their memory from the earth.',
      },
    ],
    text: 'Yahweh’s face is against those who do evil, to cut off their memory from the earth.',
  },
  'Psalms 34:21': {
    reference: 'Psalms 34:21',
    book: 'Psalms',
    chapter: 34,
    verses: [
      {
        verse: 21,
        text: 'Evil shall kill the wicked. Those who hate the righteous shall be condemned.',
      },
    ],
    text: 'Evil shall kill the wicked. Those who hate the righteous shall be condemned.',
  },
  'Psalms 35:16': {
    reference: 'Psalms 35:16',
    book: 'Psalms',
    chapter: 35,
    verses: [
      { verse: 16, text: 'Like the profane mockers in feasts, they gnashed their teeth at me.' },
    ],
    text: 'Like the profane mockers in feasts, they gnashed their teeth at me.',
  },
  'Psalms 37:20': {
    reference: 'Psalms 37:20',
    book: 'Psalms',
    chapter: 37,
    verses: [
      {
        verse: 20,
        text: 'But the wicked shall perish. The enemies of Yahweh shall be like the beauty of the fields. They will vanish— vanish like smoke.',
      },
    ],
    text: 'But the wicked shall perish. The enemies of Yahweh shall be like the beauty of the fields. They will vanish— vanish like smoke.',
  },
  'Psalms 37:38': {
    reference: 'Psalms 37:38',
    book: 'Psalms',
    chapter: 37,
    verses: [
      {
        verse: 38,
        text: 'As for transgressors, they shall be destroyed together. The future of the wicked shall be cut off.',
      },
    ],
    text: 'As for transgressors, they shall be destroyed together. The future of the wicked shall be cut off.',
  },
  'Psalms 59:13': {
    reference: 'Psalms 59:13',
    book: 'Psalms',
    chapter: 59,
    verses: [
      {
        verse: 13,
        text: 'Consume them in wrath. Consume them, and they will be no more. Let them know that God rules in Jacob, to the ends of the earth. Selah.',
      },
    ],
    text: 'Consume them in wrath. Consume them, and they will be no more. Let them know that God rules in Jacob, to the ends of the earth. Selah.',
  },
  'Revelation 14:9-11': {
    reference: 'Revelation 14:9-11',
    book: 'Revelation',
    chapter: 14,
    verses: [
      {
        verse: 9,
        text: 'Another angel, a third, followed them, saying with a great voice, “If anyone worships the beast and his image, and receives a mark on his forehead, or on his hand,',
      },
      {
        verse: 10,
        text: 'he also will drink of the wine of the wrath of God, which is prepared unmixed in the cup of his anger. He will be tormented with fire and sulfur in the presence of the holy angels, and in the presence of the Lamb.',
      },
      {
        verse: 11,
        text: 'The smoke of their torment goes up forever and ever. They have no rest day and night, those who worship the beast and his image, and whoever receives the mark of his name.',
      },
    ],
    text: 'Another angel, a third, followed them, saying with a great voice, “If anyone worships the beast and his image, and receives a mark on his forehead, or on his hand, he also will drink of the wine of the wrath of God, which is prepared unmixed in the cup of his anger. He will be tormented with fire and sulfur in the presence of the holy angels, and in the presence of the Lamb. The smoke of their torment goes up forever and ever. They have no rest day and night, those who worship the beast and his image, and whoever receives the mark of his name.',
  },
  'Revelation 18:21': {
    reference: 'Revelation 18:21',
    book: 'Revelation',
    chapter: 18,
    verses: [
      {
        verse: 21,
        text: 'A mighty angel took up a stone like a great millstone and cast it into the sea, saying, “Thus with violence will Babylon, the great city, be thrown down, and will be found no more at all.',
      },
    ],
    text: 'A mighty angel took up a stone like a great millstone and cast it into the sea, saying, “Thus with violence will Babylon, the great city, be thrown down, and will be found no more at all.',
  },
  'Revelation 19:3': {
    reference: 'Revelation 19:3',
    book: 'Revelation',
    chapter: 19,
    verses: [
      { verse: 3, text: 'A second said, “Hallelujah! Her smoke goes up forever and ever.”' },
    ],
    text: 'A second said, “Hallelujah! Her smoke goes up forever and ever.”',
  },
  'Revelation 20:10': {
    reference: 'Revelation 20:10',
    book: 'Revelation',
    chapter: 20,
    verses: [
      {
        verse: 10,
        text: 'The devil who deceived them was thrown into the lake of fire and sulfur, where the beast and the false prophet are also. They will be tormented day and night forever and ever.',
      },
    ],
    text: 'The devil who deceived them was thrown into the lake of fire and sulfur, where the beast and the false prophet are also. They will be tormented day and night forever and ever.',
  },
  'Revelation 20:10-15': {
    reference: 'Revelation 20:10-15',
    book: 'Revelation',
    chapter: 20,
    verses: [
      {
        verse: 10,
        text: 'The devil who deceived them was thrown into the lake of fire and sulfur, where the beast and the false prophet are also. They will be tormented day and night forever and ever.',
      },
      {
        verse: 11,
        text: 'I saw a great white throne, and him who sat on it, from whose face the earth and the heaven fled away. There was found no place for them.',
      },
      {
        verse: 12,
        text: 'I saw the dead, the great and the small, standing before the throne, and they opened books. Another book was opened, which is the book of life. The dead were judged out of the things which were written in the books, according to their works.',
      },
      {
        verse: 13,
        text: 'The sea gave up the dead who were in it. Death and Hades gave up the dead who were in them. They were judged, each one according to his works.',
      },
      {
        verse: 14,
        text: 'Death and Hades were thrown into the lake of fire. This is the second death, the lake of fire.',
      },
      {
        verse: 15,
        text: 'If anyone was not found written in the book of life, he was cast into the lake of fire.',
      },
    ],
    text: 'The devil who deceived them was thrown into the lake of fire and sulfur, where the beast and the false prophet are also. They will be tormented day and night forever and ever. I saw a great white throne, and him who sat on it, from whose face the earth and the heaven fled away. There was found no place for them. I saw the dead, the great and the small, standing before the throne, and they opened books. Another book was opened, which is the book of life. The dead were judged out of the things which were written in the books, according to their works. The sea gave up the dead who were in it. Death and Hades gave up the dead who were in them. They were judged, each one according to his works. Death and Hades were thrown into the lake of fire. This is the second death, the lake of fire. If anyone was not found written in the book of life, he was cast into the lake of fire.',
  },
  'Revelation 20:13-14': {
    reference: 'Revelation 20:13-14',
    book: 'Revelation',
    chapter: 20,
    verses: [
      {
        verse: 13,
        text: 'The sea gave up the dead who were in it. Death and Hades gave up the dead who were in them. They were judged, each one according to his works.',
      },
      {
        verse: 14,
        text: 'Death and Hades were thrown into the lake of fire. This is the second death, the lake of fire.',
      },
    ],
    text: 'The sea gave up the dead who were in it. Death and Hades gave up the dead who were in them. They were judged, each one according to his works. Death and Hades were thrown into the lake of fire. This is the second death, the lake of fire.',
  },
  'Revelation 20:14': {
    reference: 'Revelation 20:14',
    book: 'Revelation',
    chapter: 20,
    verses: [
      {
        verse: 14,
        text: 'Death and Hades were thrown into the lake of fire. This is the second death, the lake of fire.',
      },
    ],
    text: 'Death and Hades were thrown into the lake of fire. This is the second death, the lake of fire.',
  },
  'Revelation 21:1-4': {
    reference: 'Revelation 21:1-4',
    book: 'Revelation',
    chapter: 21,
    verses: [
      {
        verse: 1,
        text: 'I saw a new heaven and a new earth: for the first heaven and the first earth have passed away, and the sea is no more.',
      },
      {
        verse: 2,
        text: 'I saw the holy city, New Jerusalem, coming down out of heaven from God, prepared like a bride adorned for her husband.',
      },
      {
        verse: 3,
        text: 'I heard a loud voice out of heaven saying, “Behold, God’s dwelling is with people, and he will dwell with them, and they will be his people, and God himself will be with them as their God.',
      },
      {
        verse: 4,
        text: 'He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.”',
      },
    ],
    text: 'I saw a new heaven and a new earth: for the first heaven and the first earth have passed away, and the sea is no more. I saw the holy city, New Jerusalem, coming down out of heaven from God, prepared like a bride adorned for her husband. I heard a loud voice out of heaven saying, “Behold, God’s dwelling is with people, and he will dwell with them, and they will be his people, and God himself will be with them as their God. He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.”',
  },
  'Revelation 21:1-8': {
    reference: 'Revelation 21:1-8',
    book: 'Revelation',
    chapter: 21,
    verses: [
      {
        verse: 1,
        text: 'I saw a new heaven and a new earth: for the first heaven and the first earth have passed away, and the sea is no more.',
      },
      {
        verse: 2,
        text: 'I saw the holy city, New Jerusalem, coming down out of heaven from God, prepared like a bride adorned for her husband.',
      },
      {
        verse: 3,
        text: 'I heard a loud voice out of heaven saying, “Behold, God’s dwelling is with people, and he will dwell with them, and they will be his people, and God himself will be with them as their God.',
      },
      {
        verse: 4,
        text: 'He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.”',
      },
      {
        verse: 5,
        text: 'He who sits on the throne said, “Behold, I am making all things new.” He said, “Write, for these words of God are faithful and true.”',
      },
      {
        verse: 6,
        text: 'He said to me, “It is done! I am the Alpha and the Omega, the Beginning and the End. I will give freely to him who is thirsty from the spring of the water of life.',
      },
      {
        verse: 7,
        text: 'He who overcomes, I will give him these things. I will be his God, and he will be my son.',
      },
      {
        verse: 8,
        text: 'But for the cowardly, unbelieving, sinners, abominable, murderers, sexually immoral, sorcerers,idolaters, and all liars, their part is in the lake that burns with fire and sulfur, which is the second death.”',
      },
    ],
    text: 'I saw a new heaven and a new earth: for the first heaven and the first earth have passed away, and the sea is no more. I saw the holy city, New Jerusalem, coming down out of heaven from God, prepared like a bride adorned for her husband. I heard a loud voice out of heaven saying, “Behold, God’s dwelling is with people, and he will dwell with them, and they will be his people, and God himself will be with them as their God. He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.” He who sits on the throne said, “Behold, I am making all things new.” He said, “Write, for these words of God are faithful and true.” He said to me, “It is done! I am the Alpha and the Omega, the Beginning and the End. I will give freely to him who is thirsty from the spring of the water of life. He who overcomes, I will give him these things. I will be his God, and he will be my son. But for the cowardly, unbelieving, sinners, abominable, murderers, sexually immoral, sorcerers,idolaters, and all liars, their part is in the lake that burns with fire and sulfur, which is the second death.”',
  },
  'Revelation 21:4': {
    reference: 'Revelation 21:4',
    book: 'Revelation',
    chapter: 21,
    verses: [
      {
        verse: 4,
        text: 'He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.”',
      },
    ],
    text: 'He will wipe away from them every tear from their eyes. Death will be no more; neither will there be mourning, nor crying, nor pain, any more. The first things have passed away.”',
  },
  'Revelation 21:8': {
    reference: 'Revelation 21:8',
    book: 'Revelation',
    chapter: 21,
    verses: [
      {
        verse: 8,
        text: 'But for the cowardly, unbelieving, sinners, abominable, murderers, sexually immoral, sorcerers,idolaters, and all liars, their part is in the lake that burns with fire and sulfur, which is the second death.”',
      },
    ],
    text: 'But for the cowardly, unbelieving, sinners, abominable, murderers, sexually immoral, sorcerers,idolaters, and all liars, their part is in the lake that burns with fire and sulfur, which is the second death.”',
  },
  'Revelation 22:1-5': {
    reference: 'Revelation 22:1-5',
    book: 'Revelation',
    chapter: 22,
    verses: [
      {
        verse: 1,
        text: 'He showed me a river of water of life, clear as crystal, proceeding out of the throne of God and of the Lamb,',
      },
      {
        verse: 2,
        text: 'in the middle of its street. On this side of the river and on that was the tree of life, bearing twelve kinds of fruits, yielding its fruit every month. The leaves of the tree were for the healing of the nations.',
      },
      {
        verse: 3,
        text: 'There will be no curse any more. The throne of God and of the Lamb will be in it, and his servants serve him.',
      },
      { verse: 4, text: 'They will see his face, and his name will be on their foreheads.' },
      {
        verse: 5,
        text: 'There will be no night, and they need no lamp light; for the Lord God will illuminate them. They will reign forever and ever.',
      },
    ],
    text: 'He showed me a river of water of life, clear as crystal, proceeding out of the throne of God and of the Lamb, in the middle of its street. On this side of the river and on that was the tree of life, bearing twelve kinds of fruits, yielding its fruit every month. The leaves of the tree were for the healing of the nations. There will be no curse any more. The throne of God and of the Lamb will be in it, and his servants serve him. They will see his face, and his name will be on their foreheads. There will be no night, and they need no lamp light; for the Lord God will illuminate them. They will reign forever and ever.',
  },
  'Revelation 22:14-15': {
    reference: 'Revelation 22:14-15',
    book: 'Revelation',
    chapter: 22,
    verses: [
      {
        verse: 14,
        text: 'Blessed are those who do his commandments,that they may have the right to the tree of life, and may enter in by the gates into the city.',
      },
      {
        verse: 15,
        text: 'Outside are the dogs, the sorcerers, the sexually immoral, the murderers, the idolaters, and everyone who loves and practices falsehood.',
      },
    ],
    text: 'Blessed are those who do his commandments,that they may have the right to the tree of life, and may enter in by the gates into the city. Outside are the dogs, the sorcerers, the sexually immoral, the murderers, the idolaters, and everyone who loves and practices falsehood.',
  },
  'Revelation 22:2': {
    reference: 'Revelation 22:2',
    book: 'Revelation',
    chapter: 22,
    verses: [
      {
        verse: 2,
        text: 'in the middle of its street. On this side of the river and on that was the tree of life, bearing twelve kinds of fruits, yielding its fruit every month. The leaves of the tree were for the healing of the nations.',
      },
    ],
    text: 'in the middle of its street. On this side of the river and on that was the tree of life, bearing twelve kinds of fruits, yielding its fruit every month. The leaves of the tree were for the healing of the nations.',
  },
  'Revelation 2:7': {
    reference: 'Revelation 2:7',
    book: 'Revelation',
    chapter: 2,
    verses: [
      {
        verse: 7,
        text: 'He who has an ear, let him hear what the Spirit says to the assemblies. To him who overcomes I will give to eat of the tree of life, which is in the Paradise of my God.',
      },
    ],
    text: 'He who has an ear, let him hear what the Spirit says to the assemblies. To him who overcomes I will give to eat of the tree of life, which is in the Paradise of my God.',
  },
  'Revelation 4:8': {
    reference: 'Revelation 4:8',
    book: 'Revelation',
    chapter: 4,
    verses: [
      {
        verse: 8,
        text: 'The four living creatures, each one of them having six wings, are full of eyes around and within. They have no rest day and night, saying, “Holy, holy, holy is the Lord God, the Almighty, who was and who is and who is to come!”',
      },
    ],
    text: 'The four living creatures, each one of them having six wings, are full of eyes around and within. They have no rest day and night, saying, “Holy, holy, holy is the Lord God, the Almighty, who was and who is and who is to come!”',
  },
  'Romans 11:32': {
    reference: 'Romans 11:32',
    book: 'Romans',
    chapter: 11,
    verses: [
      {
        verse: 32,
        text: 'For God has shut up all to disobedience, that he might have mercy on all.',
      },
    ],
    text: 'For God has shut up all to disobedience, that he might have mercy on all.',
  },
  'Romans 14:10-11': {
    reference: 'Romans 14:10-11',
    book: 'Romans',
    chapter: 14,
    verses: [
      {
        verse: 10,
        text: 'But you, why do you judge your brother? Or you again, why do you despise your brother? For we will all stand before the judgment seat of Christ.',
      },
      {
        verse: 11,
        text: 'For it is written, “‘As I live,’ says the Lord, ‘to me every knee will bow. Every tongue will confess to God.’”',
      },
    ],
    text: 'But you, why do you judge your brother? Or you again, why do you despise your brother? For we will all stand before the judgment seat of Christ. For it is written, “‘As I live,’ says the Lord, ‘to me every knee will bow. Every tongue will confess to God.’”',
  },
  'Romans 2:12': {
    reference: 'Romans 2:12',
    book: 'Romans',
    chapter: 2,
    verses: [
      {
        verse: 12,
        text: 'For as many as have sinned without law will also perish without the law. As many as have sinned under the law will be judged by the law.',
      },
    ],
    text: 'For as many as have sinned without law will also perish without the law. As many as have sinned under the law will be judged by the law.',
  },
  'Romans 2:5': {
    reference: 'Romans 2:5',
    book: 'Romans',
    chapter: 2,
    verses: [
      {
        verse: 5,
        text: 'But according to your hardness and unrepentant heart you are treasuring up for yourself wrath in the day of wrath, revelation, and of the righteous judgment of God;',
      },
    ],
    text: 'But according to your hardness and unrepentant heart you are treasuring up for yourself wrath in the day of wrath, revelation, and of the righteous judgment of God;',
  },
  'Romans 2:6': {
    reference: 'Romans 2:6',
    book: 'Romans',
    chapter: 2,
    verses: [{ verse: 6, text: 'who “will pay back to everyone according to their works:”' }],
    text: 'who “will pay back to everyone according to their works:”',
  },
  'Romans 2:7': {
    reference: 'Romans 2:7',
    book: 'Romans',
    chapter: 2,
    verses: [
      {
        verse: 7,
        text: 'to those who by patience in well-doing seek for glory, honor, and incorruptibility, eternal life;',
      },
    ],
    text: 'to those who by patience in well-doing seek for glory, honor, and incorruptibility, eternal life;',
  },
  'Romans 2:8': {
    reference: 'Romans 2:8',
    book: 'Romans',
    chapter: 2,
    verses: [
      {
        verse: 8,
        text: 'but to those who are self-seeking, and don’t obey the truth, but obey unrighteousness, will be wrath and indignation,',
      },
    ],
    text: 'but to those who are self-seeking, and don’t obey the truth, but obey unrighteousness, will be wrath and indignation,',
  },
  'Romans 3:23': {
    reference: 'Romans 3:23',
    book: 'Romans',
    chapter: 3,
    verses: [{ verse: 23, text: 'for all have sinned, and fall short of the glory of God;' }],
    text: 'for all have sinned, and fall short of the glory of God;',
  },
  'Romans 3:25': {
    reference: 'Romans 3:25',
    book: 'Romans',
    chapter: 3,
    verses: [
      {
        verse: 25,
        text: 'whom God sent to be an atoning sacrifice, through faith in his blood, for a demonstration of his righteousness through the passing over of prior sins, in God’s forbearance;',
      },
    ],
    text: 'whom God sent to be an atoning sacrifice, through faith in his blood, for a demonstration of his righteousness through the passing over of prior sins, in God’s forbearance;',
  },
  'Romans 5:12-21': {
    reference: 'Romans 5:12-21',
    book: 'Romans',
    chapter: 5,
    verses: [
      {
        verse: 12,
        text: 'Therefore as sin entered into the world through one man, and death through sin; and so death passed to all men, because all sinned.',
      },
      {
        verse: 13,
        text: 'For until the law, sin was in the world; but sin is not charged when there is no law.',
      },
      {
        verse: 14,
        text: 'Nevertheless death reigned from Adam until Moses, even over those whose sins weren’t like Adam’s disobedience, who is a foreshadowing of him who was to come.',
      },
      {
        verse: 15,
        text: 'But the free gift isn’t like the trespass. For if by the trespass of the one the many died, much more did the grace of God, and the gift by the grace of the one man, Jesus Christ, abound to the many.',
      },
      {
        verse: 16,
        text: 'The gift is not as through one who sinned: for the judgment came by one to condemnation, but the free gift came of many trespasses to justification.',
      },
      {
        verse: 17,
        text: 'For if by the trespass of the one, death reigned through the one; so much more will those who receive the abundance of grace and of the gift of righteousness reign in life through the one, Jesus Christ.',
      },
      {
        verse: 18,
        text: 'So then as through one trespass, all men were condemned; even so through one act of righteousness, all men were justified to life.',
      },
      {
        verse: 19,
        text: 'For as through the one man’s disobedience many were made sinners, even so through the obedience of the one, many will be made righteous.',
      },
      {
        verse: 20,
        text: 'The law came in besides, that the trespass might abound; but where sin abounded, grace abounded more exceedingly;',
      },
      {
        verse: 21,
        text: 'that as sin reigned in death, even so grace might reign through righteousness to eternal life through Jesus Christ our Lord.',
      },
    ],
    text: 'Therefore as sin entered into the world through one man, and death through sin; and so death passed to all men, because all sinned. For until the law, sin was in the world; but sin is not charged when there is no law. Nevertheless death reigned from Adam until Moses, even over those whose sins weren’t like Adam’s disobedience, who is a foreshadowing of him who was to come. But the free gift isn’t like the trespass. For if by the trespass of the one the many died, much more did the grace of God, and the gift by the grace of the one man, Jesus Christ, abound to the many. The gift is not as through one who sinned: for the judgment came by one to condemnation, but the free gift came of many trespasses to justification. For if by the trespass of the one, death reigned through the one; so much more will those who receive the abundance of grace and of the gift of righteousness reign in life through the one, Jesus Christ. So then as through one trespass, all men were condemned; even so through one act of righteousness, all men were justified to life. For as through the one man’s disobedience many were made sinners, even so through the obedience of the one, many will be made righteous. The law came in besides, that the trespass might abound; but where sin abounded, grace abounded more exceedingly; that as sin reigned in death, even so grace might reign through righteousness to eternal life through Jesus Christ our Lord.',
  },
  'Romans 5:13': {
    reference: 'Romans 5:13',
    book: 'Romans',
    chapter: 5,
    verses: [
      {
        verse: 13,
        text: 'For until the law, sin was in the world; but sin is not charged when there is no law.',
      },
    ],
    text: 'For until the law, sin was in the world; but sin is not charged when there is no law.',
  },
  'Romans 5:15-18': {
    reference: 'Romans 5:15-18',
    book: 'Romans',
    chapter: 5,
    verses: [
      {
        verse: 15,
        text: 'But the free gift isn’t like the trespass. For if by the trespass of the one the many died, much more did the grace of God, and the gift by the grace of the one man, Jesus Christ, abound to the many.',
      },
      {
        verse: 16,
        text: 'The gift is not as through one who sinned: for the judgment came by one to condemnation, but the free gift came of many trespasses to justification.',
      },
      {
        verse: 17,
        text: 'For if by the trespass of the one, death reigned through the one; so much more will those who receive the abundance of grace and of the gift of righteousness reign in life through the one, Jesus Christ.',
      },
      {
        verse: 18,
        text: 'So then as through one trespass, all men were condemned; even so through one act of righteousness, all men were justified to life.',
      },
    ],
    text: 'But the free gift isn’t like the trespass. For if by the trespass of the one the many died, much more did the grace of God, and the gift by the grace of the one man, Jesus Christ, abound to the many. The gift is not as through one who sinned: for the judgment came by one to condemnation, but the free gift came of many trespasses to justification. For if by the trespass of the one, death reigned through the one; so much more will those who receive the abundance of grace and of the gift of righteousness reign in life through the one, Jesus Christ. So then as through one trespass, all men were condemned; even so through one act of righteousness, all men were justified to life.',
  },
  'Romans 5:18': {
    reference: 'Romans 5:18',
    book: 'Romans',
    chapter: 5,
    verses: [
      {
        verse: 18,
        text: 'So then as through one trespass, all men were condemned; even so through one act of righteousness, all men were justified to life.',
      },
    ],
    text: 'So then as through one trespass, all men were condemned; even so through one act of righteousness, all men were justified to life.',
  },
  'Romans 5:8': {
    reference: 'Romans 5:8',
    book: 'Romans',
    chapter: 5,
    verses: [
      {
        verse: 8,
        text: 'But God commends his own love toward us, in that while we were yet sinners, Christ died for us.',
      },
    ],
    text: 'But God commends his own love toward us, in that while we were yet sinners, Christ died for us.',
  },
  'Romans 6:23': {
    reference: 'Romans 6:23',
    book: 'Romans',
    chapter: 6,
    verses: [
      {
        verse: 23,
        text: 'For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.',
      },
    ],
    text: 'For the wages of sin is death, but the free gift of God is eternal life in Christ Jesus our Lord.',
  },
  'Romans 9:22': {
    reference: 'Romans 9:22',
    book: 'Romans',
    chapter: 9,
    verses: [
      {
        verse: 22,
        text: 'What if God, willing to show his wrath, and to make his power known, endured with much patience vessels of wrath made for destruction,',
      },
    ],
    text: 'What if God, willing to show his wrath, and to make his power known, endured with much patience vessels of wrath made for destruction,',
  },
  'Zephaniah 1:15-18': {
    reference: 'Zephaniah 1:15-18',
    book: 'Zephaniah',
    chapter: 1,
    verses: [
      {
        verse: 15,
        text: 'That day is a day of wrath, a day of distress and anguish, a day of trouble and ruin, a day of darkness and gloom, a day of clouds and blackness,',
      },
      {
        verse: 16,
        text: 'a day of the trumpet and alarm, against the fortified cities, and against the high battlements.',
      },
      {
        verse: 17,
        text: 'I will bring distress on men, that they will walk like blind men, because they have sinned against Yahweh, and their blood will be poured out like dust, and their flesh like dung.',
      },
      {
        verse: 18,
        text: 'Neither their silver nor their gold will be able to deliver them in the day of Yahweh’s wrath, but the whole land will be devoured by the fire of his jealousy; for he will make an end, yes, a terrible end, of all those who dwell in the land.',
      },
    ],
    text: 'That day is a day of wrath, a day of distress and anguish, a day of trouble and ruin, a day of darkness and gloom, a day of clouds and blackness, a day of the trumpet and alarm, against the fortified cities, and against the high battlements. I will bring distress on men, that they will walk like blind men, because they have sinned against Yahweh, and their blood will be poured out like dust, and their flesh like dung. Neither their silver nor their gold will be able to deliver them in the day of Yahweh’s wrath, but the whole land will be devoured by the fire of his jealousy; for he will make an end, yes, a terrible end, of all those who dwell in the land.',
  },
}

/**
 * Look up a passage by its normalised reference.
 *
 * `PASSAGES` is an object literal, so a bare index reaches its prototype:
 * `getScripture('constructor')` returned `Object` itself, and `hasScripture`
 * agreed that it existed. `requireScripture` therefore did not throw for it
 * either, and `<Scripture reference="constructor">` would have rendered a
 * passage with no reference and no text — quietly defeating the one guarantee
 * this module exists to make. Every lookup goes through an own-property check.
 */
function ownPassage(reference: string): ScripturePassage | undefined {
  const key = reference.trim()
  return Object.hasOwn(PASSAGES, key) ? PASSAGES[key] : undefined
}

export function getScripture(reference: string): ScripturePassage | undefined {
  return ownPassage(reference)
}

/**
 * Look up a passage, failing loudly when it is absent.
 *
 * Called from the `<Scripture>` component, so a reference an author has typed
 * incorrectly fails the build with an actionable message rather than silently
 * rendering nothing.
 */
export function requireScripture(reference: string): ScripturePassage {
  const passage = ownPassage(reference)
  if (!passage) {
    throw new Error(
      `No verified Scripture text for "${reference}". Add it to ` +
        'scripts/conditional-immortality/fetch-scripture.ts and re-run that script. ' +
        'Never hand-write Scripture text.',
    )
  }
  return passage
}

export function hasScripture(reference: string): boolean {
  return ownPassage(reference) !== undefined
}

export const scriptureReferences: readonly string[] = Object.keys(PASSAGES)

/** A complete quotation record, including translation and rights metadata. */
export function scriptureQuotation(reference: string): ScriptureQuotation {
  const passage = requireScripture(reference)
  return {
    reference: passage.reference,
    translation: WEB_TRANSLATION,
    licenseId: WEB_LICENSE_ID,
    text: passage.text,
    sourceUrl: 'https://worldenglish.bible/',
    verifiedAt: WEB_VERIFIED_AT,
  }
}
