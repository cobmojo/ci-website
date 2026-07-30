'use client'

import { useState } from 'react'
import { formatTimestamp } from '@/lib/format'
import { siteConfig } from '@/lib/site-config'

/**
 * A video poster that contacts YouTube only when the reader asks it to.
 *
 * Until the button is pressed there is no iframe, no script, no cookie and no
 * request of any kind to a YouTube domain. The poster is drawn from type and
 * site colour rather than from a remote thumbnail, so even the image request
 * that a normal poster would make does not happen.
 *
 * The container carries an explicit 16:9 ratio, so swapping the poster for the
 * iframe moves nothing on the page.
 *
 * Props are optional on purpose. This is a client component, and importing the
 * video record would pull the whole transcript and the schema validator into
 * the browser bundle, so callers that have the registry to hand pass the title
 * and duration down. Without them the poster simply says less; it never
 * invents a title or a running time.
 */
export interface ClickToLoadVideoProps {
  /** Title shown on the poster and used as the iframe's accessible name. */
  readonly title?: string
  readonly durationSeconds?: number
  /** Start the video at this offset in seconds when it is activated. */
  readonly startSeconds?: number
  readonly className?: string
}

const FALLBACK_TITLE = 'Video overview'

export function ClickToLoadVideo({
  title,
  durationSeconds,
  startSeconds,
  className,
}: ClickToLoadVideoProps) {
  const [activated, setActivated] = useState(false)
  const [start, setStart] = useState(0)

  const minutes = durationSeconds ? Math.floor(durationSeconds / 60) : null
  const playLabel = minutes
    ? `Play the ${minutes} minute overview video`
    : 'Play the overview video'
  const frameTitle = title ?? FALLBACK_TITLE
  const watchUrl = siteConfig.video.watchUrl

  /**
   * Chapter links on the watch page are plain `?t=` links, so a reader who
   * arrives through one and then presses play should start there. The query is
   * read at the moment of activation rather than during render, which keeps
   * the page statically rendered and avoids any hydration mismatch.
   */
  function resolveStart(): number {
    if (typeof startSeconds === 'number' && startSeconds > 0) {
      return Math.floor(startSeconds)
    }
    if (typeof window === 'undefined') return 0
    const raw = new URLSearchParams(window.location.search).get('t')
    const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }

  const source = [
    `${siteConfig.video.embedHost}/embed/${siteConfig.video.youtubeId}`,
    `?autoplay=1&rel=0${start > 0 ? `&start=${start}` : ''}`,
  ].join('')

  return (
    <div className={className}>
      <div className="video-embed relative aspect-video w-full overflow-hidden rounded-md border border-border bg-panel print:hidden">
        {activated ? (
          <iframe
            src={source}
            title={frameTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            // `video-frame` fades the player in over the poster it replaced.
            // The container already carries the 16:9 ratio, so nothing moves;
            // this only softens the swap to black.
            className="video-frame absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            aria-label={playLabel}
            onClick={() => {
              setStart(resolveStart())
              setActivated(true)
            }}
            // `video-play` moves the glyph rather than the poster on hover and
            // press. Scaling a 16:9 panel would drag its border across the page
            // and shift everything below it.
            className="video-play absolute inset-0 flex min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-3 p-5 text-center text-navy hover:bg-panel-strong sm:p-8"
          >
            <svg
              viewBox="0 0 64 64"
              className="video-play__glyph h-12 w-12 sm:h-16 sm:w-16"
              aria-hidden="true"
              focusable="false"
            >
              <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1.75" />
              <path d="M25 19 L47 32 L25 45 Z" fill="currentColor" />
            </svg>
            <span className="font-sans text-[0.78rem] font-semibold tracking-[0.14em] text-copper-deep uppercase">
              Video overview
            </span>
            {title ? (
              <span className="max-w-[36rem] font-sans text-[1.02rem] leading-snug font-medium text-navy-deep sm:text-[1.15rem]">
                {title}
              </span>
            ) : null}
            <span className="font-sans text-[0.88rem] text-ink-muted">
              {durationSeconds ? (
                <>
                  {formatTimestamp(durationSeconds)} <span aria-hidden="true">·</span>{' '}
                </>
              ) : null}
              Press play to load it from YouTube
            </span>
          </button>
        )}
      </div>

      <p className="mt-3 mb-0 font-sans text-[0.86rem] leading-snug text-ink-muted">
        This video is loaded from YouTube only when you choose to play it. Nothing is requested from
        YouTube before then, and the privacy-enhanced player is used when it is.{' '}
        <a href={watchUrl} rel="noopener noreferrer" target="_blank">
          Watch it on YouTube directly: {watchUrl}
        </a>
      </p>
    </div>
  )
}
