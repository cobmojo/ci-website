import { siteConfig } from './site-config'

const LONG_DATE = new Intl.DateTimeFormat(siteConfig.locale, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/** Render an ISO calendar date as prose, pinned to UTC so SSR and client agree. */
export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  return LONG_DATE.format(new Date(Date.UTC(year, month - 1, day)))
}

/** `1712` -> `28:32`; `65` -> `1:05`. */
export function formatTimestamp(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

/** ISO-8601 duration for `<time datetime>` on transcript timestamps. */
export function isoDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  return `PT${Math.floor(seconds / 60)}M${seconds % 60}S`
}

/**
 * Reading time at 220 words per minute, rounded to the nearest minute with a
 * floor of one. Used for the "approximately N minutes" metadata line.
 */
export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}
