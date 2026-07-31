import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import { coverage } from '../../vitest.coverage'

export default defineConfig({
  resolve: {
    alias: {
      '@ci/content-schema/bible': resolve(__dirname, '../ci-content-schema/src/bible.ts'),
      '@ci/content-schema': resolve(__dirname, '../ci-content-schema/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    /*
     * Mostly data. What is measured here is the code that reads it —
     * routes, revisions, the migration ledger accessors.
     * Floors measured on this tree; see `vitest.coverage.ts` for the policy.
     */
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { lines: 75, statements: 70, functions: 65, branches: 60 },
    }),
  },
})
