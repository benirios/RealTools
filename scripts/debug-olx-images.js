// Run: node scripts/debug-olx-images.js <olx-listing-url>
// Prints JSON-LD images and __NEXT_DATA__ image paths found on the page.

const { chromium } = require('playwright')

const url = process.argv[2]
if (!url) { console.error('Usage: node scripts/debug-olx-images.js <url>'); process.exit(1) }

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'pt-BR',
  })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForTimeout(1500)

  const result = await page.evaluate(() => {
    // JSON-LD
    const jsonld = []
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
      try { jsonld.push(JSON.parse(el.textContent ?? '')) } catch {}
    })

    // __NEXT_DATA__ top-level keys and pageProps keys
    const nd = window.__NEXT_DATA__
    const pagePropsKeys = nd?.props?.pageProps ? Object.keys(nd.props.pageProps) : []

    // Try common image paths
    const pp = nd?.props?.pageProps ?? {}
    const imagePaths = {
      'pageProps.ad?.images': pp.ad?.images?.slice(0, 2),
      'pageProps.listing?.images': pp.listing?.images?.slice(0, 2),
      'pageProps.data?.ad?.images': pp.data?.ad?.images?.slice(0, 2),
      'pageProps.initialState': pp.initialState ? Object.keys(pp.initialState) : undefined,
    }

    // All img srcs on page
    const imgSrcs = Array.from(document.querySelectorAll('img'))
      .map(i => i.currentSrc || i.src)
      .filter(s => s && !s.startsWith('data:'))
      .slice(0, 5)

    return { jsonld, pagePropsKeys, imagePaths, imgSrcs }
  })

  console.log('=== JSON-LD ===')
  result.jsonld.forEach((d, i) => {
    console.log(`[${i}] @type=${d['@type']} image=${JSON.stringify(d.image ?? 'none').slice(0, 200)}`)
  })
  console.log('\n=== __NEXT_DATA__ pageProps keys ===', result.pagePropsKeys)
  console.log('\n=== image paths ===', JSON.stringify(result.imagePaths, null, 2))
  console.log('\n=== img srcs on page ===', result.imgSrcs)

  await browser.close()
})()
