import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * The server answering this run is the build this run was made from.
 *
 * Every other project depends on this one, so it is the first thing that
 * happens and nothing else starts if it fails.
 *
 * This exists because of a measured failure, not a hypothetical one. The suite
 * serves its production build on a fixed port. When a second checkout of this
 * repository was testing at the same time, the run bound to — or was answered
 * by — the *other* checkout's server, and reported nine failures that described
 * that other build: hashed chunk names the lazy-boundary tests could not match,
 * and dialog markup the excerpt tests could not find. All nine looked exactly
 * like product defects. None of them was.
 *
 * A wrong answer that looks like a finding is worse than no answer, so the run
 * now proves what it is talking to before it says anything about it.
 */

/** Emitted by `next build` and embedded in every rendered document. */
function localBuildId(): string {
  return readFileSync(path.resolve(process.cwd(), '.next/BUILD_ID'), 'utf8').trim()
}

test('the server under test is serving this checkout’s build', async ({ page, baseURL }) => {
  const response = await page.goto('/')
  expect(response?.status(), `${baseURL} did not answer with a page`).toBe(200)

  const html = await page.content()

  if (process.env.PLAYWRIGHT_BASE_URL) {
    /*
     * A deployed origin was built somewhere else, so its build id cannot match
     * a local one and there is nothing to compare it against. What still has to
     * hold is that the origin is this site rather than a parked domain, a
     * provider error page or somebody else's deployment.
     */
    await expect(page).toHaveTitle(/Conditional Immortality/i)
    return
  }

  const expected = localBuildId()
  expect(
    html.includes(expected),
    `The server at ${baseURL} is not serving the build in .next (${expected}). ` +
      'Another process is almost certainly holding the port. Set PLAYWRIGHT_PORT ' +
      'to something free, or stop the other server, and run again.',
  ).toBe(true)
})
