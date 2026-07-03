'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { completeImportRun, failImportRun, startImportRun } from '@/lib/listings/import-runs'
import { upsertListing, upsertListingImportTarget } from '@/lib/listings/ingestion'
import { scrapeOlxListings } from '@/lib/listings/olx'
import { DEFAULT_LISTING_IMPORT_TARGETS } from '@/lib/listings/constants'
import { processImportRunListings } from '@/lib/listings/processing'
import { ListingImportTargetSchema } from '@/lib/schemas/listing'
import type { Database, Json } from '@/types/supabase'

type ListingImportTargetRow = Database['public']['Tables']['listing_import_targets']['Row']

export type ImportActionResult = {
  ok: boolean
  message: string
}

export type OlxSearchImportState = {
  errors?: {
    locationQuery?: string[]
    searchTerm?: string[]
    general?: string[]
  }
  message?: string
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erro desconhecido na importação'
}

function getSavedUrls(metadata: Json | null): string[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return []
  const savedUrls = metadata.savedUrls
  if (!Array.isArray(savedUrls)) return []
  return savedUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
}

export async function runOlxSearchImportAction(
  _prevState: OlxSearchImportState,
  formData: FormData
): Promise<OlxSearchImportState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const locationQuery = String(formData.get('locationQuery') ?? '').trim()
  const searchTerm = String(formData.get('searchTerm') ?? '').trim() || 'ponto comercial'
  const state = String(formData.get('state') ?? '').trim().toUpperCase()
  const maxListingsRaw = Number(formData.get('maxListings') ?? 25)
  const maxListings = Number.isFinite(maxListingsRaw)
    ? Math.min(Math.max(Math.trunc(maxListingsRaw), 1), 50)
    : 25

  if (locationQuery.length < 2) return { errors: { locationQuery: ['Informe um endereço, cidade ou região.'] } }
  if (searchTerm.length < 2) return { errors: { searchTerm: ['Informe um termo de busca.'] } }

  const supabase = createSupabaseServiceClient()
  const { data: run, error: runError } = await startImportRun(supabase, userId, {
    source: 'olx',
    metadata: { importType: 'on_demand_search', locationQuery, state, searchTerm, maxListings },
  })

  if (runError || !run) {
    const msg = runError instanceof Error ? runError.message : (runError as { message?: string })?.message ?? JSON.stringify(runError)
    console.error('[startImportRun] failed:', msg)
    return { errors: { general: [`Não foi possível iniciar a importação: ${msg}`] } }
  }

  try {
    const listings = await scrapeOlxListings({ searchTerm, region: locationQuery, city: locationQuery, state: state || undefined, maxListings })

    let createdCount = 0
    let failedCount = 0
    const failures: string[] = []
    const savedUrls: string[] = []

    for (const listing of listings) {
      const { error } = await upsertListing(supabase, userId, listing)
      if (error) { failedCount += 1; failures.push(`${listing.sourceUrl}: ${error.message ?? 'falha ao salvar'}`) }
      else { createdCount += 1; savedUrls.push(listing.sourceUrl) }
    }

    await completeImportRun(supabase, run.id, userId,
      { createdCount, updatedCount: 0, skippedCount: 0, failedCount },
      { source: 'olx', importType: 'on_demand_search', locationQuery, state, searchTerm, successfulUpserts: createdCount, savedUrls, failures: failures.slice(0, 10) }
    )

    const automation = await processImportRunListings(supabase, userId, run.id, savedUrls)

    revalidatePath('/listings/import')
    revalidatePath('/imoveis')
    revalidatePath(`/listings/import/runs/${run.id}`)
    return { message: `OLX search finished: ${createdCount} saved, ${failedCount} failed. Automation: ${automation.automation.enrichedCount} enriched, ${automation.automation.matchedCount} matched.` }
  } catch (error) {
    const message = getErrorMessage(error)
    await failImportRun(supabase, run.id, userId, message, { source: 'olx', importType: 'on_demand_search', locationQuery, state, searchTerm })
    revalidatePath('/listings/import')
    return { errors: { general: [message] } }
  }
}

export async function runOlxImportAction(targetId: string): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: target } = await (supabase.from('listing_import_targets') as any)
    .select('*')
    .eq('id', targetId)
    .eq('user_id', userId)
    .eq('source', 'olx')
    .eq('is_active', true)
    .single() as { data: ListingImportTargetRow | null }

  if (!target) return { ok: false, message: 'Alvo de importação não encontrado ou inativo.' }

  const { data: run, error: runError } = await startImportRun(supabase, userId, {
    source: 'olx',
    targetId: target.id,
    metadata: { state: target.state, city: target.city, searchTerm: target.search_term },
  })

  if (runError || !run) {
    const msg = runError instanceof Error ? runError.message : (runError as { message?: string })?.message ?? JSON.stringify(runError)
    console.error('[startImportRun target] failed:', msg)
    return { ok: false, message: `Não foi possível iniciar a importação: ${msg}` }
  }

  try {
    const listings = await scrapeOlxListings({ state: target.state, city: target.city, searchTerm: target.search_term, maxListings: 25 })

    let createdCount = 0
    let failedCount = 0
    const failures: string[] = []
    const savedUrls: string[] = []

    for (const listing of listings) {
      const { error } = await upsertListing(supabase, userId, listing)
      if (error) { failedCount += 1; failures.push(`${listing.sourceUrl}: ${error.message ?? 'falha ao salvar'}`) }
      else { createdCount += 1; savedUrls.push(listing.sourceUrl) }
    }

    await completeImportRun(supabase, run.id, userId,
      { createdCount, updatedCount: 0, skippedCount: 0, failedCount },
      { targetId: target.id, source: 'olx', successfulUpserts: createdCount, savedUrls, failures: failures.slice(0, 10) }
    )

    const automation = await processImportRunListings(supabase, userId, run.id, savedUrls)

    revalidatePath('/listings/import')
    revalidatePath('/imoveis')
    revalidatePath(`/listings/import/runs/${run.id}`)
    return { ok: failedCount === 0, message: `OLX import finished: ${createdCount} saved, ${failedCount} failed. Automation: ${automation.automation.enrichedCount} enriched, ${automation.automation.matchedCount} matched.` }
  } catch (error) {
    const message = getErrorMessage(error)
    await failImportRun(supabase, run.id, userId, message, { targetId: target.id, source: 'olx' })
    revalidatePath('/listings/import')
    return { ok: false, message }
  }
}

export async function reenrichImportRunAction(runId: string): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: run } = await (supabase.from('listing_import_runs') as any)
    .select('id, metadata')
    .eq('id', runId)
    .eq('user_id', userId)
    .single()

  if (!run) return { ok: false, message: 'Execução de importação não encontrada.' }

  const savedUrls = getSavedUrls(run.metadata)
  if (savedUrls.length === 0) return { ok: false, message: 'Esta importação não tem imóveis salvos para reprocessar.' }

  const automation = await processImportRunListings(supabase, userId, runId, savedUrls, { force: true })

  revalidatePath('/listings/import')
  revalidatePath('/imoveis')
  revalidatePath(`/listings/import/runs/${runId}`)

  return {
    ok: automation.automation.failedCount === 0,
    message: `Reprocessados ${automation.automation.commercialCount} imóveis comerciais: ${automation.automation.enrichedCount} enriquecidos, ${automation.automation.matchedCount} com match, ${automation.automation.failedCount} com falha.`,
  }
}

export async function clearImportRunsAction(): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listing_import_runs') as any)
    .delete()
    .eq('user_id', userId)

  revalidatePath('/listings/import')
  return error
    ? { ok: false, message: 'Falha ao limpar execuções.' }
    : { ok: true, message: 'Execuções limpas.' }
}

export async function seedDefaultImportTargetsAction(): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  let saved = 0

  for (const target of DEFAULT_LISTING_IMPORT_TARGETS) {
    const { error } = await upsertListingImportTarget(supabase, userId, target)
    if (!error) saved += 1
  }

  revalidatePath('/listings/import')
  return {
    ok: saved > 0,
    message: saved > 0 ? `${saved} alvos padrão prontos.` : 'Nenhum alvo padrão foi salvo.',
  }
}

export async function createImportTargetAction(
  _prevState: CreateImportTargetState,
  formData: FormData
): Promise<CreateImportTargetState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

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
  const { error } = await upsertListingImportTarget(supabase, userId, parsed.data)

  if (error) {
    return { errors: { general: ['Não foi possível salvar o alvo de importação.'] } }
  }

  revalidatePath('/listings/import')
  return { message: 'Alvo de importação criado.' }
}

export async function deleteImportTargetAction(targetId: string): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listing_import_targets') as any)
    .delete()
    .eq('id', targetId)
    .eq('user_id', userId)

  if (error) return { ok: false, message: 'Falha ao remover o alvo de importação.' }

  revalidatePath('/listings/import')
  return { ok: true, message: 'Alvo de importação removido.' }
}

export async function toggleImportTargetAction(targetId: string, nextActive: boolean): Promise<ImportActionResult> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listing_import_targets') as any)
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq('id', targetId)
    .eq('user_id', userId)

  if (error) return { ok: false, message: 'Falha ao atualizar o alvo de importação.' }

  revalidatePath('/listings/import')
  return { ok: true, message: nextActive ? 'Alvo ativado.' : 'Alvo desativado.' }
}
