import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The motion contract.
 *
 * `docs/motion-brief.md` is the prose; this file is the part that fails a build.
 * It reads the stylesheet as text rather than exercising a browser, because the
 * rules it enforces are properties of the source: which declarations sit inside
 * a reduced-motion query, whether a duration is tokenised, whether anybody
 * reached for `transition: all`.
 *
 * The behavioural half lives in `tests/e2e/motion.spec.ts`, which checks what a
 * browser actually computes with the preference set both ways.
 */

const here = dirname(fileURLToPath(import.meta.url))
const CSS_PATH = resolve(here, '../../app/globals.css')
const css = readFileSync(CSS_PATH, 'utf8')

/* ------------------------------------------------------------------ *
 * Extracting media blocks
 *
 * Brace matching rather than a regex: these blocks nest `@starting-style`
 * and pseudo-element rules, so a lazy `\{[^}]*\}` would stop at the first
 * inner close brace and silently pass everything after it.
 * ------------------------------------------------------------------ */

function blocksFor(source: string, condition: string): string[] {
  const found: string[] = []
  const needle = `@media (prefers-reduced-motion: ${condition})`
  let from = 0

  for (;;) {
    const start = source.indexOf(needle, from)
    if (start === -1) return found

    const open = source.indexOf('{', start)
    if (open === -1) return found

    let depth = 0
    let index = open
    for (; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1
      else if (source[index] === '}') {
        depth -= 1
        if (depth === 0) break
      }
    }

    found.push(source.slice(open + 1, index))
    from = index + 1
  }
}

const noPreferenceBlocks = blocksFor(css, 'no-preference')
const reduceBlocks = blocksFor(css, 'reduce')

/** Everything not inside a reduced-motion query of either kind. */
const unconditional = [...noPreferenceBlocks, ...reduceBlocks].reduce(
  (rest, block) => rest.replace(block, ''),
  css,
)

/* ------------------------------------------------------------------ *
 * Declaration helpers
 * ------------------------------------------------------------------ */

/** Strip comments so a documented counter-example cannot fail its own rule. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '')
}

interface Declaration {
  readonly property: string
  readonly value: string
}

function declarations(source: string): Declaration[] {
  const found: Declaration[] = []
  const pattern = /([-a-z]+)\s*:\s*([^;{}]+)/g
  for (const match of withoutComments(source).matchAll(pattern)) {
    const [, property, value] = match
    if (property && value) found.push({ property, value: value.trim() })
  }
  return found
}

function declarationsNamed(source: string, ...names: readonly string[]): Declaration[] {
  return declarations(source).filter(entry => names.includes(entry.property))
}

/**
 * Properties whose animation moves something. Transitioning any of these is
 * movement by definition, so it may only appear inside a `no-preference` query.
 */
const MOVEMENT_PROPERTIES = [
  'transform',
  'translate',
  'rotate',
  'scale',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'width',
  'height',
  'block-size',
  'inline-size',
  'max-height',
  'max-block-size',
  'margin',
  'margin-top',
  'margin-block-start',
  'padding',
  'gap',
  'flex-basis',
]

/** The property list from a `transition` shorthand or a `transition-property`. */
function transitionedProperties(value: string): string[] {
  return value
    .split(',')
    .map(
      part =>
        part
          .trim()
          // Drop durations, delays, easing functions and `allow-discrete`.
          .replace(/var\([^)]*\)/g, '')
          .replace(/cubic-bezier\([^)]*\)/g, '')
          .trim()
          .split(/\s+/)[0]
          ?.toLowerCase() ?? '',
    )
    .filter(name => name.length > 0)
}

/* ------------------------------------------------------------------ *
 * Tokens
 * ------------------------------------------------------------------ */

describe('motion tokens', () => {
  const REQUIRED = [
    '--motion-feedback',
    '--motion-press',
    '--motion-overlay',
    '--motion-overlay-exit',
    '--ease-out-quad',
    '--ease-out-cubic',
  ]

  it.each(REQUIRED)('declares %s', token => {
    expect(css).toContain(`${token}:`)
  })

  it('uses the easing blueprint curves rather than invented ones', () => {
    // From the "Animations on the Web" easing blueprint. A substituted curve
    // here would change the feel of every animation on the site at once.
    expect(css).toContain('--ease-out-quad: cubic-bezier(0.25, 0.46, 0.45, 0.94)')
    expect(css).toContain('--ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1)')
  })

  it('keeps every duration under the 300ms ceiling for interface animation', () => {
    const durations = declarations(css)
      .filter(entry => entry.property.startsWith('--motion-'))
      .map(entry => ({ token: entry.property, ms: Number.parseFloat(entry.value) }))

    expect(durations.length).toBeGreaterThanOrEqual(REQUIRED.length - 2)
    for (const { token, ms } of durations) {
      expect(Number.isFinite(ms), `${token} is not a time`).toBe(true)
      expect(ms, `${token} is above the 300ms ceiling`).toBeLessThanOrEqual(300)
      expect(ms, `${token} is not a perceptible duration`).toBeGreaterThan(0)
    }
  })

  it('makes exits quicker than entrances', () => {
    const value = (token: string): number => {
      const match = css.match(new RegExp(`${token}:\\s*([0-9.]+)ms`))
      return Number.parseFloat(match?.[1] ?? 'NaN')
    }
    expect(value('--motion-overlay-exit')).toBeLessThan(value('--motion-overlay'))
  })
})

/* ------------------------------------------------------------------ *
 * Reduced motion
 * ------------------------------------------------------------------ */

describe('reduced motion', () => {
  it('opts into movement rather than out of it', () => {
    // The still variant has to be the default, so a browser matching neither
    // query still gets it.
    expect(noPreferenceBlocks.length).toBeGreaterThan(0)
  })

  it('never uses !important to suppress motion', () => {
    // A blanket `!important` cannot be overridden by a component that needs to
    // keep an opacity fade, which is the meaning the reader relies on.
    for (const block of reduceBlocks) {
      expect(withoutComments(block)).not.toContain('!important')
    }
  })

  it('has dropped the blanket duration override', () => {
    // Comments are stripped: the stylesheet documents what it replaced, and the
    // explanation must not trip the rule it is explaining.
    const live = withoutComments(css)
    expect(live).not.toContain('0.001ms')
    expect(live).not.toMatch(/animation-iteration-count:\s*1\s*!important/)
  })

  it('keeps colour transitions when motion is reduced', () => {
    // Tier 1 survives `reduce`: colour is not movement, it is how the state
    // change stays legible. A `transition-property: none` on `*` would remove it.
    for (const block of reduceBlocks) {
      const killers = declarationsNamed(block, 'transition', 'transition-property').filter(entry =>
        /\bnone\b/.test(entry.value),
      )
      const universal = /\*\s*,?\s*(\*::before|\*::after|\{)/.test(block)
      expect(
        killers.length === 0 || !universal,
        'a universal selector inside `reduce` switches transitions off wholesale',
      ).toBe(true)
    }
  })

  it('confines every movement transition to a no-preference block', () => {
    const offenders: string[] = []
    for (const entry of declarationsNamed(unconditional, 'transition', 'transition-property')) {
      for (const property of transitionedProperties(entry.value)) {
        if (MOVEMENT_PROPERTIES.includes(property)) {
          offenders.push(`${entry.property}: ${entry.value}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('confines every movement keyframe animation to a no-preference block', () => {
    const moving = new Set<string>()
    const pattern = /@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\s*\}/g
    for (const match of withoutComments(css).matchAll(pattern)) {
      const [, name, body] = match
      if (!name || !body) continue
      if (/\b(transform|translate|scale|rotate|block-size|height)\s*:/.test(body)) moving.add(name)
    }

    const used = declarationsNamed(unconditional, 'animation', 'animation-name')
      .flatMap(entry => entry.value.split(/[\s,]+/))
      .filter(token => moving.has(token))

    expect(used).toEqual([])
  })

  it('never sets smooth scrolling in the stylesheet', () => {
    // Tier 4 is applied by `components/navigation/smooth-anchor-scroll.tsx` for
    // the duration of one fragment navigation, because `scroll-behavior: smooth`
    // on `html` also suppresses the App Router's scroll-to-top. That component
    // reads the reduced-motion preference itself, and its own suite covers it.
    expect(withoutComments(css)).not.toMatch(/scroll-behavior:\s*smooth/)
  })

  it('never animates a size', () => {
    // Nothing on the site animates a height, in either variant. A collapsed
    // `::details-content` hides the content of a disclosure outright on
    // Chromium 148, so the disclosure animation was measured and withdrawn;
    // `interpolate-size` exists only to make `auto` interpolable and has no
    // other purpose here. See docs/motion-brief.md.
    const live = withoutComments(css)
    expect(live).not.toContain('interpolate-size')
    expect(live).not.toMatch(/::details-content\s*\{[^}]*block-size/)
  })
})

/* ------------------------------------------------------------------ *
 * Craft rules
 * ------------------------------------------------------------------ */

describe('animation craft', () => {
  it('never transitions all', () => {
    for (const entry of declarationsNamed(css, 'transition', 'transition-property')) {
      expect(
        transitionedProperties(entry.value),
        `\`${entry.property}: ${entry.value}\` lets unrelated property changes animate`,
      ).not.toContain('all')
    }
  })

  it('tokenises every duration', () => {
    const offenders = declarationsNamed(
      css,
      'transition',
      'transition-duration',
      'animation',
      'animation-duration',
    )
      .filter(entry => /(?<![\w-])[0-9.]+m?s\b/.test(entry.value.replace(/var\([^)]*\)/g, '')))
      .map(entry => `${entry.property}: ${entry.value}`)

    expect(offenders).toEqual([])
  })

  it('tokenises every easing curve', () => {
    const offenders = declarationsNamed(
      css,
      'transition',
      'transition-timing-function',
      'animation',
      'animation-timing-function',
    )
      .filter(entry => /cubic-bezier\(/.test(entry.value))
      .map(entry => `${entry.property}: ${entry.value}`)

    expect(offenders).toEqual([])
  })

  it('never uses ease-in, which delays the feedback a reader is waiting for', () => {
    const offenders = declarationsNamed(
      css,
      'transition',
      'transition-timing-function',
      'animation',
      'animation-timing-function',
    )
      // `ease-in-out` is a different curve and is allowed for on-screen movement.
      .filter(entry => /\bease-in(?![-\w])/.test(entry.value))
      .map(entry => `${entry.property}: ${entry.value}`)

    expect(offenders).toEqual([])
  })

  it('gives every interactive element feedback timing from one place', () => {
    // Tier 1 is applied in the base layer to element selectors, so a page added
    // later cannot forget it and two identical-looking controls cannot behave
    // differently.
    const base = css.slice(css.indexOf('@layer base'), css.indexOf('@layer components'))
    expect(base).toContain('var(--motion-feedback)')
    for (const selector of ['a', 'button', 'summary', 'select', 'input', 'textarea']) {
      expect(base).toMatch(new RegExp(`(^|[\\s,])${selector}[\\s,]`, 'm'))
    }
  })

  it('scales presses down, and only slightly', () => {
    const press = css.slice(css.indexOf('.pressable'))
    const match = press.match(/scale:\s*([0-9.]+)/)
    expect(match, 'the press affordance has no scale').not.toBeNull()
    const factor = Number.parseFloat(match?.[1] ?? 'NaN')
    expect(factor).toBeLessThan(1)
    expect(
      factor,
      'a press below 0.9 reads as a glitch rather than a press',
    ).toBeGreaterThanOrEqual(0.9)
  })

  it('never animates from nothing', () => {
    // Starting a scale animation at 0 has no counterpart in the physical world.
    expect(withoutComments(css)).not.toMatch(/scale:\s*0(\s|;|\))/)
  })

  it('runs every press confirmation on the press token and the press curve', () => {
    // Tier 2 is one gesture with one clock and one curve. `.pressable`
    // carries `--motion-press` with `--ease-out-quad` in its per-property
    // lists; the video play glyph performs the identical 0.97 squash and must
    // not drift onto the Tier 1 feedback timing on either axis.
    const live = withoutComments(css)
    const press = live.match(/\.video-play:active\s+\.video-play__glyph\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(press).toContain('var(--motion-press)')
    expect(press).toContain('var(--ease-out-quad)')
  })

  it('gives Tier 3 arrivals the overlay curve, not the Tier 1 keyword', () => {
    // The brief assigns `--ease-out-quad` to Tier 3. `status-in` uses it; the
    // shared `reveal-fade` arrival must use the same curve rather than `ease`.
    expect(withoutComments(css)).toMatch(
      /animation:\s*reveal-fade\s+var\(--motion-reveal\)\s+var\(--ease-out-quad\)/,
    )
  })
})

/* ------------------------------------------------------------------ *
 * Print
 * ------------------------------------------------------------------ */

describe('print', () => {
  it('leaves no animation able to hide content on paper', () => {
    // Print forces every disclosure open by reverting `display` on its
    // children, which cannot reach a pseudo-element. So no rule anywhere may
    // collapse `::details-content`, or the content of every disclosure would be
    // missing from the printed page.
    const live = withoutComments(css)
    expect(live).not.toMatch(/::details-content\s*\{[^}]*(block-size|content-visibility|overflow)/)
  })

  it('keeps disclosures open on paper', () => {
    // Index into the stripped string, not the original: comments shift offsets.
    const live = withoutComments(css)
    const print = live.slice(live.indexOf('@media print'))
    // Pinned to the exact selector. `details[^{]*` would also accept
    // `details[open]`, which forces open only what is already open — the
    // regression this line exists to catch.
    expect(print).toMatch(
      /details:not\(\.print-hidden,\s*\[class~="print:hidden"\]\)\s*\{\s*display:\s*block\s*!important/,
    )
    expect(print).toMatch(/display:\s*revert\s*!important/)
  })
})
