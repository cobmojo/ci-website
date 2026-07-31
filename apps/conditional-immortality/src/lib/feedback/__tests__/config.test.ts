import { readFileSync } from 'node:fs'
import path from 'node:path'
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

  it('accepts an http store with an https endpoint the operator has claimed', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      FEEDBACK_STORE: 'http',
      FEEDBACK_STORE_URL: 'https://collector.example/records',
      FEEDBACK_STORE_FIRST_PARTY: '1',
    })
    expect(config).toMatchObject({
      kind: 'http',
      endpoint: 'https://collector.example/records',
      usable: true,
    })
  })

  /*
   * The one configuration that could make the site lie about itself.
   *
   * `/corrections/` says "no third party is contacted" and that submissions
   * are "stored on the site's own server"; `/privacy/` says "there is no third
   * party involved in receiving, storing or reading a submission". This
   * adapter posts the whole record — the message, and the name and email
   * address if the reader gave them — to whatever URL is set, and no code can
   * tell a collector the author runs from a hosted form product. So the
   * deployment has to say, in the same way it says a directory is durable.
   */
  it('refuses an http store nobody has claimed as their own', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      FEEDBACK_STORE: 'http',
      FEEDBACK_STORE_URL: 'https://collector.example/records',
    })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/FEEDBACK_STORE_FIRST_PARTY/)
    // The message has to name the pages whose promise it is protecting, or the
    // operator reads it as a formality and sets it to make the error go away.
    expect(problemOf(config)).toMatch(/third party/i)
    expect(problemOf(config)).toMatch(/\/privacy\//)
  })

  it('does not accept a value other than 1 as the claim', () => {
    for (const value of ['0', 'true', 'yes', '']) {
      const config = resolveFeedbackConfig({
        ...PROD,
        FEEDBACK_STORE: 'http',
        FEEDBACK_STORE_URL: 'https://collector.example/records',
        FEEDBACK_STORE_FIRST_PARTY: value,
      })
      expect(config.usable, `FEEDBACK_STORE_FIRST_PARTY=${JSON.stringify(value)}`).toBe(false)
    }
  })

  it('asks for the claim after the endpoint is valid, not instead of checking it', () => {
    // A plaintext endpoint is refused for being plaintext, whether or not the
    // operator has claimed it: the two checks protect different things.
    const config = resolveFeedbackConfig({
      ...PROD,
      FEEDBACK_STORE: 'http',
      FEEDBACK_STORE_URL: 'http://collector.example/records',
      FEEDBACK_STORE_FIRST_PARTY: '1',
    })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/https/i)
  })

  it('refuses an http store with no endpoint', () => {
    const config = resolveFeedbackConfig({ ...PROD, FEEDBACK_STORE: 'http' })
    expect(config.usable).toBe(false)
    expect(problemOf(config)).toMatch(/FEEDBACK_STORE_URL/)
  })

  it('refuses a plaintext http endpoint, which would put a reader’s message on the wire in clear', () => {
    const config = resolveFeedbackConfig({
      ...PROD,
      FEEDBACK_STORE: 'http',
      FEEDBACK_STORE_URL: 'http://collector.example/records',
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

describe('trusted proxy hops', () => {
  it('assumes exactly one proxy, which is what every managed host puts in front of an origin', () => {
    expect(resolveFeedbackConfig(DEV).trustedProxyHops).toBe(1)
  })

  it('takes an explicit hop count', () => {
    expect(
      resolveFeedbackConfig({ ...DEV, FEEDBACK_TRUSTED_PROXY_HOPS: '2' }).trustedProxyHops,
    ).toBe(2)
  })

  it('treats zero as “no proxy, trust nothing a client sent”', () => {
    expect(
      resolveFeedbackConfig({ ...DEV, FEEDBACK_TRUSTED_PROXY_HOPS: '0' }).trustedProxyHops,
    ).toBe(0)
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

describe('the promise the http store is gated on', () => {
  /*
   * The gate and the promise live in different files and neither imports the
   * other, so nothing connects them. Renaming or softening either would leave
   * a refusal protecting a claim the site no longer makes, or — far worse — a
   * claim with nothing protecting it, and every test still green.
   *
   * This is not asserting that a particular sentence is good copy. It is
   * asserting that the pages still say the thing `resolveFeedbackConfig`
   * refuses an unclaimed endpoint in order to keep true. If that changes, this
   * fails, and whoever changed it decides which of the two to move.
   */
  const read = (file: string) => readFileSync(path.resolve(__dirname, '../../../app', file), 'utf8')

  it('/corrections/ still tells the reader no third party is contacted', () => {
    expect(read('corrections/page.tsx')).toMatch(/no third party is contacted/)
  })

  it('/corrections/ still tells the reader submissions stay on this server', () => {
    expect(read('corrections/page.tsx')).toMatch(/stored on the site’s own server/)
  })

  it('/privacy/ still rules a third party out of receiving or storing one', () => {
    expect(read('privacy/page.tsx')).toMatch(
      /no third party involved in receiving, storing or reading a[\s\S]{0,20}submission/,
    )
  })
})
