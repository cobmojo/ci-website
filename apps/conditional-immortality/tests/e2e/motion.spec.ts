import { expect, type Page, test } from '@playwright/test'

/**
 * Motion, as a browser actually computes it.
 *
 * `src/lib/__tests__/motion-contract.test.ts` checks the stylesheet as source.
 * This suite checks the result: that the two variants promised in
 * `docs/motion-brief.md` are the two variants a reader gets, with the operating
 * system preference set each way.
 *
 * Nothing here samples a frame mid-transition. Timing assertions taken from a
 * running animation are flaky by construction, so every check reads computed
 * style or a settled end state instead.
 */

/** Properties whose animation moves something on screen. */
const MOVEMENT = [
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
  'margin',
  'margin-top',
  'padding',
  'gap',
]

/**
 * Keyframe animations allowed to run when motion is reduced. Each fades and
 * does nothing else, so it carries the state change without moving anything.
 */
const FADE_ONLY_ANIMATIONS = ['none', 'reveal-fade']

/**
 * Navigate with a motion preference, and prove the preference took.
 *
 * `test.use({ reducedMotion: 'reduce' })` silently does nothing in this project:
 * inside these describe blocks `matchMedia('(prefers-reduced-motion: reduce)')`
 * still reported `false`, so every assertion below about movement being removed
 * was passing against a page that had never been told to remove it. Emulation is
 * therefore set per navigation and then verified, because a reduced-motion suite
 * that cannot fail is worse than no suite at all.
 */
async function gotoWith(
  page: Page,
  route: string,
  preference: 'reduce' | 'no-preference',
): Promise<void> {
  await page.emulateMedia({ reducedMotion: preference })
  await page.goto(route)

  const state = await page.evaluate(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    noPreference: matchMedia('(prefers-reduced-motion: no-preference)').matches,
  }))
  expect(state.reduce, `emulation of ${preference} did not take`).toBe(preference === 'reduce')
  expect(state.noPreference).toBe(preference === 'no-preference')
}

interface ComputedTransition {
  readonly properties: readonly string[]
  readonly durations: readonly number[]
  readonly animationName: string
}

async function transitionOf(page: Page, selector: string): Promise<ComputedTransition> {
  return page.evaluate(target => {
    const element = document.querySelector(target)
    if (!element) throw new Error(`no element matched ${target}`)
    const style = getComputedStyle(element)
    return {
      properties: style.transitionProperty.split(',').map(value => value.trim()),
      durations: style.transitionDuration
        .split(',')
        .map(value => Number.parseFloat(value) * (value.includes('ms') ? 1 : 1000)),
      animationName: style.animationName,
    }
  }, selector)
}

/** Duration in milliseconds for one property in a computed transition. */
function durationFor(transition: ComputedTransition, property: string): number {
  const index = transition.properties.indexOf(property)
  if (index === -1) return 0
  const { durations } = transition
  return durations[index % durations.length] ?? 0
}

/* ------------------------------------------------------------------ *
 * No preference: the full animation
 * ------------------------------------------------------------------ */

test.describe('with no motion preference', () => {
  test('scrolls smoothly to an in-page anchor, and lands on it', async ({ page }) => {
    await gotoWith(page, '/case/key-texts/eternal-punishment/', 'no-preference')

    // At rest the document must be `auto`, or the router's scroll-to-top on the
    // next navigation is suppressed and the reader lands mid-article.
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')

    // The last entry, so the target is far enough down the document that the
    // scroll position is unambiguous.
    const anchor = page.locator('.on-this-page a[href^="#"]').filter({ visible: true }).last()
    const href = await anchor.getAttribute('href')
    expect(href).toBeTruthy()

    /*
     * Recorded rather than polled. The component hands the behaviour back on
     * `scrollend`, so a poll for `smooth` after the click races the scroll
     * finishing. An observer on the style attribute cannot miss it.
     */
    await page.evaluate(() => {
      const seen: string[] = []
      ;(window as unknown as { __seen: string[] }).__seen = seen
      new MutationObserver(() => {
        seen.push(document.documentElement.style.scrollBehavior || 'unset')
      }).observe(document.documentElement, { attributeFilter: ['style'] })
    })

    await anchor.click()

    // The heading is reached, and clears the sticky header.
    await expect(page.locator(href ?? '#')).toBeInViewport()
    await expect
      .poll(async () => Math.round(await page.evaluate(() => window.scrollY)))
      .toBeGreaterThan(200)

    // Wait for the hand-back before reading the log: the release arrives on
    // `scrollend` or a one-second timer, so sampling immediately after the
    // scroll starts reads a log that legitimately still ends in `smooth`.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.scrollBehavior))
      .toBe('')

    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)
    expect(seen, 'the behaviour was never switched on').toContain('smooth')
    expect(seen.at(-1), 'the behaviour was never handed back').toBe('unset')

    // And it is back to `auto`, so the next route change is unaffected.
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  })

  test('still returns to the top on a client navigation', async ({ page }) => {
    // The regression that scoped Tier 4 to fragment navigation in the first
    // place: with `scroll-behavior: smooth` set on `html`, this scroll position
    // survived the route change untouched.
    await gotoWith(page, '/case/key-texts/eternal-punishment/', 'no-preference')
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)

    await page.locator('.previous-next a').filter({ visible: true }).first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0)
  })

  test('returns to the top even when a route click lands mid-anchor-scroll', async ({ page }) => {
    // The ordering the release window cannot cover on its own: a reader clicks
    // an in-page anchor and, while the smooth scroll is still in flight,
    // follows "Next section". The behaviour must be handed back at the route
    // click itself, or the router's scroll-to-top inherits `smooth` and the
    // reader is stranded mid-article.
    await gotoWith(page, '/case/key-texts/eternal-punishment/', 'no-preference')

    const anchor = page.locator('.on-this-page a[href^="#"]').filter({ visible: true }).last()
    await anchor.click()
    // No settling wait: the route click must interrupt the fragment scroll.
    await page.locator('.previous-next a').filter({ visible: true }).first().click()

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0)
  })

  test('animates the search dialog in with movement', async ({ page }) => {
    await gotoWith(page, '/', 'no-preference')
    await page.getByRole('link', { name: 'Search', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Search this site' })
    await expect(dialog).toBeVisible()

    const transition = await transitionOf(page, 'dialog.overlay-panel')
    expect(transition.properties).toContain('translate')
    expect(transition.properties).toContain('scale')
    expect(transition.properties).toContain('opacity')
    // `display` and `overlay` have to be in the list, or the panel is removed
    // from the top layer before its exit has had a chance to run.
    expect(transition.properties).toContain('display')
    expect(transition.properties).toContain('overlay')

    expect(durationFor(transition, 'opacity')).toBeGreaterThan(0)
    expect(durationFor(transition, 'opacity')).toBeLessThanOrEqual(300)

    // Settled, not mid-flight.
    await expect(dialog).toHaveCSS('opacity', '1')
  })

  test('animates the navigation sheet in from the edge it is anchored to', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await gotoWith(page, '/', 'no-preference')
    await page.getByRole('button', { name: /menu/i }).click()

    const sheet = page.getByRole('dialog', { name: 'Site navigation' })
    await expect(sheet).toBeVisible()

    const transition = await transitionOf(page, 'dialog.overlay-sheet')
    expect(transition.properties).toContain('translate')
    expect(durationFor(transition, 'translate')).toBeGreaterThan(0)

    await expect(sheet).toHaveCSS('opacity', '1')
    // Arrived. A sheet stuck at its off-screen offset would still be "visible".
    const translate = await sheet.evaluate(element => getComputedStyle(element).translate)
    expect(translate === 'none' || /^0px/.test(translate)).toBe(true)
  })

  test('gives buttons a press affordance', async ({ page }) => {
    await gotoWith(page, '/', 'no-preference')
    const transition = await transitionOf(page, '.pressable')
    expect(transition.properties).toContain('scale')
    expect(durationFor(transition, 'scale')).toBeGreaterThan(0)
    expect(durationFor(transition, 'scale')).toBeLessThanOrEqual(150)
  })

  test('leaves disclosures unanimated, and working', async ({ page }) => {
    // The disclosure height animation was built and withdrawn: on Chromium 148 a
    // collapsed `::details-content` never re-expands, so the content stays
    // hidden. This is the regression guard — it fails if the animation comes
    // back without the engine bug being fixed.
    await gotoWith(page, '/case/key-texts/eternal-punishment/', 'no-preference')

    // The case-contents disclosure is the narrow-screen equivalent of the
    // sidebar, so it only exists below the large breakpoint.
    await page.setViewportSize({ width: 375, height: 812 })
    const disclosure = page.locator('details').first()
    const summary = disclosure.locator('summary').first()
    await expect(summary).toBeVisible()

    const height = () => disclosure.evaluate(element => element.getBoundingClientRect().height)
    const before = await height()

    await summary.click()
    await expect(disclosure.getByRole('navigation', { name: 'Case chapters' })).toBeVisible()

    // Generous margin: the assertion is that it opened at all, not by how much.
    expect(await height(), 'the disclosure did not grow when opened').toBeGreaterThan(before + 50)
  })
})

/* ------------------------------------------------------------------ *
 * Reduce: the movement goes, the meaning stays
 * ------------------------------------------------------------------ */

test.describe('with reduced motion', () => {
  test('jumps to an in-page anchor without scrolling smoothly', async ({ page }) => {
    await gotoWith(page, '/case/key-texts/eternal-punishment/', 'reduce')

    const anchor = page.locator('.on-this-page a[href^="#"]').filter({ visible: true }).last()
    const href = await anchor.getAttribute('href')
    await anchor.click()

    // Never switched on, so the jump is instant. The reader still arrives.
    await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
    await expect(page.locator(href ?? '#')).toBeInViewport()
  })

  test('keeps colour feedback on interactive elements', async ({ page }) => {
    await gotoWith(page, '/', 'reduce')
    // Tier 1 survives `reduce`. Colour is not movement; it is how a reader sees
    // that the pointer landed on something.
    const transition = await transitionOf(page, 'main a[href]')
    expect(durationFor(transition, 'color')).toBeGreaterThan(0)
  })

  test('crossfades the search dialog instead of moving it', async ({ page }) => {
    await gotoWith(page, '/', 'reduce')
    await page.getByRole('link', { name: 'Search', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Search this site' })
    await expect(dialog).toBeVisible()

    const transition = await transitionOf(page, 'dialog.overlay-panel')
    expect(durationFor(transition, 'opacity')).toBeGreaterThan(0)
    for (const property of MOVEMENT) {
      expect(durationFor(transition, property), `${property} still animates`).toBe(0)
    }

    await expect(dialog).toHaveCSS('opacity', '1')
    // Nothing travelled to get here.
    const translate = await dialog.evaluate(element => getComputedStyle(element).translate)
    expect(translate === 'none' || /^0px/.test(translate)).toBe(true)
  })

  test('crossfades the navigation sheet instead of sliding it', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await gotoWith(page, '/', 'reduce')
    await page.getByRole('button', { name: /menu/i }).click()

    const sheet = page.getByRole('dialog', { name: 'Site navigation' })
    await expect(sheet).toBeVisible()

    const transition = await transitionOf(page, 'dialog.overlay-sheet')
    expect(durationFor(transition, 'opacity')).toBeGreaterThan(0)
    for (const property of MOVEMENT) {
      expect(durationFor(transition, property), `${property} still animates`).toBe(0)
    }
  })

  test('removes the press scale', async ({ page }) => {
    await gotoWith(page, '/', 'reduce')
    const transition = await transitionOf(page, '.pressable')
    expect(durationFor(transition, 'scale')).toBe(0)
    expect(durationFor(transition, 'transform')).toBe(0)
  })

  test('leaves nothing on the page animating a movement property', async ({ page }) => {
    // The sweeping guard. Every rendered element on a representative page of
    // each type is checked, so a movement transition added later to any
    // component fails here rather than reaching a reader who gets sick from it.
    const routes = [
      '/',
      '/case/',
      '/case/key-texts/eternal-punishment/',
      '/passages/mark-9-42-48/',
      '/corrections/',
      '/scripture/',
      '/watch/',
      '/full-case/',
    ]

    for (const route of routes) {
      await gotoWith(page, route, 'reduce')
      const offenders = await page.evaluate(
        ({ movement, allowed }) => {
          const problems: string[] = []
          for (const element of document.querySelectorAll<HTMLElement>('*')) {
            if (!element.checkVisibility()) continue
            const style = getComputedStyle(element)

            const properties = style.transitionProperty.split(',').map(value => value.trim())
            const durations = style.transitionDuration
              .split(',')
              .map(value => Number.parseFloat(value) * (value.includes('ms') ? 1 : 1000))

            properties.forEach((property, index) => {
              const duration = durations[index % durations.length] ?? 0
              if (duration > 0 && movement.includes(property)) {
                problems.push(`${element.tagName.toLowerCase()}: transition ${property}`)
              }
            })

            for (const name of style.animationName.split(',').map(value => value.trim())) {
              if (!allowed.includes(name)) {
                problems.push(`${element.tagName.toLowerCase()}: animation ${name}`)
              }
            }
          }
          return [...new Set(problems)]
        },
        { movement: MOVEMENT, allowed: FADE_ONLY_ANIMATIONS },
      )

      expect(offenders, `movement survives reduced motion on ${route}`).toEqual([])
    }
  })
})

/* ------------------------------------------------------------------ *
 * Behaviour that must survive the animation either way
 * ------------------------------------------------------------------ */

test.describe('overlays still work', () => {
  for (const preference of ['no-preference', 'reduce'] as const) {
    test(`the search dialog opens and closes with motion ${preference}`, async ({ page }) => {
      await gotoWith(page, '/', preference)

      const trigger = page.getByRole('link', { name: 'Search', exact: true })
      await trigger.click()

      const dialog = page.getByRole('dialog', { name: 'Search this site' })
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('searchbox', { name: 'Search terms' })).toBeFocused()

      await page.keyboard.press('Escape')
      // An exit animation keeps the element painted for a moment. It must still
      // end up gone, and focus must come back to where it started.
      await expect(dialog).not.toBeVisible()
      await expect(trigger).toBeFocused()
    })

    test(`the navigation sheet opens and closes with motion ${preference}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await gotoWith(page, '/', preference)

      const trigger = page.getByRole('button', { name: /menu/i })
      await trigger.click()

      const sheet = page.getByRole('dialog', { name: 'Site navigation' })
      await expect(sheet).toBeVisible()
      await expect(sheet.getByRole('link', { name: /^Start Here/ }).first()).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(sheet).not.toBeVisible()
      await expect(trigger).toBeFocused()
    })
  }

  test('the skip link travels into view on focus and still moves focus', async ({ page }) => {
    await gotoWith(page, '/case/key-texts/eternal-punishment/', 'no-preference')
    await page.keyboard.press('Tab')

    const skip = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()

    // Inside the viewport, not merely painted somewhere above it.
    //
    // Polled rather than sampled once: the link arrives over a transition, so
    // a single reading taken the instant focus lands is a race against it, and
    // on a loaded machine it catches the link still travelling. This asserts
    // the same thing — that it ends up on screen — and still fails if it never
    // gets there.
    await expect
      .poll(async () => (await skip.boundingBox())?.y ?? Number.NEGATIVE_INFINITY)
      .toBeGreaterThanOrEqual(0)

    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('the heading anchor is never hidden on a device that cannot hover', async ({ page }) => {
    // The old `group-hover` utility hid this unconditionally, so on a phone it
    // was invisible with no way to reveal it. Both branches are asserted, so the
    // test is meaningful whichever pointer the runner reports.
    await gotoWith(page, '/case/key-texts/eternal-punishment/', 'no-preference')

    const anchor = page.locator('.heading-anchor').first()
    await expect(anchor).toHaveCount(1)

    const state = await anchor.evaluate(element => ({
      canHover: matchMedia('(hover: hover) and (pointer: fine)').matches,
      opacity: Number(getComputedStyle(element).opacity),
    }))

    if (state.canHover) expect(state.opacity).toBe(0)
    else expect(state.opacity, 'invisible with no hover available to reveal it').toBeGreaterThan(0)
  })
})
