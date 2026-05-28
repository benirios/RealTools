import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { PageContent } from '@/components/page-content'
import { Badge } from '@/components/ui/badge'
import { AddNegocioDialog } from '@/components/negocios/add-negocio-dialog'

type NegocioStatus = 'suggested' | 'saved' | 'sent' | 'interested' | 'rejected' | 'negotiating' | 'closed'

const STATUS_LABELS: Record<NegocioStatus, string> = {
  suggested: 'Sugerida',
  saved: 'Salva',
  sent: 'Enviada',
  interested: 'Interessado',
  rejected: 'Rejeitada',
  negotiating: 'Negociando',
  closed: 'Fechada',
}

function statusVariant(status: NegocioStatus) {
  if (status === 'closed') return 'default' as const
  if (status === 'negotiating' || status === 'interested') return 'default' as const
  if (status === 'rejected') return 'secondary' as const
  return 'outline' as const
}

function normalizeStatus(value: string | null | undefined): NegocioStatus {
  const valid: NegocioStatus[] = ['suggested', 'saved', 'sent', 'interested', 'rejected', 'negotiating', 'closed']
  return valid.includes(value as NegocioStatus) ? (value as NegocioStatus) : 'suggested'
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

type NegocioRow = {
  id: string
  client_id: string
  opportunity_id: string
  status: string
  match_score: number | null
  notes: string | null
  updated_at: string | null
  listings: { title: string; city: string | null; neighborhood: string | null; price_text: string | null } | null
  investors: { name: string } | null
}

export default async function NegociosPage() {
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: negocios } = await (supabase.from('client_opportunities') as any)
    .select('id, client_id, opportunity_id, status, match_score, notes, updated_at, listings(title, city, neighborhood, price_text), investors(name)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false }) as { data: NegocioRow[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clients } = await (supabase.from('investors') as any)
    .select('id, name')
    .eq('user_id', userId)
    .order('name') as { data: Array<{ id: string; name: string }> | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listings } = await (supabase.from('listings') as any)
    .select('id, title, city, neighborhood')
    .eq('user_id', userId)
    .order('first_seen_at', { ascending: false }) as { data: Array<{ id: string; title: string; city: string | null; neighborhood: string | null }> | null }

  const rows = negocios ?? []

  return (
    <PageContent>
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium leading-tight text-foreground">Negócios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} negócio{rows.length !== 1 ? 's' : ''} em acompanhamento.
          </p>
        </div>
        <AddNegocioDialog clients={clients ?? []} listings={listings ?? []} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-foreground">Nenhum negócio ainda.</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Vincule um cliente a um imóvel para acompanhar o andamento da negociação.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Imóvel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = normalizeStatus(row.status)
                const loc = [row.listings?.neighborhood, row.listings?.city].filter(Boolean).join(', ')
                return (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/imoveis/${row.opportunity_id}?clientId=${row.client_id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {row.listings?.title ?? row.opportunity_id.slice(0, 8)}
                      </Link>
                      {loc && <p className="text-xs text-muted-foreground">{loc}</p>}
                      {row.listings?.price_text && (
                        <p className="text-xs text-muted-foreground">{row.listings.price_text}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/investors/${row.client_id}`}
                        className="text-foreground hover:underline"
                      >
                        {row.investors?.name ?? row.client_id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.match_score != null ? `${row.match_score}/100` : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(row.updated_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </PageContent>
  )
}
