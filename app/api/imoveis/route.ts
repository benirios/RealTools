import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const data = body as Record<string, unknown>
  const title = String(data.title ?? '').trim()

  if (!title) {
    return NextResponse.json({ fieldErrors: { title: ['Título é obrigatório'] } }, { status: 422 })
  }

  const priceAmountRaw = data.price_amount !== '' && data.price_amount != null
    ? Number(data.price_amount)
    : null

  const listingId = crypto.randomUUID()
  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('listings') as any).insert({
    id: listingId,
    user_id: userId,
    source: 'manual',
    source_url: `manual://${listingId}`,
    title,
    description: String(data.description ?? '').trim() || null,
    price_text: String(data.price_text ?? '').trim() || null,
    price_amount: priceAmountRaw !== null && !Number.isNaN(priceAmountRaw) && priceAmountRaw >= 0
      ? priceAmountRaw
      : null,
    address_text: String(data.address_text ?? '').trim() || null,
    neighborhood: String(data.neighborhood ?? '').trim() || null,
    city: String(data.city ?? '').trim() || null,
    state: String(data.state ?? '').trim().toUpperCase() || null,
    property_type: String(data.property_type ?? '').trim() || null,
    commercial_type: String(data.commercial_type ?? '').trim() || null,
    images: Array.isArray(data.images) ? data.images.filter((u) => typeof u === 'string') : [],
    is_commercial: true,
    confidence: 100,
  })

  if (error) {
    console.error('[POST /api/imoveis] DB error:', error)
    return NextResponse.json({ error: `Erro ao criar imóvel: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ id: listingId })
}
