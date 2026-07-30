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
  // Capped: the bottleneck is the single `next start` process, not the CPU, and
  // over-subscribing it made the run both slower and flakier.
  workers: process.env.CI ? 2 : Math.min(4, Math.max(1, Math.floor(os.cpus().length / 2))),
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
