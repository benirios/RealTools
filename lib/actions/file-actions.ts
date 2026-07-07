'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { dealBelongsToUser } from '@/lib/actions/deal-ownership'
import type { Database } from '@/types/supabase'

type DealFileInsert = Database['public']['Tables']['deal_files']['Insert']

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
])
const MAX_FILE_BYTES = 50 * 1024 * 1024

/**
 * Uploads a deal file to Storage and records it. Runs entirely server-side
 * via the service-role client because Storage RLS on `deal-files` still
 * checks auth.uid()/auth.role()='authenticated' (migration 004, pre-Clerk) —
 * the browser's Supabase client has no Supabase Auth session under Clerk, so
 * a direct browser->Storage upload always 403s. Clerk's auth() replaces that
 * check here instead.
 */
export async function uploadDealFileAction(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const dealId = formData.get('deal_id')
  const file = formData.get('file')
  if (typeof dealId !== 'string' || !dealId || !(file instanceof File)) {
    return { error: 'Requisição inválida.' }
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return { error: 'Tipo de arquivo não permitido. Use PDF, Word, Excel, PowerPoint ou imagem.' }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: 'Arquivo muito grande. Máximo de 50MB.' }
  }

  const supabase = createSupabaseServiceClient()

  if (!(await dealBelongsToUser(supabase, dealId, userId))) {
    return { error: 'Negócio não encontrado.' }
  }

  // Path convention required by the (still-enforced) Storage RLS policy:
  // {user_id}/{deal_id}/{timestamp}-{filename}.
  const storagePath = `${userId}/${dealId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('deal-files')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: 'Falha ao enviar arquivo.' }

  const insertData: DealFileInsert = {
    deal_id:      dealId,
    user_id:      userId,
    file_name:    file.name,
    storage_path: storagePath,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deal_files') as any).insert(insertData)

  if (error) return { error: 'Não foi possível salvar o registro do arquivo. Tente novamente.' }

  try {
    // Best-effort telemetry: primary file record creation has already succeeded.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activities') as any).insert({
      deal_id: dealId,
      event_type: 'file_uploaded',
      metadata: { file_name: file.name },
    })
  } catch {
    // Do not block file creation on telemetry failure.
  }

  revalidatePath(`/deals/${dealId}`)
  return {}
}

export async function deleteDealFileAction({
  fileId,
  dealId,
}: {
  fileId: string
  dealId: string
}): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()

  // Look up the storage path ourselves, scoped to this user — never trust a
  // client-supplied path, or a caller could pass an arbitrary path and delete
  // another tenant's object directly (the service-role client bypasses
  // Storage RLS, so this ownership check is the only gate).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fileRow } = await (supabase.from('deal_files') as any)
    .select('storage_path')
    .eq('id', fileId)
    .eq('user_id', userId)
    .maybeSingle() as { data: { storage_path: string } | null }

  if (!fileRow) return { error: 'Arquivo não encontrado.' }

  await supabase.storage.from('deal-files').remove([fileRow.storage_path])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deal_files') as any)
    .delete()
    .eq('id', fileId)
    .eq('user_id', userId)

  if (error) return { error: 'Não foi possível excluir. Tente novamente.' }

  revalidatePath(`/deals/${dealId}`)
  return {}
}
