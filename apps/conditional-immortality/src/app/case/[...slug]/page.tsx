import { caseSections, getSectionByRoute } from '@ci/content/case'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionPage } from '@/components/article/section-page'
import { articleJsonLd, breadcrumbJsonLd, JsonLd, sectionMetadata } from '@/lib/metadata'
import { loadSection } from '@/lib/sections'

/** Every RB, preface and S section whose canonical route sits under /case/. */
const CASE_ROUTE_SECTIONS = caseSections.filter(section => section.route.startsWith('/case/'))

export function generateStaticParams() {
  return CASE_ROUTE_SECTIONS.map(section => ({
    slug: section.route
      .replace(/^\/case\//, '')
      .replace(/\/$/, '')
      .split('/'),
  }))
}

export const dynamicParams = false

function resolve(slug: readonly string[]) {
  return getSectionByRoute(`/case/${slug.join('/')}/`)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const section = resolve(slug)
  if (!section) return {}
  return sectionMetadata(section)
}

export default async function CaseSectionRoute({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  const section = resolve(slug)
  if (!section) notFound()

  const loaded = loadSection(section)

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(loaded.crumbs)} />
      <JsonLd data={articleJsonLd(section)} />
      <SectionPage loaded={loaded} />
    </>
  )
}
