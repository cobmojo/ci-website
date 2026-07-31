import { describe, expect, it } from 'vitest'
import { type FeedbackConfig, resolveFeedbackConfig } from '../config'

/** Narrows the union so a test can read the reason a configuration was refused. */
function problemOf(config: FeedbackConfig): string {
  return config.usable ? '' : config.problem
}

/**
 * The correction form is the only way a reader can tell this site it is wrong,
 * and the only place the site writes anything down. Where those writes go is a
 * deployment decision that the code cannot make and cannot detect: a directory
 * that survives a restart and a directory that evaporates on the next deploy
 * are the same directory to `appendFile`.
 *
 * So the configuration is resolved once, strictly, and a production deployment
 * has to say which of the two it has. The tests below are the whole contract.
 */

/** A local build: `next dev`, `vitest`, the Playwright server. */
const DEV = { NODE_ENV: 'development' } as const
/** A deployed build. */
const PROD = { NODE_ENV: 'production' } as const
/** The canonical origin a deployed build publishes under. */
const SITE = 'https://example.org'

describe('resolveFeedbackConfig, locally', () => {
  it('defaults to the filesystem store in the repository', () => {
    const config = resolveFeedbackConfig(DEV)
    expect(config.kind).toBe('filesystem')
    expect(config.usable).toBe(true)
  })

  it('honours an explicit store directory', () => {
    const config = resolveFeedbackConfig({ ...DEV, FEEDBACK_STORE_DIR: '/tmp/somewhere' })
    expect(config).toMatchObject({ kind: 'filesystem', directory: '/tmp/somewhere' })
  })

  it('offers an in-memory store for tests, which never touches a disk', () => {
    const config = resolveFeedbackConfig({ ...DEV, FEEDBACK_STORE: 'memory' })
    expect(config).toMatchObject({ kind: 'memory', usable: true })
  })
})

describe('resolveFeedbackConfig, deployed', () => {
  it('refuses an unacknowledged filesystem store, because it cannot tell whether the disk survives a deploy', () => {
    const config = resolveFeedbackConfig({ ...PROD, FEEDBACK_STORE_DIR: '/var/data/feedback' })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/FEEDBACK_STORE_DURABLE/)
  })

  it('accepts a filesystem store once the operator has vouched for the volume', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      FEEDBACK_STORE_DIR: '/var/data/feedback',
      FEEDBACK_STORE_DURABLE: '1',
    })
    expect(config).toMatchObject({
      kind: 'filesystem',
      directory: '/var/data/feedback',
      usable: true,
    })
  })

  it('requires an absolute directory, because a relative one resolves against whatever cwd the host chose', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      FEEDBACK_STORE_DIR: 'feedback-store',
      FEEDBACK_STORE_DURABLE: '1',
    })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/absolute/i)
  })

  it('refuses the in-memory store outright, whatever else is set', () => {
    const config = resolveFeedbackConfig({ ...PROD, FEEDBACK_STORE: 'memory' })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/memory/i)
  })

  it('accepts an http store on the site’s own origin', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      NEXT_PUBLIC_SITE_URL: SITE,
      FEEDBACK_STORE: 'http',
      FEEDBACK_STORE_URL: `${SITE}/internal/feedback`,
    })
    expect(config).toMatchObject({
      kind: 'http',
      endpoint: `${SITE}/internal/feedback`,
      usable: true,
    })
  })

  it('refuses an http store with no endpoint', () => {
    const config = resolveFeedbackConfig({ ...PROD, FEEDBACK_STORE: 'http' })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/FEEDBACK_STORE_URL/)
  })

  it('refuses a plaintext http endpoint, which would put a reader’s message on the wire in clear', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      NEXT_PUBLIC_SITE_URL: SITE,
      FEEDBACK_STORE: 'http',
      FEEDBACK_STORE_URL: 'http://example.org/internal/feedback',
    })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/https/i)
  })

  it('refuses an unknown store name rather than falling back to a default', () => {
    const config = resolveFeedbackConfig({ ...PROD, FEEDBACK_STORE: 'postgres' })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/postgres/)
  })
})

/**
 * `/privacy/` says no third party is involved in receiving, storing or reading
 * a submission, and `/corrections/` says submissions are stored on the site's
 * own server. A collector on anyone else's origin makes both untrue while the
 * pages go on saying them, so the configuration is where that is caught.
 */
describe('the http collector has to be this site', () => {
  const HTTP = { ...PROD, NEXT_PUBLIC_SITE_URL: SITE, FEEDBACK_STORE: 'http' } as const

  it('refuses a collector on another host, naming the promise it would break', () => {
    const config = resolveFeedbackConfig({
      ...HTTP,
      FEEDBACK_STORE_URL: 'https://collector.example/records',
    })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/third party/i)
    expect(problemOf(config)).toContain('https://collector.example')
  })

  it('refuses a subdomain of the site, which is still a different origin to a browser', () => {
    const config = resolveFeedbackConfig({
      ...HTTP,
      FEEDBACK_STORE_URL: 'https://forms.example.org/records',
    })
    expect(config.usable).toBe(false)
  })

  it('refuses a different port on the same host', () => {
    const config = resolveFeedbackConfig({
      ...HTTP,
      FEEDBACK_STORE_URL: 'https://example.org:8443/r',
    })
    expect(config.usable).toBe(false)
  })

  it('accepts any path on the site’s own origin', () => {
    expect(
      resolveFeedbackConfig({ ...HTTP, FEEDBACK_STORE_URL: 'https://example.org/internal/store' })
        .usable,
    ).toBe(true)
  })

  it('refuses to guess when the build never said what its origin is', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      FEEDBACK_STORE: 'http',
      FEEDBACK_STORE_URL: `${SITE}/internal/feedback`,
    })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/NEXT_PUBLIC_SITE_URL/)
  })
})

describe('trusted proxy hops', () => {
  it('assumes exactly one proxy, which is what every managed host puts in front of an origin', () => {
    expect(resolveFeedbackConfig(DEV).trustedProxyHops).toBe(1)
  })

  it('takes an explicit hop count', () => {
    expect(
      resolveFeedbackConfig({ ...DEV, FEEDBACK_TRUSTED_PROXY_HOPS: '2' }).trustedProxyHops,
    ).toBe(2)
  })

  /**
   * Zero used to be documented as “nothing is in front, believe no forwarding
   * header”. It is refused instead: with no address to key on, `clientAddress`
   * answers `unknown-client` for everyone, so the five-per-ten-minutes window
   * becomes five submissions for the whole readership and one sender closes
   * the site's only correction channel for everybody.
   */
  it('refuses zero rather than bucketing every reader together', () => {
    const config = resolveFeedbackConfig({ ...DEV, FEEDBACK_TRUSTED_PROXY_HOPS: '0' })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/FEEDBACK_TRUSTED_PROXY_HOPS/)
    expect(problemOf(config)).toMatch(/proxy/i)
  })

  it('refuses zero in production too, whichever store was asked for', () => {
    for (const store of ['filesystem', 'http', 'memory']) {
      const config = resolveFeedbackConfig({
        ...PROD,
        FEEDBACK_STORE: store,
        FEEDBACK_TRUSTED_PROXY_HOPS: '0',
      })
      expect(config.usable).toBe(false)
    }
  })

  it('ignores a value that is not a whole number rather than guessing', () => {
    expect(
      resolveFeedbackConfig({ ...DEV, FEEDBACK_TRUSTED_PROXY_HOPS: 'lots' }).trustedProxyHops,
    ).toBe(1)
    expect(
      resolveFeedbackConfig({ ...DEV, FEEDBACK_TRUSTED_PROXY_HOPS: '-3' }).trustedProxyHops,
    ).toBe(1)
  })
})

describe('the notification switch says what it actually does', () => {
  it('is off by default', () => {
    expect(resolveFeedbackConfig(DEV).notifyEmail).toBeNull()
  })

  it('carries the address through when set', () => {
    expect(
      resolveFeedbackConfig({ ...DEV, FEEDBACK_NOTIFY_EMAIL: 'a@b.example' }).notifyEmail,
    ).toBe('a@b.example')
  })
})
