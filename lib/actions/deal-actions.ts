'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { DealSchema, type DealState } from '@/lib/schemas/deal'
import type { Database } from '@/types/supabase'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type DealInsert = Database['public']['Tables']['deals']['Insert']
type DealUpdate = Database['public']['Tables']['deals']['Update']
type DealFileRow = Database['public']['Tables']['deal_files']['Row']

export async function createDealAction(
  _prevState: DealState,
  formData: FormData
): Promise<DealState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const parsed = DealSchema.safeParse({
    title:       formData.get('title'),
    address:     formData.get('address'),
    price:       formData.get('price'),
    status:      formData.get('status') ?? 'active',
    description: formData.get('description') ?? undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const insertData: DealInsert = {
    ...parsed.data,
    user_id: userId,
  }

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deals') as any).insert(insertData)

  if (error) return { errors: { general: ['Não foi possível salvar o negócio. Tente novamente.'] } }

  revalidatePath('/dashboard')
  return {}
}

export async function updateDealAction(
  _prevState: DealState,
  formData: FormData
): Promise<DealState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const dealId = formData.get('dealId') as string
  if (!dealId || !UUID_RE.test(dealId)) return { errors: { general: ['ID do negócio inválido.'] } }

  const parsed = DealSchema.safeParse({
    title:       formData.get('title'),
    address:     formData.get('address'),
    price:       formData.get('price'),
    status:      formData.get('status') ?? 'active',
    description: formData.get('description') ?? undefined,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const updateData: DealUpdate = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deals') as any)
    .update(updateData)
    .eq('id', dealId)
    .eq('user_id', userId)

  if (error) return { errors: { general: ['Não foi possível salvar o negócio. Tente novamente.'] } }

  revalidatePath('/dashboard')
  revalidatePath(`/deals/${dealId}`)
  return {}
}

export async function deleteDealAction(dealId: string): Promise<{ error?: string }> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()

  // Fetch storage paths before deleting deal (cascade will remove deal_files rows)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: files } = await (supabase.from('deal_files') as any)
    .select('storage_path')
    .eq('deal_id', dealId)
    .eq('user_id', userId) as { data: Pick<DealFileRow, 'storage_path'>[] | null }

  // Remove files from Storage (best-effort — orphan files waste quota but don't block)
  if (files && files.length > 0) {
    const paths = files.map((f) => f.storage_path)
    await supabase.storage.from('deal-files').remove(paths)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('deals') as any)
    .delete()
    .eq('id', dealId)
    .eq('user_id', userId)

  if (error) return { error: 'Não foi possível excluir. Tente novamente.' }

  revalidatePath('/dashboard')
  return {}
}
