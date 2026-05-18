'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { generateAiDealSummary } from '@/lib/ai/deal-summary-service'

export type AiSummaryActionState = {
  ok: boolean
  message: string
}

export async function regenerateAiDealSummaryAction(listingId: string): Promise<AiSummaryActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await generateAiDealSummary(supabase, user.id, listingId, { force: true })

  revalidatePath(`/imoveis/${listingId}`)
  revalidatePath('/decision-surface')

  if (!result.ok) {
    return {
      ok: false,
      message: result.error?.includes('chave de API do Gemini ausente')
        ? 'Resumo IA indisponível. Configure GEMINI_API_KEY e tente novamente.'
        : result.error ?? 'Resumo IA indisponível.',
    }
  }

  return {
    ok: true,
    message: result.skipped ? 'O resumo IA já está atualizado.' : 'Resumo IA regenerado.',
  }
}
