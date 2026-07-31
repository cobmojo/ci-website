import { defineConfig } from 'vitest/config'
import { coverage } from '../../vitest.coverage'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: coverage({
      include: ['src/**/*.ts'],
      thresholds: { lines: 0, statements: 0, functions: 0, branches: 0 },
    }),
  },
})
