import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * Namespace every id and in-page link within one rendered body.
 *
 * The continuous edition renders all forty sections into a single document,
 * and they share heading text by design: nearly every one has an "In brief"
 * and a "Sources and notes". Slugged independently that produces forty
 * elements with the same id, so the browser scrolls to the first match and
 * every link into a later section silently lands in section one.
 *
 * Prefixing with the permanent section id keeps each anchor addressable, and
 * rewriting the fragment links in the same pass keeps them pointing at the
 * copy in their own section rather than at section one's.
 *
 * Only same-document fragment links are rewritten. A link to another page,
 * with or without a fragment, is left exactly as it is.
 */
export function rehypePrefixIds(prefix: string) {
  const namespaced = (value: string) => `${prefix}-${value}`

  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      const properties = node.properties
      if (!properties) return

      if (typeof properties.id === 'string' && properties.id.length > 0) {
        properties.id = namespaced(properties.id)
      }

      if (node.tagName === 'a' && typeof properties.href === 'string') {
        const href = properties.href
        if (href.startsWith('#') && href.length > 1) {
          properties.href = `#${namespaced(href.slice(1))}`
        }
      }

      // Keep ARIA relationships pointing at the ids we just renamed.
      const bag = properties as Record<string, unknown>
      for (const attribute of ['ariaLabelledBy', 'ariaDescribedBy', 'ariaControls']) {
        const value = bag[attribute]
        if (typeof value === 'string' && value.length > 0) {
          bag[attribute] = value
            .split(/\s+/)
            .map((token: string) => namespaced(token))
            .join(' ')
        }
      }
    })
  }
}
