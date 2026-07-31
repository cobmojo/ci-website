import { caseSections } from '@ci/content/case'
import { video } from '@ci/content/video'
import { describe, expect, it } from 'vitest'
import { articleJsonLd, breadcrumbJsonLd, videoJsonLd, websiteJsonLd } from '@/lib/metadata'
import { siteConfig } from '@/lib/site-config'

/**
 * What the site is allowed to claim about itself in JSON-LD.
 *
 * Structured data is the one part of the page a reader never sees, which is
 * exactly why it needs a test: a false claim here is invisible in a browser,
 * survives every layout and accessibility gate, and is read by machines as
 * fact. Each assertion below is a statement about the *truth* of the markup,
 * not about its syntax — `JSON.stringify` will happily serialise a lie.
 */

const section = caseSections.find(item => item.id === 'S04')
if (!section) throw new Error('S04 is a permanent section id; the registry no longer has it')

describe('articleJsonLd', () => {
  const data = articleJsonLd(section) as Record<string, unknown>

  it('does not claim an organization publishes the site', () => {
    /*
     * The visible site says, in its own words, that it presents "one person's
     * case". No organization publishes it, and `publisher` is not a required
     * Article property, so naming the site title as an `Organization` invented
     * a legal entity that does not exist.
     */
    expect(data).not.toHaveProperty('publisher')
  })

  it('links the author to the page that identifies him', () => {
    const author = data.author as Record<string, unknown>
    expect(author['@type']).toBe('Person')
    expect(author.name).toBe(siteConfig.author.name)
    // Recommended by Google precisely so an author name is resolvable to a
    // person rather than being a bare string.
    expect(author.url).toBe(`${siteConfig.url}/about/`)
  })

  it('keeps the claims that are true of every section', () => {
    expect(data['@type']).toBe('Article')
    expect(data.headline).toBe(section.title)
    expect(data.inLanguage).toBe(siteConfig.language)
    expect(data.isAccessibleForFree).toBe(true)
    expect(data.mainEntityOfPage).toBe(`${siteConfig.url}${section.route}`)
  })

  it('never emits a date it does not have', () => {
    for (const key of ['datePublished', 'dateModified']) {
      if (key in data) expect(data[key]).toMatch(/^\d{4}-\d{2}-\d{2}/)
    }
  })
})

describe('websiteJsonLd', () => {
  const data = websiteJsonLd() as Record<string, unknown>

  it('carries no sitelinks search box markup', () => {
    /*
     * Google retired the sitelinks search box on 21 November 2024. The
     * `SearchAction` that fed it has no remaining consumer, so keeping it
     * described a Google feature that no longer exists. The site's own search
     * page is untouched: it is a reader feature, not a markup feature.
     */
    expect(data).not.toHaveProperty('potentialAction')
    expect(JSON.stringify(data)).not.toContain('SearchAction')
  })

  it('still identifies the site, which is what WebSite is now for', () => {
    expect(data['@type']).toBe('WebSite')
    expect(data.name).toBe(siteConfig.name)
    expect(data.url).toBe(siteConfig.url)
    expect(data.inLanguage).toBe(siteConfig.language)
  })
})

describe('videoJsonLd', () => {
  const data = videoJsonLd() as Record<string, unknown>

  it('does not pass a watch page off as the media file', () => {
    /*
     * `contentUrl` must be the video file's actual content bytes. The only
     * URL this project has is a YouTube watch page, which is what `embedUrl`
     * is for. Omitting the property is honest; pointing it at a watch page is
     * not, and there is no media file to point it at.
     */
    expect(data).not.toHaveProperty('contentUrl')
    expect(data.embedUrl).toContain(siteConfig.video.youtubeId)
  })

  it('keeps the properties Google requires', () => {
    expect(data['@type']).toBe('VideoObject')
    expect(data.name).toBeTruthy()
    expect(Array.isArray(data.thumbnailUrl)).toBe(true)
    expect((data.thumbnailUrl as string[])[0]).toMatch(/^https?:\/\//)
    expect(data.uploadDate).toBe(video.publishedAt)
  })

  it('gives every clip a URL that really starts the video there', () => {
    /*
     * A clip URL has to deep link into the video. The old markup pointed at a
     * page fragment, which scrolls the transcript and leaves the player at
     * zero — a link that looks like a deep link and is not one. `?t=` is the
     * format the watch page already honours: `ClickToLoadVideo` reads it at
     * activation and hands `start=` to the embed.
     */
    const clips = data.hasPart as Array<Record<string, unknown>>
    expect(clips.length).toBe(video.chapters.length)

    expect(clips.map(clip => clip['@type'])).toEqual(video.chapters.map(() => 'Clip'))
    expect(clips.map(clip => clip.startOffset)).toEqual(video.chapters.map(c => c.start))
    expect(clips.map(clip => clip.url)).toEqual(
      video.chapters.map(c => `${siteConfig.url}/watch/?t=${c.start}`),
    )
    // The fragment form is precisely what was wrong; guard against a revert.
    for (const clip of clips) expect(String(clip.url)).not.toContain('#')
  })
})

describe('breadcrumbJsonLd', () => {
  it('numbers positions from one, consecutively, with absolute URLs', () => {
    const data = breadcrumbJsonLd([
      { href: '/', label: 'Home' },
      { href: '/watch/', label: 'Watch and Transcript' },
    ]) as Record<string, unknown>

    const items = data.itemListElement as Array<Record<string, unknown>>
    expect(items.map(item => item.position)).toEqual([1, 2])
    for (const item of items) expect(String(item.item).startsWith(siteConfig.url)).toBe(true)
  })
})
