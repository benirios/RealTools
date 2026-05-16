'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const insertData: DealFileInsert = {
    deal_id:      dealId,
    user_id:      user.id,
    file_name:    fileName,
    storage_path: storagePath,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deal_files') as any).insert(insertData)

  if (error) return { error: 'Failed to save file record. Please try again.' }

  try {
    const serviceClient = createSupabaseServiceClient()
    // Best-effort telemetry: primary file record creation has already succeeded.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient.from('activities') as any).insert({
      deal_id: dealId,
      event_type: 'file_uploaded',
      metadata: {
        file_name: fileName,
      },
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
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Remove from Storage first (best-effort — Storage RLS also enforces user_id prefix)
  await supabase.storage.from('deal-files').remove([storagePath])

  // Delete DB record — scoped to user_id for IDOR protection (threat T-03-02)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deal_files') as any)
    .delete()
    .eq('id', fileId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to delete. Please try again.' }

  revalidatePath(`/deals/${dealId}`)
  return {}
}
