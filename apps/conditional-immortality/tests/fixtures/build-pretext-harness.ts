import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Build the browser geometry harness, into a temporary directory.
 *
 * Runs as Playwright's `globalSetup`, so `bun run test:text-geometry` works
 * from a clean checkout with no undocumented build step in front of it.
 *
 * The bundle is written to the operating system's temporary directory rather
 * than anywhere under the repository. Nothing test-only can then be committed
 * by accident, served from `public/`, or swept into the production build.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** Where the built harness lands. The geometry spec reads the same path. */
export const HARNESS_BUNDLE = path.join(
  os.tmpdir(),
  'ci-pretext-geometry-harness',
  'pretext-browser-harness.js',
)

export function buildPretextHarness(): string {
  const outDir = path.dirname(HARNESS_BUNDLE)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  // An IIFE bundle so a plain `<script>` tag is enough, and no module graph has
  // to resolve from a temporary directory the page knows nothing about.
  execFileSync(
    process.platform === 'win32' ? 'bun.exe' : 'bun',
    [
      'build',
      path.join(HERE, 'pretext-browser-harness.ts'),
      '--target=browser',
      '--format=iife',
      '--outfile',
      HARNESS_BUNDLE,
    ],
    { cwd: path.resolve(HERE, '../..'), stdio: 'pipe' },
  )

  if (!existsSync(HARNESS_BUNDLE)) {
    throw new Error(`The Pretext geometry harness did not build to ${HARNESS_BUNDLE}`)
  }
  return HARNESS_BUNDLE
}

export default function globalSetup(): void {
  buildPretextHarness()
}
