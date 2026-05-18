'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { completeImportRun, failImportRun, startImportRun } from '@/lib/listings/import-runs'
import { upsertListing } from '@/lib/listings/ingestion'
import { scrapeOlxListings } from '@/lib/listings/olx'
import { processImportRunListings } from '@/lib/listings/processing'
import { recalculateMatchesForInvestor } from '@/lib/investors/match-processing'
import type { Database } from '@/types/supabase'

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>
type ClientOpportunityStatus = 'suggested' | 'saved' | 'sent' | 'interested' | 'rejected' | 'negotiating' | 'closed'
type ClientOpportunityRow = Database['public']['Tables']['client_opportunities']['Row']
type InvestorListingMatchRow = Database['public']['Tables']['investor_listing_matches']['Row']

const STATUS_VALUES = new Set<ClientOpportunityStatus>([
  'suggested',
  'saved',
  'sent',
  'interested',
  'rejected',
  'negotiating',
  'closed',
])

export type ClientSearchImportState = {
  errors?: {
    locationQuery?: string[]
    searchTerm?: string[]
    general?: string[]
  }
  message?: string
}

function parseStatus(value: FormDataEntryValue | string | null): ClientOpportunityStatus {
  const status = String(value ?? 'suggested')
  return STATUS_VALUES.has(status as ClientOpportunityStatus)
    ? status as ClientOpportunityStatus
    : 'suggested'
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro desconhecido na busca do cliente.'
}

async function getMatchScore(
  supabase: Supabase,
  userId: string,
  clientId: string,
  opportunityId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('investor_listing_matches') as any)
    .select('match_score')
    .eq('user_id', userId)
    .eq('investor_id', clientId)
    .eq('listing_id', opportunityId)
    .maybeSingle() as { data: Pick<InvestorListingMatchRow, 'match_score'> | null }

  return data?.match_score ?? null
}

async function getExistingClientOpportunity(
  supabase: Supabase,
  userId: string,
  clientId: string,
  opportunityId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('client_opportunities') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .eq('opportunity_id', opportunityId)
    .maybeSingle() as { data: ClientOpportunityRow | null }

  return data
}

async function upsertClientOpportunity(
  supabase: Supabase,
  payload: {
    user_id: string
    client_id: string
    opportunity_id: string
    status: ClientOpportunityStatus
    match_score: number | null
    notes?: string | null
    last_action_at?: string | null
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase.from('client_opportunities') as any)
    .upsert(payload, { onConflict: 'user_id,client_id,opportunity_id' })

  if (!result.error || !String(result.error.message ?? '').includes('last_action_at')) {
    return result
  }

  const fallbackPayload = { ...payload }
  delete fallbackPayload.last_action_at

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('client_opportunities') as any)
    .upsert(fallbackPayload, { onConflict: 'user_id,client_id,opportunity_id' })
}

async function syncClientOpportunitiesForMatches(
  supabase: Supabase,
  userId: string,
  clientId: string,
  listingIds?: string[]
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let matchQuery = (supabase.from('investor_listing_matches') as any)
    .select('listing_id, match_score')
    .eq('user_id', userId)
    .eq('investor_id', clientId)

  if (listingIds?.length) matchQuery = matchQuery.in('listing_id', listingIds)

  const { data: matches } = await matchQuery as { data: Array<Pick<InvestorListingMatchRow, 'listing_id' | 'match_score'>> | null }
  const rows = matches ?? []
  if (rows.length === 0) return 0

  const opportunityIds = rows.map((row) => row.listing_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('client_opportunities') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .in('opportunity_id', opportunityIds) as { data: ClientOpportunityRow[] | null }

  const existingByOpportunity = new Map((existing ?? []).map((row) => [row.opportunity_id, row]))
  const payload = rows.map((row) => {
    const current = existingByOpportunity.get(row.listing_id)

    return {
      user_id: userId,
      client_id: clientId,
      opportunity_id: row.listing_id,
      status: current?.status ?? 'suggested',
      match_score: row.match_score,
      notes: current?.notes ?? null,
      last_action_at: current?.last_action_at ?? null,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('client_opportunities') as any)
    .upsert(payload, { onConflict: 'user_id,client_id,opportunity_id' })

  return payload.length
}

export async function updateClientOpportunityStatusAction(
  clientId: string,
  opportunityId: string,
  status: ClientOpportunityStatus
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const nextStatus = parseStatus(status)
  const matchScore = await getMatchScore(supabase, user.id, clientId, opportunityId)
  const existing = await getExistingClientOpportunity(supabase, user.id, clientId, opportunityId)

  const { error } = await upsertClientOpportunity(
    supabase,
    {
      user_id: user.id,
      client_id: clientId,
      opportunity_id: opportunityId,
      status: nextStatus,
      match_score: matchScore ?? existing?.match_score ?? null,
      notes: existing?.notes ?? null,
      last_action_at: new Date().toISOString(),
    }
  )

  revalidatePath(`/investors/${clientId}`)
  revalidatePath(`/imoveis/${opportunityId}`)

  return error
    ? { ok: false, message: 'Não foi possível atualizar o status desta oportunidade.' }
    : { ok: true, message: 'Status atualizado.' }
}

export async function updateClientOpportunityNotesAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const clientId = String(formData.get('clientId') ?? '')
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const notes = String(formData.get('notes') ?? '').trim() || null
  const status = parseStatus(formData.get('status'))

  if (!clientId || !opportunityId) {
    return { ok: false, message: 'Cliente ou oportunidade ausente.' }
  }

  const matchScore = await getMatchScore(supabase, user.id, clientId, opportunityId)
  const existing = await getExistingClientOpportunity(supabase, user.id, clientId, opportunityId)

  const { error } = await upsertClientOpportunity(
    supabase,
    {
      user_id: user.id,
      client_id: clientId,
      opportunity_id: opportunityId,
      status,
      match_score: matchScore ?? existing?.match_score ?? null,
      notes,
      last_action_at: new Date().toISOString(),
    }
  )

  revalidatePath(`/investors/${clientId}`)
  revalidatePath(`/imoveis/${opportunityId}`)

  return error
    ? { ok: false, message: 'Não foi possível salvar as notas.' }
    : { ok: true, message: 'Notas salvas.' }
}

export async function removeClientOpportunityAction(
  clientId: string,
  opportunityId: string
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('client_opportunities') as any)
    .delete()
    .eq('user_id', user.id)
    .eq('client_id', clientId)
    .eq('opportunity_id', opportunityId)

  revalidatePath(`/investors/${clientId}`)
  revalidatePath(`/imoveis/${opportunityId}`)

  return error
    ? { ok: false, message: 'Não foi possível remover a oportunidade do pipeline.' }
    : { ok: true, message: 'Oportunidade removida do pipeline deste cliente.' }
}

export async function recalculateClientWorkspaceMatchesAction(clientId: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await recalculateMatchesForInvestor(supabase, user.id, clientId, true)
  if (!result.error) {
    await syncClientOpportunitiesForMatches(supabase, user.id, clientId)
  }

  revalidatePath('/investors')
  revalidatePath(`/investors/${clientId}`)

  return result.error
    ? { ok: false, message: result.error }
    : { ok: true, message: `${result.matchedCount} matches recalculados para este cliente.` }
}

export async function runClientOlxSearchImportAction(
  _prevState: ClientSearchImportState,
  formData: FormData
): Promise<ClientSearchImportState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const clientId = String(formData.get('clientId') ?? '')
  const locationQuery = String(formData.get('locationQuery') ?? '').trim()
  const searchTerm = String(formData.get('searchTerm') ?? '').trim() || 'ponto comercial'
  const state = String(formData.get('state') ?? '').trim().toUpperCase()
  const maxListingsRaw = Number(formData.get('maxListings') ?? 25)
  const maxListings = Number.isFinite(maxListingsRaw)
    ? Math.min(Math.max(Math.trunc(maxListingsRaw), 1), 50)
    : 25

  if (!clientId) return { errors: { general: ['Cliente ausente.'] } }
  if (locationQuery.length < 2) return { errors: { locationQuery: ['Informe um endereço, cidade ou região.'] } }
  if (searchTerm.length < 2) return { errors: { searchTerm: ['Informe um termo de busca.'] } }

  const { data: run, error: runError } = await startImportRun(supabase, user.id, {
    source: 'olx',
    metadata: {
      importType: 'client_workspace_search',
      clientId,
      locationQuery,
      state,
      searchTerm,
      maxListings,
    },
  })

  if (runError || !run) return { errors: { general: ['Não foi possível iniciar a busca do cliente.'] } }

  try {
    const listings = await scrapeOlxListings({
      searchTerm,
      region: locationQuery,
      city: locationQuery,
      state: state || undefined,
      maxListings,
    })

    let savedCount = 0
    let failedCount = 0
    const failures: string[] = []
    const savedUrls: string[] = []

    for (const listing of listings) {
      const { error } = await upsertListing(supabase, user.id, listing)
      if (error) {
        failedCount += 1
        failures.push(`${listing.sourceUrl}: ${error.message ?? 'falha ao salvar'}`)
      } else {
        savedCount += 1
        savedUrls.push(listing.sourceUrl)
      }
    }

    await completeImportRun(
      supabase,
      run.id,
      user.id,
      {
        createdCount: savedCount,
        updatedCount: 0,
        skippedCount: 0,
        failedCount,
      },
      {
        source: 'olx',
        importType: 'client_workspace_search',
        clientId,
        locationQuery,
        state,
        searchTerm,
        successfulUpserts: savedCount,
        savedUrls,
        failures: failures.slice(0, 10),
      }
    )

    const automation = await processImportRunListings(supabase, user.id, run.id, savedUrls)

    const savedListings = savedUrls.length > 0
      ? await (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('listings') as any)
          .select('id')
          .eq('user_id', user.id)
          .in('source_url', savedUrls) as { data: Array<{ id: string }> | null }
        return data ?? []
      })()
      : []

    const listingIds = savedListings.map((listing) => listing.id)
    await recalculateMatchesForInvestor(supabase, user.id, clientId, true)
    const syncedCount = await syncClientOpportunitiesForMatches(supabase, user.id, clientId, listingIds)

    revalidatePath('/listings/import')
    revalidatePath('/imoveis')
    revalidatePath('/investors')
    revalidatePath(`/investors/${clientId}`)
    revalidatePath(`/listings/import/runs/${run.id}`)

    return {
      message: `${savedCount} oportunidades globais salvas, ${failedCount} falharam. ${automation.automation.enrichedCount} enriquecidas; ${syncedCount} ligadas a este cliente.`,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    await failImportRun(supabase, run.id, user.id, message, {
      source: 'olx',
      importType: 'client_workspace_search',
      clientId,
      locationQuery,
      state,
      searchTerm,
    })
    revalidatePath(`/investors/${clientId}`)
    return { errors: { general: [message] } }
  }
}
