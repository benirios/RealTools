import 'server-only'
import type { Database, Json } from '@/types/supabase'
import type { StrategyFitScoreResult } from './strategy-fit'

type StrategyFitScoreRow = Database['public']['Tables']['strategy_fit_scores']['Row']
import type { SupabaseLike } from '@/lib/supabase/types'

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
