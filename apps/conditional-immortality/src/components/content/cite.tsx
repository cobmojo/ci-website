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

  /*
   * `formatCitation` already ends with the source's own locator when it has
   * one. Appending an identical `locator` prop on top of that said the same
   * words twice inside one citation, and a third time in the marker that leads
   * the accessible name — so a screen reader read "Book II, chapter 34,
   * section 3" three times for a single footnote. A locator that genuinely
   * narrows the source (a page within a book cited whole) is still appended.
   */
  const citation = formatCitation(source)
  const label = locator && locator !== source.locator ? `${citation}. ${locator}` : citation

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

  return (
    <a
      href={`/sources/#${source.id}`}
      className="ml-0.5 font-sans text-[0.72em] align-super no-underline text-copper-deep hover:underline"
      aria-label={`${marker}. Source: ${label}`}
      title={label}
    >
      [{marker}]
    </a>
  )
}
