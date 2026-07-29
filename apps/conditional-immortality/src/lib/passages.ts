import { findPassageByReference, getPassage, passageRoute } from '@ci/content/passages'

/**
 * Resolve a Scripture reference to its passage page, if one exists.
 *
 * Only passages with substantial treatment get a page. Everything else lives
 * in the Scripture index, so no thin auto-generated page is created for a
 * passing citation.
 */
export function passageBySlugOrReference(
  value: string,
): { slug: string; route: string; reference: string } | undefined {
  const bySlug = getPassage(value)
  if (bySlug) {
    return {
      slug: bySlug.slug,
      route: passageRoute(bySlug),
      reference: bySlug.normalizedReference,
    }
  }
  const byReference = findPassageByReference(value)
  if (byReference) {
    return {
      slug: byReference.slug,
      route: passageRoute(byReference),
      reference: byReference.normalizedReference,
    }
  }
  return undefined
}
