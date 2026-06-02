import type { ListingDraft } from '@/lib/schemas/listing'
import { scrapeIdealistaListings } from '@/lib/config/scrapers/idealista'
import { scrapeImovirtualListings } from '@/lib/config/scrapers/imovirtual'
import type { ScrapeTarget } from '@/lib/config/scrapers/playwright-utils'

// Portal scrapers in priority order. Part 2 replaces this hardcoded list with the
// active country config's `portals` array.
const PORTAL_SCRAPERS = [scrapeIdealistaListings, scrapeImovirtualListings] as const

// Runs every portal for the country and merges the drafts, de-duplicated by source URL.
// A single portal failing (e.g. DataDome challenge) does not abort the others.
export async function scrapeListings(target: ScrapeTarget): Promise<ListingDraft[]> {
  const perPortalLimit = Math.max(1, Math.ceil((target.maxListings ?? 25) / PORTAL_SCRAPERS.length))
  const results: ListingDraft[] = []
  const seen = new Set<string>()

  for (const scrape of PORTAL_SCRAPERS) {
    try {
      const drafts = await scrape({ ...target, maxListings: perPortalLimit })
      for (const draft of drafts) {
        if (seen.has(draft.sourceUrl)) continue
        seen.add(draft.sourceUrl)
        results.push(draft)
      }
    } catch {
      // Best-effort: one blocked/failed portal should not sink the whole import run.
    }
  }

  return results
}
