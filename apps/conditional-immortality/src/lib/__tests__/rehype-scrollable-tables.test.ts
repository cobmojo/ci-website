import type { Root } from 'hast'
import { describe, expect, it } from 'vitest'
import { rehypeScrollableTables } from '../rehype-scrollable-tables'

/**
 * A wide table has to scroll on a narrow screen, and WCAG 2.1.1 requires that
 * a keyboard be able to scroll it. Setting `display: block` on the table would
 * strip its implicit ARIA table role and lose every row and column
 * relationship, so the scrolling has to belong to a wrapper.
 *
 * The wrapping is done here rather than in the MDX components map because that
 * map only sees elements produced by *markdown* syntax. A hand-written
 * `<table>` in an `.mdx` file is literal JSX and never passes through it — and
 * the corpus contains seven of those.
 */

function markdownTable(children: unknown[] = []) {
  return { type: 'element', tagName: 'table', properties: {}, children }
}

function jsxTable(children: unknown[] = []) {
  return { type: 'mdxJsxFlowElement', name: 'table', attributes: [], children }
}

function caption(text: string, jsx = false) {
  const child = { type: 'text', value: text }
  return jsx
    ? { type: 'mdxJsxFlowElement', name: 'caption', attributes: [], children: [child] }
    : { type: 'element', tagName: 'caption', properties: {}, children: [child] }
}

function run(children: unknown[]): Root {
  const tree = { type: 'root', children } as unknown as Root
  rehypeScrollableTables()(tree)
  return tree
}

interface Wrapper {
  type: string
  tagName: string
  properties: Record<string, unknown>
  children: { type: string; tagName?: string; name?: string }[]
}

const wrapperOf = (tree: Root, index = 0) => tree.children[index] as unknown as Wrapper

describe('rehypeScrollableTables', () => {
  it('wraps a table written as markdown', () => {
    const wrapper = wrapperOf(run([markdownTable()]))
    expect(wrapper.tagName).toBe('div')
    expect(wrapper.properties.className).toEqual(['table-scroll'])
    expect(wrapper.children[0]?.tagName).toBe('table')
  })

  it('wraps a table written as literal JSX', () => {
    const wrapper = wrapperOf(run([jsxTable()]))
    expect(wrapper.tagName).toBe('div')
    expect(wrapper.children[0]?.name).toBe('table')
  })

  it('makes the wrapper keyboard-scrollable and announceable', () => {
    const wrapper = wrapperOf(run([markdownTable()]))
    // Without tabindex a keyboard cannot scroll the region at all.
    expect(wrapper.properties.tabIndex).toBe(0)
    expect(wrapper.properties.role).toBe('region')
    expect(wrapper.properties['aria-label']).toBe('Table')
  })

  it('names the region after the table caption, in either node shape', () => {
    const fromMarkdown = wrapperOf(run([markdownTable([caption('Views compared')])]))
    expect(fromMarkdown.properties['aria-label']).toBe('Views compared')

    const fromJsx = wrapperOf(run([jsxTable([caption('Views compared', true)])]))
    expect(fromJsx.properties['aria-label']).toBe('Views compared')
  })

  it('collapses whitespace in a caption spread over several lines', () => {
    const wrapper = wrapperOf(run([markdownTable([caption('  Views \n  compared  ')])]))
    expect(wrapper.properties['aria-label']).toBe('Views compared')
  })

  it('wraps every table, not just the first', () => {
    const tree = run([markdownTable(), jsxTable(), markdownTable()])
    expect(tree.children).toHaveLength(3)
    for (let i = 0; i < 3; i += 1) {
      expect(wrapperOf(tree, i).properties.dataTableScroll).toBe('')
    }
  })

  it('does not wrap a table twice when the pass runs again', () => {
    const tree = run([markdownTable()])
    rehypeScrollableTables()(tree)
    const wrapper = wrapperOf(tree)
    expect(wrapper.children).toHaveLength(1)
    expect(wrapper.children[0]?.tagName).toBe('table')
  })

  it('leaves everything that is not a table alone', () => {
    const tree = run([{ type: 'element', tagName: 'p', properties: {}, children: [] }])
    expect((tree.children[0] as { tagName: string }).tagName).toBe('p')
  })
})
