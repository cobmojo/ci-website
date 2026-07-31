import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import { coverage } from '../../vitest.coverage'

export default defineConfig({
  resolve: {
    alias: {
      '@ci/content-schema/bible': resolve(__dirname, '../ci-content-schema/src/bible.ts'),
      '@ci/content-schema': resolve(__dirname, '../ci-content-schema/src/index.ts'),
      '@ci/content': resolve(__dirname, '../ci-content/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    /*
     * Normalisation, ranking and highlighting, where an off-by-one in a
     * grapheme boundary is invisible until a reader sees a broken excerpt.
     * Floors measured on this tree; see `vitest.coverage.ts` for the policy.
     */
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { lines: 97, statements: 95, functions: 100, branches: 89 },
    }),
    /*
     * Several suites here are corpus-scale rather than unit-scale: they build
     * the real search index from the content registries and replay thirty real
     * queries against it. That is the point of them — a ranking snapshot over a
     * fixture corpus would prove much less — but it is more work than the
     * five-second default assumes, especially with four packages testing in
     * parallel under Turborepo.
     */
    testTimeout: 30_000,
  },
})
