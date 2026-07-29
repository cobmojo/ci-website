import type { CaseSection } from '@ci/content-schema'
import type { Metadata } from 'next'
import { absoluteUrl, siteConfig } from '@/lib/site-config'

export interface PageMetaInput {
  readonly title: string
  readonly description: string
  readonly route: string
  readonly noindex?: boolean
  readonly type?: 'website' | 'article'
  readonly publishedTime?: string
  readonly modifiedTime?: string
  readonly category?: string
}

/** Build page metadata with a canonical URL and a generated social image. */
export function pageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.route)
  // Slashed, so the image is served directly rather than through a 308.
  const ogImage = absoluteUrl(
    `/og/?title=${encodeURIComponent(input.title)}${
      input.category ? `&category=${encodeURIComponent(input.category)}` : ''
    }`,
  )

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    robots: input.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? 'website',
      url,
      title: input.title,
      description: input.description,
      siteName: siteConfig.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [ogImage],
    },
  }
}

export function sectionMetadata(section: CaseSection): Metadata {
  return pageMetadata({
    title: section.title,
    description: section.shortSummary,
    route: section.route,
    type: 'article',
    category: section.id,
    publishedTime: section.firstPublished,
    modifiedTime: section.lastSubstantiveRevision,
  })
}

/* ------------------------------------------------------------------ *
 * Structured data
 *
 * Only emitted for things the visible page actually contains.
 * ------------------------------------------------------------------ */

export function breadcrumbJsonLd(trail: readonly { href: string; label: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: absoluteUrl(crumb.href),
    })),
  }
}

export function articleJsonLd(section: CaseSection) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: section.title,
    description: section.shortSummary,
    author: { '@type': 'Person', name: siteConfig.author.name },
    publisher: { '@type': 'Organization', name: siteConfig.name },
    mainEntityOfPage: absoluteUrl(section.route),
    ...(section.firstPublished ? { datePublished: section.firstPublished } : {}),
    ...(section.lastSubstantiveRevision ? { dateModified: section.lastSubstantiveRevision } : {}),
    isAccessibleForFree: true,
    inLanguage: siteConfig.language,
  }
}

/** Render a JSON-LD block. Values are serialised, never interpolated as HTML. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires a script body; the value is JSON.stringify of typed data, never user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
