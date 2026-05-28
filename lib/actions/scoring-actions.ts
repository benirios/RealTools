'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { scoreListingService } from '@/lib/scoring/service'
import { STRATEGIES, STRATEGY_SLUGS } from '@/lib/scoring/strategies'
import type { ScoringActionState } from '@/lib/scoring/schemas'

const BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy'] as const

export async function scoreListingAction(
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  if (!STRATEGY_SLUGS.includes(strategySlug as typeof STRATEGY_SLUGS[number])) {
    return { errors: { general: ['Estratégia inválida.'] } }
  }

  const supabase = createSupabaseServiceClient()
  const result = await scoreListingService(supabase, userId, listingId, strategySlug)

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  return { message: result.message, score: result.score, errors: result.errors }
}

export async function getBestFitAction(listingId: string): Promise<{
  scores: ScoringActionState[]
  topStrategies: { slug: string; label: string; totalScore: number; fitLabel: string }[]
}> {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  const results = await Promise.all(
    BEST_FIT_SLUGS.map(slug => scoreListingService(supabase, userId, listingId, slug))
  )

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  const scored = results
    .map((r, i) => ({ slug: BEST_FIT_SLUGS[i], state: r }))
    .filter(x => x.state.score !== undefined && x.state.score !== null)
    .sort((a, b) => (b.state.score!.totalScore) - (a.state.score!.totalScore))

  return {
    scores: results,
    topStrategies: scored.slice(0, 2).map(x => ({
      slug: x.slug,
      label: STRATEGIES[x.slug].label,
      totalScore: x.state.score!.totalScore,
      fitLabel: x.state.score!.fitLabel,
    })),
  }
}
