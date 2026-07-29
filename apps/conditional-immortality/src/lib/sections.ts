import {
  caseSections,
  type ExtractedHeading,
  extractHeadings,
  mdxExists,
  mdxToPlainText,
  nextSection,
  previousSection,
  readMdx,
  sectionFileName,
} from '@ci/content'
import { CASE_GROUP_LABELS, type CaseSection } from '@ci/content-schema'
import type { Crumb } from '@/components/article/article-chrome'
import { readingTimeMinutes } from '@/lib/format'

/** Where a section's MDX body lives. Appendices sit in their own directory. */
function collectionFor(section: CaseSection): 'case' | 'appendices' {
  return section.group === 'appendix' ? 'appendices' : 'case'
}

export interface LoadedSection {
  readonly section: CaseSection
  readonly body: string
  readonly headings: readonly ExtractedHeading[]
  readonly plainText: string
  readonly readingMinutes: number
  readonly previous?: CaseSection
  readonly next?: CaseSection
  readonly crumbs: readonly Crumb[]
}

export function loadSection(section: CaseSection): LoadedSection {
  const name = sectionFileName(section.id, section.slug)
  const collection = collectionFor(section)
  const body = readMdx(collection, name)
  const plainText = mdxToPlainText(body)

  return {
    section,
    body,
    headings: extractHeadings(body),
    plainText,
    readingMinutes: readingTimeMinutes(plainText),
    previous: previousSection(section.id),
    next: nextSection(section.id),
    crumbs: crumbsFor(section),
  }
}

export function sectionBodyExists(section: CaseSection): boolean {
  return mdxExists(collectionFor(section), sectionFileName(section.id, section.slug))
}

/** Sections whose MDX body is missing, used by the content audit. */
export function sectionsMissingBodies(): readonly CaseSection[] {
  return caseSections.filter(section => !sectionBodyExists(section))
}

const CASE_SUBGROUP_ROUTES: Partial<Record<CaseSection['group'], { href: string; label: string }>> =
  {
    roadblock: { href: '/case/#roadblock', label: 'Roadblocks' },
    'key-text': { href: '/case/#key-text', label: 'Key Texts' },
    'biblical-language': { href: '/case/#biblical-language', label: 'Biblical Language' },
    'biblical-pattern': { href: '/case/#biblical-pattern', label: 'Biblical Patterns' },
    'final-destiny': { href: '/case/#final-destiny', label: 'Final Destiny' },
    'further-reasoning': { href: '/case/#further-reasoning', label: 'Further Reasoning' },
  }

export function crumbsFor(section: CaseSection): readonly Crumb[] {
  const home: Crumb = { href: '/', label: 'Home' }

  if (section.group === 'objection') {
    return [
      home,
      { href: '/objections/', label: 'Objections' },
      { href: section.route, label: section.title },
    ]
  }
  if (section.group === 'appendix') {
    return [
      home,
      { href: '/case/#appendix', label: 'Appendices' },
      { href: section.route, label: section.title },
    ]
  }

  const trail: Crumb[] = [home, { href: '/case/', label: 'The Case' }]
  const sub = CASE_SUBGROUP_ROUTES[section.group]
  if (sub) trail.push(sub)
  trail.push({ href: section.route, label: section.title })
  return trail
}

export function groupLabel(section: CaseSection): string {
  return CASE_GROUP_LABELS[section.group]
}
