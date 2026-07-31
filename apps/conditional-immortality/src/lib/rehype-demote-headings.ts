import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * Demote every heading in a rendered body by one level.
 *
 * The continuous edition gives each of the forty sections an `h2` title and
 * then renders the section's MDX body, whose own top-level headings are also
 * written as `##`. Without demotion, "In brief" sits at the same outline
 * level as the section it belongs to, and a screen-reader user walking the
 * heading list of a 54,000-word document cannot tell parts from sub-parts.
 *
 * Only standard markdown headings are handled here, because literal JSX
 * survives the hast tree as `mdxJsxFlowElement` nodes and renders its
 * headings at React time. The components that render their own headings
 * (`Callout`, `ECTReading`, `CIReading`) are demoted by the substitution map
 * in `mdx-content.tsx`, which switches to demoted variants whenever this
 * plugin is active, so the two mechanisms always move together.
 */

const DEMOTION: Record<string, string> = {
  h2: 'h3',
  h3: 'h4',
  h4: 'h5',
  h5: 'h6',
}

export function rehypeDemoteHeadings() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const demoted = DEMOTION[node.tagName]
      if (demoted) node.tagName = demoted
    })
  }
}
