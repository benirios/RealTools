import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvestorFormModal } from '@/components/investors/investor-form-modal'
import { InvestorsTable } from '@/components/investors/investors-table'
import { RecalculateAllMatchesButton, SeedDemoInvestorsButton } from '@/components/investors/investor-actions'
import type { Database } from '@/types/supabase'

type InvestorRow = Database['public']['Tables']['investors']['Row']

export default async function InvestorsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: investors } = await (supabase.from('investors') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: InvestorRow[] | null }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-foreground">Investidores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as preferências de investidores e combine-os com imóveis comerciais coletados.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <RecalculateAllMatchesButton />
          <SeedDemoInvestorsButton />
          {(investors ?? []).length > 0 && <InvestorFormModal />}
        </div>
      </div>

      <InvestorsTable investors={investors ?? []} />
    </div>
  )
}
