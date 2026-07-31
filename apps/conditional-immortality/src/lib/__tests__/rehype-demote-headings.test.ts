import type { Element, Root } from 'hast'
import { describe, expect, it } from 'vitest'
import { rehypeDemoteHeadings } from '../rehype-demote-headings'

function heading(tagName: string, id?: string): Element {
  return {
    type: 'element',
    tagName,
    properties: id ? { id } : {},
    children: [{ type: 'text', value: 'Heading' }],
  }
}

function tree(...children: Element[]): Root {
  return { type: 'root', children }
}

describe('rehypeDemoteHeadings', () => {
  it('demotes h2 and h3 one level each', () => {
    const root = tree(heading('h2'), heading('h3'))
    rehypeDemoteHeadings()(root)
    expect((root.children[0] as Element).tagName).toBe('h3')
    expect((root.children[1] as Element).tagName).toBe('h4')
  })

  it('leaves ids untouched, so fragment links keep working', () => {
    const root = tree(heading('h2', 'in-brief'))
    rehypeDemoteHeadings()(root)
    const demoted = root.children[0] as Element
    expect(demoted.tagName).toBe('h3')
    expect(demoted.properties?.id).toBe('in-brief')
  })

  it('never demotes past h6', () => {
    const root = tree(heading('h6'))
    rehypeDemoteHeadings()(root)
    expect((root.children[0] as Element).tagName).toBe('h6')
  })

  it('leaves non-heading elements alone', () => {
    const root = tree(heading('p'))
    rehypeDemoteHeadings()(root)
    expect((root.children[0] as Element).tagName).toBe('p')
  })
})
