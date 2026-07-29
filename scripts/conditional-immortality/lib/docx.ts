/**
 * DOCX structural extraction.
 *
 * Reads the WordprocessingML directly rather than relying on a
 * DOCX-to-HTML conversion. Conversions routinely drop comments, relationship
 * targets, table structure and list nesting, all of which the migration ledger
 * needs in order to prove nothing substantive was lost.
 */

export interface Hyperlink {
  readonly rId?: string
  readonly target?: string
  readonly text: string
}

export interface SourceElement {
  readonly index: number
  readonly kind: 'paragraph' | 'table-start' | 'table-end'
  readonly container: string
  readonly row?: number
  readonly col?: number
  readonly text: string
  readonly style?: string
  readonly numId?: string
  readonly ilvl?: string
  readonly hyperlinks: Hyperlink[]
  readonly images: { rId?: string; target?: string }[]
  readonly commentRefs: string[]
  readonly openComments: string[]
  readonly tableRef?: number
  readonly rows?: number
}

export interface DocxComment {
  readonly id: string
  readonly author: string
  readonly date: string
  readonly text: string
}

export interface Relationship {
  readonly type: string
  readonly target: string
  readonly mode: string
}

/** Decode the five XML predefined entities plus numeric references. */
function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function attr(tag: string, name: string): string | undefined {
  const match = new RegExp(`${name}="([^"]*)"`).exec(tag)
  return match?.[1] ? decodeXml(match[1]) : undefined
}

export function parseRelationships(xml: string): Map<string, Relationship> {
  const rels = new Map<string, Relationship>()
  for (const match of xml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const tag = match[1] ?? ''
    const id = attr(tag, 'Id')
    const type = attr(tag, 'Type')
    const target = attr(tag, 'Target')
    if (!id || !type || !target) continue
    rels.set(id, {
      type: type.split('/').pop() ?? type,
      target,
      mode: attr(tag, 'TargetMode') ?? 'Internal',
    })
  }
  return rels
}

export function parseComments(xml: string): Map<string, DocxComment> {
  const comments = new Map<string, DocxComment>()
  for (const match of xml.matchAll(/<w:comment\b([^>]*)>([\s\S]*?)<\/w:comment>/g)) {
    const tag = match[1] ?? ''
    const body = match[2] ?? ''
    const id = attr(tag, 'w:id')
    if (!id) continue
    const paragraphs: string[] = []
    for (const p of body.matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)) {
      const text = [...(p[1] ?? '').matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map(t => decodeXml(t[1] ?? ''))
        .join('')
      if (text.trim()) paragraphs.push(text)
    }
    comments.set(id, {
      id,
      author: attr(tag, 'w:author') ?? 'Unknown',
      date: attr(tag, 'w:date') ?? '',
      text: paragraphs.join('\n'),
    })
  }
  return comments
}

/**
 * Walk the document body, emitting one element per paragraph and marking
 * table boundaries. Paragraphs inside table cells keep their row and column so
 * the source tables can be reconstructed.
 */
export function parseDocument(xml: string, rels: Map<string, Relationship>): SourceElement[] {
  const bodyMatch = /<w:body\b[^>]*>([\s\S]*)<\/w:body>/.exec(xml)
  const body = bodyMatch?.[1] ?? xml

  const elements: SourceElement[] = []
  let index = 0
  const openComments: string[] = []

  // Token scan over paragraph, table row/cell and table boundaries.
  const tokenPattern =
    /<w:tbl>|<\/w:tbl>|<w:tr\b[^>]*>|<\/w:tr>|<w:tc>|<\/w:tc>|<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g

  const tableStack: number[] = []
  let row = -1
  let col = -1
  let rowCount = 0

  for (const match of body.matchAll(tokenPattern)) {
    const token = match[0]

    if (token === '<w:tbl>') {
      index += 1
      tableStack.push(index)
      elements.push({
        index,
        kind: 'table-start',
        container: tableStack.length > 1 ? `table:${tableStack[tableStack.length - 2]}` : 'body',
        text: '',
        hyperlinks: [],
        images: [],
        commentRefs: [],
        openComments: [],
      })
      rowCount = 0
      row = -1
      continue
    }

    if (token === '</w:tbl>') {
      const ref = tableStack.pop()
      index += 1
      elements.push({
        index,
        kind: 'table-end',
        container: tableStack.length ? `table:${tableStack[tableStack.length - 1]}` : 'body',
        text: '',
        hyperlinks: [],
        images: [],
        commentRefs: [],
        openComments: [],
        tableRef: ref,
        rows: rowCount,
      })
      continue
    }

    if (token.startsWith('<w:tr')) {
      row += 1
      rowCount += 1
      col = -1
      continue
    }
    if (token === '<w:tc>') {
      col += 1
      continue
    }
    if (token === '</w:tr>' || token === '</w:tc>') continue

    // Paragraph.
    index += 1
    const inTable = tableStack.length > 0
    const container = inTable ? `table:${tableStack[tableStack.length - 1]}` : 'body'

    const styleMatch = /<w:pStyle\s+w:val="([^"]+)"/.exec(token)
    const numIdMatch = /<w:numId\s+w:val="([^"]+)"/.exec(token)
    const ilvlMatch = /<w:ilvl\s+w:val="([^"]+)"/.exec(token)

    // Comment ranges open and close around runs.
    for (const start of token.matchAll(/<w:commentRangeStart\s+w:id="([^"]+)"/g)) {
      const id = start[1]
      if (id && !openComments.includes(id)) openComments.push(id)
    }
    const snapshot = [...openComments]
    for (const end of token.matchAll(/<w:commentRangeEnd\s+w:id="([^"]+)"/g)) {
      const id = end[1]
      const at = id ? openComments.indexOf(id) : -1
      if (at !== -1) openComments.splice(at, 1)
    }

    const commentRefs = [...token.matchAll(/<w:commentReference\s+w:id="([^"]+)"/g)]
      .map(m => m[1])
      .filter((v): v is string => Boolean(v))

    const hyperlinks: Hyperlink[] = []
    for (const link of token.matchAll(/<w:hyperlink\b([^>]*)>([\s\S]*?)<\/w:hyperlink>/g)) {
      const linkTag = link[1] ?? ''
      const rId = attr(linkTag, 'r:id')
      const anchor = attr(linkTag, 'w:anchor')
      const text = [...(link[2] ?? '').matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)]
        .map(t => decodeXml(t[1] ?? ''))
        .join('')
      hyperlinks.push({
        rId,
        target: rId ? rels.get(rId)?.target : anchor ? `#${anchor}` : undefined,
        text,
      })
    }

    const images: { rId?: string; target?: string }[] = []
    for (const blip of token.matchAll(/<a:blip\b[^>]*r:embed="([^"]+)"/g)) {
      const rId = blip[1]
      images.push({ rId, target: rId ? rels.get(rId)?.target : undefined })
    }
    for (const vml of token.matchAll(/<v:imagedata\b[^>]*r:id="([^"]+)"/g)) {
      const rId = vml[1]
      images.push({ rId, target: rId ? rels.get(rId)?.target : undefined })
    }

    // Text: w:t runs, plus tabs and breaks rendered as whitespace.
    const text = token
      .replace(/<w:tab\b[^>]*\/>/g, '\t')
      .replace(/<w:br\b[^>]*\/>/g, '\n')
      .replace(/<w:cr\b[^>]*\/>/g, '\n')
      .replace(/<w:noBreakHyphen\b[^>]*\/>/g, '-')
      .split(/(<w:t\b[^>]*>[\s\S]*?<\/w:t>)/)
      .map(part => {
        const m = /^<w:t\b[^>]*>([\s\S]*?)<\/w:t>$/.exec(part)
        if (m) return decodeXml(m[1] ?? '')
        return part.includes('\t') || part.includes('\n') ? part.replace(/<[^>]*>/g, '') : ''
      })
      .join('')

    elements.push({
      index,
      kind: 'paragraph',
      container,
      row: inTable ? row : undefined,
      col: inTable ? col : undefined,
      text,
      style: styleMatch?.[1],
      numId: numIdMatch?.[1],
      ilvl: ilvlMatch?.[1],
      hyperlinks,
      images,
      commentRefs,
      openComments: snapshot,
    })
  }

  return elements
}
