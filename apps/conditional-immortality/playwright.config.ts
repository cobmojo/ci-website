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
 * `--project=accessibility --project=accessibility-mobile` for `test:a11y`.
 */

/** Deliberately not the 3210 `next dev` uses, or a dev server gets adopted. */
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
  // Capped: the bottleneck is the single `next start` process, not the CPU, and
  // over-subscribing it made the run both slower and flakier.
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
    {
      // The same axe and structural sweep at the mobile viewport. Layout,
      // target sizes and the sheet navigation all differ below the desktop
      // breakpoints, so a desktop-only gate could pass a mobile regression.
      name: 'accessibility-mobile',
      testMatch: A11Y_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: MOBILE_VIEWPORT, hasTouch: true },
    },
  ],

  webServer: {
    // Serve only: both tasks declare `dependsOn: ["build"]`, so building here as
    // well ran `next build` twice. Running playwright directly needs a build.
    command: `bunx next start --port ${PORT}`,
    url: BASE_URL,
    // `next start` loads its manifest at boot, so a reused server would serve
    // whatever was built when it started rather than the code under test.
    reuseExistingServer: false,
    timeout: 2 * 60 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { FEEDBACK_STORE_DIR },
  },
})
