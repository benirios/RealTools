import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export default async function NegocioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('client_opportunities') as any)
    .select('opportunity_id, client_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single() as { data: { opportunity_id: string; client_id: string } | null }

  if (!data) notFound()

  redirect(`/imoveis/${data.opportunity_id}?clientId=${data.client_id}`)
}
