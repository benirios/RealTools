import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvestorSchema } from '@/lib/schemas/investor'
import { deleteInvestor, updateInvestor } from '@/lib/investors/data'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('investors') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
  return NextResponse.json({ investor: data })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = InvestorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data, error } = await updateInvestor(supabase, user.id, id, parsed.data)
  if (error || !data) return NextResponse.json({ error: 'Failed to update investor' }, { status: 500 })

  return NextResponse.json({ investor: data })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await deleteInvestor(supabase, user.id, id)
  if (error) return NextResponse.json({ error: 'Failed to delete investor' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
