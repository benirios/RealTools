import 'server-only'
import { unstable_cache } from 'next/cache'
import type { Database, Json } from '@/types/supabase'
import type { ScoreResult, CategoryBreakdown } from './schemas'
import type { StrategyFitScoreResult } from './strategy-fit'

type OpportunityScoreRow = Database['public']['Tables']['opportunity_scores']['Row']
type StrategyFitScoreRow = Database['public']['Tables']['strategy_fit_scores']['Row']
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

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

export async function upsertStrategyFitScore(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  result: StrategyFitScoreResult,
  inputDataHash: string
): Promise<{ data: StrategyFitScoreRow | null; error: string | null }> {
  const payload = {
    user_id: userId,
    listing_id: listingId,
    strategy: result.strategy,
    score: result.score,
    confidence: result.confidence,
    breakdown: result.breakdown as unknown as Json,
    strengths: result.strengths as unknown as Json,
    weaknesses: result.weaknesses as unknown as Json,
    best_fit_reasons: result.best_fit_reasons as unknown as Json,
    missing_data: result.missing_data as unknown as Json,
    input_data_hash: inputDataHash,
    generated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('strategy_fit_scores') as any)
    .upsert(payload, { onConflict: 'user_id,listing_id,strategy' })
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Não foi possível salvar o score de estratégia.' }
  }

  return { data: data as StrategyFitScoreRow, error: null }
}

export async function getStrategyFitScores(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategy?: string
): Promise<StrategyFitScoreRow[]> {
  return unstable_cache(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('strategy_fit_scores') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('listing_id', listingId)

      if (strategy) query = query.eq('strategy', strategy)

      const { data, error } = await query.order('score', { ascending: false })
      if (error) return []
      return (data ?? []) as StrategyFitScoreRow[]
    },
    ['strategy_fit_score', userId, listingId, ...(strategy ? [strategy] : [])],
    { tags: ['strategy_fit_score'] }
  )()
}
