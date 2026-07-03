import 'server-only'
import { unstable_cache } from 'next/cache'
import type { Database, Json } from '@/types/supabase'
import type { ScoreResult, CategoryBreakdown } from './schemas'

type OpportunityScoreRow = Database['public']['Tables']['opportunity_scores']['Row']
import type { SupabaseLike } from '@/lib/supabase/types'

export async function upsertScore(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  result: ScoreResult
): Promise<{ data: OpportunityScoreRow | null; error: string | null }> {
  // Step 1: Read current score_version (or 0 if not yet persisted)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('opportunity_scores') as any)
    .select('score_version')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('strategy_slug', result.strategySlug)
    .maybeSingle()

  const nextVersion = (existing?.score_version ?? 0) + 1

  // Step 2: Build payload with all category columns from migration 013
  const payload = {
    user_id: userId,
    listing_id: listingId,
    strategy_slug: result.strategySlug,
    total_score: result.totalScore,
    score_version: nextVersion,
    breakdown: result.breakdown as unknown as Json,
    signals: result.signals as unknown as Json,
    risks: result.risks as unknown as Json,
    fit_label: result.fitLabel,
    computed_at: result.computedAt,
    demographics_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'demographics')?.score ?? null,
    location_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'location_quality')?.score ?? null,
    foot_traffic_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'nearby_businesses')?.score ?? null,
    competition_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'competition')?.score ?? null,
    risk_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'risk')?.score ?? null,
    investor_fit_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'investor_fit')?.score ?? null,
    engine_version: '1.0',
  }

  // Step 3: Upsert with conflict on (user_id, listing_id, strategy_slug)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('opportunity_scores') as any)
    .upsert(payload, { onConflict: 'user_id,listing_id,strategy_slug' })
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Não foi possível salvar a pontuação.' }
  }
  return { data: data as OpportunityScoreRow, error: null }
}

export async function getScoreHistory(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug?: string
): Promise<OpportunityScoreRow[]> {
  return unstable_cache(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('opportunity_scores') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('listing_id', listingId)

      if (strategySlug) {
        query = query.eq('strategy_slug', strategySlug)
      }

      const { data } = await query.order('total_score', { ascending: false })
      return (data ?? []) as OpportunityScoreRow[]
    },
    ['opportunity_score', userId, listingId, ...(strategySlug ? [strategySlug] : [])],
    { tags: ['opportunity_score'] }
  )()
}

export async function getScore(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug: string
): Promise<OpportunityScoreRow | null> {
  return unstable_cache(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('opportunity_scores') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .eq('strategy_slug', strategySlug)
        .maybeSingle()
      return (data ?? null) as OpportunityScoreRow | null
    },
    ['opportunity_score', userId, listingId, strategySlug],
    { tags: ['opportunity_score'] }
  )()
}
