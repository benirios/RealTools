import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { scoreListingService } from '@/lib/scoring/service'
import { getScoreHistory } from '@/lib/scoring/data'
import { STRATEGY_SLUGS } from '@/lib/scoring/strategies'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const strategy = searchParams.get('strategy') ?? undefined

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const scores = await getScoreHistory(supabase, userId, id, strategy)
  return NextResponse.json({ scores })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const strategySlug = body?.strategy_slug

  if (!strategySlug || typeof strategySlug !== 'string') {
    return NextResponse.json({ error: 'strategy_slug é obrigatório' }, { status: 400 })
  }

  if (!STRATEGY_SLUGS.includes(strategySlug as typeof STRATEGY_SLUGS[number])) {
    return NextResponse.json({ error: 'Estratégia inválida.' }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()
  const result = await scoreListingService(supabase, userId, id, strategySlug)

  if (result.errors) {
    return NextResponse.json(
      { error: result.errors.general?.[0] ?? 'Não foi possível calcular a pontuação.' },
      { status: 422 }
    )
  }

  revalidateTag('opportunity_score')
  return NextResponse.json({ score: result.score })
}
