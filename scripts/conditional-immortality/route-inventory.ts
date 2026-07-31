#!/usr/bin/env bun
/**
 * The route inventory, printed, and the three sources reconciled.
 *
 * Exits non-zero when the build output, the sitemap and the navigation
 * registries disagree — a page prerendered but absent from the sitemap, a
 * sitemap entry for a route that is in `NOINDEX_ROUTES`, an indexable route
 * that belongs to no template family. Each of those is a real defect that
 * nothing else in the gate can see, because every individual artefact is
 * internally consistent.
 *
 * Run after `next build`.
 */
import { auditableRoutes, buildRouteManifest, profileFamilies } from './lib/route-manifest'

const manifest = buildRouteManifest()
const families = profileFamilies(manifest)

const counts = new Map<string, number>()
for (const record of manifest.routes) counts.set(record.kind, (counts.get(record.kind) ?? 0) + 1)

console.log('Route inventory')
console.log('===============')
for (const [kind, count] of [...counts.entries()].sort()) {
  console.log(`  ${kind.padEnd(16)} ${String(count).padStart(4)}`)
}
console.log(`  ${'sitemap <loc>'.padEnd(16)} ${String(manifest.sitemapRoutes.length).padStart(4)}`)
console.log(
  `  ${'auditable HTML'.padEnd(16)} ${String(auditableRoutes(manifest).length).padStart(4)}`,
)
console.log('')

console.log('Template families')
console.log('=================')
console.log(
  `  ${'family'.padEnd(16)} ${'n'.padStart(3)}  ${'certified on'.padEnd(46)} largest HTML / most links / most JS`,
)
for (const profile of families) {
  console.log(
    `  ${profile.family.padEnd(16)} ${String(profile.count).padStart(3)}  ` +
      `${profile.worstCandidate.padEnd(46)} ${profile.largestHtml} / ${profile.mostLinks} / ${profile.mostJs}`,
  )
}
console.log('')

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ manifest, families }, null, 2))
}

if (manifest.discrepancies.length > 0) {
  console.error(`${manifest.discrepancies.length} discrepancy(ies) between the route sources:`)
  for (const problem of manifest.discrepancies) console.error(`  x ${problem}`)
  console.error('')
  console.error('The build output, the sitemap and navigation.ts have to agree about what')
  console.error('this site serves. Each of them is internally consistent when they do not.')
  process.exit(1)
}

console.log('The build output, the sitemap and the navigation registries agree.')
