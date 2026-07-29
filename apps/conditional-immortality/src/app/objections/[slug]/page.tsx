import { objectionSections } from '@ci/content/case'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionPage } from '@/components/article/section-page'
import { articleJsonLd, breadcrumbJsonLd, JsonLd, sectionMetadata } from '@/lib/metadata'
import { loadSection } from '@/lib/sections'

export function generateStaticParams() {
  return objectionSections.map(section => ({ slug: section.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const section = objectionSections.find(item => item.slug === slug)
  return section ? sectionMetadata(section) : {}
}

export default async function ObjectionRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const section = objectionSections.find(item => item.slug === slug)
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
