import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * WCAG 2.2 SC 1.4.11, for the one thing on this site automation cannot check.
 *
 * axe-core 4.12.1 has no non-text-contrast rule — only `color-contrast`, which
 * is text-only — so the accessibility suite is green whatever colour a control
 * boundary is. It was 2.04:1 against paper-raised and 1.89:1 against paper, on
 * every text field, textarea and select the site has, against a required 3:1.
 * Nothing failed, and nothing would have.
 *
 * The tokens are read out of `globals.css` rather than restated here, so this
 * measures the site rather than a copy of it.
 */

const CSS = readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8')

function token(name: string): string {
  const match = CSS.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`No --color-${name} in globals.css`)
  return (match[1] as string).toLowerCase()
}

/** WCAG 2.x relative luminance, from the sRGB definition. */
function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Every surface a form control is ever drawn on or against. */
const SURFACES = ['paper', 'paper-raised', 'panel', 'panel-strong'] as const

/** SC 1.4.11 Non-text Contrast, Level AA. */
const REQUIRED = 3

describe('SC 1.4.11: the boundary of every form control', () => {
  for (const surface of SURFACES) {
    it(`clears ${REQUIRED}:1 against ${surface}`, () => {
      const ratio = contrast(token('border-control'), token(surface))
      expect(ratio, `${ratio.toFixed(2)}:1 against ${surface}`).toBeGreaterThanOrEqual(REQUIRED)
    })
  }

  it('is a warmer grey than the ink it sits near, not a new hue', () => {
    const control = token('border-control')
    const [r, g, b] = [1, 3, 5].map(at => Number.parseInt(control.slice(at, at + 2), 16)) as [
      number,
      number,
      number,
    ]
    // The paper palette is warm: red above green above blue, throughout.
    expect(r).toBeGreaterThan(g)
    expect(g).toBeGreaterThan(b)
  })

  it('stays lighter than body ink, so a control reads as a container and not as text', () => {
    expect(luminance(token('border-control'))).toBeGreaterThan(luminance(token('ink')))
  })
})

/**
 * The structural borders are deliberately left alone: 1.4.11 governs the
 * information needed to identify a component, and a card edge is not one. This
 * is here so that a later change to those tokens is a decision rather than an
 * accident, and so the reason survives in the suite.
 */
describe('the decorative borders are not held to the control threshold', () => {
  it('and are documented as decoration rather than raised to it silently', () => {
    expect(contrast(token('border'), token('paper'))).toBeLessThan(REQUIRED)
    expect(CSS).toMatch(/1\.4\.11/)
  })
})

/**
 * A token nothing applies is not a fix, so the components are read too.
 *
 * A text field, textarea or select on this site is written as one long class
 * string with a recognisable shape: a rounded box, a one-pixel border, a paper
 * fill and ink-coloured text at the control size. Buttons and links that look
 * like buttons carry `no-underline` and a smaller type size, and panels carry
 * neither a fill nor `text-ink` — so the filter below selects controls and
 * nothing else. The count is asserted as well: a heuristic that quietly matches
 * nothing would otherwise pass for ever.
 */
describe('every author-styled control uses the control token', () => {
  const COMPONENTS = [
    'components/feedback/feedback-form.tsx',
    'components/search/search-dialog.tsx',
    'components/scripture/scripture-filter.tsx',
    'components/sources/source-filter.tsx',
    'app/search/page.tsx',
  ] as const

  function controlClassLines(file: string): string[] {
    const source = readFileSync(path.resolve(__dirname, '../..', file), 'utf8')
    return source
      .split('\n')
      .filter(line => /className="/.test(line))
      .filter(line => /\brounded-md border border-/.test(line))
      .filter(line => /\bbg-paper(-raised)?\b/.test(line))
      .filter(line => /\btext-ink\b/.test(line))
      .filter(line => !/no-underline|status-message|overlay-panel/.test(line))
  }

  it('finds every one of the twelve controls, so the check cannot pass vacuously', () => {
    const total = COMPONENTS.reduce((count, file) => count + controlClassLines(file).length, 0)
    expect(total).toBe(12)
  })

  for (const file of COMPONENTS) {
    it(`${file} draws no control on a decorative border token`, () => {
      const stragglers = controlClassLines(file).filter(line =>
        /\bborder-border(-strong)?\b(?!-control)/.test(line),
      )
      expect(stragglers, `still on a decorative border: ${stragglers.join(' | ')}`).toEqual([])
    })
  }
})
