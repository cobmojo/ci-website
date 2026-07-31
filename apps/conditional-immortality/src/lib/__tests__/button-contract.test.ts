import { buttonVariants } from '@ci/ui'
import { describe, expect, it } from 'vitest'

/**
 * The button surface contract.
 *
 * `buttonVariants` documents that `min-h-11` keeps every target at or above
 * the 44px WCAG 2.2 target-size guidance "without needing per-instance
 * overrides". These tests hold that sentence to account: no size variant may
 * lower the floor, or its first consumer has to patch the height back and the
 * comment becomes false.
 *
 * The assertion reads every `min-h-*` in the produced class string rather
 * than looking for the one the base always supplies. An earlier version
 * checked that `min-h-11` was present, which the base guaranteed, so the only
 * regression it could ever have caught was the literal string it named.
 */

const SIZES = ['sm', 'md', 'lg'] as const

const MINIMUM_PX = 44

/**
 * Every min-height in the class string, in pixels.
 *
 * The string is split into tokens rather than scanned with one regex. A regex
 * that consumed the separator on each side could not see `min-h-11 min-h-10`
 * as two values, and a floor lowered by an adjacent class is exactly the shape
 * this guard exists to catch.
 *
 * Three ways of writing a height are resolved: a scale step (0.25rem each), an
 * arbitrary `[36px]`, and an arbitrary `[2.25rem]`. This codebase writes
 * arbitrary values freely — `text-[0.97rem]` is in the button itself — so
 * `min-h-[36px]` is as plausible a regression as `min-h-9`. A variant prefix
 * is dropped first, because `sm:min-h-10` lowers the floor on small screens
 * just as effectively. Anything else resolves to NaN, which fails the
 * comparison rather than passing unseen.
 */
function minHeightPixels(classes: string): number[] {
  return classes
    .split(/\s+/)
    .map(token => token.slice(token.lastIndexOf(':') + 1))
    .filter(token => token.startsWith('min-h-'))
    .map(token => {
      const value = token.slice('min-h-'.length)
      if (/^\d+(?:\.\d+)?$/.test(value)) return Number(value) * 4
      const arbitrary = /^\[(\d+(?:\.\d+)?)(px|rem)\]$/.exec(value)
      if (!arbitrary) return Number.NaN
      return Number(arbitrary[1]) * (arbitrary[2] === 'px' ? 1 : 16)
    })
}

describe('buttonVariants target size', () => {
  it.each(SIZES)('size %s never states a floor below 44px', size => {
    const heights = minHeightPixels(buttonVariants({ size }))
    expect(
      heights.length,
      'no min-height at all would leave the floor to the content',
    ).toBeGreaterThan(0)
    for (const height of heights) {
      expect(height, `a ${height}px floor is below the 44px minimum`).toBeGreaterThanOrEqual(
        MINIMUM_PX,
      )
    }
  })

  it('catches a lowered floor whatever value it is written as', () => {
    // The guard has to fail for any sub-44px value, not just the `min-h-9`
    // that happened to be there when it was written.
    expect(minHeightPixels('inline-flex min-h-11 px-4 min-h-10')).toEqual([44, 40])
    expect(minHeightPixels('min-h-11 min-h-10')).toEqual([44, 40])
    expect(minHeightPixels('inline-flex min-h-[36px] px-4')).toEqual([36])
    expect(minHeightPixels('inline-flex min-h-[2.25rem] px-4')).toEqual([36])
    expect(minHeightPixels('inline-flex min-h-11 sm:min-h-10')).toEqual([44, 40])
    expect(minHeightPixels('inline-flex min-h-11 px-4')).toEqual([44])
  })

  it('refuses to pass a min-height it cannot read', () => {
    // Silently skipping an unrecognised token is how a guard goes quiet.
    expect(minHeightPixels('min-h-fit')).toEqual([Number.NaN])
    expect(() =>
      expect(minHeightPixels('min-h-fit')[0]).toBeGreaterThanOrEqual(MINIMUM_PX),
    ).toThrow()
  })
})
