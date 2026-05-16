import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ClearImportRunsButton, OlxSearchImportForm, SeedDefaultTargetsButton } from '@/components/listings/import-actions'
import { ImportRunsTable, type ImportRun } from '@/components/listings/import-runs-table'
import { ImportTargetsTable, type ImportTarget } from '@/components/listings/import-targets-table'

export default async function ListingImportPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    targetsResult,
    runsResult,
    listingsResult,
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('listing_import_targets') as any)
      .select('id, source, country, state, city, search_term, is_active')
      .eq('user_id', user.id)
      .order('state', { ascending: true })
      .order('city', { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('listing_import_runs') as any)
      .select('id, source, status, created_count, updated_count, skipped_count, failed_count, error_message, started_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(12),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('listings') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const targets = (targetsResult.data ?? []) as ImportTarget[]
  const runs = (runsResult.data ?? []) as ImportRun[]
  const totalListings = listingsResult.count ?? 0
  const activeTargets = targets.filter((target) => target.is_active).length
  const lastRun = runs[0]
  const failedRuns = runs.filter((run) => run.status === 'failed' || run.failed_count > 0).length

  const summary = [
    { label: 'Total de imóveis', value: totalListings },
    { label: 'Alvos ativos', value: activeTargets },
    { label: 'Última execução', value: lastRun?.status ?? '-' },
    { label: 'Execuções com falha', value: failedRuns },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-foreground">Importação de Imóveis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busque no OLX por endereço, cidade ou região e salve os imóveis encontrados.
        </p>
      </div>

      <OlxSearchImportForm />

      <div className="grid gap-3 md:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Alvos de Importação</h2>
            <p className="mt-1 text-sm text-muted-foreground">Buscas OLX salvas opcionalmente para execuções repetidas.</p>
          </div>
          <SeedDefaultTargetsButton />
        </div>
        <ImportTargetsTable targets={targets} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Execuções Recentes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Revise o status da fonte, registros salvos e falhas.</p>
          </div>
          {runs.length > 0 && <ClearImportRunsButton />}
        </div>
        <ImportRunsTable runs={runs} />
      </section>
    </div>
  )
}
