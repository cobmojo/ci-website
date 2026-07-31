'use client'

import type { ReactNode } from 'react'
import { VIDEO_SEEK_EVENT } from '@/components/media/click-to-load-video'
import { FocusOnArrivalLink } from '@/components/navigation/focus-on-arrival-link'

/**
 * A transcript timestamp: a link to the player, and an instruction to seek.
 *
 * The link half is what makes it work without scripting and before the player
 * has been activated — `?t=` is read when play is pressed. The seek half is
 * what makes it work afterwards, which is the order a reader actually uses the
 * page in: press play, watch, scroll into the transcript, click a timestamp.
 * Without it the iframe was rebuilt with an identical `src`, so the video
 * carried on exactly where it was while the page pulled the reader back up to
 * the player, and nothing said the seek had not happened.
 */
export function TranscriptTimestamp({
  seconds,
  className,
  children,
}: {
  seconds: number
  className?: string
  children: ReactNode
}) {
  return (
    <FocusOnArrivalLink
      href={`?t=${seconds}`}
      focusId="video-player"
      className={className}
      onNavigate={() => {
        window.dispatchEvent(new CustomEvent(VIDEO_SEEK_EVENT, { detail: seconds }))
      }}
    >
      {children}
    </FocusOnArrivalLink>
  )
}
