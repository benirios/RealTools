import { defineConfig, devices } from 'playwright/test'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100'

export default defineConfig({
  testDir: './tests',
  testMatch: /score-card\.e2e\.spec\.ts/,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
