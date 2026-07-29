import { defineConfig } from 'vitest/config'

/**
 * Unit test configuration.
 *
 * Vitest and Playwright both claim `*.spec.ts` by default, so the end-to-end
 * directory is excluded here. Without this, `vitest run` tries to execute the
 * Playwright specs and fails on `test.describe`.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/.next/**', 'tests/e2e/**', 'test-results/**'],
  },
})
