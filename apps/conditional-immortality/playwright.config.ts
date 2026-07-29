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

const PORT = 3210
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
  workers: process.env.CI ? 2 : undefined,
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
    command: 'bunx next build && bunx next start --port 3210',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // A cold build of 129 static pages is the slow path here, not the server.
    timeout: 20 * 60 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { FEEDBACK_STORE_DIR },
  },
})
