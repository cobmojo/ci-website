import { expect, test } from '@playwright/test'

/**
 * The response headers, read from a response.
 *
 * `next.config.ts` computes these, and nothing checked that any of them
 * survived to the wire. A header block is exactly the kind of configuration
 * that is edited once, believed for a year, and turns out to have been dropped
 * by a rewrite, a provider default or a typo in a directive name.
 *
 * These run against whatever origin the suite is pointed at, so the same
 * assertions cover the local production server and a deployed preview — which
 * matters, because a deployment platform is free to add, strip or override
 * headers, and only the deployed run can tell you that it did.
 */

/** Directives that must be present, whatever else the policy carries. */
const REQUIRED_CSP: ReadonlyArray<[directive: string, value: RegExp]> = [
  ['default-src', /'self'/],
  ['script-src', /'self'/],
  ['style-src', /'self'/],
  ['img-src', /'self'/],
  ['font-src', /'self'/],
  ['connect-src', /'self'/],
  ['object-src', /'none'/],
  ['base-uri', /'self'/],
  ['form-action', /'self'/],
  ['frame-ancestors', /'none'/],
  // The one external origin the site is allowed to frame, and only that one.
  ['frame-src', /^https:\/\/www\.youtube-nocookie\.com$/],
]

function parseCsp(header: string): Map<string, string> {
  const directives = new Map<string, string>()
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const space = trimmed.indexOf(' ')
    if (space === -1) directives.set(trimmed, '')
    else directives.set(trimmed.slice(0, space), trimmed.slice(space + 1).trim())
  }
  return directives
}

test('every page carries the security header set', async ({ request }) => {
  const response = await request.get('/')
  expect(response.status()).toBe(200)
  const headers = response.headers()

  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['cross-origin-opener-policy']).toBe('same-origin')
  expect(headers['permissions-policy']).toContain('camera=()')
  expect(headers['permissions-policy']).toContain('geolocation=()')

  // Next is asked not to advertise itself; a version header is a free hint.
  expect(headers['x-powered-by']).toBeUndefined()
})

test('the content security policy carries every directive it is supposed to', async ({
  request,
}) => {
  const response = await request.get('/')
  const header = response.headers()['content-security-policy']
  expect(header, 'no Content-Security-Policy on the response').toBeTruthy()

  const directives = parseCsp(header as string)
  for (const [name, pattern] of REQUIRED_CSP) {
    expect(directives.has(name), `missing ${name}`).toBe(true)
    expect(directives.get(name) ?? '', name).toMatch(pattern)
  }
})

test('the policy allows no external script, style, font or connection origin', async ({
  request,
}) => {
  const header = (await request.get('/')).headers()['content-security-policy'] as string
  const directives = parseCsp(header)

  for (const directive of ['script-src', 'style-src', 'font-src', 'connect-src']) {
    const value = directives.get(directive) ?? ''
    expect(value, `${directive} names an external origin`).not.toMatch(/https?:\/\//)
  }
})

test('an article carries the same policy as the home page', async ({ request }) => {
  const home = (await request.get('/')).headers()['content-security-policy']
  const article = (await request.get('/case/key-texts/eternal-punishment/')).headers()[
    'content-security-policy'
  ]
  expect(article).toBe(home)
})

test('the write endpoint carries the header set too', async ({ request }) => {
  // The canonical, slashed path. A GET is answered with a redirect to the
  // corrections page, which is enough to read the headers off the route
  // without posting anything.
  const response = await request.get('/api/feedback/', { maxRedirects: 0 })
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
  expect(response.headers()['content-security-policy']).toBeTruthy()
})

test('a trailing-slash normalisation is a bare redirect, and what it points at is not', async ({
  request,
}) => {
  /*
   * `trailingSlash: true` answers an unslashed path with a 308 before any
   * header rule runs, so that one response carries no policy. It has no body,
   * no script and nothing to protect, and the page it points at carries the
   * full set — which is the part worth pinning, because the difference is not
   * visible in `next.config.ts`.
   */
  const normalisation = await request.get('/api/feedback', { maxRedirects: 0 })
  expect([301, 308]).toContain(normalisation.status())
  // Next writes the destination as the body of its normalisation redirect, and
  // that is the whole of it: no markup, no script, nothing a policy protects.
  const body = await normalisation.text()
  expect(body.length).toBeLessThan(200)
  expect(body).not.toMatch(/<script|<html/i)

  const canonical = await request.get('/api/feedback/', { maxRedirects: 0 })
  expect(canonical.headers()['content-security-policy']).toBeTruthy()
})

test('transport security matches the scheme the origin is actually served on', async ({
  request,
  baseURL,
}) => {
  const headers = (await request.get('/')).headers()
  const hsts = headers['strict-transport-security']

  if ((baseURL as string).startsWith('https://')) {
    expect(hsts, 'an HTTPS origin must send HSTS').toBeTruthy()
    expect(hsts).toMatch(/max-age=\d{7,}/)
    expect(hsts).toContain('includeSubDomains')
  } else {
    /*
     * Never from a plain-HTTP origin. Sent from the local test server it would
     * pin the browser's `localhost` entry to HTTPS for the whole max-age and
     * break every other project on the machine.
     */
    expect(hsts, 'HSTS from a plain-HTTP origin').toBeUndefined()
  }
})

test('a font is cached for a year, and the write endpoint is not cached at all', async ({
  request,
  page,
}) => {
  /*
   * The font is read out of the rendered document rather than guessed: the
   * filenames are an implementation detail of the build, and a test that
   * hardcodes one silently stops checking anything the day it changes.
   */
  await page.goto('/')
  const fontUrl = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap(sheet => {
        try {
          return [...sheet.cssRules]
        } catch {
          return []
        }
      })
      .map(rule => /url\((?:"|')?([^"')]*\.woff2)/.exec(rule.cssText)?.[1])
      .find(Boolean),
  )
  expect(fontUrl, 'no woff2 referenced by any stylesheet').toBeTruthy()

  const font = await request.get(fontUrl as string)
  expect(font.status()).toBe(200)
  expect(font.headers()['cache-control'] ?? '').toContain('immutable')
  expect(font.headers()['cache-control'] ?? '').toMatch(/max-age=\d{7,}/)

  const feedback = await request.get('/api/feedback/', { maxRedirects: 0 })
  const cacheControl = feedback.headers()['cache-control'] ?? ''
  expect(cacheControl, 'the write endpoint must not be cached').not.toMatch(/max-age=[1-9]/)
})

test('the downloads and the search index are reachable but not indexable', async ({ request }) => {
  for (const route of [
    '/download/transcript.txt',
    '/download/bibliography.txt',
    '/download/handout.html',
    '/search-index.json',
  ]) {
    const response = await request.get(route)
    expect(response.status(), route).toBe(200)
    expect(response.headers()['x-robots-tag'] ?? '', route).toContain('noindex')
  }

  /*
   * A real page is not caught by the same rule. On a preview deployment every
   * page carries `noindex, nofollow`, so the assertion is that this page agrees
   * with the site-wide policy rather than that it has none.
   */
  const home = (await request.get('/')).headers()['x-robots-tag']
  const article = (await request.get('/case/key-texts/eternal-punishment/')).headers()[
    'x-robots-tag'
  ]
  expect(article).toBe(home)

  /*
   * The four paths never weaken the site-wide policy. A later header rule
   * replaces an earlier one rather than adding to it, so the download rule has
   * to carry every directive the site-wide one does — and the assertion has to
   * be unconditional, or it only runs on a preview and is dead everywhere the
   * suite is actually executed. Written as a token comparison so it holds in
   * both environments: `noindex` always, `nofollow` exactly when the site-wide
   * policy has it.
   */
  const download = (await request.get('/download/transcript.txt')).headers()['x-robots-tag'] ?? ''
  expect(download).toContain('noindex')
  expect(download.includes('nofollow'), 'the download rule dropped nofollow').toBe(
    (home ?? '').includes('nofollow'),
  )
})

test('the search index is served as JSON and revalidates rather than going stale', async ({
  request,
}) => {
  const response = await request.get('/search-index.json')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type'] ?? '').toContain('application/json')
  expect(response.headers()['cache-control'] ?? '').toMatch(/must-revalidate|max-age/)
})
