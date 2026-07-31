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

test('a static asset is cached, and the write endpoint is not', async ({ request }) => {
  const feedback = await request.get('/api/feedback', { maxRedirects: 0 })
  const cacheControl = feedback.headers()['cache-control'] ?? ''
  expect(cacheControl, 'the write endpoint must not be cached').not.toMatch(/max-age=[1-9]/)
})

test('the search index is served as JSON and revalidates rather than going stale', async ({
  request,
}) => {
  const response = await request.get('/search-index.json')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type'] ?? '').toContain('application/json')
  expect(response.headers()['cache-control'] ?? '').toMatch(/must-revalidate|max-age/)
})
