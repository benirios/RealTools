import { chromium } from 'playwright'
import type { ListingDraft } from '@/lib/schemas/listing'
import { enrichListingFields } from '@/lib/listings/enrichment'

export type OlxTarget = {
  state?: string
  city?: string
  region?: string
  address?: string
  searchTerm: string
  maxListings?: number
}

const DEFAULT_MAX_LISTINGS = 25
const HARD_MAX_LISTINGS = 50
const OLX_BASE_URL = 'https://www.olx.com.br'

function normalizeLimit(maxListings?: number) {
  if (!maxListings || Number.isNaN(maxListings)) return DEFAULT_MAX_LISTINGS
  return Math.min(Math.max(Math.trunc(maxListings), 1), HARD_MAX_LISTINGS)
}

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return null
  try {
    const u = new URL(url, OLX_BASE_URL)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

function compactText(value: string | null | undefined) {
  return value?.replace(/\s+/g, ' ').trim() || undefined
}

function isCloudflareBlock(text: string) {
  return text.includes('Please enable cookies') || text.includes('Cloudflare Ray ID')
}

export function buildOlxSearchUrl(target: OlxTarget) {
  const query = [
    target.searchTerm,
    target.address,
    target.region,
    target.city,
    target.state,
  ]
    .filter(Boolean)
    .join(' ')

  const params = new URLSearchParams({ q: query })
  return `${OLX_BASE_URL}/imoveis?${params.toString()}`
}

export async function scrapeOlxListings(target: OlxTarget): Promise<ListingDraft[]> {
  const maxListings = normalizeLimit(target.maxListings)
  const browser = await chromium.launch({ headless: true })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    })

    // Patch bot-detection signals on every page in this context
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
    })

    const page = await context.newPage()

    await page.goto(buildOlxSearchUrl(target), {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    })

    // Wheel-scroll triggers Intersection Observer lazy loading; window.scrollTo() does not
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 400)
      await page.waitForTimeout(80)
    }
    await page.waitForTimeout(400)
    await page
      .waitForFunction(
        () =>
          Array.from(document.querySelectorAll('img')).some(
            (img) => img.currentSrc && !img.currentSrc.startsWith('data:')
          ),
        { timeout: 3000 }
      )
      .catch(() => {})

    const rawCards = await page.evaluate((limit) => {
      const anchors = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href*="/item/"], a[href*="olx.com.br"]')
      )
      const seen = new Set<string>()

      return anchors
        .map((anchor) => {
          const href = anchor.href
          if (!href || seen.has(href)) return null
          seen.add(href)

          const container = anchor.closest('section, article, li, div') ?? anchor
          const text = container.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const title =
            anchor.getAttribute('title') ||
            anchor.getAttribute('aria-label') ||
            container.querySelector('h2, h3')?.textContent ||
            anchor.textContent
          const price = text.match(/R\$\s?[\d.,]+/)?.[0]
          const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'))
            .map(
              (img) =>
                img.currentSrc ||
                img.getAttribute('data-src') ||
                img.getAttribute('data-lazy') ||
                img.getAttribute('data-original') ||
                img.src
            )
            .filter((src): src is string => Boolean(src) && !src.startsWith('data:'))

          return {
            href,
            title: title?.replace(/\s+/g, ' ').trim() ?? '',
            price,
            location: text,
            images,
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item?.href && item.title))
        .slice(0, limit)
    }, maxListings)

    const drafts: ListingDraft[] = []

    for (const raw of rawCards) {
      const sourceUrl = toAbsoluteUrl(raw.href)
      if (!sourceUrl) continue

      let description: string | undefined
      let addressText: string | undefined
      let detailImages: string[] = []

      try {
        const detail = await context.newPage()
        await detail.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

        const extracted = await detail.evaluate(() => {
          const bodyText = document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const images: string[] = []

          // JSON-LD structured data — present for SEO, in initial HTML, not lazy-loaded
          document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
            try {
              const data = JSON.parse(el.textContent ?? '') as Record<string, unknown>
              const raw = Array.isArray(data?.image) ? data.image : data?.image ? [data.image] : []
              ;(raw as unknown[]).forEach((img) => {
                const url = typeof img === 'string' ? img : (img as { url?: string })?.url
                if (url && url.startsWith('http')) images.push(url)
              })
            } catch {}
          })

          // DOM fallback: real img src/data-src (works if Cloudflare didn't block us)
          if (images.length === 0) {
            document.querySelectorAll('img').forEach((img) => {
              const src =
                (img as HTMLImageElement).currentSrc ||
                img.getAttribute('data-src') ||
                img.getAttribute('data-lazy') ||
                (img as HTMLImageElement).src
              if (src && !src.startsWith('data:') && src.startsWith('http')) images.push(src)
            })
          }

          return { bodyText, images: images.slice(0, 8) }
        })

        if (!isCloudflareBlock(extracted.bodyText)) {
          description = compactText(extracted.bodyText.slice(0, 2000))
          addressText = compactText(
            extracted.bodyText.match(/(?:Endere[cç]o|Localiza[cç][aã]o)\s*:?\s*([^|]{8,160})/i)?.[1]
          )
          detailImages = extracted.images.filter(Boolean)
        }

        await detail.close()
      } catch {
        // Detail extraction is best-effort; search-card data is still useful.
      }

      const enriched = enrichListingFields({
        title: raw.title,
        description,
        priceText: raw.price,
        locationText: raw.location,
        addressText,
      })

      // Prefer full gallery images from detail page; fall back to search-card thumbnails
      const images =
        detailImages.length > 0
          ? detailImages
          : raw.images
              .map((image) => toAbsoluteUrl(image))
              .filter((image): image is string => Boolean(image))

      drafts.push({
        source: 'olx',
        sourceUrl,
        title: compactText(raw.title) ?? 'OLX listing',
        description,
        priceText: compactText(raw.price),
        priceAmount: enriched.priceAmount,
        locationText: compactText(raw.location),
        addressText,
        country: 'BR',
        state: target.state,
        city: target.city ?? target.region,
        tags: enriched.tags,
        propertyType: enriched.propertyType,
        images,
        rawPayload: {
          ...raw,
          requestedAddress: target.address,
          requestedRegion: target.region,
          requestedCity: target.city,
          requestedState: target.state,
        },
      })
    }

    return drafts
  } finally {
    await browser.close()
  }
}
