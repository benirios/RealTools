import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, count } = await (supabase.from('listings') as any)
    .delete({ count: 'exact' })
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Falha ao excluir imóveis' }, { status: 500 })
  }

  return NextResponse.json({ deletedCount: count ?? ids.length })
}
