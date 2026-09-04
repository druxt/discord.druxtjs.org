// Behaviour the markup tests cannot see: whether the redirect actually fires,
// whether a keyboard reaches the invite, whether the motion preference is
// honoured, and whether the contrast on the dark ground really does pass.

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

import { canonicalInvite } from '../helpers/page.js'

const invite = canonicalInvite()
const inviteUrl = `https://discord.gg/${invite}`

// The invite is a live third-party URL, and the meta refresh fires 1.5s after
// load. Both suites below intercept it so nothing reaches the network: the
// redirect test fulfils the request (proving the navigation happened), every
// other test aborts it so the page under inspection stays put rather than
// disappearing mid-assertion on a slow runner.
const stubDiscord = (page) =>
  page.route('https://discord.gg/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }),
  )

const holdOnPage = (page) => page.route('https://discord.gg/**', (route) => route.abort())

test('renders the invite as a real link, not just a redirect', async ({ page }) => {
  await holdOnPage(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Discord/)
  await expect(page.getByRole('link', { name: /invite/i })).toHaveAttribute('href', inviteUrl)
})

test('the meta refresh navigates to the invite', async ({ page }) => {
  await stubDiscord(page)
  await page.goto('/')

  await page.waitForURL(inviteUrl, { timeout: 10_000 })
  expect(page.url()).toBe(inviteUrl)
})

test('a keyboard reaches the invite button', async ({ page }) => {
  await holdOnPage(page)
  await page.goto('/')

  // Tab from the document body; the invite is the first interactive element.
  await page.keyboard.press('Tab')
  await expect(page.locator('a.invite')).toBeFocused()
})

test('prefers-reduced-motion stops the progress bar animating', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await holdOnPage(page)
  await page.goto('/')

  const animation = await page
    .locator('.bar span')
    .evaluate((el) => getComputedStyle(el).animationName)
  expect(animation).toBe('none')

  await context.close()
})

test('the default view animates the progress bar', async ({ page }) => {
  await holdOnPage(page)
  await page.goto('/')

  const animation = await page
    .locator('.bar span')
    .evaluate((el) => getComputedStyle(el).animationName)
  expect(animation).not.toBe('none')
})

// A timed <meta refresh> under 20 hours fails WCAG 2.2.1 (Timing Adjustable),
// and axe rates it critical. The page does it deliberately: the 1.5s pause is
// what makes the branded hand-off visible, and GitHub Pages "deploy from
// branch" cannot issue a real 301 instead. The escape hatch is that the invite
// is also a plain link, so nobody is trapped waiting on the timer.
//
// It is listed here rather than switched off so the exception stays one named
// rule instead of a blanket opt-out - any other violation still fails the
// build. Setting the refresh delay to 0 resolves it for good; see README.
const KNOWN_VIOLATIONS = ['meta-refresh']

const scan = (page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

test('passes axe apart from the documented meta-refresh exception', async ({ page }) => {
  await holdOnPage(page)
  await page.goto('/')

  const unexpected = (await scan(page)).violations.filter(
    (violation) => !KNOWN_VIOLATIONS.includes(violation.id),
  )

  expect(unexpected.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([])
})

test('the meta-refresh exception is still needed', async ({ page }) => {
  await holdOnPage(page)
  await page.goto('/')

  const ids = (await scan(page)).violations.map((violation) => violation.id)
  const stale = KNOWN_VIOLATIONS.filter((id) => !ids.includes(id))

  // Fails once the page stops triggering it, so the exception gets deleted
  // rather than quietly outliving the problem it was written for.
  expect(stale).toEqual([])
})
