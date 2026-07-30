import os from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end, accessibility and text-geometry configuration.
 *
 * The suite always runs against a production build. Development mode renders
 * different markup, ships an error overlay and serves unminified CSS, so an
 * accessibility or geometry result taken from it would not describe what a
 * reader gets.
 *
 * Project names are load bearing: `package.json` runs
 * `--project=chromium-desktop --project=chromium-mobile` for `test:e2e`,
 * `--project=accessibility` for `test:a11y`, and the three `geometry-*`
 * projects for `test:text-geometry`.
 *
 * `globalSetup` builds the Pretext geometry harness into a temporary directory
 * before anything runs, so the geometry suite works from a clean checkout with
 * no undocumented build step in front of it.
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
/** The geometry spec belongs to the three focused browser projects. */
const GEOMETRY_SPEC = /text-geometry\.spec\.ts$/

const DESKTOP_VIEWPORT = { width: 1440, height: 900 }
const MOBILE_VIEWPORT = { width: 375, height: 812 }

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/fixtures/build-pretext-harness.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  /*
   * Some tests here are navigation-heavy rather than slow: the horizontal
   * overflow check walks all thirty-one routes inside a single test, at each
   * viewport. With six projects sharing a machine that comfortably exceeds a
   * ninety-second budget, and a timeout is a resource limit, not a finding.
   * The assertions themselves are unchanged and still fail fast.
   */
  timeout: 180_000,
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
      testIgnore: [A11Y_SPEC, GEOMETRY_SPEC],
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'chromium-mobile',
      testIgnore: [A11Y_SPEC, GEOMETRY_SPEC],
      use: { ...devices['Desktop Chrome'], viewport: MOBILE_VIEWPORT, hasTouch: true },
    },
    {
      name: 'accessibility',
      testMatch: A11Y_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    /*
     * Text geometry, in each engine that lays text out differently.
     *
     * Three separate engines rather than three skins on one: Chromium, Gecko
     * and WebKit each shape and break text with their own code, and a
     * prediction that holds in one says nothing about the others.
     *
     * `geometry-webkit` is Playwright's WebKit build. It is not Safari, and it
     * is not described as Safari anywhere. Real Safari is validated by hand;
     * the procedure is in `docs/pretext-text-geometry.md`.
     */
    {
      name: 'geometry-chromium',
      testMatch: GEOMETRY_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'geometry-firefox',
      testMatch: GEOMETRY_SPEC,
      use: { ...devices['Desktop Firefox'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'geometry-webkit',
      testMatch: GEOMETRY_SPEC,
      use: { ...devices['Desktop Safari'], viewport: DESKTOP_VIEWPORT },
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
