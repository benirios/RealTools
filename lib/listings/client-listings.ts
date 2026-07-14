import 'server-only'
import type { SupabaseLike } from '@/lib/supabase/types'

// A listing belongs to a client's Imóveis tab either because it was found by
// their own search and favorited (listings.investor_id + is_favorited) or
// because the broker shared it in from another client's pipeline
// (investor_listing_matches.is_manual_share). Scraped listings land in a
// review queue (loadClientPendingListingIds) until favorited; manual
// listings are inserted already favorited, so they skip the queue.
export async function loadClientListingIds(
  supabase: SupabaseLike,
  userId: string,
  investorId: string
): Promise<string[]> {
  const [ownedResult, sharedResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('listings') as any)
      .select('id')
      .eq('user_id', userId)
      .eq('investor_id', investorId)
      .eq('is_favorited', true) as Promise<{ data: { id: string }[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('investor_listing_matches') as any)
      .select('listing_id')
      .eq('user_id', userId)
      .eq('investor_id', investorId)
      .eq('is_manual_share', true) as Promise<{ data: { listing_id: string }[] | null }>,
  ])

  const owned = (ownedResult.data ?? []).map((row) => row.id)
  const shared = (sharedResult.data ?? []).map((row) => row.listing_id)
  return Array.from(new Set([...owned, ...shared]))
}

// Scraped listings owned by this client, not yet favorited into Imóveis.
export async function loadClientPendingListingIds(
  supabase: SupabaseLike,
  userId: string,
  investorId: string
): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('listings') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('investor_id', investorId)
    .eq('is_favorited', false) as { data: { id: string }[] | null }

  return (data ?? []).map((row) => row.id)
}
