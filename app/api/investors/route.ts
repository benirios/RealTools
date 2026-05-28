import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { InvestorSchema } from '@/lib/schemas/investor'
import { createInvestor } from '@/lib/investors/data'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('investors') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Não foi possível carregar os investidores' }, { status: 500 })
  return NextResponse.json({ investors: data ?? [] })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = InvestorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const supabase = createSupabaseServiceClient()
  const { data, error } = await createInvestor(supabase, userId, parsed.data)
  if (error) return NextResponse.json({ error: 'Não foi possível criar o investidor' }, { status: 500 })

  return NextResponse.json({ investor: data }, { status: 201 })
}
