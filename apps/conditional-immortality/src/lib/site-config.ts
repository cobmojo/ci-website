import { resolveSiteUrl } from './site-url'

/**
 * Single source of truth for site identity, metadata and external URLs.
 *
 * The production domain is configurable and, since it decides every canonical
 * URL the build emits, it is validated rather than guessed. `site-url.ts` owns
 * the rules and the failure messages.
 *
 * Each variable is read as a literal `process.env.X` member access, which is
 * what lets Next replace the `NEXT_PUBLIC_` ones with their values in the
 * client bundle. Passing `process.env` itself would defeat that substitution
 * and leave the browser resolving against an empty object.
 */
const siteUrl = resolveSiteUrl({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL: process.env.NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL,
})

export const siteConfig = {
  name: 'The Case for Conditional Immortality',
  shortName: 'Conditional Immortality',
  homepageTitle: 'A Biblical Case for Conditional Immortality',
  description:
    'This site presents a cumulative evangelical case that final judgment is real, conscious, just, and permanent, and that it culminates in the second death rather than endless conscious torment.',
  author: {
    name: 'Phil Welch',
    role: 'Author of the source document',
  },
  url: siteUrl,
  locale: 'en-US',
  language: 'en',
  /** Date of the last substantive editorial review across the whole site. */
  lastSubstantivelyUpdated: '2026-07-29',
  sourceDocument: {
    title:
      'My case for Conditional Immortality/Annihilation (CI) instead of Eternal Conscious Torment (ECT)',
    startedOn: '2023-03-01',
    sha256: 'd3e567fd5a945efb2280d058787e808c86109d5ae848744beffafd45cf09187a',
  },
  video: {
    youtubeId: '9fevXbKUKmE',
    watchUrl: 'https://youtu.be/9fevXbKUKmE',
    /** Privacy-enhanced host. No request is made to it until a visitor presses play. */
    embedHost: 'https://www.youtube-nocookie.com',
  },
  /**
   * Optional. When unset the feedback route stores submissions on disk under
   * `.feedback-store/` and skips notification email entirely.
   */
  feedbackNotifyEmail: process.env.FEEDBACK_NOTIFY_EMAIL ?? null,
} as const

export type SiteConfig = typeof siteConfig

export function absoluteUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${siteConfig.url}${suffix}`
}
