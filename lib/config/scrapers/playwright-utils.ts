import { chromium, type Browser, type BrowserContext } from 'playwright'

export type ScrapeTarget = {
  state?: string // Portuguese distrito (e.g. "Lisboa", "Porto")
  city?: string // concelho / locality
  region?: string
  address?: string
  searchTerm: string
  maxListings?: number
}

const DEFAULT_MAX_LISTINGS = 25
const HARD_MAX_LISTINGS = 50

// Portuguese CP7 postal code, e.g. 4710-057
const CP7_RE = /\b(\d{4}-\d{3})\b/

export function normalizeLimit(maxListings?: number) {
  if (!maxListings || Number.isNaN(maxListings)) return DEFAULT_MAX_LISTINGS
  return Math.min(Math.max(Math.trunc(maxListings), 1), HARD_MAX_LISTINGS)
}

export function toAbsoluteUrl(url: string | null | undefined, baseUrl: string) {
  if (!url) return null
  try {
    const u = new URL(url, baseUrl)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

export function compactText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() || undefined
}

export function extractPostalCode(...texts: Array<string | null | undefined>) {
  for (const text of texts) {
    const match = String(text ?? '').match(CP7_RE)
    if (match) return match[1]
  }
  return undefined
}

// "Vila Nova de Gaia" -> "vila-nova-de-gaia" for portal location path segments.
export function slugifyLocation(value: string | null | undefined) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Bot-detection / interstitial detection shared across portals.
// Idealista fronts with DataDome; Imovirtual (OLX group) can show Cloudflare.
export function isBlockedPage(text: string) {
  return (
    text.includes('Please enable cookies') ||
    text.includes('Cloudflare Ray ID') ||
    text.includes('datadome') ||
    text.includes('geo.captcha-delivery.com') ||
    text.includes('Pardon Our Interruption')
  )
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true })
}

// Portuguese-locale stealth context with bot-detection signals patched out.
export async function newStealthContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'pt-PT',
    timezoneId: 'Europe/Lisbon',
  })

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-PT', 'pt', 'en-US', 'en'] })
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
  })

  return context
}
