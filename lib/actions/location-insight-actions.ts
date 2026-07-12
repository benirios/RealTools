'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { createDemoLocationInsightsForListing } from '@/lib/location-intelligence/demo-seeds'
import { loadListingForUser } from '@/lib/location-intelligence/api'
import { recalculateMatchesForListing } from '@/lib/investors/match-processing'
import { enrichScoreAndMatchListing } from '@/lib/listings/processing'
import { scoreListingService } from '@/lib/scoring/service'
import type { LocationInsightActionState } from '@/lib/schemas/location-insight'

function errorState(message: string): LocationInsightActionState {
  return { errors: { general: [message] } }
}

function successState(message: string): LocationInsightActionState {
  return { message }
}

export async function enrichListingLocationAction(listingId: string): Promise<LocationInsightActionState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const result = await enrichScoreAndMatchListing(supabase, userId, listingId, { force: true })
  if (result.error) return errorState(result.error)

  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/investors')
  return successState('Localização enriquecida, pontuação recalculada e matches atualizados.')
}

export async function seedDemoLocationInsightsAction(listingId: string): Promise<LocationInsightActionState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const listing = await loadListingForUser(supabase, userId, listingId)
  if (!listing) return errorState('Imóvel não encontrado.')

  const result = await createDemoLocationInsightsForListing(supabase, userId, listing)
  if (!result.ok) return errorState('Não foi possível criar os dados de demonstração.')

  const scoring = await scoreListingService(supabase, userId, listingId, 'any')
  if (scoring.errors?.general?.[0]) return errorState(scoring.errors.general[0])

  const matching = await recalculateMatchesForListing(supabase, userId, listingId, true)
  if (matching.error) return errorState(matching.error)

  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/investors')
  return successState('Dados de demonstração criados com sucesso.')
}

export async function recalculateListingMatchesAction(listingId: string): Promise<LocationInsightActionState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const result = await recalculateMatchesForListing(supabase, userId, listingId, true)
  if (result.error) return errorState(result.error)

  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/investors')
  return successState(`${result.matchedCount} matches recalculados para este imóvel.`)
}
