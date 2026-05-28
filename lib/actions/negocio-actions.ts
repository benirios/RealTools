'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

type NegocioStatus = 'suggested' | 'saved' | 'sent' | 'interested' | 'rejected' | 'negotiating' | 'closed'

const STATUS_VALUES = new Set<NegocioStatus>([
  'suggested', 'saved', 'sent', 'interested', 'rejected', 'negotiating', 'closed',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseStatus(value: FormDataEntryValue | null): NegocioStatus {
  const s = String(value ?? 'suggested')
  return STATUS_VALUES.has(s as NegocioStatus) ? (s as NegocioStatus) : 'suggested'
}

export type NegocioState = {
  errors?: {
    clientId?: string[]
    opportunityId?: string[]
    general?: string[]
  }
}

export async function createNegocioAction(
  _prev: NegocioState,
  formData: FormData
): Promise<NegocioState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const clientId = String(formData.get('clientId') ?? '').trim()
  const opportunityId = String(formData.get('opportunityId') ?? '').trim()
  const status = parseStatus(formData.get('status'))
  const notes = String(formData.get('notes') ?? '').trim() || null

  if (!UUID_RE.test(clientId)) return { errors: { clientId: ['Selecione um cliente.'] } }
  if (!UUID_RE.test(opportunityId)) return { errors: { opportunityId: ['Selecione um imóvel.'] } }

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('client_opportunities') as any).upsert(
    {
      user_id: userId,
      client_id: clientId,
      opportunity_id: opportunityId,
      status,
      notes,
      last_action_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,client_id,opportunity_id' }
  )

  if (error) return { errors: { general: ['Não foi possível criar o negócio. Tente novamente.'] } }

  revalidatePath('/negocios')
  revalidatePath(`/investors/${clientId}`)
  revalidatePath(`/imoveis/${opportunityId}`)
  return {}
}
