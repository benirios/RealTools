import 'server-only'
import { computeScore } from './engine'
import { upsertScore } from './data'
import { getListingLocationInsight } from '@/lib/location-intelligence/insights'
import type { ScoringActionState, ScoreResult } from './schemas'
import type { Database } from '@/types/supabase'

type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

type ListingRow = Database['public']['Tables']['listings']['Row']

async function loadListingForScoring(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<ListingRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('listings') as any)
    .select('*')
    .eq('id', listingId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data ?? null) as ListingRow | null
}

export async function scoreListingService(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState & { scoreResult?: ScoreResult }> {
  // 1. Load listing (user-scoped)
  const listing = await loadListingForScoring(supabase, userId, listingId)
  if (!listing) {
    return { errors: { general: ['Imóvel não encontrado.'] } }
  }

  // 2. Load location insight (user-scoped)
  const insight = await getListingLocationInsight(supabase, userId, listingId)
  if (!insight) {
    return { errors: { general: ['Enriqueça a localização antes de calcular a pontuação.'] } }
  }

  // 3. Compute score (pure, no side effects)
  const outcome = computeScore(listing, insight, strategySlug)

  if (outcome.status === 'NEEDS_ENRICHMENT') {
    return { errors: { general: ['Enriqueça a localização antes de calcular a pontuação.'] } }
  }
  if (outcome.status === 'ENRICHMENT_FAILED') {
    return { errors: { general: ['Não foi possível calcular a pontuação. Tente novamente.'] } }
  }

  // 4. Persist score (upsert with version increment in data layer)
  const saveResult = await upsertScore(supabase, userId, listingId, outcome.result)
  if (saveResult.error) {
    return { errors: { general: ['Não foi possível salvar a pontuação.'] } }
  }

  return {
    message: 'Pontuação calculada com sucesso.',
    score: outcome.result,
    scoreResult: outcome.result,
  }
}
