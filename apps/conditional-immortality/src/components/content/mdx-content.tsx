import { Callout } from '@ci/ui'
import { MDXRemote } from 'next-mdx-remote/rsc'
import type { ComponentPropsWithoutRef } from 'react'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { Cite } from '@/components/content/cite'
import {
  CIReading,
  Compare,
  Details,
  ECTReading,
  Greek,
  Hebrew,
} from '@/components/content/language'
import { Scripture, TranslationNote } from '@/components/content/scripture'
import { Link } from '@/components/navigation/link'
import { rehypeDemoteHeadings } from '@/lib/rehype-demote-headings'
import { rehypePrefixIds } from '@/lib/rehype-prefix-ids'
import { rehypeScrollableTables } from '@/lib/rehype-scrollable-tables'

/**
 * Anchor-linked headings.
 *
 * `rehype-slug` supplies stable ids from the heading text, and the same
 * slugging rule is used to build the "On this page" list, so the two can
 * never disagree.
 */
function HeadingAnchor({ id }: { id?: string }) {
  if (!id) return null
  return (
    <a
      href={`#${id}`}
      // Visibility and colour both live in `heading-anchor` in globals.css
      // rather than in utilities here. A `group-hover` utility hid the anchor
      // unconditionally and revealed it on hover, which meant it was
      // permanently invisible on a touch device; a colour utility here would
      // sit on the resting state too, and the resting anchor has to clear the
      // contrast requirement, not just the hovered one.
      className="heading-anchor ml-2 align-middle text-[0.62em] no-underline print:hidden"
      aria-label="Link to this section"
    >
      #
    </a>
  )
}

function InternalOrExternalLink({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) {
  if (!href) return <span {...rest}>{children}</span>
  const isExternal = /^https?:\/\//.test(href)
  if (isExternal) {
    return (
      <a href={href} rel="noopener noreferrer" target="_blank" {...rest}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
        <span aria-hidden="true" className="ml-0.5 text-[0.8em]">
          ↗
        </span>
      </a>
    )
  }
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  )
}

const components = {
  // No `group` class: `heading-anchor` keys off `:is(h2, h3, h4):hover`
  // directly, so the marker class is no longer load bearing. The `h4` entry
  // exists for the continuous edition: authored headings stop at `###`, but
  // demotion turns those into `h4`, and a demoted heading keeps its anchor.
  h2: ({ children, id, ...rest }: ComponentPropsWithoutRef<'h2'>) => (
    <h2 id={id} {...rest}>
      {children}
      <HeadingAnchor id={id} />
    </h2>
  ),
  h3: ({ children, id, ...rest }: ComponentPropsWithoutRef<'h3'>) => (
    <h3 id={id} {...rest}>
      {children}
      <HeadingAnchor id={id} />
    </h3>
  ),
  h4: ({ children, id, ...rest }: ComponentPropsWithoutRef<'h4'>) => (
    <h4 id={id} {...rest}>
      {children}
      <HeadingAnchor id={id} />
    </h4>
  ),
  a: InternalOrExternalLink,
  Scripture,
  TranslationNote,
  Callout,
  Cite,
  Greek,
  Hebrew,
  Compare,
  ECTReading,
  CIReading,
  Details,
}

/**
 * The rehype demotion step only reaches markdown headings: literal JSX stays
 * an `mdxJsxFlowElement` in the tree and renders its heading at React time.
 * So the components that render their own headings are demoted here, in the
 * substitution map, and both mechanisms always move together.
 */
const DEMOTED_CALLOUT_LEVEL = { h2: 'h3', h3: 'h4', h4: 'h5', h5: 'h5', p: 'p' } as const

const demotedComponents = {
  ...components,
  Callout: ({ as = 'h3', ...rest }: ComponentPropsWithoutRef<typeof Callout>) => (
    <Callout {...rest} as={DEMOTED_CALLOUT_LEVEL[as]} />
  ),
  ECTReading: (props: ComponentPropsWithoutRef<typeof ECTReading>) => (
    <ECTReading {...props} as="h5" />
  ),
  CIReading: (props: ComponentPropsWithoutRef<typeof CIReading>) => (
    <CIReading {...props} as="h5" />
  ),
}

/**
 * Render an MDX body.
 *
 * Compiled on the server at build time. The rendered output is plain HTML with
 * a handful of server components, so an article page ships no client JavaScript
 * for its prose and remains fully readable with scripting disabled.
 */
export function MdxContent({
  source,
  idPrefix,
  demoteHeadings = false,
}: {
  source: string
  /**
   * Namespace every id and fragment link in this body. Needed only where more
   * than one body shares a document, as on the continuous edition, since the
   * sections deliberately reuse heading text.
   */
  idPrefix?: string
  /**
   * Push every heading in the body down one level. Needed only where the
   * rendering page has already used the body's top level for its own section
   * titles, as on the continuous edition.
   */
  demoteHeadings?: boolean
}) {
  // Unified calls a plugin with its options and uses the return value as the
  // transformer, so options go in a tuple. Passing an already-applied factory
  // hands it the transformer instead, which it then calls with no tree.
  const rehypePlugins: NonNullable<
    NonNullable<Parameters<typeof MDXRemote>[0]['options']>['mdxOptions']
  >['rehypePlugins'] = [rehypeSlug, rehypeScrollableTables]
  if (idPrefix) rehypePlugins.push([rehypePrefixIds, idPrefix])
  if (demoteHeadings) rehypePlugins.push(rehypeDemoteHeadings)

  return (
    <MDXRemote
      source={source}
      components={demoteHeadings ? demotedComponents : components}
      options={{
        parseFrontmatter: false,
        mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins },
      }}
    />
  )
}
