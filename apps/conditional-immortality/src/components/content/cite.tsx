import { formatCitation, getSource } from '@ci/content/sources'

/**
 * An inline citation.
 *
 * Renders a superscript marker linking to the source library entry. Authors
 * reference sources by id, so a typo fails the build rather than producing a
 * dangling citation, and no bare URL ever appears in prose.
 */
export function Cite({ id, locator }: { id: string; locator?: string }) {
  const source = getSource(id)
  if (!source) {
    throw new Error(
      `Unknown source id "${id}" in a <Cite>. Add it to packages/ci-content/src/sources/sources.ts.`,
    )
  }

  /**
   * The visible marker, built once and used twice.
   *
   * WCAG 2.2 SC 2.5.3 Label in Name asks that a control's accessible name
   * contain its visible text, so that someone saying "click Dear page 76" is
   * saying something their speech software can match. The accessible name used
   * to be `Source: ${formatCitation(source)}. ${locator}` — a full citation
   * that interleaves the publication and the year between the author's name
   * and the locator, so the visible "Dear, page 76" appeared nowhere in it as
   * a contiguous string.
   *
   * Putting the marker first fixes that without shortening what a screen
   * reader hears: the full citation still follows.
   */
  const marker = `${source.author ? source.author.split(' ').pop() : source.title.split(' ')[0]}${
    locator ? `, ${locator}` : ''
  }`

  /*
   * The locator is said once, in the marker.
   *
   * `formatCitation` appends the record's own locator, and the marker already
   * carries the one this citation passes, so composing the two said it twice —
   * three times where a record has a locator and the citation passes one as
   * well. The tail therefore drops it, and so does the tooltip, which is also
   * the accessible description and was repeating it for the same reason.
   */
  const citation = formatCitation(source, { includeLocator: false })
  return (
    <a
      href={`/sources/#${source.id}`}
      className="ml-0.5 font-sans text-[0.72em] align-super no-underline text-copper-deep hover:underline"
      aria-label={`${marker}. Source: ${citation}`}
      title={`${marker}. ${citation}`}
    >
      [{marker}]
    </a>
  )
}
