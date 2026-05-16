import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getListingLocationInsightByListingId } from '@/lib/location-intelligence/api'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const insight = await getListingLocationInsightByListingId(supabase, user.id, id)
  if (!insight) return NextResponse.json({ error: 'Location insight not found' }, { status: 404 })

  return NextResponse.json({ insight })
}
