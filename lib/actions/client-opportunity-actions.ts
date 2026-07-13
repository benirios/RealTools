'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { completeImportRun, failImportRun, startImportRun } from '@/lib/listings/import-runs'
import { upsertListing, upsertListingImportTarget } from '@/lib/listings/ingestion'
import { scrapeOlxListings } from '@/lib/listings/olx'
import { processImportRunListings } from '@/lib/listings/processing'
import { recalculateMatchesForInvestor } from '@/lib/investors/match-processing'
import { ListingImportTargetSchema } from '@/lib/schemas/listing'
import type { Database } from '@/types/supabase'

type Supabase = ReturnType<typeof createSupabaseServiceClient>
type ClientOpportunityStatus = 'suggested' | 'saved' | 'sent' | 'interested' | 'rejected' | 'negotiating' | 'closed'
type ClientOpportunityRow = Database['public']['Tables']['client_opportunities']['Row']
type InvestorListingMatchRow = Database['public']['Tables']['investor_listing_matches']['Row']

export type ImportActionResult = {
  ok: boolean
  message: string
}

export type CreateImportTargetState = {
  errors?: {
    state?: string[]
    city?: string[]
    searchTerm?: string[]
    general?: string[]
  }
  message?: string
}

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
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const nextStatus = parseStatus(status)
  const matchScore = await getMatchScore(supabase, userId, clientId, opportunityId)
  const existing = await getExistingClientOpportunity(supabase, userId, clientId, opportunityId)

  const { error } = await upsertClientOpportunity(
    supabase,
    {
      user_id: userId,
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

// Called after a successful OM send. Only advances suggested/saved -> sent —
// never overwrites interested/negotiating/closed/rejected with a re-send.
export async function markClientOpportunitySentAction(clientId: string, opportunityId: string): Promise<void> {
  const { userId } = await auth()
  if (!userId) return

  const supabase = createSupabaseServiceClient()
  const existing = await getExistingClientOpportunity(supabase, userId, clientId, opportunityId)
  if (existing && existing.status !== 'suggested' && existing.status !== 'saved') return

  const matchScore = await getMatchScore(supabase, userId, clientId, opportunityId)

  await upsertClientOpportunity(supabase, {
    user_id: userId,
    client_id: clientId,
    opportunity_id: opportunityId,
    status: 'sent',
    match_score: matchScore ?? existing?.match_score ?? null,
    notes: existing?.notes ?? null,
    last_action_at: new Date().toISOString(),
  })

  revalidatePath(`/investors/${clientId}`)
  revalidatePath(`/imoveis/${opportunityId}`)
}

export async function updateClientOpportunityNotesAction(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const clientId = String(formData.get('clientId') ?? '')
  const opportunityId = String(formData.get('opportunityId') ?? '')
  const notes = String(formData.get('notes') ?? '').trim() || null
  const status = parseStatus(formData.get('status'))

  if (!clientId || !opportunityId) {
    return { ok: false, message: 'Cliente ou oportunidade ausente.' }
  }

  const supabase = createSupabaseServiceClient()
  const matchScore = await getMatchScore(supabase, userId, clientId, opportunityId)
  const existing = await getExistingClientOpportunity(supabase, userId, clientId, opportunityId)

  const { error } = await upsertClientOpportunity(
    supabase,
    {
      user_id: userId,
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
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('client_opportunities') as any)
    .delete()
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .eq('opportunity_id', opportunityId)

  revalidatePath(`/investors/${clientId}`)
  revalidatePath(`/imoveis/${opportunityId}`)

  return error
    ? { ok: false, message: 'Não foi possível remover a oportunidade do pipeline.' }
    : { ok: true, message: 'Oportunidade removida do pipeline deste cliente.' }
}

export async function recalculateClientWorkspaceMatchesAction(clientId: string): Promise<{ ok: boolean; message: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const result = await recalculateMatchesForInvestor(supabase, userId, clientId, true)
  if (!result.error) {
    await syncClientOpportunitiesForMatches(supabase, userId, clientId)
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
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

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

  const supabase = createSupabaseServiceClient()
  const { data: run, error: runError } = await startImportRun(supabase, userId, {
    source: 'olx',
    investorId: clientId,
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
      const { error } = await upsertListing(supabase, userId, listing, clientId)
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
      userId,
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

    const automation = await processImportRunListings(supabase, userId, run.id, savedUrls)

    const savedListings = savedUrls.length > 0
      ? await (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from('listings') as any)
          .select('id')
          .eq('user_id', userId)
          .in('source_url', savedUrls) as { data: Array<{ id: string }> | null }
        return data ?? []
      })()
      : []

    const listingIds = savedListings.map((listing) => listing.id)
    await recalculateMatchesForInvestor(supabase, userId, clientId, true)
    const syncedCount = await syncClientOpportunitiesForMatches(supabase, userId, clientId, listingIds)

    revalidatePath('/investors')
    revalidatePath(`/investors/${clientId}`)
    revalidatePath(`/listings/import/runs/${run.id}`)

    return {
      message: `${savedCount} imóveis salvos no pipeline do cliente, ${failedCount} falharam. ${automation.automation.enrichedCount} enriquecidos; ${syncedCount} ligados a este cliente.`,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    await failImportRun(supabase, run.id, userId, message, {
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

export async function createClientImportTargetAction(
  _prevState: CreateImportTargetState,
  formData: FormData
): Promise<CreateImportTargetState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const clientId = String(formData.get('clientId') ?? '')
  if (!clientId) return { errors: { general: ['Cliente ausente.'] } }

  const parsed = ListingImportTargetSchema.safeParse({
    source: String(formData.get('source') ?? 'olx'),
    country: String(formData.get('country') ?? 'BR').trim() || 'BR',
    state: String(formData.get('state') ?? '').trim().toUpperCase(),
    city: String(formData.get('city') ?? '').trim(),
    searchTerm: String(formData.get('searchTerm') ?? '').trim(),
    isActive: true,
  })

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return {
      errors: {
        state: fieldErrors.state,
        city: fieldErrors.city,
        searchTerm: fieldErrors.searchTerm,
      },
    }
  }

  const supabase = createSupabaseServiceClient()
  const { error } = await upsertListingImportTarget(supabase, userId, parsed.data, clientId)

  if (error) return { errors: { general: ['Não foi possível salvar o alvo de importação.'] } }

  revalidatePath(`/investors/${clientId}`)
  return { message: 'Alvo de importação criado.' }
}

export async function deleteClientImportTargetAction(clientId: string, targetId: string): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listing_import_targets') as any)
    .delete()
    .eq('id', targetId)
    .eq('user_id', userId)
    .eq('investor_id', clientId)

  if (error) return { ok: false, message: 'Falha ao remover o alvo de importação.' }

  revalidatePath(`/investors/${clientId}`)
  return { ok: true, message: 'Alvo de importação removido.' }
}

export async function toggleClientImportTargetAction(
  clientId: string,
  targetId: string,
  nextActive: boolean
): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listing_import_targets') as any)
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq('id', targetId)
    .eq('user_id', userId)
    .eq('investor_id', clientId)

  if (error) return { ok: false, message: 'Falha ao atualizar o alvo de importação.' }

  revalidatePath(`/investors/${clientId}`)
  return { ok: true, message: nextActive ? 'Alvo ativado.' : 'Alvo desativado.' }
}

export async function runClientImportTargetAction(clientId: string, targetId: string): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: target } = await (supabase.from('listing_import_targets') as any)
    .select('*')
    .eq('id', targetId)
    .eq('user_id', userId)
    .eq('investor_id', clientId)
    .eq('source', 'olx')
    .eq('is_active', true)
    .single()

  if (!target) return { ok: false, message: 'Alvo de importação não encontrado ou inativo.' }

  const { data: run, error: runError } = await startImportRun(supabase, userId, {
    source: 'olx',
    targetId: target.id,
    investorId: clientId,
    metadata: { clientId, state: target.state, city: target.city, searchTerm: target.search_term },
  })

  if (runError || !run) return { ok: false, message: 'Não foi possível iniciar a importação.' }

  try {
    const listings = await scrapeOlxListings({ state: target.state, city: target.city, searchTerm: target.search_term, maxListings: 25 })

    let createdCount = 0
    let failedCount = 0
    const failures: string[] = []
    const savedUrls: string[] = []

    for (const listing of listings) {
      const { error } = await upsertListing(supabase, userId, listing, clientId)
      if (error) { failedCount += 1; failures.push(`${listing.sourceUrl}: ${error.message ?? 'falha ao salvar'}`) }
      else { createdCount += 1; savedUrls.push(listing.sourceUrl) }
    }

    await completeImportRun(supabase, run.id, userId,
      { createdCount, updatedCount: 0, skippedCount: 0, failedCount },
      { targetId: target.id, clientId, source: 'olx', successfulUpserts: createdCount, savedUrls, failures: failures.slice(0, 10) }
    )

    const automation = await processImportRunListings(supabase, userId, run.id, savedUrls)
    await recalculateMatchesForInvestor(supabase, userId, clientId, true)

    revalidatePath(`/investors/${clientId}`)
    return {
      ok: failedCount === 0,
      message: `${createdCount} salvos, ${failedCount} falharam. ${automation.automation.enrichedCount} enriquecidos.`,
    }
  } catch (error) {
    const message = getErrorMessage(error)
    await failImportRun(supabase, run.id, userId, message, { targetId: target.id, clientId, source: 'olx' })
    revalidatePath(`/investors/${clientId}`)
    return { ok: false, message }
  }
}

export async function shareListingWithInvestorAction(listingId: string, investorId: string): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingMatch } = await (supabase.from('investor_listing_matches') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('investor_id', investorId)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (existingMatch) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('investor_listing_matches') as any)
      .update({ is_manual_share: true })
      .eq('id', existingMatch.id)

    if (error) return { ok: false, message: 'Falha ao compartilhar o imóvel.' }
  } else {
    // No algorithmic match row yet (listing hasn't been scored for this
    // investor) — compute one now so the share carries a real compatibility
    // score instead of an empty row.
    await recalculateMatchesForInvestor(supabase, userId, investorId, true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('investor_listing_matches') as any)
      .update({ is_manual_share: true })
      .eq('user_id', userId)
      .eq('investor_id', investorId)
      .eq('listing_id', listingId)

    if (error) return { ok: false, message: 'Falha ao compartilhar o imóvel.' }
  }

  revalidatePath(`/investors/${investorId}`)
  revalidatePath(`/imoveis/${listingId}`)
  return { ok: true, message: 'Imóvel compartilhado com o cliente.' }
}
