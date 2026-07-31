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
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { lines: 0, statements: 0, functions: 0, branches: 0 },
    }),
  },
})
