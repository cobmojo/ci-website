import { expect, type Locator, type Page, test } from '@playwright/test'

/**
 * Reader journeys.
 *
 * Every test here stands for something a visitor came to do. None of them is a
 * smoke test: each one asserts against the words and controls the page actually
 * renders, so a page that loads but no longer answers the question fails.
 */

const MOBILE_VIEWPORT = { width: 375, height: 812 }

/** Hosts the site must not contact until a reader asks it to. */
const YOUTUBE_HOSTS = ['youtube.com', 'youtube-nocookie.com', 'ytimg.com', 'youtu.be']

function isYouTube(url: string): boolean {
  try {
    const host = new URL(url).hostname
    return YOUTUBE_HOSTS.some(known => host === known || host.endsWith(`.${known}`))
  } catch {
    return false
  }
}

/** The list that a panel heading introduces. */
function panelListFor(page: Page, headingName: string | RegExp): Locator {
  return page.getByRole('heading', { name: headingName }).locator('xpath=following-sibling::ul')
}

/** A short description of whatever currently holds focus. */
async function focusDescription(page: Page): Promise<string> {
  return page.evaluate(() => {
    const element = document.activeElement
    if (!element || element === document.body) return 'body'
    const label =
      element.getAttribute('aria-label') ??
      (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60)
    return `${element.tagName.toLowerCase()}#${element.id || '-'} "${label}"`
  })
}

/* ------------------------------------------------------------------ *
 * 1 and 2. What the site teaches, and what it does not
 * ------------------------------------------------------------------ */

test('a visitor can state what the site teaches about the unrighteous', async ({ page }) => {
  await page.goto('/')

  const affirms = panelListFor(page, 'This case affirms')
  await expect(affirms).toBeVisible()

  await expect(
    affirms
      .getByRole('listitem')
      .filter({ hasText: 'The resurrection of the righteous and the unrighteous' }),
  ).toHaveCount(1)
  await expect(
    affirms.getByRole('listitem').filter({ hasText: 'A conscious final judgment' }),
  ).toHaveCount(1)
  await expect(
    affirms.getByRole('listitem').filter({ hasText: 'The final and irreversible second death' }),
  ).toHaveCount(1)

  const precise = page.getByText(/Stated precisely: human beings are not inherently immortal\./)
  await expect(precise).toBeVisible()
  await expect(precise).toContainText('resurrected, consciously judged')
  await expect(precise).toContainText('complete and irreversible death')
})

test('a visitor can determine the site does not teach painless or instant annihilation', async ({
  page,
}) => {
  await page.goto('/')

  const denies = panelListFor(page, 'This case does not teach')
  await expect(denies).toBeVisible()
  await expect(
    denies.getByRole('listitem').filter({ hasText: 'That judgment is painless' }),
  ).toHaveCount(1)
  await expect(
    denies
      .getByRole('listitem')
      .filter({ hasText: 'That punishment is necessarily instantaneous' }),
  ).toHaveCount(1)
  await expect(
    denies.getByRole('listitem').filter({ hasText: 'That nothing happens to the wicked' }),
  ).toHaveCount(1)

  await page.goto('/objections/is-annihilation-punishment/')
  const callout = page
    .getByRole('heading', { name: /what this site does not teach/i })
    .locator('xpath=..')
  await expect(callout).toBeVisible()
  await expect(callout).toContainText('the end is painless')
  await expect(callout).toContainText('annihilation is instantaneous')
  await expect(callout).toContainText('consciously experienced')
})

/* ------------------------------------------------------------------ *
 * 3, 7 and 8. Finding things
 * ------------------------------------------------------------------ */

test('a search index that fails to load says so, in words and to assistive technology', async ({
  page,
}) => {
  // The index is the one fetch the dialog cannot do without. When it fails the
  // reader must be told, rather than left with an empty pane, and the telling
  // has to reach a screen reader: the live region is the only channel that
  // does not require moving focus.
  await page.route('**/search-index.json', route => route.abort())

  await page.goto('/')
  await page.getByRole('link', { name: 'Search', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await expect(dialog).toBeVisible()

  // One channel, both ways: the failure is written into a region already in
  // the accessibility tree, so the same words are announced and readable.
  const status = dialog.locator('[aria-live="polite"]', { hasText: /could not load/i })
  await expect(status).toBeVisible()

  // The recovery link inside that message is a real, reachable link: it must
  // be in the accessibility tree, not hidden inside an aria-hidden twin, and
  // Playwright's role engine ignores aria-hidden subtrees, so finding it here
  // is the assertion.
  const recovery = status.getByRole('link', { name: /full search page/i })
  await expect(recovery).toHaveCount(1)

  // It is also a genuine tab stop, in order, rather than a silent one.
  await dialog.getByRole('searchbox', { name: 'Search terms' }).focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(recovery).toBeFocused()

  await recovery.click()
  await expect(page).toHaveURL(/\/search\//)
})

test('a modified click on a quick-search result leaves the dialog standing', async ({ page }) => {
  // Cmd/Ctrl-clicking a result opens it in a background tab and leaves this
  // one where it was, so the dialog, the query and the result list have to
  // survive: tearing them down would lose the reader's place in exchange for
  // a navigation they did not ask this tab to make.
  await page.goto('/')
  await page.getByRole('link', { name: 'Search', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await dialog.getByRole('searchbox', { name: 'Search terms' }).fill('gehenna')

  const firstResult = dialog.getByRole('link').first()
  await expect(firstResult).toBeVisible()
  await firstResult.click({ modifiers: ['ControlOrMeta'] })

  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('searchbox', { name: 'Search terms' })).toHaveValue('gehenna')
})

test('a visitor can find Revelation 14:11 through search', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Search', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await expect(dialog).toBeVisible()

  await dialog.getByRole('searchbox', { name: 'Search terms' }).fill('Revelation 14:11')

  const result = dialog.getByRole('link', { name: /Revelation 14/ }).first()
  await expect(result).toBeVisible()
  await result.click()

  await expect(page).toHaveURL(/\/(passages\/revelation-14|case\/key-texts\/revelation-14)/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Revelation 14')
  // Scoped to the article region: the search dialog leaves a live status line in
  // the header that mentions the query too.
  await expect(
    page
      .getByRole('main')
      .getByText(/Revelation 14:11/)
      .first(),
  ).toBeVisible()
})

test('search accepts an abbreviated Scripture reference', async ({ page }) => {
  await page.goto('/search/?q=Mt+10+28')

  await expect(page.getByText(/results for .Mt 10 28./)).toBeVisible()
  const results = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })
  await expect(results.first()).toBeVisible()

  await expect(page.getByRole('link', { name: /Matthew 10:28/ }).first()).toBeVisible()
  await page
    .getByRole('link', { name: /Matthew 10:28/ })
    .first()
    .click()
  await expect(page).toHaveURL(/matthew-10-28/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Matthew 10:28')
})

test('search accepts a phrase from a passage', async ({ page }) => {
  await page.goto('/search/?q=worm+does+not+die')

  await expect(page.getByText(/results for .worm does not die./)).toBeVisible()

  const headings = page.getByRole('heading', { level: 3 })
  await expect(headings.first()).toBeVisible()
  const titles = (await headings.allInnerTexts()).join(' | ').toLowerCase()
  expect(titles).toMatch(/mark 9|worm|gehenna|fire/)

  await headings.first().getByRole('link').click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

/* ------------------------------------------------------------------ *
 * 4. Every section that uses a reference
 * ------------------------------------------------------------------ */

test('a visitor can find every section that uses Matthew 10:28', async ({ page }) => {
  await page.goto('/scripture/')

  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: /^Matthew 10:28\b/ }) })
  await expect(row).toHaveCount(1)

  const cells = row.getByRole('cell')
  const usesCell = cells.last()
  const sectionLinks = usesCell.getByRole('link')

  const count = await sectionLinks.count()
  expect(count).toBeGreaterThan(1)

  for (let index = 0; index < count; index += 1) {
    const link = sectionLinks.nth(index)
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', /^\/(case|objections|appendix)\/.+\/$/)
    expect(((await link.innerText()) ?? '').trim().length).toBeGreaterThan(3)
  }

  // The row also states how many appearances there are, and it agrees.
  await expect(cells.first()).toHaveText(String(count))
})

/* ------------------------------------------------------------------ *
 * 5. From a claim to the source behind it
 * ------------------------------------------------------------------ */

test('a visitor can locate the source behind an early church claim', async ({ page }) => {
  await page.goto('/case/roadblocks/tradition/')

  const citation = page.getByRole('link', { name: /^Source: Irenaeus of Lyons/ }).first()
  await expect(citation).toBeVisible()
  // The citation itself carries the locator, so a reader knows where to look
  // before they follow it.
  await expect(citation).toHaveAccessibleName(/Book II, chapter 34, section 3/)

  await citation.click()
  await expect(page).toHaveURL(/\/sources\/#irenaeus-against-heresies$/)

  const entry = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name: /Irenaeus of Lyons\. Against Heresies/ }),
  })
  await expect(entry).toHaveCount(1)
  await expect(entry).toBeVisible()
  await expect(entry.getByRole('term').filter({ hasText: 'Locator' })).toHaveCount(1)
  await expect(entry).toContainText('Book II, chapter 34, section 3')
  await expect(
    entry.getByRole('link', { name: /Is Conditional Immortality a New Teaching/ }),
  ).toBeVisible()
})

/* ------------------------------------------------------------------ *
 * 6. Where the author says he is unsure
 * ------------------------------------------------------------------ */

test('a visitor can identify where the author is uncertain about Revelation 20', async ({
  page,
}) => {
  await page.goto('/case/key-texts/lake-of-fire/')

  const heading = page.getByRole('heading', { name: /where the author is uncertain/i })
  await expect(heading).toBeVisible()

  const callout = heading.locator('xpath=..')
  await expect(callout).toContainText('his own present interpretation')
  await expect(callout).toContainText('does not present the reading as settled')
  await expect(callout).toContainText('Other conditionalists disagree with him')
})

/* ------------------------------------------------------------------ *
 * 9 and 10. The video
 * ------------------------------------------------------------------ */

test('nothing is requested from YouTube until the reader presses play', async ({ page }) => {
  const contacted: string[] = []
  page.on('request', request => {
    if (isYouTube(request.url())) contacted.push(request.url())
  })
  // The embed must never actually load during a test run, but the request event
  // above still records any attempt.
  await page.route(
    url => isYouTube(url.toString()),
    route => route.abort(),
  )

  await page.goto('/watch/')
  await page.waitForLoadState('networkidle')
  await page.mouse.wheel(0, 1200)
  await page.waitForTimeout(500)

  expect(contacted).toEqual([])
  await expect(page.locator('iframe')).toHaveCount(0)

  const play = page.getByRole('button', { name: /press play to load it from youtube/i })
  await expect(play).toBeVisible()
  // Label in name: the poster shows the video's title, so the accessible name
  // must carry it too, or a speech-input user reading the title aloud cannot
  // address the control.
  await expect(play).toHaveAccessibleName(/video overview/i)
  await play.click()

  const frame = page.locator('iframe')
  await expect(frame).toHaveCount(1)
  await expect(frame).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\//)
  await expect(frame).toHaveAttribute('title', /.+/)
  // The control the reader pressed no longer exists; the player that replaced
  // it takes its focus rather than dropping the reader at the document body.
  await expect(frame).toBeFocused()
})

test('video chapters can be reached and activated from the keyboard', async ({ page }) => {
  await page.goto('/watch/')
  await page.route(
    url => isYouTube(url.toString()),
    route => route.abort(),
  )

  const chapters = page.getByRole('navigation', { name: 'Chapters' })
  await expect(chapters).toBeVisible()

  await page.locator('body').press('Tab')

  let href: string | null = null
  for (let step = 0; step < 80 && href === null; step += 1) {
    const candidate = await page.evaluate(() => {
      const element = document.activeElement as HTMLAnchorElement | null
      if (element?.tagName !== 'A') return null
      const target = element.getAttribute('href') ?? ''
      if (!target.startsWith('#')) return null
      const nav = element.closest('nav')
      if (!nav) return null
      const labelledBy = nav.getAttribute('aria-labelledby')
      const name =
        nav.getAttribute('aria-label') ??
        (labelledBy ? (document.getElementById(labelledBy)?.textContent ?? '').trim() : '')
      return name === 'Chapters' ? target : null
    })
    if (candidate) {
      href = candidate
      break
    }
    await page.keyboard.press('Tab')
  }

  expect(href, 'a chapter link should be reachable with Tab alone').not.toBeNull()
  const fragment = (href as string).slice(1)

  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(new RegExp(`/watch/#${fragment}$`))
  const targeted = page.locator(':target')
  await expect(targeted).toHaveCount(1)
  await expect(targeted).toHaveAttribute('id', fragment)
  await expect(targeted).toBeVisible()
  // The target is a transcript section, so it carries its own heading and prose.
  await expect(targeted.getByRole('heading').first()).toBeVisible()
  await expect(targeted.locator('p').first()).toBeVisible()
})

/* ------------------------------------------------------------------ *
 * 11. Sending a correction
 * ------------------------------------------------------------------ */

test('a visitor can submit a correction for S04', async ({ page }, testInfo) => {
  /**
   * The endpoint rate limits by forwarded address. Giving each run its own
   * address keeps a repeated local run from tripping a limit that belongs to
   * real submissions, and exercises the same code path either way.
   */
  await page.setExtraHTTPHeaders({
    'x-forwarded-for': `198.51.100.${(testInfo.workerIndex % 200) + 1}`,
  })

  await page.goto('/corrections/?section=S04#form')

  const form = page.locator('form#form')
  await expect(form).toBeVisible()
  await expect(form.locator('input[name="sectionId"]')).toHaveValue('S04')

  await form
    .getByLabel('What kind of feedback is this?')
    .selectOption({ label: 'Factual correction' })

  await form
    .getByLabel('Your correction, counterargument or report')
    .fill(
      'Section S04 quotes Matthew 25:46 in a way that reads as though the adjective settles the duration of the punishing rather than of the punishment. Please state the distinction before the conclusion.',
    )

  await form.getByLabel('Source web address (optional)').fill('https://example.org/aionios-note')
  await form.getByLabel('Publish the correction without my name').check()

  await form.getByRole('button', { name: 'Send submission' }).click()

  const receipt = page.getByText(/Received\./)
  await expect(receipt).toBeVisible()
  await expect(receipt.locator('xpath=..')).toContainText('Your submission has been recorded')
  await expect(receipt.locator('xpath=..').getByRole('link', { name: 'changelog' })).toBeVisible()

  // A recorded submission clears the field, so the same text cannot be sent twice
  // by accident.
  await expect(form.getByLabel('Your correction, counterargument or report')).toHaveValue('')
})

test('an invalid submission moves focus to the field that needs fixing', async ({ page }) => {
  await page.goto('/corrections/#form')

  const form = page.locator('form#form')
  await expect(form).toBeVisible()

  const message = form.getByLabel('Your correction, counterargument or report')
  await message.fill('Too short.')
  await form.getByRole('button', { name: 'Send submission' }).click()

  // Focus lands on the first invalid control, whose accessible description
  // carries the error, so the failure is announced without a live region.
  await expect(message).toBeFocused()
  await expect(message).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByText(/at least a sentence or two/)).toBeVisible()
  // The reader's text is never thrown away on failure.
  await expect(message).toHaveValue('Too short.')
})

/* ------------------------------------------------------------------ *
 * 12. Moving through the case
 * ------------------------------------------------------------------ */

test('previous and next move a reader through the case', async ({ page }) => {
  await page.goto('/case/key-texts/eternal-punishment/')

  const startTitle = await page.getByRole('heading', { level: 1 }).innerText()
  const startUrl = page.url()

  const sequence = page.getByRole('navigation', { name: 'Previous and next sections' })
  await expect(sequence).toBeVisible()

  await sequence.getByRole('link', { name: /^Next/ }).click()
  await expect(page).not.toHaveURL(startUrl)
  const nextTitle = await page.getByRole('heading', { level: 1 }).innerText()
  expect(nextTitle).not.toBe(startTitle)
  const nextUrl = page.url()

  const backwards = page.getByRole('navigation', { name: 'Previous and next sections' })
  await backwards.getByRole('link', { name: /^Previous/ }).click()
  await expect(page).toHaveURL(startUrl)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(startTitle)

  // The link that took us forward names where it goes, so the pair is coherent.
  await expect(
    page.getByRole('navigation', { name: 'Previous and next sections' }).getByRole('link', {
      name: new RegExp(nextTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    }),
  ).toHaveAttribute('href', new URL(nextUrl).pathname)
})

/* ------------------------------------------------------------------ *
 * 13 and 14. Dialogs
 * ------------------------------------------------------------------ */

test.describe('narrow viewport navigation', () => {
  test.use({ viewport: MOBILE_VIEWPORT })

  test('the chapter menu opens, takes focus, and gives it back', async ({ page }) => {
    await page.goto('/case/key-texts/eternal-punishment/')

    const trigger = page.getByRole('button', { name: 'Menu' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Site navigation' })
    await expect(dialog).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const focusInsideDialog = await page.evaluate(() => {
      const open = document.querySelector('dialog[open]')
      return Boolean(open && document.activeElement && open.contains(document.activeElement))
    })
    expect(focusInsideDialog, `focus was on ${await focusDescription(page)}`).toBe(true)

    await expect(dialog.getByRole('link', { name: /The Case/ }).first()).toBeVisible()

    // The sheet marks where the reader is, exactly as the desktop nav does:
    // this page lives under The Case, so that entry carries aria-current.
    // Exactly one, counted rather than sampled: the secondary link list
    // repeats routes the primary list owns, and marking both would announce
    // two current pages in a single navigation region.
    const current = dialog.locator('[aria-current="page"]')
    await expect(current).toHaveCount(1)
    await expect(current).toBeVisible()
    await expect(current).toContainText('The Case')

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

test('closing the search dialog returns focus to its trigger', async ({ page }) => {
  await page.goto('/')

  const trigger = page.getByRole('link', { name: 'Search', exact: true })
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await expect(dialog).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(dialog.getByRole('searchbox', { name: 'Search terms' })).toBeFocused()

  await dialog.getByRole('button', { name: 'Close search' }).click()
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  // Escape has to do the same thing, since that is what a keyboard reader
  // reaches for first.
  await trigger.click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('the keyboard shortcut opens the search dialog and closes it again', async ({ page }) => {
  await page.goto('/')

  // The shortcut handler exists only after hydration, and `aria-expanded`
  // appears on the trigger at the same moment, so waiting for it keeps the
  // keypress from racing the handler's registration.
  const trigger = page.getByRole('link', { name: 'Search', exact: true })
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  const dialog = page.getByRole('dialog', { name: 'Search this site' })
  await page.keyboard.press('Control+k')
  await expect(dialog).toBeVisible()
  // The dialog focuses its own text field on open, and the shortcut must
  // still close it from there: a toggle that only works with focus somewhere
  // else is not a toggle.
  await expect(dialog.getByRole('searchbox', { name: 'Search terms' })).toBeFocused()
  await page.keyboard.press('Control+k')
  await expect(dialog).toBeHidden()
})

/* ------------------------------------------------------------------ *
 * 15. The homepage without a mouse
 * ------------------------------------------------------------------ */

test('the skip link is the first stop and moves focus to the main region', async ({ page }) => {
  await page.goto('/')

  await page.keyboard.press('Tab')

  const skip = page.getByRole('link', { name: 'Skip to main content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await expect(skip).toHaveAttribute('href', '#main-content')

  await page.keyboard.press('Enter')

  const focusedId = await page.evaluate(() => document.activeElement?.id ?? '')
  expect(focusedId, `focus was on ${await focusDescription(page)}`).toBe('main-content')
})

test('every control on the homepage is reachable with the Tab key alone', async ({ page }) => {
  await page.goto('/')

  const expected = await page.evaluate(() => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'summary',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')
    const elements = [...document.querySelectorAll(selector)].filter(
      element => element instanceof HTMLElement && element.checkVisibility(),
    )
    elements.forEach((element, index) => {
      element.setAttribute('data-tab-probe', String(index))
    })
    return elements.map((_, index) => String(index))
  })

  expect(expected.length).toBeGreaterThan(20)

  // A positive tabindex would reorder the page against its own reading order.
  expect(await page.locator('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])').count()).toBe(0)

  const reached = new Set<string>()
  for (let step = 0; step < expected.length + 3; step += 1) {
    await page.keyboard.press('Tab')
    const probe = await page.evaluate(
      () => document.activeElement?.getAttribute('data-tab-probe') ?? null,
    )
    if (probe !== null) reached.add(probe)
  }

  expect(expected.filter(index => !reached.has(index))).toEqual([])
})

/* ------------------------------------------------------------------ *
 * 16. Narrow screens
 * ------------------------------------------------------------------ */

test.describe('at 320 CSS pixels', () => {
  test.use({ viewport: { width: 320, height: 720 } })

  const NARROW_ROUTES = [
    '/',
    '/case/key-texts/eternal-punishment/',
    '/passages/mark-9-42-48/',
    '/scripture/',
    '/search/?q=unquenchable+fire',
    '/watch/',
    '/start/compare-the-views/',
  ]

  for (const route of NARROW_ROUTES) {
    test(`${route} does not scroll sideways`, async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('domcontentloaded')

      const measurement = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        widest: (() => {
          let worst = { tag: '', width: 0 }
          for (const element of document.body.querySelectorAll('*')) {
            const rect = element.getBoundingClientRect()
            if (rect.right > worst.width) {
              worst = {
                tag: `${element.tagName.toLowerCase()}.${(element.className || '').toString().slice(0, 60)}`,
                width: Math.round(rect.right),
              }
            }
          }
          return worst
        })(),
      }))

      expect(
        measurement.scrollWidth,
        `widest box: ${measurement.widest.tag} reaching ${measurement.widest.width}px`,
      ).toBeLessThanOrEqual(measurement.innerWidth + 1)
    })
  }
})

/* ------------------------------------------------------------------ *
 * 17. Print
 * ------------------------------------------------------------------ */

test('printing keeps the argument and drops the chrome', async ({ page }) => {
  await page.goto('/case/key-texts/eternal-punishment/')
  await page.emulateMedia({ media: 'print' })

  const article = page.locator('article.article-body')
  await expect(article).toBeVisible()
  expect((await article.innerText()).length).toBeGreaterThan(2000)

  await expect(page.getByRole('heading', { name: 'Sources cited on this page' })).toBeVisible()
  await expect(
    page
      .getByRole('heading', { name: 'Sources cited on this page' })
      .locator('xpath=following-sibling::ol'),
  ).toBeVisible()

  await expect(page.locator('header.site-header')).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Case chapters' }).first()).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Previous and next sections' })).toBeHidden()
  await expect(
    page.getByRole('heading', { name: 'Found an error or have a counterargument?' }),
  ).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Watch this part of the overview' })).toBeHidden()

  // The embed itself is only on the pages that carry the video.
  await page.goto('/watch/')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.video-embed')).toBeHidden()
  await expect(page.getByRole('heading', { name: 'Transcript', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sources mentioned in the video' })).toBeVisible()
})
