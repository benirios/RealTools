import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { scoreListingService } from '@/lib/scoring/service'
import { getScoreHistory } from '@/lib/scoring/data'
import { STRATEGY_SLUGS } from '@/lib/scoring/strategies'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const strategy = searchParams.get('strategy') ?? undefined

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scores = await getScoreHistory(supabase, user.id, id, strategy)
  return NextResponse.json({ scores })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const strategySlug = body?.strategy_slug

  if (!strategySlug || typeof strategySlug !== 'string') {
    return NextResponse.json({ error: 'strategy_slug is required' }, { status: 400 })
  }

  // T-17-02: validate against allowed slugs before passing to engine
  if (!STRATEGY_SLUGS.includes(strategySlug as typeof STRATEGY_SLUGS[number])) {
    return NextResponse.json({ error: 'Estratégia inválida.' }, { status: 400 })
  }

  const result = await scoreListingService(supabase, user.id, id, strategySlug)

  if (result.errors) {
    return NextResponse.json(
      { error: result.errors.general?.[0] ?? 'Não foi possível calcular a pontuação.' },
      { status: 422 }
    )
  }

  revalidateTag('opportunity_score')
  return NextResponse.json({ score: result.score })
}
