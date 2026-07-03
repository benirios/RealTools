import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { searchInvestorsAndListings } from '@/lib/search/global-search'

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (query.length < 2) return NextResponse.json({ investors: [], listings: [] })

  const supabase = createSupabaseServiceClient()
  const results = await searchInvestorsAndListings(supabase, userId, query)

  return NextResponse.json(results)
}
