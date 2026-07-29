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

  const label = locator ? `${formatCitation(source)}. ${locator}` : formatCitation(source)

  return (
    <a
      href={`/sources/#${source.id}`}
      className="ml-0.5 font-sans text-[0.72em] align-super no-underline text-copper-deep hover:underline"
      aria-label={`Source: ${label}`}
      title={label}
    >
      [{source.author ? source.author.split(' ').pop() : source.title.split(' ')[0]}
      {locator ? `, ${locator}` : ''}]
    </a>
  )
}
