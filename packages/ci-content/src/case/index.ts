import {
  CASE_GROUP_LABELS,
  type CaseGroup,
  type CaseSection,
  CaseSectionSchema,
} from '@ci/content-schema'
import { CASE_SECTIONS } from './sections'

/** Validated registry. A schema failure here fails the build. */
export const caseSections: readonly CaseSection[] = CASE_SECTIONS.map(section => {
  const parsed = CaseSectionSchema.safeParse(section)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(issue => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid case section "${section.id}":\n${issues}`)
  }
  return parsed.data
}).sort((a, b) => a.canonicalOrder - b.canonicalOrder)

const BY_ID = new Map(caseSections.map(section => [section.id, section]))
const BY_ROUTE = new Map(caseSections.map(section => [section.route, section]))

export function getSection(id: string): CaseSection | undefined {
  return BY_ID.get(id)
}

export function requireSection(id: string): CaseSection {
  const section = BY_ID.get(id)
  if (!section) throw new Error(`Unknown section id: ${id}`)
  return section
}

export function getSectionByRoute(route: string): CaseSection | undefined {
  return BY_ROUTE.get(route.endsWith('/') ? route : `${route}/`)
}

/** Sections that make up the readable case, in canonical order. */
export const caseReadingOrder: readonly CaseSection[] = caseSections

export function previousSection(id: string): CaseSection | undefined {
  const index = caseReadingOrder.findIndex(section => section.id === id)
  return index > 0 ? caseReadingOrder[index - 1] : undefined
}

export function nextSection(id: string): CaseSection | undefined {
  const index = caseReadingOrder.findIndex(section => section.id === id)
  return index >= 0 && index < caseReadingOrder.length - 1 ? caseReadingOrder[index + 1] : undefined
}

export interface CaseGroupBucket {
  readonly group: CaseGroup
  readonly label: string
  readonly sections: readonly CaseSection[]
}

/** Sections bucketed by editorial group, in canonical group order. */
export const caseSectionsByGroup: readonly CaseGroupBucket[] = (() => {
  const order: CaseGroup[] = [
    'preface',
    'roadblock',
    'key-text',
    'biblical-language',
    'biblical-pattern',
    'final-destiny',
    'further-reasoning',
    'objection',
    'appendix',
  ]
  return order
    .map(group => ({
      group,
      label: CASE_GROUP_LABELS[group],
      sections: caseSections.filter(section => section.group === group),
    }))
    .filter(bucket => bucket.sections.length > 0)
})()

export const objectionSections: readonly CaseSection[] = caseSections.filter(
  section => section.group === 'objection',
)

export const appendixSections: readonly CaseSection[] = caseSections.filter(
  section => section.group === 'appendix',
)

/**
 * The six principal claims the cumulative case is built from.
 *
 * The homepage, the case map and the case hub all read this list, so the
 * spine of the argument is stated in exactly one place.
 */
export interface PrincipalClaim {
  readonly id: string
  readonly number: number
  readonly title: string
  readonly summary: string
  readonly sectionIds: readonly string[]
}

export const PRINCIPAL_CLAIMS: readonly PrincipalClaim[] = [
  {
    id: 'immortality-is-given',
    number: 1,
    title: 'Immortality is given by God, not automatically possessed by every human being.',
    summary:
      'Scripture attributes immortality to God and describes it as something brought to light and given through Christ. Human life is presented throughout as dependent and perishable rather than inherently unending.',
    sectionIds: ['RB2', 'S21', 'S22'],
  },
  {
    id: 'wage-of-sin-is-death',
    number: 2,
    title: 'The final wage of sin is death.',
    summary:
      'From Eden to Romans, the stated penalty for sin is death. Because believers and unbelievers alike die physically, the death in view is the second death rather than the first.',
    sectionIds: ['S07', 'S10', 'S16', 'S17', 'S18'],
  },
  {
    id: 'language-of-destruction',
    number: 3,
    title:
      'Scripture repeatedly describes the fate of the wicked as destruction, perishing, consumption, and extinction.',
    summary:
      'This vocabulary is not occasional. It runs through the Psalms, the Prophets, the Gospels and the Epistles, and it is the ordinary language of the Bible on the subject.',
    sectionIds: ['S08', 'S11', 'S12'],
  },
  {
    id: 'eternal-describes-result',
    number: 4,
    title:
      '“Eternal punishment” can describe a permanent and irreversible result rather than an eternally continuing act of punishing.',
    summary:
      'Eternal redemption, eternal judgment and eternal salvation all name something accomplished once whose effect stands for ever. Eternal punishment can be read the same way, and 2 Thessalonians 1:9 names the punishment as destruction.',
    sectionIds: ['S04', 'S03', 'S01'],
  },
  {
    id: 'patterns-end-in-death',
    number: 5,
    title:
      'Biblical patterns of judgment, including fire, Sodom and Gomorrah, sacrifice, Old Testament judgment, and Christ’s death, culminate in death or destruction.',
    summary:
      'Where Scripture shows judgment rather than describing it, the shape is consistent: fire consumes, cities are reduced to ash, sacrifices die, and Christ died in our place.',
    sectionIds: ['S13', 'S14', 'S15', 'S16', 'S17'],
  },
  {
    id: 'difficult-texts-fit',
    number: 6,
    title:
      'The principal passages used for eternal conscious torment can be read naturally within that broader biblical framework without requiring endless conscious torment for wicked human beings.',
    summary:
      'Mark 9, Revelation 14, Revelation 20, Matthew 25, Luke 16 and the weeping-and-gnashing sayings are each examined in full, with the traditional reading stated from its own defenders first.',
    sectionIds: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06'],
  },
]

/**
 * The recommended essential path.
 *
 * A reader who works through these twelve pages in order meets every load-
 * bearing pillar of the case without reading all thirty-nine.
 */
export const ESSENTIAL_PATH: readonly string[] = [
  'P00',
  'RB2',
  'S07',
  'S08',
  'S10',
  'S13',
  'S14',
  'S17',
  'S22',
  'S04',
  'S03',
  'S12',
]

/** Groups whose sections live under `/case/`, used for breadcrumbs. */
export const CASE_ROUTE_GROUPS: ReadonlySet<CaseGroup> = new Set<CaseGroup>([
  'preface',
  'roadblock',
  'key-text',
  'biblical-language',
  'biblical-pattern',
  'final-destiny',
  'further-reasoning',
])

export { CASE_SECTIONS }
