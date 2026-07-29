import { getSection } from '@ci/content/case'
import { formatCitation, getSource } from '@ci/content/sources'
import { video, videoTimestampUrl } from '@ci/content/video'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, type Crumb, FeedbackCta } from '@/components/article/article-chrome'
import { ClickToLoadVideo } from '@/components/media/click-to-load-video'
import { formatLongDate, formatTimestamp, isoDuration } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { absoluteUrl, siteConfig } from '@/lib/site-config'
import { cuesToParagraphs, transcriptSegments } from '@/lib/transcript'

const ROUTE = '/watch/'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: ROUTE, label: 'Watch and Transcript' },
]

export const metadata: Metadata = pageMetadata({
  title: video.siteTitle,
  description:
    'Watch the 28 minute overview of the case for conditional immortality, with chapters linked to the written sections and the complete transcript on the page.',
  route: ROUTE,
  category: 'Video overview',
})

/**
 * Sources the video itself points the viewer to.
 *
 * `video.sourceIds` records the video as a source in its own right. The two
 * organisations named in the closing seconds are added here because the page
 * repeats that recommendation in prose, and every id resolves against the
 * source library rather than being written out again.
 */
const SOURCE_IDS: readonly string[] = [
  ...video.sourceIds,
  'rethinking-hell',
  'sprinkle-introduction',
]

/** Short, distinct link text for an external source: its host name. */
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function WatchPage() {
  const segments = transcriptSegments()
  const sources = [...new Set(SOURCE_IDS)]
    .map(id => getSource(id))
    .filter((source): source is NonNullable<typeof source> => Boolean(source))

  const videoJsonLd = {
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
    contentUrl: siteConfig.video.watchUrl,
    creator: { '@type': 'Person', name: siteConfig.author.name },
    inLanguage: siteConfig.language,
    isAccessibleForFree: true,
    hasPart: video.chapters.map(chapter => ({
      '@type': 'Clip',
      name: chapter.title,
      startOffset: chapter.start,
      endOffset: chapter.end,
      url: absoluteUrl(`${ROUTE}#${chapter.id}`),
    })),
  }

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={videoJsonLd} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[54rem]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              Video overview
            </p>
            <h1 className="mt-0 mb-4">{video.siteTitle}</h1>
            <p className="m-0 max-w-[var(--spacing-measure)] text-[1.13rem] leading-[1.6] text-ink-muted">
              {video.description}
            </p>
          </header>

          <figure className="m-0 mb-10">
            <ClickToLoadVideo title={video.siteTitle} durationSeconds={video.durationSeconds} />
            <figcaption className="mt-3 font-sans text-[0.86rem] leading-snug text-ink-subtle">
              Published on YouTube as{' '}
              <span className="text-ink-muted">“{video.originalTitle}”</span>.{' '}
              <time dateTime={video.publishedAt}>{formatLongDate(video.publishedAt)}</time>
              <span aria-hidden="true"> · </span>
              Running time {formatTimestamp(video.durationSeconds)}.
            </figcaption>
          </figure>

          <nav
            aria-labelledby="chapters-title"
            className="mb-10 rounded-md border border-border bg-paper-raised p-5"
          >
            <h2 id="chapters-title" className="mt-0 mb-3 text-[1.18rem]">
              Chapters
            </h2>
            <ol className="m-0 list-none space-y-3 p-0">
              {video.chapters.map(chapter => {
                const covered = chapter.sectionIds
                  .map(id => getSection(id))
                  .filter((section): section is NonNullable<typeof section> => Boolean(section))
                return (
                  <li key={chapter.id} className="font-sans text-[0.95rem]">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <time
                        dateTime={isoDuration(chapter.start)}
                        className="tabular-nums text-ink-subtle"
                      >
                        {formatTimestamp(chapter.start)}
                      </time>
                      {/* A plain anchor, not a router link. A same page jump
                          has to be a real fragment navigation, or the browser
                          never marks the transcript section as `:target` and
                          the reader loses their place. */}
                      <a href={`#${chapter.id}`}>{chapter.title}</a>
                    </span>
                    {covered.length > 0 ? (
                      <span className="mt-0.5 block text-[0.88rem] text-ink-muted">
                        Covers{' '}
                        {covered.map((section, index) => (
                          <span key={section.id}>
                            {index > 0 ? ', ' : null}
                            <Link href={section.route}>
                              {section.id}. {section.title}
                            </Link>
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </nav>

          <section aria-labelledby="transcript-title" className="mb-10">
            <h2 id="transcript-title" className="mt-0 mb-2 text-[1.35rem]">
              Transcript
            </h2>
            <p className="m-0 mb-6 max-w-[var(--spacing-measure)] font-sans text-[0.92rem] text-ink-muted">
              {video.transcriptSource} Retrieved{' '}
              <time dateTime={video.transcriptRetrievedAt}>
                {formatLongDate(video.transcriptRetrievedAt)}
              </time>
              . Timestamps link back to the player at the top of this page, and each one also opens
              the video at that moment on YouTube.
            </p>

            {segments.map(segment => (
              <section key={segment.id} id={segment.id} className="mt-8 scroll-mt-28">
                <h3 className="mt-0 mb-2 text-[1.08rem]">
                  <Link href={`?t=${segment.start}`} className="no-underline hover:underline">
                    <time
                      dateTime={isoDuration(segment.start)}
                      className="mr-2 font-sans text-[0.86rem] tabular-nums text-ink-subtle"
                    >
                      {formatTimestamp(segment.start)}
                    </time>
                    {segment.title}
                  </Link>
                </h3>

                {segment.chapter?.visualDescription ? (
                  <aside
                    aria-label={`On-screen information during ${segment.title}`}
                    className="my-3 border-l-2 border-border-strong bg-panel/60 py-2 pl-3 font-sans text-[0.9rem] text-ink-muted"
                  >
                    <span className="font-semibold text-ink">Shown on screen, not spoken: </span>
                    {segment.chapter.visualDescription}
                  </aside>
                ) : null}

                {cuesToParagraphs(segment.cues).map(paragraph => (
                  <p
                    key={`${segment.id}-${paragraph.slice(0, 24)}`}
                    className="mt-3 mb-0 max-w-[var(--spacing-measure)]"
                  >
                    {paragraph}
                  </p>
                ))}

                <p className="mt-2 mb-0 font-sans text-[0.84rem] text-ink-subtle print:hidden">
                  <a
                    href={videoTimestampUrl(segment.start)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open this moment on YouTube
                  </a>
                </p>
              </section>
            ))}
          </section>

          <section
            aria-labelledby="video-sources-title"
            className="mb-10 border-t border-border pt-6"
          >
            <h2 id="video-sources-title" className="mt-0 mb-3 text-[1.18rem]">
              Sources mentioned in the video
            </h2>
            <p className="m-0 mb-3 max-w-[var(--spacing-measure)] font-sans text-[0.92rem] text-ink-muted">
              The closing seconds point viewers to two places for further reading. Both are
              conditionalist or multi-view sources, and both are listed in full in the source
              library.
            </p>
            <ol className="m-0 space-y-2 pl-5 font-sans text-[0.9rem] text-ink-muted">
              {sources.map(source => (
                <li key={source.id} id={`source-${source.id}`}>
                  {formatCitation(source)}
                  {source.url ? (
                    <>
                      {' '}
                      <a href={source.url} rel="noopener noreferrer" target="_blank">
                        Open {hostLabel(source.url)}
                      </a>
                    </>
                  ) : null}{' '}
                  <Link href={`/sources/#${source.id}`} className="text-ink-subtle">
                    Details
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <section
            aria-labelledby="transcript-download-title"
            className="mb-10 rounded-md border border-border bg-paper-raised p-5"
          >
            <h2 id="transcript-download-title" className="mt-0 mb-2 text-[1.12rem]">
              Take the transcript with you
            </h2>
            <p className="m-0 mb-3 max-w-[var(--spacing-measure)] text-[1rem] text-ink-muted">
              The whole transcript is also available as a plain text file with the chapter headings
              and timestamps kept in place.
            </p>
            <p className="m-0 font-sans text-[0.95rem]">
              <a href="/download/transcript.txt" download>
                Download the transcript as plain text
              </a>
              <span className="text-ink-subtle"> or see all </span>
              <Link href="/download/">downloads</Link>
              <span className="text-ink-subtle">.</span>
            </p>
          </section>

          <FeedbackCta />
        </div>
      </div>
    </>
  )
}
