import type { Database } from '@/types/supabase'
import { createLocationInsight, upsertLocationInsightForListing } from '@/lib/location-intelligence/insights'
import { resolveLocationIntelligence } from '@/lib/location-intelligence/providers'

type ListingRow = Database['public']['Tables']['listings']['Row']
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

function buildDemoInputFromListing(listing: ListingRow, listingId: string | null) {
  const city = listing.city?.trim() || 'São Paulo'
  const state = listing.state?.trim() || 'SP'
  const neighborhood = listing.neighborhood?.trim() || 'Centro'
  const address = listing.address_text?.trim() || listing.location_text?.trim() || 'Avenida Paulista'

  return {
    listingId,
    address,
    neighborhood,
    city,
    state,
    country: listing.country?.trim() || 'BR',
    latitude: listing.lat ?? null,
    longitude: listing.lng ?? null,
  }
}

export async function createDemoLocationInsightsForListing(
  supabase: SupabaseLike,
  userId: string,
  listing: ListingRow
): Promise<
  | {
      ok: true
      standalone: Awaited<ReturnType<typeof createLocationInsight>>['data']
      linked: Awaited<ReturnType<typeof upsertLocationInsightForListing>>['data']
    }
  | { ok: false; error: string }
> {
  const standaloneInput = buildDemoInputFromListing(listing, null)
  const linkedInput = buildDemoInputFromListing(listing, listing.id)

  const standalone = await resolveLocationIntelligence(standaloneInput)
  const standaloneSave = await createLocationInsight(supabase, userId, standalone)
  if (standaloneSave.error || !standaloneSave.data) {
    return { ok: false, error: standaloneSave.error ?? 'Failed to create standalone demo insight.' }
  }

  const linked = await resolveLocationIntelligence(linkedInput)
  const linkedSave = await upsertLocationInsightForListing(supabase, userId, listing.id, linked)
  if (linkedSave.error || !linkedSave.data) {
    return { ok: false, error: linkedSave.error ?? 'Failed to create listing-linked demo insight.' }
  }

  return {
    ok: true,
    standalone: standaloneSave.data,
    linked: linkedSave.data,
  }
}
