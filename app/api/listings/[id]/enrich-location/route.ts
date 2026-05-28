import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { enrichScoreAndMatchListing } from '@/lib/listings/processing'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const result = await enrichScoreAndMatchListing(supabase, userId, id, { force: true })
  if (result.error) {
    const status = result.error === 'Imóvel não encontrado.' ? 404 : 500
    return NextResponse.json({ error: result.error ?? 'Não foi possível enriquecer a localização' }, { status })
  }

  return NextResponse.json({ result })
}
