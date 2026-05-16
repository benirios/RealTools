import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvestorSchema } from '@/lib/schemas/investor'
import { createInvestor } from '@/lib/investors/data'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('investors') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load investors' }, { status: 500 })
  return NextResponse.json({ investors: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = InvestorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data, error } = await createInvestor(supabase, user.id, parsed.data)
  if (error) return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 })

  return NextResponse.json({ investor: data }, { status: 201 })
}
