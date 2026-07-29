import GithubSlugger from 'github-slugger'
import { describe, expect, it } from 'vitest'
import { extractHeadings, mdxToPlainText, sectionFileName, slugifyHeading } from '../mdx'

/**
 * The "On this page" navigation is built from `slugifyHeading`, while the ids
 * in the rendered HTML come from `rehype-slug`, which uses `github-slugger`.
 * If the two disagree, every anchor on the affected page is silently broken.
 *
 * These tests compare our implementation against the real slugger.
 */
describe('heading slugs match github-slugger', () => {
  it.each([
    'In brief',
    'The primary passage',
    'Why ECT interpreters cite this passage',
    // Punctuation is removed, not replaced. This is the case that broke.
    'John 10:10, life and fullness of life are two gifts',
    'What 2 Thessalonians 1:9 says the punishment is',
    'Daniel 12:2',
    'Revelation 21:8 answers Revelation 21:7',
    'Mark 9:42-48 and Isaiah 66:24',
    'The author’s own suggested reading',
    "The author's own suggested reading",
    'Weeping, gnashing of teeth, and outer darkness',
    'What it does not establish by itself',
    '“Eternal punishment” and what it names',
    'Body, soul and spirit: a three-part view',
    'Sodom and Gomorrah (2 Peter 2:6)',
  ])('slugs %s identically', heading => {
    const slugger = new GithubSlugger()
    expect(slugifyHeading(heading)).toBe(slugger.slug(heading))
  })

  it('disambiguates repeated headings the same way', () => {
    const body = [
      '## The conditionalist reading',
      'Prose.',
      '## The conditionalist reading',
      'More prose.',
    ].join('\n\n')

    const slugger = new GithubSlugger()
    const expected = [
      slugger.slug('The conditionalist reading'),
      slugger.slug('The conditionalist reading'),
    ]
    expect(extractHeadings(body).map(h => h.id)).toEqual(expected)
  })
})

describe('heading extraction', () => {
  it('reads level two and three headings in order', () => {
    const body = ['## First', 'text', '### Nested', 'text', '## Second'].join('\n\n')
    expect(extractHeadings(body)).toEqual([
      { depth: 2, text: 'First', id: 'first' },
      { depth: 3, text: 'Nested', id: 'nested' },
      { depth: 2, text: 'Second', id: 'second' },
    ])
  })

  it('ignores a hash inside a fenced code block', () => {
    const body = ['## Real', '', '```', '## Not a heading', '```', '', '## Also real'].join('\n')
    expect(extractHeadings(body).map(h => h.text)).toEqual(['Real', 'Also real'])
  })

  it('strips inline markup from heading text', () => {
    expect(extractHeadings('## The **wages** of `sin`')[0]?.text).toBe('The wages of sin')
    expect(extractHeadings('## See [Mark 9](/case/key-texts/mark-9/)')[0]?.text).toBe('See Mark 9')
  })

  it('ignores level one headings, which bodies must not contain', () => {
    expect(extractHeadings('# Title\n\n## Section').map(h => h.text)).toEqual(['Section'])
  })
})

describe('plain text conversion', () => {
  it('removes components, markup and tables', () => {
    const body = [
      '## In brief',
      '',
      '<Scripture reference="Mark 9:42-48" />',
      '',
      'The **wages** of sin is [death](/topics/death/).',
      '',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
    ].join('\n')

    const plain = mdxToPlainText(body)
    expect(plain).toContain('The wages of sin is death.')
    expect(plain).not.toContain('<Scripture')
    expect(plain).not.toContain('**')
    expect(plain).not.toContain('|')
  })
})

describe('file naming', () => {
  it('builds the body filename from id and slug', () => {
    expect(sectionFileName('S04', 'eternal-punishment')).toBe('s04-eternal-punishment')
    expect(sectionFileName('APP1', 'afterlife-odds')).toBe('app1-afterlife-odds')
    expect(sectionFileName('P00', 'why-this-matters')).toBe('p00-why-this-matters')
  })
})
