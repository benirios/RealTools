import type { Database, Json } from '@/types/supabase'
import type { ListingSource } from '@/lib/schemas/listing'

type ImportRunRow = Database['public']['Tables']['listing_import_runs']['Row']
type ImportRunInsert = Database['public']['Tables']['listing_import_runs']['Insert']
type ImportRunUpdate = Database['public']['Tables']['listing_import_runs']['Update']
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (relation: string) => any }

type StartImportRunInput = {
  source: ListingSource
  targetId?: string | null
  metadata?: Json
}

type ImportRunCounts = {
  createdCount?: number
  updatedCount?: number
  skippedCount?: number
  failedCount?: number
}

export async function startImportRun(
  supabase: SupabaseLike,
  userId: string,
  input: StartImportRunInput
): Promise<{ data: ImportRunRow | null; error: unknown }> {
  const insertData: ImportRunInsert = {
    user_id:   userId,
    source:    input.source,
    target_id: input.targetId ?? null,
    metadata:  input.metadata ?? {},
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('listing_import_runs') as any)
    .insert(insertData)
    .select('*')
    .single()
}

export async function completeImportRun(
  supabase: SupabaseLike,
  runId: string,
  userId: string,
  counts: ImportRunCounts,
  metadata?: Json
) {
  const failedCount = counts.failedCount ?? 0
  const updateData: ImportRunUpdate = {
    status:        failedCount > 0 ? 'partial' : 'completed',
    created_count: counts.createdCount ?? 0,
    updated_count: counts.updatedCount ?? 0,
    skipped_count: counts.skippedCount ?? 0,
    failed_count:  failedCount,
    metadata,
    completed_at:  new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('listing_import_runs') as any)
    .update(updateData)
    .eq('id', runId)
    .eq('user_id', userId)
}

export async function failImportRun(
  supabase: SupabaseLike,
  runId: string,
  userId: string,
  errorMessage: string,
  metadata?: Json
) {
  const updateData: ImportRunUpdate = {
    status:        'failed',
    error_message: errorMessage,
    metadata,
    completed_at:  new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('listing_import_runs') as any)
    .update(updateData)
    .eq('id', runId)
    .eq('user_id', userId)
}
