// One page, four viewports. The redirect fires 1.5s after load and the
// progress bar animates, so both are stopped before the shutter: the route is
// aborted so the page stays put, and animations are frozen so the bar is at a
// fixed position in every run rather than wherever the timer happened to be.

import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://discord.gg/**', (route) => route.abort())
})

test('redirect page', async ({ page }) => {
  await page.goto('/')

  // Waits for the web font stack to settle before measuring.
  await page.evaluate(() => document.fonts.ready)

  await expect(page).toHaveScreenshot('page.png', {
    fullPage: true,
    animations: 'disabled',
  })
})
