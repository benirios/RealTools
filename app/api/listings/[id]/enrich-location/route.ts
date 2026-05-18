import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { enrichScoreAndMatchListing } from '@/lib/listings/processing'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const result = await enrichScoreAndMatchListing(supabase, user.id, id, { force: true })
  if (result.error) {
    const status = result.error === 'Imóvel não encontrado.' ? 404 : 500
    return NextResponse.json({ error: result.error ?? 'Não foi possível enriquecer a localização' }, { status })
  }

  return NextResponse.json({ result })
}
