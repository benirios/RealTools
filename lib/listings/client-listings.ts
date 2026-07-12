import 'server-only'
import type { SupabaseLike } from '@/lib/supabase/types'

// A listing belongs to a client's pipeline either because it was found by
// their own search (listings.investor_id) or because the broker shared it in
// from another client's pipeline (investor_listing_matches.is_manual_share).
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
      .eq('investor_id', investorId) as Promise<{ data: { id: string }[] | null }>,
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
