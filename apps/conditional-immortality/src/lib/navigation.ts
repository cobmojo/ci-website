/**
 * Canonical navigation model.
 *
 * Header, mobile sheet, footer and the sitemap all read from here, so a route
 * can never appear in one surface and be missing from another.
 */

export interface NavLink {
  readonly href: string
  readonly label: string
  readonly description?: string
}

/**
 * Whether `pathname` sits inside the section `href` names. Shared by the
 * desktop nav items and the mobile sheet so the two surfaces can never
 * disagree about where the reader is.
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  const normalised = pathname.endsWith('/') ? pathname : `${pathname}/`
  return href === '/' ? normalised === '/' : normalised.startsWith(href)
}

/**
 * The promoted Watch call to action. It appears in the header and again in
 * the mobile sheet; both read from here so the label and the description
 * cannot drift between the two.
 */
export const WATCH_CTA: NavLink = {
  href: '/watch/',
  label: 'Watch the Overview',
  description: '28 minutes, with chapters and a full transcript',
}

/** Deliberately short. Seven items is the ceiling for the desktop header. */
export const PRIMARY_NAV: readonly NavLink[] = [
  { href: '/start/', label: 'Start Here', description: 'Orientation and the three-minute summary' },
  { href: '/case/', label: 'The Case', description: 'All 37 parts in a guided order' },
  { href: '/passages/', label: 'Key Passages', description: 'Passage-by-passage treatments' },
  { href: '/objections/', label: 'Objections', description: 'Direct responses to common concerns' },
  { href: '/scripture/', label: 'Scripture Index', description: 'Every reference in the case' },
  { href: '/sources/', label: 'Sources', description: 'The full source library' },
]

export const FOOTER_NAV: readonly { title: string; links: readonly NavLink[] }[] = [
  {
    title: 'Start here',
    links: [
      {
        href: '/start/what-is-conditional-immortality/',
        label: 'What Is Conditional Immortality?',
      },
      { href: '/start/compare-the-views/', label: 'Compare the Views' },
      { href: '/start/case-map/', label: 'Case Map' },
      { href: '/watch/', label: 'Watch and Transcript' },
    ],
  },
  {
    title: 'Read',
    links: [
      { href: '/case/', label: 'The Case' },
      { href: '/full-case/', label: 'Full Case' },
      { href: '/topics/', label: 'Topics' },
      { href: '/glossary/', label: 'Glossary' },
    ],
  },
  {
    title: 'How this was made',
    links: [
      { href: '/method/', label: 'Method' },
      { href: '/about/', label: 'About' },
      { href: '/corrections/', label: 'Corrections' },
      { href: '/changelog/', label: 'Changelog' },
    ],
  },
  {
    title: 'This site',
    links: [
      { href: '/original-document/', label: 'Original Document' },
      { href: '/download/', label: 'Downloads' },
      { href: '/accessibility/', label: 'Accessibility' },
      { href: '/privacy/', label: 'Privacy' },
    ],
  },
]

/** Every canonical, indexable route that is not generated from content data. */
export const STATIC_ROUTES: readonly string[] = [
  '/',
  '/start/',
  '/start/what-is-conditional-immortality/',
  '/start/compare-the-views/',
  '/start/case-map/',
  '/watch/',
  '/case/',
  '/objections/',
  '/passages/',
  '/scripture/',
  '/topics/',
  '/glossary/',
  '/sources/',
  '/method/',
  '/about/',
  '/corrections/',
  '/changelog/',
  '/original-document/',
  '/download/',
  '/accessibility/',
  '/privacy/',
]

/** Routes that must never be treated as canonical indexable pages. */
export const NOINDEX_ROUTES: readonly string[] = ['/full-case/', '/search/']
