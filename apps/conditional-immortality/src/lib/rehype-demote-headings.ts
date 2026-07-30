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
 * Only standard markdown headings need handling: authored bodies contain no
 * literal `<h2>` JSX (the authoring brief forbids `<h1>` and the components
 * that render headings take their level as a prop).
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
