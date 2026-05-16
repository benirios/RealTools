'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createDemoLocationInsightsForListing } from '@/lib/location-intelligence/demo-seeds'
import { loadListingForUser as loadOwnedListingForUser } from '@/lib/location-intelligence/api'
import { recalculateMatchesForListing } from '@/lib/investors/match-processing'
import { enrichScoreAndMatchListing } from '@/lib/listings/processing'
import { scoreListingService } from '@/lib/scoring/service'
import { calculateStrategyFitScoresForListingService } from '@/lib/scoring/strategy-fit-service'
import type { LocationInsightActionState } from '@/lib/schemas/location-insight'

function errorState(message: string): LocationInsightActionState {
  return { errors: { general: [message] } }
}

function successState(message: string): LocationInsightActionState {
  return { message }
}

async function loadListingForUser(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, listingId: string, userId: string) {
  return loadOwnedListingForUser(supabase, userId, listingId)
}

export async function enrichListingLocationAction(listingId: string): Promise<LocationInsightActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await enrichScoreAndMatchListing(supabase, user.id, listingId, { force: true })
  if (result.error) {
    return errorState(result.error)
  }

  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/decision-surface')
  revalidatePath('/investors')
  return successState('Localização enriquecida, pontuação recalculada e matches atualizados.')
}

export async function seedDemoLocationInsightsAction(listingId: string): Promise<LocationInsightActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const listing = await loadListingForUser(supabase, listingId, user.id)
  if (!listing) return errorState('Imóvel não encontrado.')

  const result = await createDemoLocationInsightsForListing(supabase, user.id, listing)
  if (!result.ok) {
    return errorState('Não foi possível criar os dados de demonstração.')
  }

  const scoring = await scoreListingService(supabase, user.id, listingId, 'any')
  if (scoring.errors?.general?.[0]) return errorState(scoring.errors.general[0])

  const strategyFit = await calculateStrategyFitScoresForListingService(supabase, user.id, listingId)
  if (strategyFit.errors?.general?.[0]) return errorState(strategyFit.errors.general[0])

  const matching = await recalculateMatchesForListing(supabase, user.id, listingId, true)
  if (matching.error) return errorState(matching.error)

  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/decision-surface')
  revalidatePath('/investors')
  return successState('Dados de demonstração criados com sucesso.')
}

export async function recalculateListingMatchesAction(listingId: string): Promise<LocationInsightActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await recalculateMatchesForListing(supabase, user.id, listingId, true)
  if (result.error) return errorState(result.error)

  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/decision-surface')
  revalidatePath('/investors')
  return successState(`${result.matchedCount} matches recalculados para este imóvel.`)
}

export async function recalculateListingStrategyScoresAction(listingId: string): Promise<LocationInsightActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await calculateStrategyFitScoresForListingService(supabase, user.id, listingId)
  if (result.errors?.general?.[0]) return errorState(result.errors.general[0])

  const matching = await recalculateMatchesForListing(supabase, user.id, listingId, true)
  if (matching.error) return errorState(matching.error)

  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/decision-surface')
  revalidatePath('/investors')
  return successState('Scores de estratégia e matches recalculados.')
}
