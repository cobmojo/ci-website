import { expect, type Page, test } from '@playwright/test'
import { buildFontContract, type ComputedTextStyle } from '../../src/lib/text-layout/font-contract'
import { excerptTextEligibility } from '../../src/lib/text-layout/supported-text'
import { HARNESS_BUNDLE } from '../fixtures/build-pretext-harness'
import {
  APPROVED_CASES,
  type ApprovedCase,
  casesFromSearchIndex,
  FALLBACK_CASES,
} from '../fixtures/typography-corpus'

/**
 * The text-geometry contract.
 *
 * Pretext claims it can tell you where a browser will break a line without
 * asking the browser. This suite is the only reason to believe that claim about
 * *this* site: real production CSS, the real self-hosted Source Serif 4, real
 * component widths, and real content, compared line for line against what the
 * browser actually did.
 *
 * It is not a visual regression suite. It says nothing about colour, spacing or
 * appearance. It answers one question — does Pretext agree with the browser
 * about how many lines this text occupies at this width — and it answers it in
 * Chromium, Firefox and WebKit.
 *
 * A disagreement here blocks the release, and blocks any Pretext upgrade.
 */

/**
 * Height tolerance, in CSS pixels.
 *
 * Pretext returns `lineCount * lineHeight` exactly. A browser lays out the same
 * lines and reports a border-box height that can differ in the last fractional
 * pixel through device-pixel rounding. Half a pixel is far below one line at any
 * size this site uses, so a real off-by-one-line error can never hide inside it.
 */
const HEIGHT_TOLERANCE = 0.5

/** Viewports the responsive suite already treats as real, plus the reflow floor. */
const VIEWPORTS = [
  { label: '320 reflow floor', width: 320, height: 720 },
  { label: '375 phone', width: 375, height: 812 },
  { label: '768 tablet', width: 768, height: 1024 },
  { label: '1024 small laptop', width: 1024, height: 768 },
  { label: '1440 desktop', width: 1440, height: 900 },
] as const

interface ProbeStyle extends ComputedTextStyle {
  readonly paddingInline: number
  readonly borderInline: number
  readonly blockSizeEm: number
  readonly blockSizeLh: number
}

interface Measurement {
  readonly style: ProbeStyle
  readonly contentWidth: number
  readonly blockHeight: number
  readonly lineHeight: number
}

/**
 * Install the harness and wait for the measured face.
 *
 * `document.fonts.load` rather than `fonts.ready`: ready resolves once nothing
 * is pending, which is also true before anything has been asked for. The
 * explicit load, with a sample that covers the corpus, is what guarantees the
 * face the geometry is compared against is the face the page will paint with.
 */
async function prepareHarness(page: Page): Promise<void> {
  await page.goto('/search/?q=fire')
  await page.addScriptTag({ path: HARNESS_BUNDLE })
  await page.waitForFunction(() => window.__ciPretextHarnessReady === true)
  await page.evaluate(async () => {
    const sample = 'The soul’s destruction — Matthew 10:28 — aionios, café, Ēxēmplum. 0123456789'
    await document.fonts.load('400 14.4px "Source Serif 4"', sample)
    await document.fonts.load('600 14.4px "Source Serif 4"', sample)
  })

  /*
   * Wait until the face is measurably in use, not merely reported loaded.
   *
   * `document.fonts.load()` resolving means the bytes arrived; it does not
   * guarantee the next layout uses them, and under the CPU contention of three
   * measurement projects at once that gap is wide enough to measure a fallback
   * serif in. Polling the width is the only statement that cannot be wrong.
   *
   * A timeout here is not an error: it means the face genuinely is not
   * available in this engine, which is a state `engineIsTrusted` is built to
   * recognise and the suite is built to assert about.
   */
  await page
    .waitForFunction(
      () => {
        const probe = document.createElement('span')
        probe.style.cssText =
          'position:absolute;left:-10000px;top:0;white-space:pre;width:max-content;'
        probe.style.font = '400 14.4px "Source Serif 4"'
        probe.textContent = 'Searching happens in your browser'
        document.body.appendChild(probe)
        const webFont = probe.getBoundingClientRect().width
        probe.style.font = '400 14.4px serif'
        const generic = probe.getBoundingClientRect().width
        probe.remove()
        return Math.abs(webFont - generic) > 0.5
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => undefined)
}

/**
 * Whether this engine can be trusted with this site's typography at all.
 *
 * Two things have to hold, and neither is a given.
 *
 * The measured face has to actually be in use, rather than a substituted serif
 * standing in for it.
 *
 * And the engine's canvas has to see the same font the layout does. Pretext
 * 0.0.8 measures through `OffscreenCanvas` where one exists, and in Firefox an
 * `OffscreenCanvas` does not resolve the document's `@font-face` rules — so it
 * measures web-font text in a substituted font and predicts confidently wrong
 * line counts while every input looks correct. Chromium and WebKit resolve the
 * face on both surfaces and agree with their own layout to a hundredth of a
 * pixel.
 *
 * Where either fails, the contract is not "Pretext agrees" — it is "production
 * declines to enhance", which is what this file then asserts instead. That is
 * the same conclusion the production runtime reaches through its own
 * self-check, by the same means.
 */
async function engineIsTrusted(page: Page): Promise<{ trusted: boolean; reason: string }> {
  return page.evaluate(() => {
    const measureText = window.__ciPretextGeometry
    if (!measureText) return { trusted: false, reason: 'the harness was not installed' }

    const font = '400 14.4px "Source Serif 4"'
    const text = 'Searching happens in your browser, so nothing'

    const probe = document.createElement('span')
    probe.style.cssText = 'position:absolute;left:-10000px;top:0;white-space:pre;width:max-content;'
    probe.style.font = font
    probe.textContent = text
    document.body.appendChild(probe)
    const webFontWidth = probe.getBoundingClientRect().width
    probe.style.font = '400 14.4px serif'
    const genericWidth = probe.getBoundingClientRect().width
    probe.remove()

    if (Math.abs(webFontWidth - genericWidth) < 0.5) {
      return {
        trusted: false,
        reason: `the self-hosted Source Serif 4 face is not in use: it lays out identically to the generic serif (${webFontWidth}px)`,
      }
    }

    // Bracket the engine's idea of the width against the browser's.
    const lines = (maxWidth: number) =>
      measureText({ text, font, letterSpacing: 0, maxWidth, lineHeight: 19.8 }).lineCount
    const fitsWhenRoomy = lines(webFontWidth + 2) === 1
    const wrapsWhenTight = lines(webFontWidth - 2) >= 2

    if (!fitsWhenRoomy || !wrapsWhenTight) {
      return {
        trusted: false,
        reason: `the engine does not measure this font as the browser does: the browser needs ${webFontWidth.toFixed(2)}px for one line, the engine fits it in ${wrapsWhenTight ? 'more' : 'less'}`,
      }
    }
    return {
      trusted: true,
      reason: `the engine and the browser agree the probe is ${webFontWidth.toFixed(2)}px wide`,
    }
  })
}

/**
 * Render one offscreen fixture carrying the production typography, and report
 * both what the browser did with it and what the contract resolved to.
 *
 * Offscreen, never `display: none`: a hidden element has no line boxes and
 * cannot be measured. Two production declarations are lifted — the fixed
 * `block-size` and the `overflow` clamp — because they exist to hide a wrong
 * answer, and the whole job here is to see the answer. Every declaration that
 * affects *where the lines fall* is left exactly as the site sets it.
 */
async function measure(page: Page, text: string, containerWidth: number): Promise<Measurement> {
  return page.evaluate(
    ({ text, containerWidth }) => {
      const host = document.createElement('div')
      host.style.cssText = 'position:absolute; left:-10000px; top:0; visibility:hidden;'

      const list = document.createElement('ol')
      list.className = 'quick-search-results'
      list.style.cssText = `width:${containerWidth}px; margin:0; padding:0; list-style:none;`

      const probe = document.createElement('span')
      probe.className = 'quick-search-excerpt'
      probe.textContent = text

      list.appendChild(probe)
      host.appendChild(list)
      document.body.appendChild(host)

      const clamped = getComputedStyle(probe)
      const blockSizeLh = Number.parseFloat(clamped.blockSize)

      // Lift only the clamp, so the natural height becomes observable. The
      // production element reserves an exact block and limits itself to the
      // line budget; both exist to hide a wrong answer, and the whole job here
      // is to see the answer. Everything that decides *where lines fall* is
      // left exactly as the site sets it.
      probe.style.blockSize = 'auto'
      probe.style.overflow = 'visible'
      probe.style.display = 'block'
      probe.style.setProperty('-webkit-line-clamp', 'none')

      const style = getComputedStyle(probe)
      const rect = probe.getBoundingClientRect()
      const px = (value: string) => Number.parseFloat(value) || 0

      const result = {
        style: {
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontStyle: style.fontStyle,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          whiteSpace: style.whiteSpace,
          wordBreak: style.wordBreak,
          overflowWrap: style.overflowWrap,
          textWrap: [style.getPropertyValue('text-wrap-style'), style.getPropertyValue('text-wrap')]
            .join(' ')
            .trim(),
          lineBudget: style.getPropertyValue('--search-excerpt-lines'),
          paddingInline: px(style.paddingInlineStart) + px(style.paddingInlineEnd),
          borderInline: px(style.borderInlineStartWidth) + px(style.borderInlineEndWidth),
          blockSizeEm:
            Number.parseFloat(style.getPropertyValue('--search-excerpt-lines')) *
            Number.parseFloat(style.getPropertyValue('--search-excerpt-line-height')) *
            Number.parseFloat(style.fontSize),
          blockSizeLh,
        },
        contentWidth:
          rect.width -
          px(style.paddingInlineStart) -
          px(style.paddingInlineEnd) -
          px(style.borderInlineStartWidth) -
          px(style.borderInlineEndWidth),
        blockHeight: rect.height,
        lineHeight: px(style.lineHeight),
      }

      host.remove()
      return result
    },
    { text, containerWidth },
  )
}

async function askPretext(
  page: Page,
  request: {
    text: string
    font: string
    letterSpacing: number
    maxWidth: number
    lineHeight: number
  },
) {
  return page.evaluate(input => {
    const measureText = window.__ciPretextGeometry
    if (!measureText) throw new Error('the geometry harness was not installed')
    return measureText(input)
  }, request)
}

/** Container widths that put the excerpt at a real production width. */
const CONTAINER_WIDTHS = [248, 256, 303, 320, 416, 512, 632, 640] as const

/**
 * The contract, whichever regime this engine is in.
 *
 * A trusted engine must agree with the browser about every approved case. An
 * untrusted one must be refused by production, so the reader sees the ordinary
 * excerpt instead of a confidently wrong one. Both are assertions; neither is a
 * skip, and the reason is recorded on the test either way.
 */
async function expectGeometryContract(
  page: Page,
  cases: readonly ApprovedCase[],
  containerWidth: number,
  testInfo: { annotations: { type: string; description?: string }[] },
): Promise<void> {
  const { trusted, reason } = await engineIsTrusted(page)
  testInfo.annotations.push({
    type: trusted ? 'engine trusted' : 'engine not trusted',
    description: reason,
  })

  if (!trusted) {
    await expectProductionDeclinesToEnhance(page)
    return
  }

  const failures: string[] = []
  for (const testCase of cases) {
    const problem = await compare(page, testCase, containerWidth)
    if (problem) failures.push(problem)
  }
  expect(failures, `agreement at a ${containerWidth}px result column`).toEqual([])
}

/**
 * The safety contract for an engine that cannot be trusted.
 *
 * Production must reach the same conclusion this suite did, through its own
 * runtime self-check, and leave every row on its ordinary excerpt.
 */
async function expectProductionDeclinesToEnhance(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('link', { name: 'Search', exact: true }).click()
  await page
    .getByRole('dialog', { name: 'Search this site' })
    .getByRole('searchbox', { name: 'Search terms' })
    .fill('unquenchable fire')
  await page.locator('[data-search-excerpt]').first().waitFor({ state: 'attached' })
  // Long enough for a fit to have been applied if one were ever going to be.
  await page.waitForTimeout(1500)

  const states = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-search-excerpt]')].map(element => ({
      state: element.dataset.pretextState ?? '',
      text: (element.textContent ?? '').trim(),
      marks: element.querySelectorAll('mark').length,
    })),
  )

  expect(states.length, 'the dialog must still show results').toBeGreaterThan(0)
  expect(
    states.every(state => state.state === 'fallback'),
    'an engine that disagrees with this browser must not be allowed to fit excerpts',
  ).toBe(true)
  // And the reader is no worse off: real text, really highlighted.
  expect(states.every(state => state.text.length > 0)).toBe(true)
  expect(states.some(state => state.marks > 0)).toBe(true)
}

test.describe('the production typography contract', () => {
  test('resolves to something Pretext can be told about', async ({ page }) => {
    await prepareHarness(page)
    const { style, contentWidth } = await measure(page, 'The second death.', 632)

    const contract = buildFontContract(style, 'en')
    expect(
      contract,
      'the production contract must be readable from the rendered element',
    ).not.toBeNull()
    if (!contract) return

    expect(contract.fontFamily).toBe('Source Serif 4')
    expect(contract.font).toContain('"Source Serif 4"')
    expect(contract.font).not.toContain('system-ui')
    expect(contract.font).not.toContain('ui-serif')
    expect(contract.fontSize).toBeGreaterThan(0)
    expect(contract.lineHeight).toBeGreaterThan(0)
    expect(contract.letterSpacing).toBe(0)
    expect(contract.whiteSpace).toBe('normal')
    expect(contract.wordBreak).toBe('normal')
    expect(contentWidth).toBeGreaterThan(0)
  })

  test('never wraps the measured excerpt with pretty or balance', async ({ page }) => {
    await prepareHarness(page)
    const { style } = await measure(page, 'The second death.', 632)
    expect(style.textWrap).not.toContain('pretty')
    expect(style.textWrap).not.toContain('balance')
  })

  test('leaves the measured element free of padding and border', async ({ page }) => {
    await prepareHarness(page)
    const { style } = await measure(page, 'The second death.', 632)
    expect(style.paddingInline).toBe(0)
    expect(style.borderInline).toBe(0)
  })

  test('reserves the same block whether it is expressed in em or lh', async ({ page }) => {
    await prepareHarness(page)
    const { style } = await measure(page, 'The second death.', 632)
    expect(style.blockSizeLh).toBeGreaterThan(0)
    expect(Math.abs(style.blockSizeLh - style.blockSizeEm)).toBeLessThanOrEqual(HEIGHT_TOLERANCE)
  })

  test('gives two lines on a phone and three on a wider column', async ({ page }) => {
    await prepareHarness(page)
    const narrow = await measure(page, 'The second death.', 303)
    const wide = await measure(page, 'The second death.', 632)
    expect(Number(narrow.style.lineBudget.trim())).toBe(2)
    expect(Number(wide.style.lineBudget.trim())).toBe(3)
  })

  test('keeps the global article typography untouched', async ({ page }, testInfo) => {
    await page.goto('/case/key-texts/eternal-punishment/')
    const article = await page.evaluate(() => {
      const paragraph = document.querySelector('.prose-article p')
      if (!paragraph) return null
      const style = getComputedStyle(paragraph)
      return {
        textWrap: [style.getPropertyValue('text-wrap-style'), style.getPropertyValue('text-wrap')]
          .join(' ')
          .trim(),
        supportsPretty:
          typeof CSS !== 'undefined' &&
          typeof CSS.supports === 'function' &&
          CSS.supports('text-wrap', 'pretty'),
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
      }
    })

    expect(article, 'the article page must render prose to compare against').not.toBeNull()
    expect(Number.parseFloat(article?.fontSize ?? '0')).toBeGreaterThan(0)
    expect(Number.parseFloat(article?.lineHeight ?? '0')).toBeGreaterThan(0)

    /*
     * The site gives prose `text-wrap: pretty` and only the measured excerpt
     * opts out. That can only be asserted where the engine supports the value:
     * Firefox parses the property but not `pretty`, and computes it to `auto`.
     * Where the value is not supported there is no pretty wrapping for the
     * excerpt to have needed to override, and the fact is recorded rather than
     * assumed either way.
     */
    if (article?.supportsPretty) {
      expect(
        article.textWrap,
        'article prose must keep pretty wrapping; only the measured excerpt opts out',
      ).toContain('pretty')
    } else {
      expect(article?.textWrap ?? '').not.toContain('pretty')
      testInfo.annotations.push({
        type: 'text-wrap',
        description: `this engine does not support text-wrap: pretty (article computes to "${article?.textWrap}"), so there is nothing for the excerpt to override`,
      })
    }
  })
})

test.describe('Pretext agrees with the browser', () => {
  for (const { label, width, height } of VIEWPORTS) {
    test(`at the real excerpt width for ${label}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height })

      // The width a reader's excerpt actually gets at this viewport, read from
      // the dialog itself rather than assumed.
      await page.goto('/')
      await page.getByRole('link', { name: 'Search', exact: true }).click()
      await page
        .getByRole('dialog', { name: 'Search this site' })
        .getByRole('searchbox', { name: 'Search terms' })
        .fill('unquenchable fire')
      await page.locator('[data-search-excerpt]').first().waitFor({ state: 'attached' })

      const live = await page.evaluate(() => {
        const probe = document.querySelector<HTMLElement>('[data-search-excerpt]')
        if (!probe) return null
        const style = getComputedStyle(probe)
        const px = (value: string) => Number.parseFloat(value) || 0
        return (
          probe.getBoundingClientRect().width -
          px(style.paddingInlineStart) -
          px(style.paddingInlineEnd)
        )
      })
      expect(live, 'a real excerpt element must exist to take the width from').not.toBeNull()
      const realWidth = Math.round(live ?? 0)
      expect(realWidth).toBeGreaterThan(100)

      await prepareHarness(page)
      await expectGeometryContract(page, APPROVED_CASES, realWidth, testInfo)
    })
  }

  for (const containerWidth of CONTAINER_WIDTHS) {
    test(`at a ${containerWidth}px result column`, async ({ page }, testInfo) => {
      await prepareHarness(page)
      await expectGeometryContract(page, APPROVED_CASES, containerWidth, testInfo)
    })
  }

  test('on real titles and excerpts from the shipped search index', async ({ page }, testInfo) => {
    await prepareHarness(page)
    const docs = await page.evaluate(async () => {
      const response = await fetch('/search-index.json')
      const index = (await response.json()) as {
        docs: { title: string; summary: string; body: string; breadcrumb: string }[]
      }
      return index.docs.slice(0, 60)
    })
    expect(docs.length).toBeGreaterThan(20)

    const cases = casesFromSearchIndex(docs, text => excerptTextEligibility(text).eligible, 40)
    expect(cases.length, 'the shipped index must yield approved cases').toBeGreaterThan(10)

    for (const width of [303, 632]) {
      await expectGeometryContract(page, cases, width, testInfo)
    }
  })
})

/**
 * Compare one case at one width. Returns a description of the disagreement, or
 * an empty string when the two agree.
 *
 * Line count is compared by dividing the block height by the computed line
 * height rather than by inspecting client rects. The fixture is a plain text
 * block with an explicit line height and no padding or border, so that division
 * is exact; rectangle-based counting is the technique that becomes unreliable
 * around fragmented inline content, which is precisely what a `<mark>` makes.
 */
async function compare(
  page: Page,
  testCase: ApprovedCase,
  containerWidth: number,
): Promise<string> {
  const { style, contentWidth, blockHeight, lineHeight } = await measure(
    page,
    testCase.text,
    containerWidth,
  )

  const contract = buildFontContract(style, 'en')
  if (!contract) return `${testCase.label}: the production contract could not be read`

  const domLineCount = Math.round(blockHeight / lineHeight)
  const predicted = await askPretext(page, {
    text: testCase.text,
    font: contract.font,
    letterSpacing: contract.letterSpacing,
    maxWidth: contentWidth,
    lineHeight,
  })

  const where = `${testCase.label} [${contract.font}, ls ${contract.letterSpacing}, lh ${lineHeight}] @ ${contentWidth}px`

  if (predicted.lineCount === domLineCount) {
    if (Math.abs(predicted.height - blockHeight) > HEIGHT_TOLERANCE) {
      return `${where}: Pretext said ${predicted.height}px tall, the browser laid out ${blockHeight}px`
    }
    return ''
  }

  /*
   * The two disagreed. Exactly one disagreement is tolerable, and only when it
   * is proved to be what it looks like.
   *
   * Pretext sums separately measured segment advances; the browser lays the
   * line out in one pass. They agree to hundredths of a pixel, so the only
   * text they can disagree about is text whose line ends within a hair of the
   * limit. Predicting one line *too many* there is harmless — the fitter shows
   * a word less. Predicting one too few would overflow the reserved block.
   *
   * So: never fewer lines than the browser, and never more than the browser
   * itself produces one pixel narrower. That second half is what turns "close
   * enough" into a measured fact rather than an assumption, and it is why the
   * fitter takes a one-pixel safety margin in production.
   */
  if (predicted.lineCount < domLineCount) {
    return `${where}: Pretext said ${predicted.lineCount} lines, the browser laid out ${domLineCount} — under-predicting risks an overflowing excerpt`
  }

  const narrower = await measure(page, testCase.text, containerWidth - SUBPIXEL_PROBE)
  const domAtNarrower = Math.round(narrower.blockHeight / narrower.lineHeight)
  if (predicted.lineCount > domAtNarrower) {
    return `${where}: Pretext said ${predicted.lineCount} lines, the browser laid out ${domLineCount} and still only ${domAtNarrower} at ${containerWidth - SUBPIXEL_PROBE}px — more than a sub-pixel disagreement`
  }
  return ''
}

/**
 * How much narrower the column is made when proving a disagreement is
 * sub-pixel. One CSS pixel: wide enough to move any genuine knife-edge case,
 * narrow enough that it cannot absorb a real breaking error.
 */
const SUBPIXEL_PROBE = 1

test.describe('text the contract declines', () => {
  test('is declined by the production gate, with the documented reason', () => {
    const wrong: string[] = []
    for (const testCase of FALLBACK_CASES) {
      const outcome = excerptTextEligibility(testCase.text)
      if (outcome.eligible) {
        wrong.push(`${testCase.label}: was accepted, must be declined`)
      } else if (outcome.reason !== testCase.reason) {
        wrong.push(`${testCase.label}: declined as ${outcome.reason}, expected ${testCase.reason}`)
      }
    }
    expect(wrong).toEqual([])
  })

  test('is accepted for every approved case', () => {
    const wrong: string[] = []
    for (const testCase of APPROVED_CASES) {
      const outcome = excerptTextEligibility(testCase.text)
      if (!outcome.eligible) wrong.push(`${testCase.label}: declined as ${outcome.reason}`)
    }
    expect(wrong).toEqual([])
  })

  test('still renders as ordinary semantic text on the page', async ({ page }) => {
    // Greek and Hebrew keep their language and direction metadata and are laid
    // out by the browser, exactly as before this integration existed.
    await page.goto('/glossary/')
    const greek = page.locator('[lang="grc"]').first()
    if ((await greek.count()) > 0) {
      await expect(greek).toBeVisible()
    }
    const hebrew = page.locator('[lang="he"]').first()
    if ((await hebrew.count()) > 0) {
      await expect(hebrew).toHaveAttribute('dir', 'rtl')
    }
  })
})
