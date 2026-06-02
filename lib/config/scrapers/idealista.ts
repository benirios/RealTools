import type { ListingDraft } from '@/lib/schemas/listing'
import { enrichListingFields } from '@/lib/listings/enrichment'
import {
  launchBrowser,
  newStealthContext,
  normalizeLimit,
  toAbsoluteUrl,
  compactText,
  extractPostalCode,
  slugifyLocation,
  isBlockedPage,
  type ScrapeTarget,
} from './playwright-utils'

const IDEALISTA_BASE_URL = 'https://www.idealista.pt'

// Idealista uses path-based location slugs rather than free-text search, so we build
// a best-effort commercial-premises search for the requested concelho/distrito.
// NOTE: Idealista fronts every page with DataDome bot protection — a headless run is
// frequently challenged. Detail extraction is best-effort; card data is the floor.
export function buildIdealistaSearchUrl(target: ScrapeTarget) {
  const locationSlug = slugifyLocation(target.city || target.region || target.state || 'portugal')
  const url = new URL(`/comprar-locais-comerciais/${locationSlug}/`, IDEALISTA_BASE_URL)
  url.searchParams.set('ordenado-por', 'fecha-desc')
  return url.toString()
}

export async function scrapeIdealistaListings(target: ScrapeTarget): Promise<ListingDraft[]> {
  const maxListings = normalizeLimit(target.maxListings)
  const browser = await launchBrowser()

  try {
    const context = await newStealthContext(browser)
    const page = await context.newPage()

    await page.goto(buildIdealistaSearchUrl(target), {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    })

    // Wheel-scroll triggers lazy image/card loading; window.scrollTo() does not.
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 400)
      await page.waitForTimeout(80)
    }
    await page.waitForTimeout(400)

    const rawCards = await page.evaluate((limit) => {
      const articles = Array.from(document.querySelectorAll<HTMLElement>('article.item, article[data-element-id]'))
      const seen = new Set<string>()

      return articles
        .map((article) => {
          const anchor = article.querySelector<HTMLAnchorElement>('a.item-link, a[href*="/imovel/"]')
          const href = anchor?.href
          if (!href || seen.has(href)) return null
          seen.add(href)

          const text = article.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const title = anchor.getAttribute('title') || anchor.textContent || ''
          const price = article.querySelector('.item-price')?.textContent?.trim()
          // Detail chips carry area (m²) and typology (e.g. "T2").
          const detailChars = Array.from(article.querySelectorAll('.item-detail-char .item-detail, .item-detail'))
            .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '')
            .filter(Boolean)
          const images = Array.from(article.querySelectorAll<HTMLImageElement>('img'))
            .map((img) => img.currentSrc || img.getAttribute('data-src') || img.src)
            .filter((src): src is string => Boolean(src) && !src.startsWith('data:'))

          return {
            href,
            title: title.replace(/\s+/g, ' ').trim(),
            price,
            location: text,
            details: detailChars.join(' · '),
            images,
          }
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item?.href && item.title))
        .slice(0, limit)
    }, maxListings)

    const drafts: ListingDraft[] = []

    for (const raw of rawCards) {
      const sourceUrl = toAbsoluteUrl(raw.href, IDEALISTA_BASE_URL)
      if (!sourceUrl) continue

      let description: string | undefined
      let addressText: string | undefined
      let detailImages: string[] = []

      try {
        const detail = await context.newPage()
        await detail.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

        const extracted = await detail.evaluate(() => {
          const bodyText = document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const comment = document.querySelector('.comment, .adCommentsLanguage')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const address = document.querySelector('#headerMap .main-info__title-minor, .main-info__title-minor')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const images: string[] = []

          // JSON-LD structured data — present for SEO in the initial HTML.
          document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
            try {
              const data = JSON.parse(el.textContent ?? '') as Record<string, unknown>
              const rawImg = Array.isArray(data?.image) ? data.image : data?.image ? [data.image] : []
              ;(rawImg as unknown[]).forEach((img) => {
                const u = typeof img === 'string' ? img : (img as { url?: string })?.url
                if (u && u.startsWith('http')) images.push(u)
              })
            } catch {}
          })

          if (images.length === 0) {
            document.querySelectorAll('img').forEach((img) => {
              const src = (img as HTMLImageElement).currentSrc || img.getAttribute('data-src') || (img as HTMLImageElement).src
              if (src && !src.startsWith('data:') && src.startsWith('http')) images.push(src)
            })
          }

          return { bodyText, comment, address, images: images.slice(0, 8) }
        })

        if (!isBlockedPage(extracted.bodyText)) {
          description = compactText(extracted.comment || extracted.bodyText.slice(0, 2000))
          addressText = compactText(extracted.address) ?? compactText(raw.location)
          detailImages = extracted.images.filter(Boolean)
        }

        await detail.close()
      } catch {
        // Detail extraction is best-effort; search-card data is still useful.
      }

      const locationText = compactText(`${raw.location} ${raw.details}`)
      const enriched = enrichListingFields({
        title: raw.title,
        description,
        priceText: raw.price,
        locationText,
        addressText,
      })

      const images =
        detailImages.length > 0
          ? detailImages
          : raw.images
              .map((image) => toAbsoluteUrl(image, IDEALISTA_BASE_URL))
              .filter((image): image is string => Boolean(image))

      drafts.push({
        source: 'idealista',
        sourceUrl,
        title: compactText(raw.title) ?? 'Idealista listing',
        description,
        priceText: compactText(raw.price),
        priceAmount: enriched.priceAmount,
        locationText,
        addressText,
        postalCode: extractPostalCode(addressText, description, raw.location),
        country: 'PT',
        state: target.state,
        city: target.city ?? target.region,
        areaSqm: enriched.areaSqm,
        typology: enriched.typology,
        tags: enriched.tags,
        propertyType: enriched.propertyType,
        images,
        rawPayload: {
          ...raw,
          areaSqm: enriched.areaSqm ?? null,
          typology: enriched.typology ?? null,
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
