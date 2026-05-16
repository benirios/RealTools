import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  persistStandaloneLocationInsight,
  resolveStandaloneLocationInsight,
  normalizeCreateLocationInsightInput,
} from '@/lib/location-intelligence/api'

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = await normalizeCreateLocationInsightInput(body)
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const result = await persistStandaloneLocationInsight(supabase, user.id, parsed.data)
    if (result.data) {
      return NextResponse.json({ insight: result.data, persisted: true }, { status: 201 })
    }

    const resolved = await resolveStandaloneLocationInsight(parsed.data)
    const fallback = await persistStandaloneLocationInsight(supabase, user.id, parsed.data)
    if (fallback.data) {
      return NextResponse.json({ insight: fallback.data, persisted: true }, { status: 201 })
    }

    return NextResponse.json(
      {
        insight: resolved,
        persisted: false,
        warning: fallback.error ?? 'Location insight generated but could not be saved.',
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search the address.'
    console.error('[api/location-insights] POST failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
