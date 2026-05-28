import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const ids = (body as { ids?: unknown })?.ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids deve ser um array não vazio' }, { status: 400 })
  }
  if (!ids.every((id) => typeof id === 'string' && UUID_RE.test(id))) {
    return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 })
  }
  if (ids.length > 500) {
    return NextResponse.json({ error: 'Máximo de 500 imóveis por operação' }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, count } = await (supabase.from('listings') as any)
    .delete({ count: 'exact' })
    .in('id', ids)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: 'Falha ao excluir imóveis' }, { status: 500 })
  }

  return NextResponse.json({ deletedCount: count ?? ids.length })
}
