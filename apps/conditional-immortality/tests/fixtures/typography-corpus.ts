/**
 * The text the geometry contract is proved against.
 *
 * Two halves, and the distinction between them is the whole point.
 *
 * The approved half is text Pretext is expected to predict exactly: the site's
 * own interface labels, real titles and excerpts pulled from the built search
 * index, and the punctuation this corpus actually contains. A disagreement
 * there is a release blocker.
 *
 * The fallback half is text the production eligibility gate is expected to
 * decline. Those cases assert the decline, not the geometry — pretending
 * Pretext agrees with the browser about a Hebrew line break would be a
 * comfortable lie, and the whole reason the gate exists is that it does not.
 */

export interface ApprovedCase {
  readonly label: string
  readonly text: string
}

export interface FallbackCase {
  readonly label: string
  readonly text: string
  /** The reason `excerptTextEligibility` must give. */
  readonly reason: string
}

const ZERO_WIDTH_SPACE = '​'
const ZERO_WIDTH_JOINER = '‍'
const SOFT_HYPHEN = '­'
const RIGHT_TO_LEFT_OVERRIDE = '‮'
const RIGHT_TO_LEFT_ISOLATE = '⁧'
const POP_DIRECTIONAL_ISOLATE = '⁩'
const VARIATION_SELECTOR_16 = '️'
const NON_BREAKING_SPACE = ' '
/**
 * The three standalone combining marks the self-hosted subsets actually carry:
 * U+0304, U+0308 and U+0329. Every other mark — the combining acute below,
 * for instance — is drawn by a substituted font, which is why the eligibility
 * gate declines it.
 */
const COMBINING_MACRON = '̄'
const COMBINING_DIAERESIS = '̈'
const COMBINING_ACUTE = '́'

/**
 * Interface text with a real line constraint, and the longest strings the
 * constrained components ever have to hold.
 */
export const INTERFACE_CASES: readonly ApprovedCase[] = [
  { label: 'search trigger label', text: 'Search' },
  { label: 'dialog close control', text: 'Close search' },
  { label: 'dialog placeholder', text: 'Search passages, sections, topics, sources' },
  { label: 'full search link', text: 'Full search page' },
  { label: 'result count line', text: 'Showing 12 of 137' },
  { label: 'local search note', text: 'Search runs locally in your browser' },
  { label: 'matched-in line', text: 'Matched in summary, body text' },
  { label: 'matched-in longest', text: 'Matched in Scripture reference, section id or alias' },
  { label: 'result type label', text: 'Case section' },
  { label: 'result type longest', text: 'Video transcript' },
  { label: 'breadcrumb', text: 'Home / Case / Key texts' },
  { label: 'breadcrumb longest', text: 'Home / Case / What the biblical language says' },
  { label: 'empty state', text: 'Type at least two characters.' },
  {
    label: 'privacy note',
    text: 'Searching happens in your browser, so nothing you type is sent anywhere.',
  },
]

/** The permanent identifiers, which must never wrap in their badge. */
export const SECTION_ID_CASES: readonly ApprovedCase[] = [
  { label: 'section id P00', text: 'P00' },
  { label: 'section id S04', text: 'S04' },
  { label: 'section id S34', text: 'S34' },
  { label: 'section id RB2', text: 'RB2' },
  { label: 'section id APP1', text: 'APP1' },
]

/** The six worked examples the empty state offers a reader. */
export const SEARCH_EXAMPLE_CASES: readonly ApprovedCase[] = [
  { label: 'example reference', text: 'Matthew 10:28' },
  { label: 'example phrase', text: 'unquenchable fire' },
  { label: 'example transliteration', text: 'aionios' },
  { label: 'example term', text: 'second death' },
  { label: 'example section id', text: 'S04' },
  { label: 'example name', text: 'Sodom' },
]

/**
 * Real prose shapes from the corpus, and the punctuation it actually uses.
 *
 * Every one of these is ordinary English set in Source Serif 4 and must agree
 * with the browser to the line.
 */
export const PROSE_CASES: readonly ApprovedCase[] = [
  {
    label: 'ordinary sentence',
    text: 'The worm that does not die and the fire that is not quenched work on dead bodies.',
  },
  {
    label: 'two sentences',
    text: 'The punishment is destruction rather than an endlessly continuing act of punishing. That distinction is what the whole section turns on.',
  },
  {
    label: 'curly apostrophe',
    text: 'The soul’s destruction is the point at issue, not the soul’s survival.',
  },
  {
    label: 'curly quotation marks',
    text: '“Eternal punishment” names a result, and the result is the second death.',
  },
  {
    label: 'em dash',
    text: 'The punishment is destruction — not an endless act of punishing — and the difference is the case.',
  },
  {
    label: 'en dash in a reference range',
    text: 'Mark 9:42–48 is the primary passage, and Isaiah 66:24 stands behind it.',
  },
  {
    label: 'mathematical minus sign',
    text: 'A net outcome of −3 on that reckoning, which the appendix works through in full.',
  },
  {
    label: 'nonbreaking space',
    text: `Matthew${NON_BREAKING_SPACE}10:28 is quoted here with a nonbreaking space in the reference.`,
  },
  {
    label: 'repeated whitespace',
    text: 'This  sentence   carries    repeated spaces that white-space normal collapses.',
  },
  {
    label: 'precomposed accented characters',
    text: 'Café, naïve, Zürich, Åland and Señor all render from the self-hosted subsets.',
  },
  {
    label: 'combining accents the subsets carry',
    text: `The macron in a${COMBINING_MACRON}ionios and the diaeresis in nai${COMBINING_DIAERESIS}ve are both self-hosted.`,
  },
  {
    label: 'long theological words',
    text: 'Evangelical conditionalism, annihilationism and traducianism all appear in this corpus.',
  },
  {
    label: 'latin transliterations',
    text: 'The words aionios, apollumi, nephesh, olam and gehenna are transliterated throughout.',
  },
  {
    label: 'scripture reference run',
    text: 'Matthew 10:28 · Luke 12:4-5 · Revelation 20:10-15 · 2 Thessalonians 1:5-10',
  },
  {
    label: 'numerals and percentages',
    text: 'Forty case sections, 18 key passages, 27 topics and roughly 54,000 words of prose.',
  },
  {
    label: 'colon and semicolon',
    text: 'One point stands out: the body dies; the soul dies; and God is the one who ends both.',
  },
  {
    label: 'parenthetical',
    text: 'The adjective (aionios) qualifies the noun it modifies, which is the whole argument.',
  },
  {
    label: 'sentence ending in a quotation',
    text: 'He asked, “Is it really destruction?” and then answered his own question at length.',
  },
  {
    label: 'hyphenated compounds',
    text: 'The body-soul question and the already-not-yet framing are handled in separate sections.',
  },
  {
    label: 'single long word',
    text: 'annihilationism',
  },
  {
    label: 'one short line',
    text: 'The second death.',
  },
  {
    label: 'a single character',
    text: 'A',
  },
  {
    label: 'a long paragraph',
    text: 'Jesus ties the fate of body and soul together and says that God can destroy both in Gehenna. The verb is not a euphemism for continuing existence in misery; it is the ordinary word for ending something. Read that way, the verse is not an embarrassment to the conditionalist case but one of its clearest statements, and the burden falls on the reading that has to soften the verb.',
  },
]

/** Everything the production gate must decline, with the reason it must give. */
export const FALLBACK_CASES: readonly FallbackCase[] = [
  {
    label: 'actual Greek',
    text: 'The adjective αἰώνιος qualifies the noun it modifies.',
    reason: 'uncovered-script',
  },
  {
    label: 'actual Hebrew',
    text: 'The word נפש means a living creature, not an immortal part.',
    reason: 'uncovered-script',
  },
  {
    label: 'Arabic script',
    text: 'The phrase الروح appears in a comparative note.',
    reason: 'uncovered-script',
  },
  {
    label: 'CJK ideographs',
    text: 'A rendering 春天到了 appears in a footnote.',
    reason: 'uncovered-script',
  },
  { label: 'Hiragana', text: 'A rendering ひらがな appears here.', reason: 'uncovered-script' },
  { label: 'Katakana', text: 'A rendering カタカナ appears here.', reason: 'uncovered-script' },
  { label: 'Hangul', text: 'A rendering 한글 appears here.', reason: 'uncovered-script' },
  { label: 'Cyrillic', text: 'A rendering Кириллица appears here.', reason: 'uncovered-script' },
  {
    label: 'astral characters',
    text: 'Mathematical 𝔄𝔟 letters sit outside the Basic Multilingual Plane.',
    reason: 'uncovered-script',
  },
  {
    // The subsets carry U+0304, U+0308 and U+0329 and no other standalone
    // combining mark, so an acute has to come from a substituted font.
    label: 'a combining mark the subsets do not carry',
    text: `The acute in Se${COMBINING_ACUTE}nor is not in the self-hosted subsets.`,
    reason: 'uncovered-script',
  },
  { label: 'emoji', text: 'A rocket 🚀 appears in this line.', reason: 'emoji' },
  {
    label: 'zero-width joiner sequence',
    text: 'A family 👨‍👩‍👧‍👦 appears in this line.',
    reason: 'emoji',
  },
  {
    label: 'variation selector',
    text: `A warning sign ⚠${VARIATION_SELECTOR_16} appears in this line.`,
    reason: 'emoji',
  },
  {
    label: 'zero-width space',
    text: `A zero${ZERO_WIDTH_SPACE}width space hides inside this word.`,
    reason: 'zero-width',
  },
  {
    label: 'bare zero-width joiner',
    text: `A joined${ZERO_WIDTH_JOINER}pair hides inside this word.`,
    reason: 'zero-width',
  },
  {
    label: 'soft hyphen',
    text: `The word anni${SOFT_HYPHEN}hilationism carries a soft hyphen.`,
    reason: 'soft-hyphen',
  },
  {
    label: 'bidirectional override',
    text: `An override ${RIGHT_TO_LEFT_OVERRIDE} sits in this line.`,
    reason: 'bidi-control',
  },
  {
    label: 'right-to-left isolate',
    text: `An isolate ${RIGHT_TO_LEFT_ISOLATE}text${POP_DIRECTIONAL_ISOLATE} sits in this line.`,
    reason: 'bidi-control',
  },
  {
    label: 'hard line break',
    text: 'A hard\nbreak sits in this line.',
    reason: 'hard-break',
  },
  {
    label: 'tab',
    text: 'A tab\tsits in this line.',
    reason: 'hard-break',
  },
  {
    label: 'repeated symbol run',
    text: 'A degenerate ,,,, run sits in this line.',
    reason: 'repeated-symbol-run',
  },
  {
    label: 'repeated bracket pattern',
    text: 'A degenerate ][][ run sits in this line.',
    reason: 'repeated-symbol-run',
  },
  {
    label: 'long unbroken token',
    text: 'See https://example.com/a/very/long/path/that/never/breaks/anywhere for the source.',
    reason: 'long-token',
  },
]

export const APPROVED_CASES: readonly ApprovedCase[] = [
  ...INTERFACE_CASES,
  ...SECTION_ID_CASES,
  ...SEARCH_EXAMPLE_CASES,
  ...PROSE_CASES,
]

/**
 * Real titles and excerpts, taken from the index the site actually ships.
 *
 * Handwritten cases pin the awkward Unicode; these keep the contract honest
 * about the text readers really meet. Anything the production gate would
 * decline is filtered out by the caller, because this half is the approved
 * half by definition.
 */
export interface IndexedDocLike {
  readonly title: string
  readonly summary: string
  readonly body: string
  readonly breadcrumb: string
}

export function casesFromSearchIndex(
  docs: readonly IndexedDocLike[],
  isApproved: (text: string) => boolean,
  limit = 40,
): readonly ApprovedCase[] {
  const cases: ApprovedCase[] = []
  const seen = new Set<string>()

  const add = (label: string, raw: string) => {
    const text = raw.replace(/\s+/g, ' ').trim()
    if (!text || text.length > 700 || seen.has(text)) return
    if (!isApproved(text)) return
    seen.add(text)
    cases.push({ label, text })
  }

  for (const doc of docs) {
    if (cases.length >= limit) break
    add('indexed title', doc.title)
    add('indexed breadcrumb', doc.breadcrumb)
    add('indexed summary', doc.summary.slice(0, 320))
    // A middle slice of the body, cut at spaces so it reads like an excerpt.
    const body = doc.body.replace(/\s+/g, ' ').trim()
    if (body.length > 600) {
      const from = body.indexOf(' ', Math.floor(body.length / 2)) + 1
      add('indexed body excerpt', body.slice(from, from + 420).replace(/\s\S*$/, ''))
    }
  }

  return cases.slice(0, limit)
}
