import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Unit test configuration.
 *
 * Vitest and Playwright both claim `*.spec.ts` by default, so unit tests are
 * named `*.test.ts` and only those are collected. Without the narrow `include`,
 * `vitest run` picks up the Playwright specs under `tests/e2e/` and fails on
 * `test.describe`.
 *
 * The `@/` alias mirrors `tsconfig.json`, which the modules under test use to
 * import each other.
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
