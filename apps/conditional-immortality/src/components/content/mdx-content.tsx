import { Callout } from '@ci/ui'
import Link from 'next/link'
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
      className="ml-2 align-middle text-[0.62em] text-border-strong no-underline opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 print:hidden"
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
  h2: ({ children, id, ...rest }: ComponentPropsWithoutRef<'h2'>) => (
    <h2 id={id} className="group scroll-mt-24" {...rest}>
      {children}
      <HeadingAnchor id={id} />
    </h2>
  ),
  h3: ({ children, id, ...rest }: ComponentPropsWithoutRef<'h3'>) => (
    <h3 id={id} className="group scroll-mt-24" {...rest}>
      {children}
      <HeadingAnchor id={id} />
    </h3>
  ),
  a: InternalOrExternalLink,
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-6 overflow-x-auto">
      <table {...props} />
    </div>
  ),
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
 * Render an MDX body.
 *
 * Compiled on the server at build time. The rendered output is plain HTML with
 * a handful of server components, so an article page ships no client JavaScript
 * for its prose and remains fully readable with scripting disabled.
 */
export function MdxContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      }}
    />
  )
}
