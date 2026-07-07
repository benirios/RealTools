import 'server-only'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/supabase'

type InvestorOmSendRow = Database['public']['Tables']['investor_om_sends']['Row']

/**
 * Idempotent OM unsubscribe by tracking token (RFC 8058 one-click).
 * Reuses the token embedded in every OM email — no raw email address in the
 * URL, no cross-tenant ambiguity (the token maps to exactly one investor_id +
 * user_id via investor_om_sends).
 *
 * Security: always completes without revealing whether the token was valid,
 * matching recordOmOpenByToken's no-information-leakage behavior.
 */
export async function unsubscribeByToken(token: string): Promise<void> {
  if (!token) return

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sendRow } = await (supabase.from('investor_om_sends') as any)
    .select('investor_id, user_id')
    .eq('tracking_token', token)
    .single() as { data: Pick<InvestorOmSendRow, 'investor_id' | 'user_id'> | null }

  if (!sendRow) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('investors') as any)
    .update({ om_unsubscribed_at: new Date().toISOString() })
    .eq('id', sendRow.investor_id)
    .eq('user_id', sendRow.user_id)
    .is('om_unsubscribed_at', null)
}
