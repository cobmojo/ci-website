import { glossary, glossaryByLetter } from '@ci/content/glossary'
import { languageNotes } from '@ci/content/language'
import { findPassageByReference, passageRoute } from '@ci/content/passages'
import { getTopic, topicRoute } from '@ci/content/topics'
import {
  REVIEW_STATUS_DEFINITIONS,
  REVIEW_STATUS_LABELS,
  type ReviewStatus,
} from '@ci/content-schema'
import { Badge } from '@ci/ui'
import Link from 'next/link'
import { Breadcrumbs, type Crumb } from '@/components/article/article-chrome'
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/metadata'

/**
 * The glossary and the original-language notes.
 *
 * Glossary entries are deliberately short: a reader who meets an unfamiliar
 * word needs a sentence and a way through to the full treatment. The language
 * notes below are the opposite, and are kept in their own section because they
 * make arguments from Greek and Hebrew that carry a review status of their own.
 */

const CRUMBS: readonly Crumb[] = [
  { href: '/', label: 'Home' },
  { href: '/glossary/', label: 'Glossary' },
]

export const metadata = pageMetadata({
  title: 'Glossary',
  description:
    'Short definitions of the terms used across the case, from annihilationism to the second death, with original-language notes on the Greek and Hebrew words the argument turns on.',
  route: '/glossary/',
})

function OriginalText({ text, lang }: { text: string; lang: 'grc' | 'he' }) {
  if (lang === 'he') {
    return (
      <span lang="he" dir="rtl" className="lang-he">
        {text}
      </span>
    )
  }
  return (
    <span lang="grc" className="lang-grc">
      {text}
    </span>
  )
}

function ReviewStatusMarker({ status }: { status: ReviewStatus }) {
  const needsAttention = status === 'revision-needed' || status === 'specialist-review-pending'
  return (
    <Badge
      tone={needsAttention ? 'ochre' : 'neutral'}
      glyph={needsAttention ? '!' : '✓'}
      title={REVIEW_STATUS_DEFINITIONS[status]}
    >
      {REVIEW_STATUS_LABELS[status]}
    </Badge>
  )
}

function ReferenceLink({ reference }: { reference: string }) {
  const passage = findPassageByReference(reference)
  return passage ? (
    <Link href={passageRoute(passage)}>{reference}</Link>
  ) : (
    <span className="text-ink-muted">{reference}</span>
  )
}

export default function GlossaryPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />

      <div className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs trail={CRUMBS} />

        <header className="max-w-[var(--spacing-measure)]">
          <p className="m-0 mb-2 font-sans text-[0.83rem] font-semibold tracking-wider text-copper-deep uppercase">
            Terms and original languages
          </p>
          <h1 className="mt-0 mb-4">Glossary</h1>
          <p className="m-0 text-[1.13rem] leading-[1.6] text-ink-muted">
            {glossary.length} terms, each in a sentence or two, with a link through to the full
            treatment where one exists. Below them are {languageNotes.length} notes on the Greek and
            Hebrew words the argument actually turns on, each stating the standard range of meaning
            before the argument made from it.
          </p>
        </header>

        <nav
          aria-label="Jump to a letter"
          className="mt-8 rounded-md border border-border bg-paper-raised p-4 print:hidden"
        >
          <h2 className="mt-0 mb-2 font-sans text-[0.78rem] font-semibold tracking-wider text-ink-subtle uppercase">
            Jump to
          </h2>
          {/* Single letters are the smallest targets on the site, so each one
              is given a real hit area rather than the width of its glyph. */}
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0 font-sans text-[0.95rem]">
            {glossaryByLetter.map(group => (
              <li key={group.letter}>
                <a
                  href={`#letter-${group.letter.toLowerCase()}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border px-2 no-underline hover:bg-panel hover:underline"
                >
                  {group.letter}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#language-notes"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-3 no-underline hover:bg-panel hover:underline"
              >
                Language notes
              </a>
            </li>
          </ul>
        </nav>

        {/* ---------------------------------------------------------------- */}

        <section aria-labelledby="terms-title" className="mt-12">
          <h2 id="terms-title" className="mt-0 mb-4 text-[1.3rem]">
            Terms
          </h2>

          {glossaryByLetter.map(group => (
            <section
              key={group.letter}
              id={`letter-${group.letter.toLowerCase()}`}
              aria-labelledby={`letter-${group.letter.toLowerCase()}-title`}
              className="mt-8 first:mt-0"
            >
              <h3
                id={`letter-${group.letter.toLowerCase()}-title`}
                className="mt-0 mb-3 border-b border-border pb-1 font-sans text-[1.05rem] font-semibold text-copper-deep"
              >
                {group.letter}
              </h3>

              <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
                {group.terms.map(term => {
                  const topic = term.topicId ? getTopic(term.topicId) : undefined
                  return (
                    <li
                      key={term.id}
                      id={term.id}
                      className="rounded-md border border-border bg-paper-raised p-5"
                    >
                      <h4 className="mt-0 mb-1 text-[1.05rem]">
                        {term.term}
                        {term.original && term.originalLang ? (
                          <span className="ml-2 font-normal">
                            <OriginalText text={term.original} lang={term.originalLang} />
                          </span>
                        ) : null}
                        {term.transliteration ? (
                          <span className="ml-2 font-sans text-[0.88rem] font-normal text-ink-muted">
                            ({term.transliteration})
                          </span>
                        ) : null}
                      </h4>
                      <p className="m-0 text-[1rem] text-ink-muted">{term.definition}</p>
                      {term.aliases.length > 0 ? (
                        <p className="m-0 mt-2 font-sans text-[0.84rem] text-ink-subtle">
                          Also called: {term.aliases.join(', ')}
                        </p>
                      ) : null}
                      {topic ? (
                        <p className="m-0 mt-3 font-sans text-[0.88rem]">
                          <Link href={topicRoute(topic)}>Full treatment: {topic.title}</Link>
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </section>

        {/* ---------------------------------------------------------------- */}

        <section
          aria-labelledby="language-notes-title"
          id="language-notes"
          className="mt-16 border-t border-border pt-8"
        >
          <h2 id="language-notes-title" className="mt-0 mb-3 text-[1.3rem]">
            Original-language notes
          </h2>
          <p className="m-0 mb-6 text-[1.05rem] text-ink-muted">
            A note exists here only where the case makes an argument from a Greek or Hebrew word.
            Each gives the standard range of meaning first, then the argument made from the word in
            its context, then how other interpreters read the same word. None of them treats a root
            or an etymology as if it settled the meaning, and every one carries its own review
            status.
          </p>

          <ul className="m-0 list-none space-y-6 p-0">
            {languageNotes.map(note => (
              <li
                key={note.id}
                id={`note-${note.id}`}
                className="rounded-md border border-border bg-paper-raised p-5"
              >
                <h3 className="mt-0 mb-2 text-[1.12rem]">
                  <OriginalText text={note.lemma} lang={note.lang} />
                  <span className="ml-2 font-sans text-[0.95rem] font-normal text-ink-muted">
                    {note.transliteration}
                  </span>
                  <span className="ml-2 font-sans text-[0.82rem] font-normal text-ink-subtle">
                    ({note.lang === 'he' ? 'Hebrew' : 'Greek'})
                  </span>
                </h3>

                <div className="mb-3">
                  <ReviewStatusMarker status={note.reviewStatus} />
                </div>

                <dl className="m-0 space-y-3 text-[1rem]">
                  <div>
                    <dt className="font-sans text-[0.84rem] tracking-wide text-ink-subtle uppercase">
                      Usual gloss
                    </dt>
                    <dd className="m-0 mt-0.5">{note.gloss}</dd>
                  </div>

                  <div>
                    <dt className="font-sans text-[0.84rem] tracking-wide text-ink-subtle uppercase">
                      Lexical range
                    </dt>
                    <dd className="m-0 mt-0.5">
                      <ul className="m-0 space-y-1 pl-5">
                        {note.lexicalRange.map(sense => (
                          <li key={sense}>{sense}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>

                  {note.morphology ? (
                    <div>
                      <dt className="font-sans text-[0.84rem] tracking-wide text-ink-subtle uppercase">
                        Morphology
                      </dt>
                      <dd className="m-0 mt-0.5">{note.morphology}</dd>
                    </div>
                  ) : null}

                  <div>
                    <dt className="font-sans text-[0.84rem] tracking-wide text-ink-subtle uppercase">
                      The argument made from this word
                    </dt>
                    <dd className="m-0 mt-0.5 leading-[1.65]">{note.contextualArgument}</dd>
                  </div>

                  <div>
                    <dt className="font-sans text-[0.84rem] tracking-wide text-ink-subtle uppercase">
                      How others read it
                    </dt>
                    <dd className="m-0 mt-0.5">
                      <ul className="m-0 space-y-2 pl-5">
                        {note.competingInterpretations.map(interpretation => (
                          <li key={interpretation}>{interpretation}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>

                  {note.occurrences.length > 0 ? (
                    <div>
                      <dt className="font-sans text-[0.84rem] tracking-wide text-ink-subtle uppercase">
                        Occurrences discussed
                      </dt>
                      <dd className="m-0 mt-0.5">
                        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 font-sans text-[0.92rem]">
                          {note.occurrences.map(reference => (
                            <li key={reference}>
                              <ReferenceLink reference={reference} />
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
