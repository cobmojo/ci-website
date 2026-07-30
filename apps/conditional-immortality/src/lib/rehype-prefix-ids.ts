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
 *
 * MDX leaves two node shapes in the tree and both have to be handled. Markdown
 * syntax becomes a hast `element` with its attributes in `properties`; literal
 * JSX stays an `mdxJsxFlowElement` or `mdxJsxTextElement` with an `attributes`
 * array, as `rehypeScrollableTables` documents in its own header.
 */

/** A literal-JSX node, in either of the two shapes MDX produces. */
interface JsxElement {
  type: string
  name?: string | null
  attributes?: JsxAttribute[]
}

interface JsxAttribute {
  type: string
  name?: string | null
  value?: unknown
}

function isJsxElement(node: unknown): node is JsxElement {
  if (typeof node !== 'object' || node === null) return false
  const type = (node as JsxElement).type
  return type === 'mdxJsxFlowElement' || type === 'mdxJsxTextElement'
}

/**
 * Is this JSX node a plain HTML element rather than a React component?
 *
 * JSX draws the line already: a lower-case tag name is an intrinsic element, a
 * capitalised one is a component. It matters here because `<Cite id="…">` is a
 * key into the source registry rather than an HTML id, and prefixing it would
 * break the citation.
 */
function isIntrinsicElement(node: JsxElement): boolean {
  const name = node.name
  if (typeof name !== 'string' || name.length === 0) return false
  // A fragment (`<>`) has a null name; a member expression (`<Foo.Bar>`) is a
  // component either way.
  if (name.includes('.')) return false
  return name[0] === name[0]?.toLowerCase()
}

const ARIA_ID_REFERENCES = ['ariaLabelledBy', 'ariaDescribedBy', 'ariaControls']
/** The same attributes as authors write them in literal JSX. */
const ARIA_ID_REFERENCES_JSX = ['aria-labelledby', 'aria-describedby', 'aria-controls']

export function rehypePrefixIds(prefix: string) {
  const namespaced = (value: string) => `${prefix}-${value}`
  const namespacedTokens = (value: string) =>
    value
      .split(/\s+/)
      .filter(Boolean)
      .map(token => namespaced(token))
      .join(' ')

  /** A fragment link into this same document, as opposed to `#` or another page. */
  const isInPageFragment = (href: string) => href.startsWith('#') && href.length > 1

  return (tree: Root) => {
    visit(tree, (node: unknown) => {
      if (isJsxElement(node)) {
        if (!isIntrinsicElement(node)) return
        for (const attribute of node.attributes ?? []) {
          // An expression value is code; rewriting it would be guesswork.
          if (attribute.type !== 'mdxJsxAttribute' || typeof attribute.value !== 'string') continue

          if (attribute.name === 'id' && attribute.value.length > 0) {
            attribute.value = namespaced(attribute.value)
          } else if (
            attribute.name === 'href' &&
            node.name === 'a' &&
            isInPageFragment(attribute.value)
          ) {
            attribute.value = `#${namespaced(attribute.value.slice(1))}`
          } else if (
            attribute.name &&
            ARIA_ID_REFERENCES_JSX.includes(attribute.name) &&
            attribute.value.length > 0
          ) {
            attribute.value = namespacedTokens(attribute.value)
          }
        }
        return
      }

      const element = node as Element
      if (element.type !== 'element') return
      const properties = element.properties
      if (!properties) return

      if (typeof properties.id === 'string' && properties.id.length > 0) {
        properties.id = namespaced(properties.id)
      }

      if (element.tagName === 'a' && typeof properties.href === 'string') {
        if (isInPageFragment(properties.href)) {
          properties.href = `#${namespaced(properties.href.slice(1))}`
        }
      }

      // Keep ARIA relationships pointing at the ids we just renamed.
      const bag = properties as Record<string, unknown>
      for (const attribute of ARIA_ID_REFERENCES) {
        const value = bag[attribute]
        if (typeof value === 'string' && value.length > 0) {
          bag[attribute] = namespacedTokens(value)
        }
      }
    })
  }
}
