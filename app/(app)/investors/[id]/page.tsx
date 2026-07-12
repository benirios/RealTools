import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowUpRight, Clock, FileText, KanbanSquare, Send } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { PageContent } from '@/components/page-content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InvestorFormModal } from '@/components/investors/investor-form-modal'
import {
  ClientOpportunityNotesForm,
  ClientOpportunityPipelineActions,
  FindClientOpportunitiesForm,
  RecalculateClientWorkspaceButton,
} from '@/components/investors/client-workspace-actions'
import {
  ClientImportTargetsList,
  CreateClientImportTargetForm,
  type ClientImportTarget,
} from '@/components/investors/client-import-targets'
import { ImportRunsTable, type ImportRun } from '@/components/listings/import-runs-table'
import { ImoveisGrid, type ListingSummary } from '@/components/listings/imoveis-grid'
import { DecisionSurface, type DecisionOpportunity } from '@/components/listings/decision-surface'
import { loadDeals, loadPersistedMatchesForInvestor, type MatchDeal, type PersistedInvestorMatch } from '@/lib/investors/match-processing'
import { loadClientListingIds } from '@/lib/listings/client-listings'
import { loadDecisionOpportunities } from '@/lib/listings/decision-data'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/supabase'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type InvestorRow = Database['public']['Tables']['investors']['Row']
type ClientOpportunityRow = Database['public']['Tables']['client_opportunities']['Row']

type WorkspaceTab = 'overview' | 'pipeline' | 'exports' | 'pesquisas' | 'imoveis' | 'decisao'

const TABS: Array<{ value: WorkspaceTab; label: string }> = [
  { value: 'overview', label: 'Visão geral' },
  { value: 'pesquisas', label: 'Pesquisas' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'decisao', label: 'Decisão' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'exports', label: 'Exportações' },
]

const WORKFLOW_STATUSES = ['suggested', 'saved', 'sent', 'interested', 'rejected', 'negotiating', 'closed'] as const
type WorkflowStatus = typeof WORKFLOW_STATUSES[number]
type PipelineItem = {
  row: ClientOpportunityRow
  match?: PersistedInvestorMatch
  deal: MatchDeal
}

const STATUS_LABELS: Record<string, string> = {
  suggested: 'Sugerida',
  saved: 'Salva',
  sent: 'Enviada',
  interested: 'Interessado',
  rejected: 'Rejeitada',
  negotiating: 'Negociando',
  closed: 'Fechada',
  strong: 'Forte',
  medium: 'Médio',
  weak: 'Fraco',
}

const STRATEGY_LABELS: Record<string, string> = {
  any: 'Qualquer',
  rental_income: 'Renda de aluguel',
  retail: 'Varejo',
  warehouse_logistics: 'Galpão / logística',
  food_beverage: 'Alimentação',
  pharmacy: 'Farmácia',
  gym_fitness: 'Academia / fitness',
  flip: 'Revenda',
  own_business: 'Negócio próprio',
  land_banking: 'Reserva de terreno',
}

const RISK_LABELS: Record<string, string> = {
  any: 'Qualquer',
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizeTab(value: string | string[] | undefined): WorkspaceTab {
  const tab = firstParam(value)
  return TABS.some((item) => item.value === tab) ? tab as WorkspaceTab : 'overview'
}

function normalizeStatus(value: string | null | undefined): WorkflowStatus {
  return WORKFLOW_STATUSES.includes(value as WorkflowStatus) ? value as WorkflowStatus : 'suggested'
}

function formatBudget(investor: InvestorRow) {
  const min = investor.budget_min ? `R$ ${Number(investor.budget_min).toLocaleString('pt-BR')}` : 'Qualquer'
  const max = investor.budget_max ? `R$ ${Number(investor.budget_max).toLocaleString('pt-BR')}` : 'Qualquer'
  return `${min} - ${max}`
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusVariant(status: string) {
  if (['saved', 'sent', 'interested', 'negotiating', 'closed', 'strong'].includes(status)) return 'default' as const
  if (['suggested', 'medium'].includes(status)) return 'outline' as const
  return 'secondary' as const
}

function addressForDeal(deal: MatchDeal) {
  return deal.address_text
    ?? deal.neighborhood
    ?? deal.location_text
    ?? [deal.city, deal.state].filter(Boolean).join(', ')
    ?? '-'
}
function tabHref(clientId: string, tab: WorkspaceTab) {
  return `/investors/${clientId}?tab=${tab}`
}

function defaultSearchLocation(client: InvestorRow) {
  return client.preferred_neighborhoods?.[0] ?? ''
}

function defaultSearchTerm(client: InvestorRow) {
  return client.property_types?.[0] ?? client.tags?.[0] ?? 'ponto comercial'
}

async function loadClientOpportunityRows(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  userId: string,
  clientId: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('client_opportunities') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false }) as { data: ClientOpportunityRow[] | null; error: { message?: string } | null }

  return error ? [] : data ?? []
}

async function buildPipelineItems(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  userId: string,
  clientRows: ClientOpportunityRow[],
  matches: PersistedInvestorMatch[]
) {
  const matchByListing = new Map(matches.map((match) => [match.listing_id, match]))
  const missingListingIds = clientRows
    .map((row) => row.opportunity_id)
    .filter((id) => !matchByListing.has(id))

  const fallbackDeals = missingListingIds.length > 0
    ? await loadDeals(supabase, userId, missingListingIds)
    : []
  const dealByListing = new Map<string, MatchDeal>([
    ...matches.map((match) => [match.listing_id, match.deal] as const),
    ...fallbackDeals.map((deal) => [deal.id, deal] as const),
  ])

  return clientRows.flatMap((row) => {
    const deal = dealByListing.get(row.opportunity_id)
    if (!deal) return []

    return [{
      row,
      match: matchByListing.get(row.opportunity_id),
      deal,
    }]
  })
}

function OverviewTab({
  client,
  matches,
  clientRows,
}: {
  client: InvestorRow
  matches: PersistedInvestorMatch[]
  clientRows: ClientOpportunityRow[]
}) {
  const avgScore = matches.length
    ? Math.round(matches.reduce((sum, match) => sum + match.match_score, 0) / matches.length)
    : null
  const savedCount = clientRows.filter((row) => ['saved', 'interested', 'negotiating', 'closed'].includes(row.status)).length
  const sentCount = clientRows.filter((row) => row.status === 'sent').length

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
      <section className="rounded-md border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Perfil do cliente</p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">{client.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{client.email ?? client.phone ?? 'Sem contato cadastrado'}</p>
        <dl className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Orçamento</dt>
            <dd className="mt-1 font-medium text-foreground">{formatBudget(client)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Estratégia</dt>
            <dd className="mt-1 font-medium text-foreground">{STRATEGY_LABELS[client.strategy] ?? client.strategy}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Risco</dt>
            <dd className="mt-1 font-medium text-foreground">{RISK_LABELS[client.risk_level] ?? client.risk_level}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Rendimento alvo</dt>
            <dd className="mt-1 font-medium text-foreground">{client.desired_yield ? `${client.desired_yield}%` : 'Qualquer'}</dd>
          </div>
        </dl>
        <div className="mt-5 space-y-3">
          <TagRow label="Regiões" values={client.preferred_neighborhoods ?? []} />
          <TagRow label="Setores/tipos" values={[...(client.property_types ?? []), ...(client.tags ?? [])]} />
        </div>
        {client.notes && (
          <div className="mt-5 rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">
            {client.notes}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Matches totais" value={matches.length} />
        <StatCard label="Oportunidades salvas" value={savedCount} />
        <StatCard label="Enviadas" value={sentCount} />
        <StatCard label="Match médio" value={avgScore !== null ? `${avgScore}%` : '-'} />
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function TagRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {values.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Qualquer</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => <Badge key={value} variant="outline">{value}</Badge>)}
        </div>
      )}
    </div>
  )
}

function MiniScore({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <p className="text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function PipelineTab({
  client,
  items,
}: {
  client: InvestorRow
  items: PipelineItem[]
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <KanbanSquare className="mx-auto mb-3 size-9 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Pipeline vazio para este cliente</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Abra um imóvel pela aba Decisão ou Imóveis e salve, envie ou rejeite para criar o acompanhamento específico deste cliente.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-5">
      {WORKFLOW_STATUSES.map((status) => {
        const group = items.filter((item) => normalizeStatus(item.row.status) === status)
        if (group.length === 0) return null

        return (
          <div key={status} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge>
              <span className="text-sm text-muted-foreground">{group.length} oportunidade{group.length === 1 ? '' : 's'}</span>
            </div>
            {group.map((item) => {
              const matchScore = item.row.match_score ?? item.match?.match_score ?? null
              const lastUpdated = item.row.last_action_at ?? item.row.updated_at ?? item.row.created_at

              return (
                <article key={item.row.id} className="space-y-4 rounded-md border border-border bg-card p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge>
                        {item.match && <Badge variant={statusVariant(item.match.match_status)}>Match {STATUS_LABELS[item.match.match_status] ?? item.match.match_status}</Badge>}
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-foreground">{item.deal.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{addressForDeal(item.deal)}</p>
                                  {item.row.notes && (
                        <p className="mt-3 line-clamp-2 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                          {item.row.notes}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>Última atualização: {formatDateTime(lastUpdated)}</span>
                      </div>
                    </div>
                    <div className="grid min-w-[280px] grid-cols-2 gap-2 text-center">
                      <MiniScore label="Universal" value={item.deal.opportunity_score ?? '-'} />
                      <MiniScore label="Cliente" value={matchScore !== null ? `${matchScore}%` : '-'} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{item.deal.price_text ?? formatMoney(item.deal.price_amount) ?? 'Preço indisponível'}</span>
                      <span>·</span>
                      <span>{item.deal.property_type ?? item.deal.commercial_type ?? 'Tipo indisponível'}</span>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/imoveis/${item.deal.id}?clientId=${client.id}`}>
                        <ArrowUpRight className="mr-2 size-4" />
                        Abrir no contexto do cliente
                      </Link>
                    </Button>
                  </div>

                  <ClientOpportunityPipelineActions clientId={client.id} opportunityId={item.deal.id} />
                  <ClientOpportunityNotesForm
                    clientId={client.id}
                    opportunityId={item.deal.id}
                    status={status}
                    notes={item.row.notes ?? null}
                  />
                </article>
              )
            })}
          </div>
        )
      })}
    </section>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function InvestorExportsTab({
  sends,
}: {
  investorId: string
  sends: Array<{
    id: string
    tracking_token: string
    om_sent_at: string | null
    om_opened_at: string | null
    created_at: string | null
    listing_id: string
    listings: { title: string; price_text: string | null; city: string | null; state: string | null } | null
  }>
}) {
  if (sends.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-border bg-card p-8 text-center">
        <FileText className="mx-auto mb-3 size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Memorandos enviados</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Nenhum memorando de oportunidade foi enviado a este cliente ainda.
          Acesse um imóvel e use &quot;Enviar OM por Email&quot; para iniciar o envio.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-md border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <FileText className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Memorandos enviados ({sends.length})</h2>
      </div>
      <ul className="divide-y divide-border">
        {sends.map((send) => (
          <li key={send.id} className="flex items-center gap-4 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {send.listings?.title ?? 'Imóvel'}
              </p>
              <p className="text-xs text-muted-foreground">
                {[send.listings?.city, send.listings?.state].filter(Boolean).join(', ')}
                {send.listings?.price_text ? ` · ${send.listings.price_text}` : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 text-xs">
              <span className="text-muted-foreground">Enviado em {formatDate(send.om_sent_at)}</span>
              {send.om_opened_at ? (
                <span className="text-green-600">Aberto em {formatDate(send.om_opened_at)}</span>
              ) : (
                <span className="text-muted-foreground">Não aberto ainda</span>
              )}
            </div>
            <a
              href={`/imoveis/${send.listing_id}`}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline"
            >
              Ver imóvel
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PesquisasTab({
  client,
  targets,
  runs,
}: {
  client: InvestorRow
  targets: ClientImportTarget[]
  runs: ImportRun[]
}) {
  return (
    <section className="space-y-6">
      <FindClientOpportunitiesForm
        clientId={client.id}
        defaultLocation={defaultSearchLocation(client)}
        defaultSearchTerm={defaultSearchTerm(client)}
      />

      <div>
        <h2 className="text-lg font-semibold text-foreground">Alvos de importação salvos</h2>
        <p className="mt-1 text-sm text-muted-foreground">Buscas OLX salvas para este cliente, para execuções repetidas.</p>
      </div>
      <CreateClientImportTargetForm clientId={client.id} />
      <ClientImportTargetsList clientId={client.id} targets={targets} />

      <div>
        <h2 className="text-lg font-semibold text-foreground">Execuções recentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">Buscas feitas para este cliente, salvas ou avulsas.</p>
      </div>
      <ImportRunsTable runs={runs} />
    </section>
  )
}

function ImoveisTab({ listings }: { listings: ListingSummary[] }) {
  if (listings.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-border bg-card p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Nenhum imóvel neste pipeline ainda</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Use a aba Pesquisas para buscar imóveis para este cliente, ou compartilhe um imóvel de outro cliente com ele.
        </p>
      </section>
    )
  }

  return <ImoveisGrid listings={listings} />
}

function DecisaoTab({ clientId, opportunities, loadError }: { clientId: string; opportunities: DecisionOpportunity[]; loadError?: string }) {
  return <DecisionSurface opportunities={opportunities} loadError={loadError} emptyStateHref={`/investors/${clientId}?tab=pesquisas`} clientId={clientId} />
}

export default async function InvestorDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const query = await searchParams
  const tab = normalizeTab(query?.tab)
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: client } = await (supabase.from('investors') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single() as { data: InvestorRow | null }

  if (!client) notFound()

  const matches = await loadPersistedMatchesForInvestor(supabase, userId, client.id, 100)
  const clientRows = await loadClientOpportunityRows(supabase, userId, client.id)
  const pipelineItems = await buildPipelineItems(supabase, userId, clientRows, matches)
  const { getOmSendsForInvestorAction } = await import('@/lib/actions/om-actions')
  const omSends = tab === 'exports' ? await getOmSendsForInvestorAction(client.id) : []

  let importTargets: ClientImportTarget[] = []
  let importRuns: ImportRun[] = []
  if (tab === 'pesquisas') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetsResult = await (supabase.from('listing_import_targets') as any)
      .select('id, source, country, state, city, search_term, is_active')
      .eq('user_id', userId)
      .eq('investor_id', client.id)
      .order('city', { ascending: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runsResult = await (supabase.from('listing_import_runs') as any)
      .select('id, source, status, created_count, updated_count, skipped_count, failed_count, error_message, started_at, completed_at')
      .eq('user_id', userId)
      .eq('investor_id', client.id)
      .order('created_at', { ascending: false })
      .limit(12)
    importTargets = (targetsResult.data ?? []) as ClientImportTarget[]
    importRuns = (runsResult.data ?? []) as ImportRun[]
  }

  let clientListings: ListingSummary[] = []
  let decisionOpportunities: DecisionOpportunity[] = []
  let decisionLoadError: string | undefined
  if (tab === 'imoveis' || tab === 'decisao') {
    const clientListingIds = await loadClientListingIds(supabase, userId, client.id)
    if (tab === 'imoveis' && clientListingIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('listings') as any)
        .select('id, title, price_text, price_amount, city, neighborhood, state, address_text, location_text, commercial_type, property_type, confidence, source_url, first_seen_at, images, enrichment_status, matching_status')
        .eq('user_id', userId)
        .in('id', clientListingIds)
        .order('first_seen_at', { ascending: false })
      clientListings = (data ?? []) as ListingSummary[]
    }
    if (tab === 'decisao') {
      const result = await loadDecisionOpportunities(supabase, userId, { listingIds: clientListingIds })
      decisionOpportunities = result.opportunities
      decisionLoadError = result.loadError
    }
  }

  return (
    <PageContent>
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/investors">Voltar para Clientes</Link>
        </Button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace do cliente</p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground">{client.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Pipeline deste cliente: pesquise imóveis para ele, acompanhe o que foi encontrado, ranqueie por oportunidade e gerencie shortlist e notas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RecalculateClientWorkspaceButton clientId={client.id} />
            <InvestorFormModal investor={client} />
          </div>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto border-b border-border">
        {TABS.map((item) => (
          <Link
            key={item.value}
            href={tabHref(client.id, item.value)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              tab === item.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === 'overview' && <OverviewTab client={client} matches={matches} clientRows={clientRows} />}
      {tab === 'pesquisas' && <PesquisasTab client={client} targets={importTargets} runs={importRuns} />}
      {tab === 'imoveis' && <ImoveisTab listings={clientListings} />}
      {tab === 'decisao' && <DecisaoTab clientId={client.id} opportunities={decisionOpportunities} loadError={decisionLoadError} />}
      {tab === 'pipeline' && <PipelineTab client={client} items={pipelineItems} />}
      {tab === 'exports' && <InvestorExportsTab investorId={client.id} sends={omSends} />}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Send className="size-4" />
        <span>{matches.length} matches específicos</span>
        <span>·</span>
        <span>{clientRows.filter((row) => row.status === 'saved').length} salvos</span>
      </div>
    </div>
    </PageContent>
  )
}
