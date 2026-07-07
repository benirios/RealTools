import 'server-only'
import type { createSupabaseServiceClient } from '@/lib/supabase/service'

/**
 * Server actions that insert a row referencing a client-supplied deal_id
 * (notes, files, activities) must call this first. Without it, any
 * authenticated user can attach data to a deal_id they don't own — notes/
 * files stay invisible to the real owner (read queries also filter by
 * user_id), but activities has no user_id column at all, so an unchecked
 * insert there is directly visible in another tenant's deal timeline.
 */
export async function dealBelongsToUser(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  dealId: string,
  userId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('deals') as any)
    .select('id')
    .eq('id', dealId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!data
}
