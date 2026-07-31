/**
 * One coverage policy, shared by every package that has tests.
 *
 * Two decisions are load bearing.
 *
 * **`include` is explicit.** Without it a coverage provider only reports files
 * a test happened to import, so a module with no test at all does not appear as
 * 0% — it does not appear. The number then rises as coverage falls, which is
 * the opposite of a gate. Naming the sources means an untested file is counted
 * against the total from the moment it is written.
 *
 * **The provider is V8.** Vitest runs its workers on Node here even though the
 * runner is invoked through Bun, so V8 coverage is available and accurate;
 * Istanbul would add a Babel instrumentation pass for nothing. Verified by
 * running the suite with `--coverage.provider=v8` and getting real per-file
 * numbers rather than an empty report.
 *
 * Thresholds are measured from the tree, not aspired to. They exist to stop a
 * regression, and the security- and correctness-critical modules carry their
 * own, higher ones.
 */

/**
 * Structurally typed rather than imported from `vitest/config`.
 *
 * This file sits at the repository root, which is not a workspace, so `vitest`
 * is not resolvable from here — every package has it, the root does not. The
 * shape is checked where it is used, which is the only place it matters.
 */
interface CoverageOptions {
  provider: 'v8'
  reporter: string[]
  reportsDirectory: string
  include: string[]
  exclude: string[]
  all: boolean
  thresholds: Record<string, number | Record<string, number>>
}

export const SHARED_COVERAGE_EXCLUDES = [
  // Generated. Their correctness is the generator's, and the generators are
  // covered by the content validators.
  'src/**/generated/**',
  'src/**/*.generated.ts',
  // Type-only. There is nothing to execute.
  'src/**/*.d.ts',
  'src/**/types.ts',
  // Barrels. A re-export has no behaviour, and counting it rewards adding one.
  'src/index.ts',
  // The tests themselves.
  'src/**/__tests__/**',
  'src/**/*.test.{ts,tsx}',
]

export function coverage(options: {
  readonly include: readonly string[]
  readonly exclude?: readonly string[]
  readonly thresholds: Record<string, number | Record<string, number>>
}): CoverageOptions {
  return {
    provider: 'v8',
    // Concise in CI, browsable locally, and machine-readable for anything that
    // wants to chart it later. None of it is committed; `coverage/` is ignored.
    reporter: process.env.CI ? ['text-summary', 'json-summary'] : ['text', 'html', 'json-summary'],
    reportsDirectory: './coverage',
    include: [...options.include],
    exclude: [...SHARED_COVERAGE_EXCLUDES, ...(options.exclude ?? [])],
    // A file with no test is a file with no coverage, not a file with no rows.
    all: true,
    thresholds: options.thresholds,
  }
}
