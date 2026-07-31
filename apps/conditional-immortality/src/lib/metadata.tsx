import { video } from '@ci/content/video'
import type { CaseSection } from '@ci/content-schema'
import type { Metadata } from 'next'
import { isoDuration } from '@/lib/format'
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

/**
 * The one author identity every block shares.
 *
 * `url` is what turns a name into something resolvable: `/about/` is the page
 * that says who he is, in his own words, and it is the only page that does.
 * Nothing here asserts a credential, an institution or a review the visible
 * site does not also state.
 */
export function authorPerson() {
  return {
    '@type': 'Person',
    name: siteConfig.author.name,
    url: absoluteUrl('/about/'),
  } as const
}

export function articleJsonLd(section: CaseSection) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: section.title,
    description: section.shortSummary,
    author: authorPerson(),
    /*
     * No `publisher`.
     *
     * It used to name the site's own title as an `Organization`, which
     * invented a publishing body that does not exist: the About page states
     * that this is one person's case, and no organization stands behind it.
     * `publisher` is not a required Article property, so the truthful move is
     * to omit it rather than to dress the author up as an institution.
     */
    mainEntityOfPage: absoluteUrl(section.route),
    ...(section.firstPublished ? { datePublished: section.firstPublished } : {}),
    ...(section.lastSubstantiveRevision ? { dateModified: section.lastSubstantiveRevision } : {}),
    isAccessibleForFree: true,
    inLanguage: siteConfig.language,
  }
}

/**
 * The site's own identity.
 *
 * No `potentialAction`. The `SearchAction` that used to sit here existed for
 * one consumer — Google's sitelinks search box — and Google retired that
 * globally on 21 November 2024, removing the report, the Rich Results Test
 * highlight and the documentation with it. Markup with no remaining consumer
 * is not free: it is a claim about a feature that no longer exists, and it has
 * to be maintained by whoever reads this next. The site's own `/search/` page
 * is untouched; it is a reader feature and never depended on this.
 *
 * `WebSite` itself stays, because site names still read from it.
 */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: siteConfig.language,
    author: authorPerson(),
  }
}

/**
 * The overview video, as the watch page presents it.
 *
 * Two things here are corrections rather than choices.
 *
 * `contentUrl` is absent. It must be the URL of the video file's actual
 * content bytes, and this project has no such URL — the video is hosted on
 * YouTube and reachable only as a watch page or an embed. It used to be set to
 * the watch page, which is the one thing the property must not be. `embedUrl`
 * is the supported way to say "the player lives here", and it stays.
 *
 * Each `Clip` points at `?t=`, not at a page fragment. A clip URL has to deep
 * link into the video; the fragment form scrolled the transcript and left the
 * player at zero, so it described a capability the page did not have. `?t=` is
 * the format `ClickToLoadVideo` already reads at activation, and the transcript
 * timestamps above already use it, so the markup now matches behaviour that is
 * on the page and tested.
 */
export function videoJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.siteTitle,
    alternateName: video.originalTitle,
    description: video.description,
    thumbnailUrl: [
      absoluteUrl(
        `/og/?title=${encodeURIComponent(video.siteTitle)}&category=${encodeURIComponent('Video overview')}`,
      ),
    ],
    uploadDate: video.publishedAt,
    duration: isoDuration(video.durationSeconds),
    embedUrl: `${siteConfig.video.embedHost}/embed/${siteConfig.video.youtubeId}`,
    creator: authorPerson(),
    inLanguage: siteConfig.language,
    isAccessibleForFree: true,
    hasPart: video.chapters.map(chapter => ({
      '@type': 'Clip',
      name: chapter.title,
      startOffset: chapter.start,
      endOffset: chapter.end,
      url: absoluteUrl(`/watch/?t=${chapter.start}`),
    })),
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
