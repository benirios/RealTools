'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { Database } from '@/types/supabase'

type DealFileInsert = Database['public']['Tables']['deal_files']['Insert']

export async function insertDealFileAction({
  dealId,
  storagePath,
  fileName,
}: {
  dealId: string
  storagePath: string
  fileName: string
}): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const insertData: DealFileInsert = {
    deal_id:      dealId,
    user_id:      userId,
    file_name:    fileName,
    storage_path: storagePath,
  }

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deal_files') as any).insert(insertData)

  if (error) return { error: 'Não foi possível salvar o registro do arquivo. Tente novamente.' }

  try {
    // Best-effort telemetry: primary file record creation has already succeeded.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('activities') as any).insert({
      deal_id: dealId,
      event_type: 'file_uploaded',
      metadata: { file_name: fileName },
    })
  } catch {
    // Do not block file creation on telemetry failure.
  }

  revalidatePath(`/deals/${dealId}`)
  return {}
}

export async function deleteDealFileAction({
  fileId,
  storagePath,
  dealId,
}: {
  fileId: string
  storagePath: string
  dealId: string
}): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  await supabase.storage.from('deal-files').remove([storagePath])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deal_files') as any)
    .delete()
    .eq('id', fileId)
    .eq('user_id', userId)

  if (error) return { error: 'Não foi possível excluir. Tente novamente.' }

  revalidatePath(`/deals/${dealId}`)
  return {}
}
