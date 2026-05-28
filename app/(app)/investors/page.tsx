import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { PageContent } from '@/components/page-content'
import { InvestorFormModal } from '@/components/investors/investor-form-modal'
import { InvestorsTable } from '@/components/investors/investors-table'
import { RecalculateAllMatchesButton, SeedDemoInvestorsButton } from '@/components/investors/investor-actions'
import type { Database } from '@/types/supabase'

type InvestorRow = Database['public']['Tables']['investors']['Row']

export default async function InvestorsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: investors } = await (supabase.from('investors') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as { data: InvestorRow[] | null }

  return (
    <PageContent>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie perfis de clientes/investidores e abra workspaces de aquisição centrados em cada cliente.
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
    </PageContent>
  )
}
