'use client'

import { useEffect, useRef, useState } from 'react'
import { NewTabLink } from '@/components/content/new-tab-link'
import { formatTimestamp } from '@/lib/format'
import { isModifiedClick } from '@/lib/modified-click'
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
  /** Set where something on the page needs to move focus to the player. */
  readonly id?: string
}

const FALLBACK_TITLE = 'Video overview'

/** Dispatched by a transcript timestamp; carries the offset in seconds. */
export const VIDEO_SEEK_EVENT = 'ci:video-seek'

/**
 * The offset the address bar is asking for, or zero.
 *
 * At module scope so the mount effect does not close over a function rebuilt
 * on every render, which would either go stale or re-run the effect forever.
 */
function startFromLocation(): number {
  if (typeof window === 'undefined') return 0
  const raw = new URLSearchParams(window.location.search).get('t')
  const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function ClickToLoadVideo({
  title,
  durationSeconds,
  startSeconds,
  className,
  id,
}: ClickToLoadVideoProps) {
  const [activated, setActivated] = useState(false)
  /**
   * False on the server and on the first client render, so the markup a
   * browser receives is a working link rather than a button that needs
   * scripting. Without this the poster was an 830x466 control that did
   * nothing at all with JavaScript off: no request, no iframe, no message.
   */
  const [scripted, setScripted] = useState(false)
  const [offset, setOffset] = useState(0)
  /**
   * A seek is a request, not a value.
   *
   * Holding only the offset meant React bailed out whenever the requested
   * second equalled the one already held, so the `src` was never rewritten and
   * the frame never reloaded — silently, for the two commonest requests there
   * are: the 0:00 chapter, which matches the initial state, and pressing any
   * timestamp a second time to hear a passage again. The counter gives each
   * request its own identity, and keys the frame so it reloads on every one.
   */
  const [seek, setSeek] = useState({ seconds: 0, requests: 0 })
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const frameTitle = title ?? FALLBACK_TITLE
  const watchUrl = siteConfig.video.watchUrl

  /**
   * Pressing play unmounts the button the reader just activated. Without a
   * new home, keyboard and screen-reader focus falls back to the document
   * body and the reader's place on the page is lost, so focus moves to the
   * player that replaced the control.
   */
  useEffect(() => {
    const sync = () =>
      setOffset(startSeconds && startSeconds > 0 ? Math.floor(startSeconds) : startFromLocation())

    setScripted(true)
    // Read after hydration, so the route stays prerendered and the markup the
    // server sent still matches what the browser first renders.
    sync()

    // And again on Back. The href comes from state and the click reads the
    // address bar live, so they agree only while the history is moving
    // forward: pressing Back after a timestamp left the href pointing at the
    // moment the reader had just undone, while a plain click on the same
    // element went where the URL now said. That is the divergence this href
    // was rewritten to close, with the polarity reversed.
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [startSeconds])

  useEffect(() => {
    if (activated) iframeRef.current?.focus()
  }, [activated])

  /**
   * Seek when a transcript timestamp is followed after the player is running.
   *
   * `start` is read once, when play is pressed. That was the whole story while
   * the only way to reach a timestamp was before playing; in the order a reader
   * actually uses the page — press play, watch, scroll down, click a timestamp
   * — the iframe `src` came out byte-identical, so the video carried on exactly
   * where it was while the page pulled the reader back up to the player. One
   * control did two different things depending on invisible prior state, and
   * failed silently in the commoner order.
   *
   * The event rather than the query string: `/watch/` is prerendered, and
   * reading `?t=` here after hydration would make the whole route render on
   * demand to serve a control that only exists once scripting has run.
   */
  useEffect(() => {
    const onSeek = (event: Event) => {
      const seconds = (event as CustomEvent<unknown>).detail
      if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return
      const whole = Math.floor(seconds)
      // Both, always. The offset is what the poster links to, and it has to
      // track the timestamps a reader presses whether or not the player is
      // running — the effect that reads the address bar runs once at mount,
      // and a timestamp is a soft navigation that never remounts this.
      setOffset(whole)
      setSeek(previous => ({ seconds: whole, requests: previous.requests + 1 }))
    }
    window.addEventListener(VIDEO_SEEK_EVENT, onSeek)
    return () => window.removeEventListener(VIDEO_SEEK_EVENT, onSeek)
  }, [])

  /**
   * Transcript timestamps are `?t=` links, so a reader who arrives through one
   * and then presses play should start there. The query is read at the moment
   * of activation rather than during render, which keeps the page statically
   * rendered and avoids any hydration mismatch. (The chapters nav above the
   * transcript uses plain `#` anchors and does not come through here.)
   */
  function resolveStart(): number {
    if (typeof startSeconds === 'number' && startSeconds > 0) {
      return Math.floor(startSeconds)
    }
    return startFromLocation()
  }

  /**
   * Where the poster goes when it is followed as a link.
   *
   * It was a constant, so every path that does not run the click handler —
   * Ctrl or middle click, "open in new tab", dragging the link, the status bar
   * a reader reads before deciding — offered the video from the beginning,
   * while a plain click on the very same element in the very same state
   * correctly started at the requested moment. Thirty-eight of the thirty-nine
   * transcript timestamps disagreed with their own poster.
   */
  const posterHref = offset > 0 ? `${watchUrl}?t=${offset}` : watchUrl

  const source = [
    `${siteConfig.video.embedHost}/embed/${siteConfig.video.youtubeId}`,
    `?autoplay=1&rel=0${seek.seconds > 0 ? `&start=${seek.seconds}` : ''}`,
  ].join('')

  return (
    // `tabIndex={-1}` so a link elsewhere on the page can move focus here
    // without the player becoming a tab stop of its own. See
    // `FocusOnArrivalLink`, which the transcript timestamps use.
    <div className={className} id={id} tabIndex={-1}>
      <div className="video-embed relative aspect-video w-full overflow-hidden rounded-md border border-border bg-panel print:hidden">
        {activated ? (
          <iframe
            // Keyed on the request count, so a seek to the offset already
            // playing still reloads the frame rather than being dropped.
            key={seek.requests}
            ref={iframeRef}
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
          <PosterControl
            scripted={scripted}
            watchUrl={posterHref}
            title={title}
            durationSeconds={durationSeconds}
            onPlay={() => {
              setSeek({ seconds: resolveStart(), requests: 0 })
              setActivated(true)
            }}
          />
        )}
      </div>

      <p className="mt-3 mb-0 font-sans text-[0.86rem] leading-snug text-ink-muted">
        This video is loaded from YouTube only when you choose to play it. Nothing is requested from
        YouTube before then, and the privacy-enhanced player is used when it is.{' '}
        <NewTabLink href={watchUrl} showsUrl>
          Watch it on YouTube directly: {watchUrl}
        </NewTabLink>
      </p>
    </div>
  )
}

/**
 * The poster: always a link to the video, upgraded in place when it can be.
 *
 * Without scripting it is exactly what it looks like — a link that opens the
 * video. It used to be a `button` there, an 830x466 control that produced no
 * request, no iframe and no explanation when pressed.
 *
 * Rendering a link and swapping it for a button after hydration would fix that
 * and introduce something subtler: the swap replaces the DOM node, so a reader
 * who had already focused the poster loses focus to the body, and anything
 * holding a reference to it is dropped. (The keyboard-reachability test caught
 * this as a flake before a reader could.) One element throughout, with the
 * click intercepted once the script that can load the player in place has run,
 * has neither problem. It is the same shape as the search trigger, which is a
 * link to `/search/` until it can open the dialog instead.
 */
function PosterControl({
  scripted,
  watchUrl,
  title,
  durationSeconds,
  onPlay,
}: {
  scripted: boolean
  watchUrl: string
  title?: string
  durationSeconds?: number
  onPlay: () => void
}) {
  return (
    // No aria-label: the visible poster text, including the video's title, is
    // the accessible name, so what a speech-input user reads aloud is what the
    // control answers to (WCAG 2.5.3). `video-play` moves the glyph rather than
    // the poster on hover and press: scaling a 16:9 panel would drag its border
    // across the page and shift everything below it.
    <a
      href={watchUrl}
      rel="noopener noreferrer"
      target={scripted ? undefined : '_blank'}
      onClick={event => {
        // Before hydration this is an ordinary link, and a modified click is
        // always a request for the browser's own behaviour.
        if (!scripted || isModifiedClick(event)) return
        event.preventDefault()
        onPlay()
      }}
      className="video-play absolute inset-0 flex min-h-11 w-full cursor-pointer flex-col items-center justify-center gap-3 p-5 text-center text-navy no-underline hover:bg-panel-strong sm:p-8"
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
        {scripted ? 'Press play to load it from YouTube' : 'Watch it on YouTube'}
      </span>
      {scripted ? null : <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}
