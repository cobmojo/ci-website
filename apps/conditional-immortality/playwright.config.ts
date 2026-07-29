import os from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end and accessibility configuration.
 *
 * The suite always runs against a production build. Development mode renders
 * different markup, ships an error overlay and serves unminified CSS, so an
 * accessibility result taken from it would not describe what a reader gets.
 *
 * Project names are load bearing: `package.json` runs
 * `--project=chromium-desktop --project=chromium-mobile` for `test:e2e` and
 * `--project=accessibility` for `test:a11y`.
 */

/**
 * A port of this suite's own, deliberately not the 3210 that `next dev` and
 * `next start` use.
 *
 * Sharing 3210 with the dev server quietly broke the guarantee in the
 * paragraph above. With `reuseExistingServer` on, a dev server left running on
 * 3210 was simply adopted, so the suite that documents itself as production
 * only — including all thirty-two axe checks — ran against development
 * markup instead, and said nothing about it.
 */
const PORT = 3211
const BASE_URL = `http://localhost:${PORT}`

/**
 * The correction endpoint appends every submission to disk. Tests write to a
 * throwaway directory so a test run never leaves records inside the repository.
 */
const FEEDBACK_STORE_DIR = path.join(os.tmpdir(), 'ci-playwright-feedback-store')

/** The accessibility spec belongs to exactly one project. */
const A11Y_SPEC = /a11y\.spec\.ts$/

const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const MOBILE_VIEWPORT = { width: 375, height: 812 }

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  /**
   * Capped, because the bottleneck is the single `next start` process, not the
   * CPU. Playwright's default is half the cores, which on a twenty-core
   * machine is ten browsers pulling whole pages — `/full-case/` alone is
   * 1.86 MB — from one Node server.
   *
   * Measured on this suite: at ten workers the whole-site sweeps, which take
   * 5.3–6.0s uncontended, blew through their 90s budget and six tests failed;
   * the run took 7m24s. At four workers all 186 passed in 1m41s. Over-
   * subscription was making it slower *and* flakier, so this is not a
   * tolerance being loosened — it is the queue being sized correctly.
   */
  workers: process.env.CI ? 2 : Math.min(4, Math.max(1, Math.floor(os.cpus().length / 2))),
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: A11Y_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'chromium-mobile',
      testIgnore: A11Y_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: MOBILE_VIEWPORT, hasTouch: true },
    },
    {
      name: 'accessibility',
      testMatch: A11Y_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
  ],

  webServer: {
    /**
     * Serve only. The build is turbo's job — `test:e2e` and `test:a11y` both
     * declare `dependsOn: ["build"]` — and doing it here as well meant
     * `next build` ran twice per invocation, at about twenty-six seconds each.
     *
     * Running `playwright test` directly, without turbo, therefore needs a
     * build first. `next start` says so plainly if one is missing.
     */
    command: `bunx next start --port ${PORT}`,
    url: BASE_URL,
    /**
     * Never adopt a server that is already listening. A surviving `next start`
     * loads its manifest at boot, so reusing one serves whatever was built
     * when it started — which, after a rebuild, is not the code under test.
     * Booting a fresh server costs a second or two; silently testing stale
     * output costs a great deal more.
     */
    reuseExistingServer: false,
    timeout: 2 * 60 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { FEEDBACK_STORE_DIR },
  },
})
