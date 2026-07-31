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

/** Tailwind's spacing scale is 0.25rem per step, so 11 is 44px. */
const MINIMUM_STEP = 11

function minHeightSteps(classes: string): number[] {
  return [...classes.matchAll(/(?:^|\s)min-h-(\d+(?:\.\d+)?)(?:\s|$)/g)].map(match =>
    Number(match[1]),
  )
}

describe('buttonVariants target size', () => {
  it.each(SIZES)('size %s never states a floor below 44px', size => {
    const steps = minHeightSteps(buttonVariants({ size }))
    expect(
      steps.length,
      'no min-height at all would leave the floor to the content',
    ).toBeGreaterThan(0)
    for (const step of steps) {
      expect(step, `min-h-${step} is below the 44px floor`).toBeGreaterThanOrEqual(MINIMUM_STEP)
    }
  })

  it('catches a lowered floor whatever value it is written as', () => {
    // The guard has to fail for any sub-44px value, not just the `min-h-9`
    // that happened to be there when it was written.
    expect(minHeightSteps('inline-flex min-h-11 px-4 min-h-10')).toEqual([11, 10])
    expect(minHeightSteps('inline-flex min-h-11 px-4')).toEqual([11])
  })
})
