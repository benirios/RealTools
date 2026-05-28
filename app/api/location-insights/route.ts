import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import {
  persistStandaloneLocationInsight,
  resolveStandaloneLocationInsight,
  normalizeCreateLocationInsightInput,
} from '@/lib/location-intelligence/api'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Corpo JSON inválido' }, { status: 400 })
    }

    const parsed = await normalizeCreateLocationInsightInput(body)
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const supabase = createSupabaseServiceClient()
    const result = await persistStandaloneLocationInsight(supabase, userId, parsed.data)
    if (result.data) {
      return NextResponse.json({ insight: result.data, persisted: true }, { status: 201 })
    }

    const resolved = await resolveStandaloneLocationInsight(parsed.data)
    const fallback = await persistStandaloneLocationInsight(supabase, userId, parsed.data)
    if (fallback.data) {
      return NextResponse.json({ insight: fallback.data, persisted: true }, { status: 201 })
    }

    return NextResponse.json(
      {
        insight: resolved,
        persisted: false,
        warning: fallback.error ?? 'A inteligência local foi gerada, mas não pôde ser salva.',
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao buscar o endereço.'
    console.error('[api/location-insights] POST failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
