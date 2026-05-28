import { chromium } from 'playwright'

const targetUrl = process.argv[2] || process.env.LOCALHOST_URL || 'http://127.0.0.1:3000'
const timeoutMs = Number.parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS || '30000', 10)
const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false'

async function run() {
  const browser = await chromium.launch({ headless })

  try {
    const page = await browser.newPage()
    const response = await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    })

    const status = response?.status() ?? 0
    const title = await page.title()

    console.log(`[localhost-agent] url=${targetUrl}`)
    console.log(`[localhost-agent] status=${status}`)
    console.log(`[localhost-agent] title=${title || '(empty)'}`)

    if (!response || status >= 400) {
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}

run().catch((error) => {
  console.error(
    '[localhost-agent] failed:',
    error instanceof Error ? error.message : String(error)
  )
  process.exit(1)
})
