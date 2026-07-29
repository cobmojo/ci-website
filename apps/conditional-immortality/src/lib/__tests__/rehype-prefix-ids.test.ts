import type { Root } from 'hast'
import { describe, expect, it } from 'vitest'
import { rehypePrefixIds } from '../rehype-prefix-ids'

/**
 * MDX leaves two different node shapes in the tree by the time a rehype plugin
 * runs, and they are easy to confuse.
 *
 * Markdown syntax — a `## Heading`, a `[link](#target)` — becomes a hast
 * `element` with its attributes in `properties`. Literal JSX written in the
 * `.mdx` file stays an `mdxJsxFlowElement` or `mdxJsxTextElement` with its
 * attributes in an `attributes` array. A plugin that visits only the first
 * kind silently ignores the second, which is exactly how the sibling
 * `rehypeScrollableTables` was broken once already.
 */

function element(tagName: string, properties: Record<string, unknown>, children: unknown[] = []) {
  return { type: 'element', tagName, properties, children }
}

function jsx(name: string, attributes: Record<string, string>, flow = true) {
  return {
    type: flow ? 'mdxJsxFlowElement' : 'mdxJsxTextElement',
    name,
    attributes: Object.entries(attributes).map(([key, value]) => ({
      type: 'mdxJsxAttribute',
      name: key,
      value,
    })),
    children: [],
  }
}

function run(children: unknown[]): Root {
  const tree = { type: 'root', children } as unknown as Root
  rehypePrefixIds('S04')(tree)
  return tree
}

/** The attributes of a JSX node, back as a plain object. */
function attributesOf(node: unknown): Record<string, unknown> {
  const list = (node as { attributes?: { name?: string; value?: unknown }[] }).attributes ?? []
  return Object.fromEntries(list.map(attribute => [attribute.name, attribute.value]))
}

/** The properties of a hast element node. */
function propertiesOf(node: unknown): Record<string, unknown> {
  return (node as { properties?: Record<string, unknown> }).properties ?? {}
}

describe('rehypePrefixIds on markdown-produced elements', () => {
  it('namespaces an id', () => {
    const tree = run([element('h2', { id: 'in-brief' })])
    expect(propertiesOf(tree.children[0]).id).toBe('S04-in-brief')
  })

  it('namespaces a same-document fragment link', () => {
    const tree = run([element('a', { href: '#in-brief' })])
    expect(propertiesOf(tree.children[0]).href).toBe('#S04-in-brief')
  })

  it('leaves a link to another page alone', () => {
    const tree = run([element('a', { href: '/sources/#dear' }), element('a', { href: '#' })])
    const hrefs = tree.children.map(child => propertiesOf(child).href)
    expect(hrefs).toEqual(['/sources/#dear', '#'])
  })

  it('keeps ARIA references pointing at the renamed ids', () => {
    const tree = run([element('div', { ariaLabelledBy: 'one two' })])
    expect(propertiesOf(tree.children[0]).ariaLabelledBy).toBe('S04-one S04-two')
  })
})

describe('rehypePrefixIds on literal JSX', () => {
  it('namespaces an id on a hand-written HTML element', () => {
    const tree = run([jsx('h2', { id: 'in-brief' })])
    expect(attributesOf(tree.children[0]).id).toBe('S04-in-brief')
  })

  it('namespaces a fragment link on a hand-written anchor', () => {
    const tree = run([jsx('a', { href: '#in-brief' }, false)])
    expect(attributesOf(tree.children[0]).href).toBe('#S04-in-brief')
  })

  it('namespaces an id nested inside literal JSX', () => {
    const table = jsx('table', { id: 'comparison' })
    const tree = run([{ type: 'element', tagName: 'div', properties: {}, children: [table] }])
    const nested = (tree.children[0] as { children: unknown[] }).children[0]
    expect(attributesOf(nested).id).toBe('S04-comparison')
  })

  /**
   * The one that makes this delicate. `<Cite id="dear-bible-teaches-...">` is
   * a source identifier, not an HTML id — the component looks it up in the
   * registry and renders a link to `/sources/#dear-...`. There are over forty
   * of them in the corpus, and prefixing any of them breaks the citation.
   *
   * The rule is the JSX rule: a lower-case tag name is an HTML element and its
   * `id` is an HTML id; a capitalised one is a React component and its props
   * are its own business.
   */
  it('leaves a component prop alone, even when it is called id', () => {
    const tree = run([
      jsx('Cite', { id: 'dear-bible-teaches-annihilationism', locator: 'page 76' }),
      jsx('Callout', { id: 'in-brief' }),
    ])
    expect(attributesOf(tree.children[0]).id).toBe('dear-bible-teaches-annihilationism')
    expect(attributesOf(tree.children[0]).locator).toBe('page 76')
    expect(attributesOf(tree.children[1]).id).toBe('in-brief')
  })

  it('leaves an attribute whose value is an expression alone', () => {
    const node = {
      type: 'mdxJsxFlowElement',
      name: 'h2',
      attributes: [
        {
          type: 'mdxJsxAttribute',
          name: 'id',
          value: { type: 'mdxJsxAttributeValueExpression', value: 'slug' },
        },
      ],
      children: [],
    }
    const tree = run([node])
    const value = attributesOf(tree.children[0]).id as { value: string }
    expect(value.value).toBe('slug')
  })
})
