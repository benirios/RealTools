import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getListingLocationInsightByListingId } from '@/lib/location-intelligence/api'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const insight = await getListingLocationInsightByListingId(supabase, userId, id)
  if (!insight) return NextResponse.json({ error: 'Inteligência local não encontrada' }, { status: 404 })

  return NextResponse.json({ insight })
}
