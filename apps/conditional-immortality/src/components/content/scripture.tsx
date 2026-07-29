import { requireScripture, WEB_TRANSLATION, WEB_TRANSLATION_SHORT } from '@ci/content/scripture'
import Link from 'next/link'
import { passageBySlugOrReference } from '@/lib/passages'

/**
 * A Scripture display.
 *
 * Authors write only the reference. The text is rendered from the verified
 * public-domain corpus, so no verse can be misquoted, and the translation and
 * rights line is generated rather than typed.
 *
 * The World English Bible is used for full displays because this site quotes
 * Scripture at reference-work scale, well beyond what incidental-quotation
 * allowances for copyrighted modern translations would cover.
 */
export function Scripture({
  reference,
  verseNumbers = true,
  className,
}: {
  reference: string
  verseNumbers?: boolean
  className?: string
}) {
  const passage = requireScripture(reference)
  const passagePage = passageBySlugOrReference(reference)

  return (
    <figure
      className={`scripture-block my-6 rounded-md border-l-[3px] border-copper/50 bg-paper-raised px-4 py-4 sm:px-5 ${className ?? ''}`}
    >
      <blockquote className="m-0 text-[1.04rem] leading-[1.62]">
        {passage.verses.map(verse => (
          <span key={verse.verse}>
            {verseNumbers && passage.verses.length > 1 ? (
              <sup
                className="mr-1 font-sans text-[0.68em] font-semibold text-ink-subtle"
                aria-hidden="true"
              >
                {verse.verse}
              </sup>
            ) : null}
            {verse.text}{' '}
          </span>
        ))}
      </blockquote>
      <figcaption className="mt-3 font-sans text-[0.83rem] text-ink-subtle">
        {passagePage ? (
          <Link href={passagePage.route} className="font-medium">
            {passage.reference}
          </Link>
        ) : (
          <span className="font-medium text-ink-muted">{passage.reference}</span>
        )}
        <span aria-hidden="true"> · </span>
        <abbr title={`${WEB_TRANSLATION}, public domain`} className="no-underline">
          {WEB_TRANSLATION_SHORT}
        </abbr>
        <span className="sr-only">, {WEB_TRANSLATION}, which is in the public domain</span>
      </figcaption>
    </figure>
  )
}

/**
 * A short inline quotation from a copyrighted modern translation, used only
 * where the argument turns on that specific rendering. Kept deliberately
 * brief and always attributed.
 */
export function TranslationNote({
  translation,
  children,
}: {
  translation: string
  children: React.ReactNode
}) {
  return (
    <span className="whitespace-normal">
      <q className="italic">{children}</q>{' '}
      <span className="font-sans text-[0.82em] text-ink-subtle">({translation})</span>
    </span>
  )
}
