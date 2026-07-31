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
 * `--project=accessibility --project=accessibility-mobile` for `test:a11y`,
 * and the three `geometry-*` projects for `test:text-geometry`.
 *
 * `globalSetup` builds the Pretext geometry harness into a temporary directory
 * before anything runs, so the geometry suite works from a clean checkout with
 * no undocumented build step in front of it.
 */

/**
 * Where the suite points.
 *
 * `PLAYWRIGHT_BASE_URL` switches the whole run to an already-deployed origin: a
 * preview deployment, a staging host, or a production server started by hand.
 * Nothing is built and no local server is started, because there is nothing
 * local to serve — see `test:preview` in `package.json`. Without it the suite
 * serves its own production build on `PORT`.
 */
const DEPLOYED_BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim().replace(/\/+$/, '') || ''
const isDeployedRun = DEPLOYED_BASE_URL.length > 0

/**
 * Deliberately not the 3210 `next dev` uses, or a dev server gets adopted.
 *
 * Overridable because the port is the one piece of global state a run owns: two
 * checkouts of this repository testing at once would otherwise collide on it,
 * and the loser either fails to start or — worse, if the other server is still
 * coming down — measures the wrong build.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3211)
const BASE_URL = isDeployedRun ? DEPLOYED_BASE_URL : `http://localhost:${PORT}`

/**
 * The correction endpoint appends every submission to disk. Tests write to a
 * throwaway directory so a test run never leaves records inside the repository.
 * Keyed by port for the same reason the port is overridable: two concurrent
 * runs must not share a store, or one run's rate-limit state is the other's.
 */
const FEEDBACK_STORE_DIR = path.join(os.tmpdir(), `ci-playwright-feedback-store-${PORT}`)

/** The accessibility spec belongs to the two accessibility projects. */
const A11Y_SPEC = /a11y\.spec\.ts$/
/** The geometry spec belongs to the three focused browser projects. */
const GEOMETRY_SPEC = /text-geometry\.spec\.ts$/
/** The served-build guard belongs to its own project, which every other one waits for. */
const SETUP_SPEC = /served-build\.setup\.ts$/

/**
 * Every project depends on this one, so no suite can report a result about a
 * server that is not this build. See `tests/e2e/served-build.setup.ts`.
 */
const SERVED_BUILD_GUARD = ['served-build'] as const

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
   * viewport. With seven projects sharing a machine that comfortably exceeds a
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
      name: 'served-build',
      testMatch: SETUP_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'chromium-desktop',
      dependencies: [...SERVED_BUILD_GUARD],
      testIgnore: [A11Y_SPEC, GEOMETRY_SPEC, SETUP_SPEC],
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'chromium-mobile',
      dependencies: [...SERVED_BUILD_GUARD],
      testIgnore: [A11Y_SPEC, GEOMETRY_SPEC, SETUP_SPEC],
      use: { ...devices['Desktop Chrome'], viewport: MOBILE_VIEWPORT, hasTouch: true },
    },
    {
      name: 'accessibility',
      dependencies: [...SERVED_BUILD_GUARD],
      testMatch: A11Y_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      // The same axe and structural sweep at the mobile viewport. Layout,
      // target sizes and the sheet navigation all differ below the desktop
      // breakpoints, so a desktop-only gate could pass a mobile regression.
      name: 'accessibility-mobile',
      dependencies: [...SERVED_BUILD_GUARD],
      testMatch: A11Y_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: MOBILE_VIEWPORT, hasTouch: true },
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
      dependencies: [...SERVED_BUILD_GUARD],
      testMatch: GEOMETRY_SPEC,
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'geometry-firefox',
      dependencies: [...SERVED_BUILD_GUARD],
      testMatch: GEOMETRY_SPEC,
      use: { ...devices['Desktop Firefox'], viewport: DESKTOP_VIEWPORT },
    },
    {
      name: 'geometry-webkit',
      dependencies: [...SERVED_BUILD_GUARD],
      testMatch: GEOMETRY_SPEC,
      use: { ...devices['Desktop Safari'], viewport: DESKTOP_VIEWPORT },
    },
  ],

  /*
   * A deployed run has nothing to serve. Starting `next start` anyway would
   * build a second, local copy of the site and then not use it, and on a
   * machine where the port is taken it would fail the run for a reason that
   * has nothing to do with the deployment under test.
   */
  webServer: isDeployedRun
    ? undefined
    : {
        // Serve only: both tasks declare `dependsOn: ["build"]`, so building
        // here as well ran `next build` twice. Running playwright directly
        // needs a build.
        command: `bunx next start --port ${PORT}`,
        url: BASE_URL,
        // `next start` loads its manifest at boot, so a reused server would
        // serve whatever was built when it started rather than the code under
        // test.
        reuseExistingServer: false,
        timeout: 2 * 60 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
        env: { FEEDBACK_STORE_DIR },
      },
})
