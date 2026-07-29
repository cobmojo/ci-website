import { caseSections } from '@ci/content/case'
import { passageRoute, passages } from '@ci/content/passages'
import { revisedSectionIds } from '@ci/content/revisions'
import { topicRoute, topics } from '@ci/content/topics'
import type { MetadataRoute } from 'next'
import { NOINDEX_ROUTES, STATIC_ROUTES } from '@/lib/navigation'
import { absoluteUrl, siteConfig } from '@/lib/site-config'

/**
 * Every canonical route on the site.
 *
 * Built from the same registries the pages are built from, so a section,
 * passage or topic can never exist without appearing here. `/full-case/` and
 * `/search/` are excluded: both are noindex, and listing a noindex URL in a
 * sitemap is a contradictory signal to a crawler.
 */

const SITE_DATE = siteConfig.lastSubstantivelyUpdated

interface Entry {
  readonly route: string
  readonly lastModified: string
  readonly changeFrequency: 'yearly' | 'monthly' | 'weekly'
  readonly priority: number
}

function collect(): readonly Entry[] {
  const entries: Entry[] = []
  const seen = new Set<string>()

  const add = (entry: Entry) => {
    if (NOINDEX_ROUTES.includes(entry.route)) return
    if (seen.has(entry.route)) return
    seen.add(entry.route)
    entries.push(entry)
  }

  for (const route of STATIC_ROUTES) {
    add({
      route,
      lastModified: SITE_DATE,
      changeFrequency: 'monthly',
      priority: route === '/' ? 1 : 0.7,
    })
  }

  for (const section of caseSections) {
    add({
      route: section.route,
      lastModified: section.lastSubstantiveRevision ?? section.lastReviewed ?? SITE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  for (const passage of passages) {
    add({
      route: passageRoute(passage),
      lastModified: passage.lastReviewed,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  for (const topic of topics) {
    add({
      route: topicRoute(topic),
      lastModified: SITE_DATE,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  for (const sectionId of revisedSectionIds) {
    add({
      route: `/changelog/${sectionId.toLowerCase()}/`,
      lastModified: SITE_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    })
  }

  return entries
}

export default function sitemap(): MetadataRoute.Sitemap {
  return collect().map(entry => ({
    url: absoluteUrl(entry.route),
    lastModified: new Date(`${entry.lastModified}T00:00:00.000Z`),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}
