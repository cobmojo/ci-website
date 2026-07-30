import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { RelatedPages } from '@/components/navigation/related-pages'
import { formatLongDate } from '@/lib/format'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'
import { siteConfig } from '@/lib/site-config'

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/about/', label: 'About' },
]

export const metadata = pageMetadata({
  title: 'About',
  description:
    'Who wrote this, how he came to hold the conditionalist position after about thirty-five years teaching the traditional view, what the site is for, and how to reach the author.',
  route: '/about/',
})

export default function AboutPage() {
  const author = siteConfig.author.name
  const started = siteConfig.sourceDocument.startedOn

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <div className="max-w-[var(--spacing-measure)]">
          <header className="mb-8">
            <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
              How this was made
            </p>
            <h1 className="mt-0 mb-4">About</h1>
            <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
              This site presents one person’s case, made from Scripture, published so that it can be
              examined and corrected.
            </p>
          </header>

          <div className="space-y-10 text-[1.06rem] leading-[1.68]">
            <section aria-labelledby="author">
              <h2 id="author" className="mt-0 mb-3">
                Who wrote this
              </h2>
              <p className="m-0 mb-3">
                {author} wrote the document this site is built from. He is not an academic
                theologian, a pastor, or a scholar of Greek or Hebrew, and the site does not ask to
                be read as though he were. It asks to be read on its arguments and its citations,
                which are set out so that they can be checked.
              </p>
              <p className="m-0">
                Where a claim needs training he does not have, the page says so and carries the
                specialist review pending label. The reasoning behind that practice is on the{' '}
                <Link href="/method/">method page</Link>.
              </p>
            </section>

            <section aria-labelledby="story">
              <h2 id="story" className="mt-0 mb-3">
                How he came to this position
              </h2>
              <p className="m-0 mb-3">
                For the first thirty-five years of his life he was in churches that taught eternal
                conscious torment, and he taught it himself. He had come to terms with it. He knew
                the standard answers to the standard objections and he gave them.
              </p>
              <p className="m-0 mb-3">
                He was not looking for a gentler doctrine. That matters, because the most common
                explanation offered for conditional immortality is that its holders find hell
                distasteful and have gone looking for an exit. He was not troubled enough by the
                traditional view to go looking for anything.
              </p>
              <p className="m-0 mb-3">
                In November 2022 he came across the conditionalist position through material by
                Preston Sprinkle. His first reaction was scepticism. It sounded like the kind of
                thing people believe because they want to believe it, and he expected the biblical
                argument to be thin.
              </p>
              <p className="m-0 mb-3">
                What changed his mind was reading the texts. Not one decisive passage, but the
                accumulation: the language Scripture actually uses for the end of the wicked, the
                stated penalty for sin, the pattern of judgment from Genesis to Revelation, and the
                way the passages usually cited for endless torment read when each is taken in its
                own context. He worked through that material and found the cumulative case stronger
                than the one he had held for decades.
              </p>
              <p className="m-0 mb-3">
                He began writing it down on{' '}
                <time dateTime={started}>{formatLongDate(started)}</time>, first for himself and
                then for the people who kept asking him about it. That document, revised and
                extended over the following years, is the source of everything on this site. It is
                described on the <Link href="/original-document/">original document</Link> page.
              </p>
              <p className="m-0">
                His own summary of the position he is in is worth keeping in his words: either he
                was wrong for thirty-plus years, or he is wrong now, or both. That is why this site
                is built to be corrected rather than defended.
              </p>
            </section>

            <section aria-labelledby="purpose">
              <h2 id="purpose" className="mt-0 mb-3">
                What this site is for
              </h2>
              <p className="m-0 mb-3">
                The document was a fifty-two page file passed between people, with no way to check a
                citation, no record of what had been changed, and no way for a reader to send back a
                correction that anyone else would ever see. This site exists to fix those four
                problems.
              </p>
              <ul className="m-0 mb-3 list-disc space-y-2 pl-6">
                <li>
                  Every argument is on a page of its own, with its Scripture references, its
                  sources, and a plain statement of what it does and does not establish.
                </li>
                <li>
                  Every source is in a library with its rights status and the date its link was last
                  checked.
                </li>
                <li>
                  Every change since publication is in a public changelog, including the changes
                  that made the case weaker.
                </li>
                <li>
                  Every reader can send a correction, and accepted corrections are published with
                  the reasoning.
                </li>
              </ul>
              <p className="m-0">
                The aim is not to win the argument by volume. It is to state the case as carefully
                as it can be stated and then make it as easy as possible to show where it is wrong.
              </p>
            </section>

            <section aria-labelledby="position">
              <h2 id="position" className="mt-0 mb-3">
                What kind of case this is
              </h2>
              <p className="m-0 mb-3">
                This is an evangelical biblical case. It assumes the authority of Scripture and
                argues within it. It affirms that final judgment is real, that it is conscious, that
                it is just, that it is deserved, and that it is permanent and irreversible. The
                disagreement with the traditional view is about what that judgment finally is, not
                about whether it happens.
              </p>
              <p className="m-0 mb-3">
                It is not universalism. It does not teach a second chance after death, and the pages
                that touch those questions say so directly.
              </p>
              <p className="m-0">
                It is also not a claim to have settled the matter. Conditionalists differ among
                themselves on several of the readings presented here, and where that is true the
                page says so.
              </p>
            </section>

            <section aria-labelledby="independence">
              <h2 id="independence" className="mt-0 mb-3">
                Independence
              </h2>
              <p className="m-0 mb-3">
                This site is the work of one person. It is not published by, funded by, endorsed by,
                or affiliated with any church, denomination, ministry, publisher, institution or
                organisation.
              </p>
              <p className="m-0">
                Writers, teachers and scholars are cited throughout, on both sides of the question.
                Citing someone is not a claim that they endorse this site, this author, or the
                conclusion argued here. That includes Preston Sprinkle, whose material is described
                above only as how the author first encountered the position.
              </p>
            </section>

            <section aria-labelledby="contact">
              <h2 id="contact" className="mt-0 mb-3">
                How to make contact
              </h2>
              <p className="m-0 mb-3">
                Everything goes through the <Link href="/corrections/">corrections form</Link>.
                Factual corrections, better sources, translation and language corrections,
                historical corrections, accessibility problems, broken links, typographical errors
                and serious counterarguments are all welcome there, and the form is the only route
                in.
              </p>
              <p className="m-0">
                The source document carried a personal email address and phone number. Neither is
                published here, and a check that runs on every build fails if either ever appears in
                the output. The reasoning is recorded in the{' '}
                <Link href="/changelog/">changelog</Link> and on the{' '}
                <Link href="/privacy/">privacy page</Link>.
              </p>
            </section>
          </div>

          <RelatedPages>
            <li>
              <Link href="/start/">Start here, if you are new to the question</Link>
            </li>
            <li>
              <Link href="/method/">The editorial method in full</Link>
            </li>
            <li>
              <Link href="/corrections/">Send a correction or a counterargument</Link>
            </li>
          </RelatedPages>
        </div>
      </div>
    </>
  )
}
