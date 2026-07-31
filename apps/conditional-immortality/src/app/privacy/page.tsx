import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { Link } from '@/components/navigation/link'
import { RelatedPages } from '@/components/navigation/related-pages'
import { formatLongDate } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { siteConfig } from '@/lib/site-config'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/privacy/', label: 'Privacy' },
]

export const metadata = pageMetadata({
  title: 'Privacy',
  description:
    'No analytics, no tracking and no cookies. What the correction form collects, how long it is kept, when YouTube is contacted, and where reading progress is stored.',
  route: '/privacy/',
})

export default function PrivacyPage() {
  const embedHost = siteConfig.video.embedHost.replace(/^https:\/\//, '')

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
            <h1 className="mt-0 mb-4">Privacy</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              Reading this site is anonymous. Nothing you read, search for or open is recorded, and
              the only information the site ever receives is what you deliberately type into the
              correction form.
            </p>
          </header>

          <div className="space-y-10 text-[1.06rem] leading-[1.68]">
            <section aria-labelledby="summary">
              <h2 id="summary" className="mt-0 mb-3">
                The short version
              </h2>
              <ul className="m-0 list-disc space-y-2 pl-6">
                <li>No analytics of any kind, and no third-party tracking.</li>
                <li>No cookies are set by this site, so there is no cookie banner to dismiss.</li>
                <li>No account, no login, no advertising, and nothing is sold or shared.</li>
                <li>
                  One external service exists, the video, and it is contacted only after you press
                  play.
                </li>
                <li>
                  The search box in the header matches inside your browser, and nothing you type
                  into it leaves your device. The full search page is an ordinary page request, so
                  its address, which contains your query, reaches this server like any other.
                </li>
                <li>
                  The correction form is the only place the site receives anything, and only what
                  you type.
                </li>
              </ul>
            </section>

            <section aria-labelledby="analytics">
              <h2 id="analytics" className="mt-0 mb-3">
                No analytics and no third-party tracking
              </h2>
              <p className="m-0 mb-3">
                There is no analytics package on this site. No page view counter, no heat map, no
                session recorder, no advertising pixel, no social media widget, no third-party font
                service, no embedded comment system and no tag manager. No third-party script runs
                on any page.
              </p>
              <p className="m-0 mb-3">
                Fonts, styles, images and the search index are all served from this site’s own
                domain. A content security policy is sent with every page which permits scripts,
                styles, fonts and connections from this origin only, so an accidental third-party
                request would be blocked by your browser rather than quietly allowed.
              </p>
              <p className="m-0">
                Like any web server, the hosting provider processes the network requests needed to
                deliver a page. That is unavoidable in order to serve a website at all, and no
                profile, analytics record or reading history is built from it by this site.
              </p>
            </section>

            <section aria-labelledby="cookies">
              <h2 id="cookies" className="mt-0 mb-3">
                No cookies
              </h2>
              <p className="m-0">
                This site sets no cookies. There is no consent banner because there is nothing to
                consent to, and no preference to remember about tracking that does not happen.
              </p>
            </section>

            <section aria-labelledby="video">
              <h2 id="video" className="mt-0 mb-3">
                The video, and when YouTube is contacted
              </h2>
              <p className="m-0 mb-3">
                The overview video is hosted on YouTube. The player is not loaded when a page opens.
                What you see before you press play is a poster and a play control served from this
                site, so opening the watch page contacts nobody but this site.
              </p>
              <p className="m-0 mb-3">
                When you press play, and only then, the player is loaded from{' '}
                <span className="break-all">{embedHost}</span>, YouTube’s privacy-enhanced domain.
                From that point onward your interaction with the video is between you and YouTube,
                under their terms and their privacy policy rather than this one. This site receives
                nothing back: it is not told whether you played the video, how much you watched, or
                whether you stopped.
              </p>
              <p className="m-0">
                If you would rather not contact YouTube at all, the{' '}
                <Link href="/watch/">watch page</Link> carries the full transcript with chapter
                headings, and the whole argument is written out across the case pages.
              </p>
            </section>

            <section aria-labelledby="search">
              <h2 id="search" className="mt-0 mb-3">
                Search runs in your browser
              </h2>
              <p className="m-0 mb-3">
                The search index is a single file downloaded from this site the first time you open
                the search box in the header. Matching happens inside your browser: what you type
                there is never sent anywhere, not to this site and not to anyone else, and it works
                with no network connection once the index has been fetched.
              </p>
              <p className="m-0 mb-3">
                The full search page at <Link href="/search/">/search/</Link> is different, and it
                is fair to say so plainly. It is an ordinary page: your query is part of its web
                address, so it reaches this server the way every address you visit does. That is
                what lets a result page be linked, bookmarked and shared, and what lets search work
                with scripting switched off. Nothing is done with it: no query is logged by this
                application, counted, analysed or kept. It does leave your browser, though, and a
                claim that it does not would be untrue.
              </p>
              <p className="m-0">
                If you would rather a query never left your device, use the search box in the header
                rather than the search page.
              </p>
            </section>

            <section aria-labelledby="storage">
              <h2 id="storage" className="mt-0 mb-3">
                Reading progress stays in your browser
              </h2>
              <p className="m-0 mb-3">
                The case index offers an optional record of which parts you have opened from it. It
                is stored in your browser’s local storage under a single key,{' '}
                <code className="break-all text-[0.95em]">ci:case-reading-progress</code>, and it
                holds nothing but a list of permanent part identifiers such as S04.
              </p>
              <p className="m-0 mb-3">
                It never leaves your device. It is not sent to this site, it is not synchronised
                between devices, and it is not used to build any profile. Clearing it changes
                nothing else about the site.
              </p>
              <p className="m-0">
                There is a Reset reading progress button on the <Link href="/case/">case hub</Link>{' '}
                which removes the key entirely, and clearing site data in your browser has the same
                effect. Nothing else is stored in local storage, session storage or any other
                browser store.
              </p>
            </section>

            <section aria-labelledby="form">
              <h2 id="form" className="mt-0 mb-3">
                The correction form
              </h2>
              <p className="m-0 mb-3">
                The <Link href="/corrections/">corrections form</Link> is the only place this site
                receives information from you, and it receives only what you type into it.
              </p>

              <h3 className="mt-6 mb-2">What it collects</h3>
              <ul className="m-0 mb-3 list-disc space-y-2 pl-6">
                <li>
                  <strong>Required:</strong> the feedback type, your message, and your choice about
                  publication.
                </li>
                <li>
                  <strong>Optional:</strong> a source web address, your name, and your email
                  address. Every one of these can be left empty, and a correction is taken just as
                  seriously without them. If you leave a field empty, nothing is stored in its
                  place.
                </li>
                <li>
                  <strong>Context:</strong> the part identifier of the page you came from, when you
                  arrive from a link on a section page. This is a short code such as S04, and it
                  exists so that a correction can be matched to the page it is about.
                </li>
              </ul>
              <p className="m-0 mb-3">
                Your network address is used for one purpose: limiting how many submissions a single
                connection can send in a ten minute window, which is how the form survives without a
                CAPTCHA. It is held in the server’s memory for the length of that window and is
                never written to disk, never stored beside your submission, and never logged.
              </p>
              <p className="m-0 mb-3">
                Submission contents are never written to a log file or sent to any monitoring
                service. There is no third party involved in receiving, storing or reading a
                submission.
              </p>

              <h3 className="mt-6 mb-2">Who sees it, and for how long</h3>
              <ul className="m-0 mb-3 list-disc space-y-2 pl-6">
                <li>
                  Submissions are read by {siteConfig.author.name} alone. They are not shared,
                  published in full, sold, or used for anything other than deciding whether to
                  change a page.
                </li>
                <li>
                  A submission is kept while it is being considered and is deleted within
                  twenty-four months of being resolved.
                </li>
                <li>
                  If a correction is accepted, the resulting change is published in the{' '}
                  <Link href="/changelog/">changelog</Link> as a description of the issue and the
                  decision. Your name appears only if you asked for credit on the form, and your
                  email address never appears.
                </li>
                <li>
                  If you gave an email address and want your submission deleted before then, send a
                  second submission saying so and it will be removed.
                </li>
              </ul>
              <p className="m-0">
                There is no CAPTCHA on the form. A hidden field that only automated clients fill in
                and the rate limit described above do that job instead, because a visual puzzle
                would exclude some of the readers most likely to have something worth saying.
              </p>
            </section>

            <section aria-labelledby="author-contact">
              <h2 id="author-contact" className="mt-0 mb-3">
                The author’s own contact details
              </h2>
              <p className="m-0 mb-3">
                The source document behind this site opens with a personal email address and phone
                number. Neither is published here, anywhere, and that is deliberate. A private
                address on a public page is harvested within days and stays harvested for years.
              </p>
              <p className="m-0">
                A check runs on every build and fails it if either detail ever appears in the
                output. The corrections form exists in their place, and the reasoning is recorded in
                the <Link href="/changelog/">changelog</Link> and on the{' '}
                <Link href="/original-document/">original document</Link> page.
              </p>
            </section>

            <section aria-labelledby="changes">
              <h2 id="changes" className="mt-0 mb-3">
                Changes to this page
              </h2>
              <p className="m-0">
                If this ever stops being accurate, the page will be changed and the change will
                appear in the <Link href="/changelog/">changelog</Link> like any other. Last
                reviewed{' '}
                <time dateTime={siteConfig.lastSubstantivelyUpdated}>
                  {formatLongDate(siteConfig.lastSubstantivelyUpdated)}
                </time>
                .
              </p>
            </section>
          </div>

          <RelatedPages>
            <li>
              <Link href="/corrections/">Send a correction</Link>
            </li>
            <li>
              <Link href="/accessibility/">What has been tested for accessibility</Link>
            </li>
            <li>
              <Link href="/original-document/">
                What is published from the source, and what is not
              </Link>
            </li>
          </RelatedPages>
        </div>
      </div>
    </>
  )
}
