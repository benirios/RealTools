import 'server-only'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/supabase'

type DealBuyerRow = Database['public']['Tables']['deal_buyers']['Row']
type BuyerRow = Database['public']['Tables']['buyers']['Row']

/**
 * Idempotent OM open recorder.
 *
 * Behavior:
 *  - Unknown token → no-op (returns without error).
 *  - First valid open → sets om_opened_at + inserts om_opened activity.
 *  - Repeat open → no duplicate activity (om_opened_at already set, guard skips).
 *
 * Used by both primary URL path (OM Server Component) and secondary pixel path
 * (/api/track/[token] Route Handler). Both paths call this single function to
 * guarantee idempotency regardless of which path fires first.
 *
 * Security: always completes without revealing whether the token was valid
 * (T-03-08: no information leakage via response difference).
 */
export async function recordOmOpenByToken(token: string): Promise<void> {
  if (!token) return

  const supabase = createSupabaseServiceClient()

  const openedAt = new Date().toISOString()

  // Atomically claim the first open. URL tracking and the fallback pixel can
  // arrive nearly together, so the null predicate must live in the UPDATE.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dealBuyer } = await (supabase.from('deal_buyers') as any)
    .update({ om_opened_at: openedAt })
    .eq('tracking_token', token)
    .is('om_opened_at', null)
    .select('deal_id, buyer_id')
    .single() as { data: Pick<DealBuyerRow, 'deal_id' | 'buyer_id'> | null }

  // Unknown or already-opened token — no-op (T-03-08/T-03-09)
  if (!dealBuyer) return

  // Fetch buyer metadata for the activity event (D-09)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: buyer } = await (supabase.from('buyers') as any)
    .select('name, email')
    .eq('id', dealBuyer.buyer_id)
    .single() as { data: Pick<BuyerRow, 'name' | 'email'> | null }

  // Insert om_opened activity event (D-09: metadata stores buyer_id/name/email)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('activities') as any).insert({
    deal_id: dealBuyer.deal_id,
    event_type: 'om_opened',
    metadata: {
      buyer_id: dealBuyer.buyer_id,
      buyer_name: buyer?.name ?? null,
      buyer_email: buyer?.email ?? null,
    },
  })
}
