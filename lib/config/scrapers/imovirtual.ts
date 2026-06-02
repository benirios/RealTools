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

const IMOVIRTUAL_BASE_URL = 'https://www.imovirtual.com'

// Map a free-text commercial search term to an Imovirtual "estate" path segment.
function categorySlug(searchTerm: string) {
  const t = searchTerm.toLowerCase()
  if (/escrit|gabinete|office/.test(t)) return 'escritorio'
  if (/armaz|nave|logis|industri/.test(t)) return 'espaco-industrial-armazem'
  if (/loja|comerc|retail|trespasse/.test(t)) return 'espaco-comercial'
  if (/terreno|lote/.test(t)) return 'terreno'
  return 'espaco-comercial'
}

export function buildImovirtualSearchUrl(target: ScrapeTarget) {
  const locationSlug = slugifyLocation(target.city || target.region || target.state || 'portugal')
  return `${IMOVIRTUAL_BASE_URL}/pt/resultados/comprar/${categorySlug(target.searchTerm)}/${locationSlug}`
}

// Imovirtual is a Next.js app (OLX group). The listing array is embedded in the
// __NEXT_DATA__ script; we walk it generically (the exact prop path changes often),
// and fall back to DOM cards if the embedded JSON is absent or blocked.
type RawCard = {
  href: string
  title: string
  price?: string
  location?: string
  area?: string
  images: string[]
}

export async function scrapeImovirtualListings(target: ScrapeTarget): Promise<ListingDraft[]> {
  const maxListings = normalizeLimit(target.maxListings)
  const browser = await launchBrowser()

  try {
    const context = await newStealthContext(browser)
    const page = await context.newPage()

    await page.goto(buildImovirtualSearchUrl(target), {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    })

    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 400)
      await page.waitForTimeout(80)
    }
    await page.waitForTimeout(400)

    const rawCards: RawCard[] = await page.evaluate((limit) => {
      const out: RawCard[] = []
      const seen = new Set<string>()

      const pushCard = (card: Partial<RawCard> & { href?: string }) => {
        if (!card.href || seen.has(card.href)) return
        if (!card.title) return
        seen.add(card.href)
        out.push({
          href: card.href,
          title: card.title,
          price: card.price,
          location: card.location,
          area: card.area,
          images: card.images ?? [],
        })
      }

      // 1) Preferred: parse the embedded __NEXT_DATA__ JSON.
      const nextData = document.getElementById('__NEXT_DATA__')?.textContent
      if (nextData) {
        try {
          const json = JSON.parse(nextData) as unknown
          const items: Record<string, unknown>[] = []
          const visit = (node: unknown, depth: number) => {
            if (!node || depth > 8 || items.length > limit * 2) return
            if (Array.isArray(node)) {
              node.forEach((child) => visit(child, depth + 1))
              return
            }
            if (typeof node === 'object') {
              const obj = node as Record<string, unknown>
              // An ad item looks like { title, slug/url, price..., areaInSquareMeters? }
              if ((obj.title || obj.name) && (obj.slug || obj.url)) {
                items.push(obj)
              }
              Object.values(obj).forEach((child) => visit(child, depth + 1))
            }
          }
          visit(json, 0)

          items.forEach((item) => {
            const slug = String(item.slug ?? item.url ?? '')
            const href = slug.startsWith('http') ? slug : slug ? `/pt/anuncio/${slug}` : ''
            const priceObj = item.totalPrice ?? item.price
            const price =
              priceObj && typeof priceObj === 'object'
                ? String((priceObj as Record<string, unknown>).value ?? '')
                : priceObj != null
                  ? String(priceObj)
                  : undefined
            const locationObj = item.location as Record<string, unknown> | undefined
            pushCard({
              href,
              title: String(item.title ?? item.name ?? '').trim(),
              price: price ? `${price} €` : undefined,
              location: locationObj ? JSON.stringify(locationObj) : undefined,
              area: item.areaInSquareMeters != null ? `${item.areaInSquareMeters} m²` : undefined,
              images: Array.isArray(item.images)
                ? (item.images as Array<Record<string, unknown>>)
                    .map((img) => String(img.large ?? img.medium ?? img.url ?? ''))
                    .filter((u) => u.startsWith('http'))
                : [],
            })
          })
        } catch {
          // fall through to DOM scraping
        }
      }

      // 2) Fallback: DOM cards.
      if (out.length === 0) {
        const anchors = Array.from(
          document.querySelectorAll<HTMLAnchorElement>('[data-cy="listing-item"] a[href], a[href*="/anuncio/"]')
        )
        anchors.forEach((anchor) => {
          const container = anchor.closest('article, [data-cy="listing-item"], li') ?? anchor
          const text = container.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const title =
            anchor.getAttribute('title') ||
            container.querySelector('h3, h2, [data-cy="listing-item-title"]')?.textContent ||
            anchor.textContent ||
            ''
          const price = text.match(/[\d.\s]+\s?€/)?.[0]
          const area = text.match(/\d[\d.\s]*\s?m²/)?.[0]
          const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'))
            .map((img) => img.currentSrc || img.getAttribute('data-src') || img.src)
            .filter((src): src is string => Boolean(src) && !src.startsWith('data:'))
          pushCard({ href: anchor.href, title: title.replace(/\s+/g, ' ').trim(), price, location: text, area, images })
        })
      }

      return out.slice(0, limit)
    }, maxListings)

    const drafts: ListingDraft[] = []

    for (const raw of rawCards) {
      const sourceUrl = toAbsoluteUrl(raw.href, IMOVIRTUAL_BASE_URL)
      if (!sourceUrl) continue

      let description: string | undefined
      let addressText: string | undefined
      let detailImages: string[] = []

      try {
        const detail = await context.newPage()
        await detail.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })

        const extracted = await detail.evaluate(() => {
          const bodyText = document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const desc = document.querySelector('[data-cy="adPageAdDescription"], [data-testid="ad-description"]')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const address = document.querySelector('[data-testid="map-link-container"], [aria-label*="Endereço"], .css-address')?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
          const images: string[] = []
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
          return { bodyText, desc, address, images: images.slice(0, 8) }
        })

        if (!isBlockedPage(extracted.bodyText)) {
          description = compactText(extracted.desc || extracted.bodyText.slice(0, 2000))
          addressText = compactText(extracted.address) ?? compactText(raw.location)
          detailImages = extracted.images.filter(Boolean)
        }

        await detail.close()
      } catch {
        // Detail extraction is best-effort; card data is still useful.
      }

      const locationText = compactText(`${raw.location ?? ''} ${raw.area ?? ''}`)
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
              .map((image) => toAbsoluteUrl(image, IMOVIRTUAL_BASE_URL))
              .filter((image): image is string => Boolean(image))

      drafts.push({
        source: 'imovirtual',
        sourceUrl,
        title: compactText(raw.title) ?? 'Imovirtual listing',
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
