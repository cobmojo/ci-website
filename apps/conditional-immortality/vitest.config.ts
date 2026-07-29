import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Unit test configuration.
 *
 * Unit tests are named `*.test.ts` or `*.test.tsx` and live under `src`.
 * Vitest and Playwright both claim `*.spec.ts` by default, so without this
 * `include`, `vitest run` picks up the Playwright specs under `tests/e2e/` and
 * fails on `test.describe`.
 *
 * The React plugin is what makes a `.tsx` test runnable at all: `tsconfig.json`
 * sets `jsx: "preserve"` for Next.js, which Vite inherits, so JSX would
 * otherwise reach the parser untransformed.
 *
 * The `@/` alias mirrors `tsconfig.json`, which the modules under test use to
 * import each other.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
