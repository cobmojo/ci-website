import { defineConfig } from 'vitest/config'
import { coverage } from '../../vitest.coverage'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    /*
     * The content models and the Bible reference parser: everything the
     * build refuses bad content with.
     * Floors measured on this tree; see `vitest.coverage.ts` for the policy.
     */
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { lines: 97, statements: 93, functions: 100, branches: 88 },
    }),
  },
})
