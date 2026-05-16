'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { scoreListingService } from '@/lib/scoring/service'
import { STRATEGIES, STRATEGY_SLUGS } from '@/lib/scoring/strategies'
import type { ScoringActionState } from '@/lib/scoring/schemas'

const BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy'] as const

export async function scoreListingAction(
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // T-17-02: validate strategy_slug before passing to engine
  if (!STRATEGY_SLUGS.includes(strategySlug as typeof STRATEGY_SLUGS[number])) {
    return { errors: { general: ['Estratégia inválida.'] } }
  }

  const result = await scoreListingService(supabase, user.id, listingId, strategySlug)

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  return { message: result.message, score: result.score, errors: result.errors }
}

export async function getBestFitAction(listingId: string): Promise<{
  scores: ScoringActionState[]
  topStrategies: { slug: string; label: string; totalScore: number; fitLabel: string }[]
}> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // D-04: exactly cafe, logistics, pharmacy — persisted per D-05 by scoreListingService
  const results = await Promise.all(
    BEST_FIT_SLUGS.map(slug => scoreListingService(supabase, user.id, listingId, slug))
  )

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  // D-06: ranked top 1-2, full ScoringActionState included
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
