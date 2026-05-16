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
      message: result.error?.includes('missing Gemini API key')
        ? 'AI summary unavailable. Configure GEMINI_API_KEY and try again.'
        : result.error ?? 'AI summary unavailable.',
    }
  }

  return {
    ok: true,
    message: result.skipped ? 'AI summary is already up to date.' : 'AI summary regenerated.',
  }
}
