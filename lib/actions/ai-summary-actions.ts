'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { generateAiDealSummary } from '@/lib/ai/deal-summary-service'

export type AiSummaryActionState = {
  ok: boolean
  message: string
}

export async function regenerateAiDealSummaryAction(listingId: string): Promise<AiSummaryActionState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const result = await generateAiDealSummary(supabase, userId, listingId, { force: true })

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
