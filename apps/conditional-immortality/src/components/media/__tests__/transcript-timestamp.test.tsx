import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VIDEO_SEEK_EVENT } from '@/components/media/click-to-load-video'
import { TranscriptTimestamp } from '@/components/media/transcript-timestamp'

/**
 * A timestamp has to work in both of the states a reader meets it in.
 *
 * Before the player has been activated — and with no scripting at all — it is
 * an ordinary link, and `?t=` is read when play is pressed. Afterwards it has
 * to seek, which is the order the page is actually used in: press play, watch,
 * scroll into the transcript, press a timestamp. Without the seek the iframe
 * was rebuilt with an identical `src`, so the video carried on exactly where
 * it was while the page pulled the reader back up to the player, and nothing
 * said the seek had not happened.
 */

vi.mock('next/link', () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
    // biome-ignore lint/a11y/useValidAnchor: a stand-in for next/link in a unit test
    <a {...props}>{children}</a>
  ),
}))

let seeks: number[]
/* Held so it can be removed again: a listener left on `window` outlives the
   test that added it, and the next one then counts every seek twice. */
let record: EventListener

beforeEach(() => {
  seeks = []
  record = event => {
    seeks.push((event as CustomEvent<number>).detail)
  }
  window.addEventListener(VIDEO_SEEK_EVENT, record)

  const player = document.createElement('div')
  player.id = 'video-player'
  player.tabIndex = -1
  player.getBoundingClientRect = () => ({ top: 10, bottom: 200 }) as DOMRect
  player.focus = () => {}
  document.body.append(player)

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0)
    return 0
  })
})

afterEach(() => {
  window.removeEventListener(VIDEO_SEEK_EVENT, record)
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('TranscriptTimestamp', () => {
  it('is a real link carrying the position, so it works before the player exists', () => {
    render(<TranscriptTimestamp seconds={754}>12:34</TranscriptTimestamp>)
    // The fragment is what takes the reader to the player; `?t=` is what the
    // player reads when it is finally activated.
    expect(screen.getByRole('link', { name: '12:34' }).getAttribute('href')).toBe(
      '?t=754#video-player',
    )
  })

  it('asks a player that is already running to seek, rather than rebuilding it', () => {
    render(<TranscriptTimestamp seconds={754}>12:34</TranscriptTimestamp>)
    fireEvent.click(screen.getByRole('link', { name: '12:34' }))
    expect(seeks).toEqual([754])
  })

  it('asks for the position it shows, on every press', () => {
    render(
      <>
        <TranscriptTimestamp seconds={0}>00:00</TranscriptTimestamp>
        <TranscriptTimestamp seconds={1_651}>27:31</TranscriptTimestamp>
      </>,
    )
    fireEvent.click(screen.getByRole('link', { name: '27:31' }))
    fireEvent.click(screen.getByRole('link', { name: '00:00' }))
    // Zero is a real position and must not be swallowed by a falsy check.
    expect(seeks).toEqual([1_651, 0])
  })

  it('asks for nothing when the reader is opening it somewhere else', () => {
    render(<TranscriptTimestamp seconds={754}>12:34</TranscriptTimestamp>)
    fireEvent.click(screen.getByRole('link', { name: '12:34' }), { ctrlKey: true })
    expect(seeks, 'the video in this tab jumped for a click meant for another').toEqual([])
  })

  it('passes the caller’s classes through, so the transcript styles it', () => {
    render(
      <TranscriptTimestamp seconds={12} className="tabular-nums">
        00:12
      </TranscriptTimestamp>,
    )
    expect(screen.getByRole('link', { name: '00:12' }).className).toContain('tabular-nums')
  })
})
