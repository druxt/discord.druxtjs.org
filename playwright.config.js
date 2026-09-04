// Playwright drives the real page: focus order, reduced motion, axe, and
// whether the meta refresh genuinely navigates, plus the visual baselines.
// `serve` hosts the repo root because that is exactly what GitHub Pages
// publishes.
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// Chromium renders text differently on arm64 and x86_64, so one baseline set
// cannot satisfy both CI systems: the GitLab runner is arm64 (Docker on Apple
// silicon) and GitHub's ubuntu-latest is x64. Baselines are therefore kept per
// architecture rather than one side permanently failing on the other's PNGs.
const ARCH = process.arch

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: `{testDir}/visual/__screenshots__/{arg}-{projectName}-${ARCH}{ext}`,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['list'], ['junit', { outputFile: 'test-results/junit.xml' }], ['html', { open: 'never' }]]
    : [['list']],
  expect: {
    // An absolute pixel budget, not a ratio. The page is mostly empty
    // gradient, so a proportional threshold scales with the viewport and
    // stops meaning anything: at 2% a full colour change of the invite
    // button passed on three of the four viewports, because the button is a
    // tiny share of a 1680px-wide screenshot. A flat budget is the same
    // sensitivity everywhere, and baselines are per-architecture so the
    // render is deterministic enough to keep it low.
    toHaveScreenshot: { maxDiffPixels: 120 },
  },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'behaviour',
      testMatch: /e2e\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'phone',
      testMatch: /visual\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 844 } },
    },
    {
      name: 'tablet',
      testMatch: /visual\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1180 } },
    },
    {
      name: 'desktop',
      testMatch: /visual\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'wide',
      testMatch: /visual\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1680, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm exec serve --no-clipboard --no-port-switching -l ${PORT} .`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
