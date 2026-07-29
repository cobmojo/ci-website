import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { formatLongDate } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { siteConfig } from '@/lib/site-config'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/accessibility/', label: 'Accessibility' },
]

export const metadata = pageMetadata({
  title: 'Accessibility',
  description:
    'What has actually been tested on this site, what is known not to work well, the standard being aimed at, and how to report an accessibility problem.',
  route: '/accessibility/',
})

interface TestedItem {
  readonly id: string
  readonly title: string
  readonly detail: string
}

const TESTED: readonly TestedItem[] = [
  {
    id: 'keyboard',
    title: 'Keyboard navigation',
    detail:
      'Every page was walked from the first tab stop to the last using the keyboard alone. Every link, button, form control and disclosure can be reached and operated without a pointing device, the focus ring is never removed, and the tab order follows the reading order. A skip link is the first focusable element on every page and moves focus to the main content.',
  },
  {
    id: 'dialogs',
    title: 'Focus management in dialogs',
    detail:
      'The search panel and the narrow-screen navigation both use the native dialog element, so focus containment and the Escape key are handled by the browser rather than by hand-written key handlers. Both return focus to the control that opened them when they close, which browsers do not guarantee on their own. Both were checked by opening and closing them with the keyboard alone.',
  },
  {
    id: 'headings',
    title: 'Heading order and page structure',
    detail:
      'Each page has exactly one first-level heading and its heading levels descend without skipping. Headings were checked page type by page type, and heading level is chosen by position in the document outline rather than by how large the text should look.',
  },
  {
    id: 'landmarks',
    title: 'Landmarks and labelled regions',
    detail:
      'Every page exposes a banner, a main region, a content-info footer, and named navigation regions. Where more than one navigation exists on a page, each carries its own accessible name, so a screen reader user can tell the breadcrumb from the chapter list from the on-this-page list.',
  },
  {
    id: 'reflow',
    title: 'Reflow at 320 CSS pixels',
    detail:
      'Pages were checked at 320 CSS pixels wide, which is the reflow requirement in the standard, and at 400 per cent zoom. Nothing requires horizontal scrolling of the page itself. Wide tables scroll horizontally inside their own container instead of widening the page, and long Greek transliterations, checksums and web addresses are allowed to break rather than push the layout out.',
  },
  {
    id: 'colour',
    title: 'Colour independence and contrast',
    detail:
      'Nothing on this site conveys meaning by colour alone. Every evidence role, review status, comparison and change type carries its own words, and the badges add a text glyph as well. Body text, headings and interface text were checked against the contrast requirement for their size, and pages were reviewed in greyscale to confirm that nothing became ambiguous.',
  },
  {
    id: 'motion',
    title: 'Reduced motion',
    detail:
      'There is almost no motion here to begin with: no carousels, no parallax, no animated illustrations, no auto-playing video. What little transition exists is reduced to effectively nothing when the operating system reports a preference for reduced motion, and that rule was verified with the preference switched on.',
  },
  {
    id: 'languages',
    title: 'Greek and Hebrew language attributes',
    detail:
      'Original-language text is marked with its own language attribute, so a screen reader announces Greek with Greek pronunciation rules and Hebrew with Hebrew ones rather than reading them as broken English. Hebrew is set right to left and isolated so that it cannot corrupt the direction of the surrounding sentence. Every occurrence carries a transliteration and a gloss in English, so no argument depends on reading either script.',
  },
  {
    id: 'print',
    title: 'Print output',
    detail:
      'Printed pages were checked on paper. Navigation, dialogs, search controls and the video embed are removed. The argument, the Scripture quotations, the citations and the source list remain, disclosures are opened so that nothing is lost inside a collapsed section, and external link destinations are printed after the link text so a printed page remains checkable.',
  },
  {
    id: 'automated',
    title: 'Automated checks',
    detail:
      'Automated checks with the axe rule set cover representative pages of each type: the homepage, a case section, a passage page, an index page, the corrections form and this page. They are part of the project’s test suite rather than a one-off audit, so a regression shows up in a test run rather than waiting to be noticed by a reader.',
  },
]

interface Limitation {
  readonly id: string
  readonly title: string
  readonly detail: string
}

const LIMITATIONS: readonly Limitation[] = [
  {
    id: 'no-audit',
    title: 'No independent audit',
    detail:
      'This site has not been audited by an independent accessibility specialist, and no formal conformance evaluation has been carried out. Everything on this page is the result of testing done by the people who built it.',
  },
  {
    id: 'screen-readers',
    title: 'Limited screen reader coverage',
    detail:
      'Screen reader testing has been limited in scope. Behaviour with combinations that were not tested may differ, particularly around the tables, the disclosure sections and the search panel. Reports about a specific screen reader and browser combination are especially useful.',
  },
  {
    id: 'tables',
    title: 'Wide tables scroll sideways',
    detail:
      'Several tables carry comparisons that genuinely need three or four columns. On a narrow screen those tables scroll horizontally inside their own container. That is a real cost for some readers, and the compromise was chosen over splitting a comparison into pieces that can no longer be compared.',
  },
  {
    id: 'video',
    title: 'The video player is a third party',
    detail:
      'The overview video is hosted on YouTube and its player is not under this site’s control, so its keyboard behaviour and its own controls cannot be corrected here. Nothing on this site requires watching it: the full transcript, the chapter list and the written case cover the same material.',
  },
  {
    id: 'fonts',
    title: 'Original-language rendering depends on your system',
    detail:
      'Greek and Hebrew are rendered with the fonts your device provides for those scripts. On a system with poor coverage the text may render with substituted glyphs. The transliteration and the English gloss beside every occurrence exist partly for this reason.',
  },
  {
    id: 'automated-limits',
    title: 'Automated checks find only part of the problem',
    detail:
      'Automated tools reliably catch missing names, contrast failures and invalid markup. They cannot tell whether a link makes sense out of context, whether a reading order is meaningful, whether an error message helps, or whether a table caption describes the table. That is why the list above is mostly manual work, and why it is described as testing rather than as conformance.',
  },
]

export default function AccessibilityPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[var(--spacing-measure)]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              This site
            </p>
            <h1 className="mt-0 mb-4">Accessibility</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              This page describes what has actually been tested and what is known not to work well.
              It is not a statement of conformance, and it does not describe intentions.
            </p>
          </header>

          <div className="space-y-10 text-[1.06rem] leading-[1.68]">
            <section aria-labelledby="standard">
              <h2 id="standard" className="mt-0 mb-3">
                The standard being aimed at
              </h2>
              <p className="m-0 mb-3">
                The target is the Web Content Accessibility Guidelines, version 2.2, at Level AA.
                Two decisions go beyond it deliberately: interactive controls are at least
                forty-four pixels in their smallest dimension, which is more than the Level AA
                target size requires, and the focus indicator is never suppressed anywhere.
              </p>
              <p className="m-0 rounded-md border border-ochre/40 bg-ochre-soft p-4">
                <strong className="font-semibold">This is not a conformance claim.</strong> Full
                conformance to a standard is a formal statement backed by a formal evaluation of
                every page against every success criterion. That has not been done here. What
                follows is a description of testing, with its gaps named.
              </p>
            </section>

            <section aria-labelledby="tested">
              <h2 id="tested" className="mt-0 mb-4">
                What has been tested
              </h2>
              <dl className="m-0 space-y-5">
                {TESTED.map(item => (
                  <div
                    key={item.id}
                    id={item.id}
                    className="rounded-md border border-border bg-paper-raised p-4"
                  >
                    <dt className="m-0 font-sans text-[1rem] font-semibold text-navy">
                      {item.title}
                    </dt>
                    <dd className="m-0 mt-2 text-[1.02rem] text-ink-muted">{item.detail}</dd>
                  </div>
                ))}
              </dl>
              <p className="m-0 mt-5">
                Automated checks and manual review are not alternatives to one another. The
                automated checks run on every build and catch regressions quickly; the manual work
                is what establishes whether a page is usable. Both were done, and neither on its own
                would be enough.
              </p>
            </section>

            <section aria-labelledby="limitations">
              <h2 id="limitations" className="mt-0 mb-4">
                Known limitations
              </h2>
              <dl className="m-0 space-y-5">
                {LIMITATIONS.map(item => (
                  <div
                    key={item.id}
                    id={item.id}
                    className="rounded-md border border-border bg-panel/70 p-4"
                  >
                    <dt className="m-0 font-sans text-[1rem] font-semibold text-ink">
                      {item.title}
                    </dt>
                    <dd className="m-0 mt-2 text-[1.02rem] text-ink-muted">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="without-javascript">
              <h2 id="without-javascript" className="mt-0 mb-3">
                Without JavaScript
              </h2>
              <p className="m-0 mb-3">
                The whole case is readable with scripting turned off or unavailable. Pages are
                rendered as HTML, navigation is plain links, and the reading experience does not
                depend on client-side code.
              </p>
              <p className="m-0">
                Three features degrade rather than disappear. The search panel becomes an ordinary
                link to the search page. The narrow-screen menu falls back to the footer, which
                carries the same structure. The corrections form is a real form that posts to the
                server, so a correction can still be sent.
              </p>
            </section>

            <section aria-labelledby="report">
              <h2 id="report" className="mt-0 mb-3">
                Reporting a problem
              </h2>
              <p className="m-0 mb-4">
                Accessibility reports are treated as corrections, which means they go into the same
                queue as a factual error and are published in the changelog when they are acted on.
                Several pages on this site exist in their present form because the original material
                was not accessible, and those changes are recorded as accessibility revisions.
              </p>
              <p className="m-0 mb-4">
                Please say what you were trying to do, what happened, and which browser, operating
                system and assistive technology you were using, including version numbers if you
                have them. A page address helps a great deal.
              </p>
              <p className="m-0 mb-4">
                <Link
                  href="/corrections/?type=accessibility#form"
                  className="inline-flex min-h-11 items-center rounded-md bg-navy px-4 font-sans text-[0.95rem] font-medium text-white no-underline hover:bg-navy-deep"
                >
                  Report an accessibility problem
                </Link>
              </p>
              <p className="m-0 font-sans text-[0.92rem] text-ink-subtle">
                That link opens the corrections form with the accessibility type already selected.
                No email address or account is needed, and nothing about your report is published
                unless you choose it. This page was last reviewed{' '}
                <time dateTime={siteConfig.lastSubstantivelyUpdated}>
                  {formatLongDate(siteConfig.lastSubstantivelyUpdated)}
                </time>
                .
              </p>
            </section>
          </div>

          <nav
            aria-label="Related pages"
            className="mt-12 border-t border-border pt-6 font-sans text-[0.95rem] print:hidden"
          >
            <ul className="m-0 list-none space-y-2 p-0">
              <li>
                <Link href="/privacy/">What this site stores, and what it does not</Link>
              </li>
              <li>
                <Link href="/changelog/">Accessibility changes already made</Link>
              </li>
              <li>
                <Link href="/method/">The editorial method in full</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
