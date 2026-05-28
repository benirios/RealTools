import 'server-only'
import { hashInputs } from '@/lib/hash'
import { revalidateTag } from 'next/cache'
import { getListingLocationInsight } from '@/lib/location-intelligence/insights'
import { calculateStrategyFitScore, STRATEGY_FIT_SLUGS, type StrategyFitScoreResult, type StrategyFitSlug } from './strategy-fit'
import { upsertStrategyFitScore } from './strategy-fit-data'
import type { Database } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']
import type { SupabaseLike } from '@/lib/supabase/types'

type StrategyFitActionState = {
  message?: string
  scores?: StrategyFitScoreResult[]
  errors?: { general?: string[] }
}

async function loadListingForStrategyFit(
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



export async function calculateStrategyFitScoresForListingService(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategies: readonly StrategyFitSlug[] = STRATEGY_FIT_SLUGS
): Promise<StrategyFitActionState> {
  const listing = await loadListingForStrategyFit(supabase, userId, listingId)
  if (!listing) return { errors: { general: ['Imóvel não encontrado.'] } }

  const insight = await getListingLocationInsight(supabase, userId, listingId)
  if (!insight) return { errors: { general: ['Enriqueça a localização antes de calcular fit por estratégia.'] } }

  const scores: StrategyFitScoreResult[] = []
  const inputDataHash = hashInputs({
    listing: {
      id: listing.id,
      updated_at: listing.updated_at,
      price_amount: listing.price_amount,
      property_type: listing.property_type,
      commercial_type: listing.commercial_type,
      tags: listing.tags,
      title: listing.title,
      description: listing.description,
      lat: listing.lat,
      lng: listing.lng,
    },
    insight: {
      id: insight.id,
      updatedAt: insight.updatedAt,
      avgIncome: insight.avgIncome,
      populationDensity: insight.populationDensity,
      nearbyBusinesses: insight.nearbyBusinesses,
      confidenceScore: insight.confidenceScore,
      latitude: insight.latitude,
      longitude: insight.longitude,
    },
  })

  for (const strategy of strategies) {
    const result = calculateStrategyFitScore({ listing, location_insight: insight }, strategy)
    const save = await upsertStrategyFitScore(supabase, userId, listingId, result, inputDataHash)
    if (save.error) return { errors: { general: [save.error] } }
    scores.push(result)
  }

  revalidateTag('strategy_fit_score')

  return {
    message: `${scores.length} scores de estratégia recalculados.`,
    scores,
  }
}
