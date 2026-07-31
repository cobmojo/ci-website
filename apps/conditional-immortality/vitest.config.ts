import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { coverage } from '../../vitest.coverage'

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
    /*
     * A unit run is a localhost context, and `site-config.ts` now refuses to
     * invent a canonical origin for a build that has not named one. Declaring
     * it here is the same statement the browser suites and CI make, in the one
     * place every test process inherits it from.
     */
    env: { NEXT_PUBLIC_ALLOW_LOCALHOST_SITE_URL: '1' },
    coverage: coverage({
      /*
       * `src/lib` is the logic; `src/components` is markup. Both are in the
       * denominator on purpose. Excluding the components would lift the
       * headline number by twenty points while measuring less, and a number
       * that rises as coverage falls is not a gate.
       *
       * What the components have instead is a browser: all 120 public routes
       * are rendered at five viewports by `route-sweep.spec.ts`, swept by axe
       * at two viewports, screenshotted by the visual project, and driven
       * through their real interactions by the reading, motion and search
       * specs. jsdom copies of those would be weaker oracles for the same
       * claims, so the global floor below is honest about where unit coverage
       * reaches, and the per-module thresholds are strict where it must.
       */
      include: ['src/lib/**/*.ts', 'src/components/**/*.tsx'],
      thresholds: {
        // Measured on this tree. A floor to stop regression, not a target:
        // raising it is a decision, and lowering it has to be argued for.
        lines: 66,
        statements: 65,
        functions: 49,
        branches: 56,

        // Security, correctness and data-loss surfaces are held far higher,
        // because for these the question is not "is it exercised" but "is
        // every branch of it known to behave".
        'src/lib/feedback/**': { lines: 95, statements: 95, functions: 100, branches: 88 },
        'src/lib/site-url.ts': { lines: 100, statements: 100, functions: 100, branches: 100 },
        'src/lib/rate-limit.ts': { lines: 83, statements: 83, functions: 100, branches: 87 },
        'src/lib/qr.ts': { lines: 98, statements: 97, functions: 100, branches: 90 },
        'src/lib/text-layout/**': { lines: 84, statements: 80, functions: 82, branches: 72 },
      },
    }),
    /*
     * The search-dialog component tests drive a coordinator that crosses an
     * animation frame, two awaited promises and a React transition before it
     * settles. jsdom drives `requestAnimationFrame` from a timer, so under a
     * loaded machine that sequence takes much longer than the five-second
     * default assumes. The waiting is generous; the assertions are not.
     */
    testTimeout: 30_000,
  },
})
