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
 */

const SIZES = ['sm', 'md', 'lg'] as const

describe('buttonVariants target size', () => {
  it.each(SIZES)('size %s keeps the 44px floor', size => {
    const classes = buttonVariants({ size })
    expect(classes).not.toContain('min-h-9')
    expect(classes).toMatch(/min-h-1[12]/)
  })
})
