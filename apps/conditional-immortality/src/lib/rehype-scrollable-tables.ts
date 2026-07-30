import type { Element, Root } from 'hast'
import { visit } from 'unist-util-visit'

/**
 * Wrap every table in a keyboard-scrollable region.
 *
 * A wide table has to scroll on a narrow screen. The obvious fix, setting
 * `display: block` on the table, is wrong: it strips the element's implicit
 * ARIA table role, and a screen reader then loses every row and column
 * relationship. The scrolling has to belong to an ancestor.
 *
 * Two things make this awkward to do anywhere else:
 *
 * 1. The MDX components map only receives elements produced by *markdown*
 *    syntax. A hand-written `<table>` in an `.mdx` file is literal JSX and
 *    never passes through it.
 * 2. Those two authoring styles also produce different node types at this
 *    stage. A markdown pipe table is a hast `element`; a hand-written one is
 *    an `mdxJsxFlowElement`. Matching only the first silently misses the
 *    second, which is exactly what happened here.
 *
 * So this matches both, and catches any table an author adds later without
 * their having to remember the rule.
 *
 * The wrapper takes `tabindex="0"` so a keyboard user can scroll it, which
 * WCAG 2.1.1 requires of any scrollable region, and an accessible name taken
 * from the table's own caption so the region is announced meaningfully.
 */

/** A table node in either of the two shapes MDX produces. */
interface TableLike {
  type: string
  tagName?: string
  name?: string
  children?: unknown[]
}

function isTable(node: unknown): node is TableLike {
  if (typeof node !== 'object' || node === null) return false
  const candidate = node as TableLike
  if (candidate.type === 'element' && candidate.tagName === 'table') return true
  if (candidate.type === 'mdxJsxFlowElement' && candidate.name === 'table') return true
  return false
}

function isCaption(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) return false
  const candidate = node as TableLike
  if (candidate.type === 'element' && candidate.tagName === 'caption') return true
  if (candidate.type === 'mdxJsxFlowElement' && candidate.name === 'caption') return true
  return false
}

/** Collect visible text, whichever node shapes the subtree is built from. */
function textOf(node: unknown): string {
  let out = ''
  visit(node as Root, (child: { type?: string; value?: string }) => {
    if (child.type === 'text' && typeof child.value === 'string') out += child.value
  })
  return out.replace(/\s+/g, ' ').trim()
}

function captionText(table: TableLike): string | undefined {
  const caption = (table.children ?? []).find(isCaption)
  if (!caption) return undefined
  const text = textOf(caption)
  return text.length > 0 ? text : undefined
}

export function rehypeScrollableTables() {
  return (tree: Root) => {
    visit(tree, (node: unknown, index, parent) => {
      if (!isTable(node)) return
      if (!parent || index === undefined) return

      const parentNode = parent as {
        type?: string
        properties?: Record<string, unknown>
        children: unknown[]
      }

      // Already wrapped, so leave it alone.
      if (parentNode.properties && 'dataTableScroll' in parentNode.properties) return

      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          dataTableScroll: '',
          className: ['table-scroll'],
          tabIndex: 0,
          // `group`, not `region`: a labelled group conveys the same grouping
          // without adding a landmark, and the Scripture index alone renders
          // dozens of these. Matches `ScrollRegion` for hand-written wrappers.
          role: 'group',
          'aria-label': captionText(node) ?? 'Table',
        },
        // The table keeps whichever node shape it already had.
        children: [node as Element],
      }

      parentNode.children[index] = wrapper
      // Do not descend into the wrapper we just created, or we would rewrap.
      return 'skip'
    })
  }
}
