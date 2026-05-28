import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { InvestorSchema } from '@/lib/schemas/investor'
import { deleteInvestor, updateInvestor } from '@/lib/investors/data'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('investors') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Investidor não encontrado' }, { status: 404 })
  return NextResponse.json({ investor: data })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = InvestorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()
  const { data, error } = await updateInvestor(supabase, userId, id, parsed.data)
  if (error || !data) return NextResponse.json({ error: 'Não foi possível atualizar o investidor' }, { status: 500 })

  return NextResponse.json({ investor: data })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  const { error } = await deleteInvestor(supabase, userId, id)
  if (error) return NextResponse.json({ error: 'Não foi possível excluir o investidor' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
