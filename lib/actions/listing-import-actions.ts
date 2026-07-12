'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { processImportRunListings } from '@/lib/listings/processing'
import type { Json } from '@/types/supabase'

export type ImportActionResult = {
  ok: boolean
  message: string
}

function getSavedUrls(metadata: Json | null): string[] {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return []
  const savedUrls = metadata.savedUrls
  if (!Array.isArray(savedUrls)) return []
  return savedUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
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

  revalidatePath(`/listings/import/runs/${runId}`)

  return {
    ok: automation.automation.failedCount === 0,
    message: `Reprocessados ${automation.automation.commercialCount} imóveis comerciais: ${automation.automation.enrichedCount} enriquecidos, ${automation.automation.matchedCount} com match, ${automation.automation.failedCount} com falha.`,
  }
}
