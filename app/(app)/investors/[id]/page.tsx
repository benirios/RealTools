import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowUpRight, Clock, FileText, KanbanSquare, MapPin, Send, Star, Target } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { PageContent } from '@/components/page-content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InvestorFormModal } from '@/components/investors/investor-form-modal'
import {
  ClientOpportunityNotesForm,
  ClientOpportunityPipelineActions,
  ClientOpportunityStatusButtons,
  FindClientOpportunitiesForm,
  RecalculateClientWorkspaceButton,
} from '@/components/investors/client-workspace-actions'
import { loadDeals, loadPersistedMatchesForInvestor, type MatchDeal, type PersistedInvestorMatch } from '@/lib/investors/match-processing'
import { getAiSummaryJson } from '@/lib/ai/deal-summary-service'
import { cn } from '@/lib/utils'
import type { AiDealSummary } from '@/lib/ai/deal-summary-schema'
import type { Database } from '@/types/supabase'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type InvestorRow = Database['public']['Tables']['investors']['Row']
type ClientOpportunityRow = Database['public']['Tables']['client_opportunities']['Row']
type AiSummaryRow = Database['public']['Tables']['listing_ai_summaries']['Row']

type WorkspaceTab = 'overview' | 'matches' | 'pipeline' | 'map' | 'saved' | 'exports'

const TABS: Array<{ value: WorkspaceTab; label: string }> = [
  { value: 'overview', label: 'Visão geral' },
  { value: 'matches', label: 'Matches' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'map', label: 'Mapa' },
  { value: 'saved', label: 'Salvos' },
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

function addressForMatch(match: PersistedInvestorMatch) {
  return addressForDeal(match.deal)
}

function aiSnippet(summary: AiDealSummary | null) {
  return summary?.headline
    ?? summary?.investor_angle
    ?? summary?.recommended_action
    ?? 'Resumo IA ainda não gerado para esta oportunidade.'
}

function summaryConfidence(summary: AiDealSummary | null) {
  if (!summary?.confidence) return null
  const labels: Record<string, string> = { low: 'baixa', medium: 'média', high: 'alta' }
  return labels[summary.confidence] ?? summary.confidence
}

function strategyFitForDeal(deal: MatchDeal, client: InvestorRow) {
  const scores = deal.strategy_fit_scores ?? []
  if (scores.length === 0) return null

  const direct = client.strategy !== 'any'
    ? scores.find((score) => score.strategy === client.strategy)
    : null

  return direct ?? [...scores].sort((a, b) => b.score - a.score)[0] ?? null
}

function strategyFitScore(match: PersistedInvestorMatch, client: InvestorRow) {
  return strategyFitForDeal(match.deal, client)
}

function coordinateForMatch(match: PersistedInvestorMatch) {
  const lat = typeof match.deal.lat === 'number' ? match.deal.lat : match.deal.location_insight?.latitude
  const lng = typeof match.deal.lng === 'number' ? match.deal.lng : match.deal.location_insight?.longitude

  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function mapTone(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-zinc-500'
}

function mapPointStyle(match: PersistedInvestorMatch, mapped: PersistedInvestorMatch[]) {
  const points = mapped.flatMap((item) => {
    const coordinate = coordinateForMatch(item)
    return coordinate ? [coordinate] : []
  })
  const coordinate = coordinateForMatch(match)
  if (!coordinate || points.length === 0) return {}

  const lats = points.map((point) => point.lat)
  const lngs = points.map((point) => point.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latRange = Math.max(maxLat - minLat, 0.01)
  const lngRange = Math.max(maxLng - minLng, 0.01)

  return {
    left: `${8 + ((coordinate.lng - minLng) / lngRange) * 84}%`,
    top: `${8 + ((maxLat - coordinate.lat) / latRange) * 84}%`,
  }
}

function clientOpportunityByListing(rows: ClientOpportunityRow[]) {
  return new Map(rows.map((row) => [row.opportunity_id, row]))
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

async function loadSummaries(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  userId: string,
  listingIds: string[]
) {
  if (listingIds.length === 0) return new Map<string, AiDealSummary | null>()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('listing_ai_summaries') as any)
    .select('*')
    .eq('user_id', userId)
    .in('listing_id', listingIds)
    .order('updated_at', { ascending: false }) as { data: AiSummaryRow[] | null }

  const summaries = new Map<string, AiDealSummary | null>()
  for (const row of data ?? []) {
    if (!summaries.has(row.listing_id)) {
      summaries.set(row.listing_id, getAiSummaryJson(row) as AiDealSummary | null)
    }
  }

  return summaries
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

function MatchOpportunityCard({
  client,
  match,
  clientOpportunity,
  summary,
}: {
  client: InvestorRow
  match: PersistedInvestorMatch
  clientOpportunity: ClientOpportunityRow | undefined
  summary: AiDealSummary | null
}) {
  const status = normalizeStatus(clientOpportunity?.status)
  const fit = strategyFitScore(match, client)

  return (
    <article className="rounded-md border border-border bg-card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge>
            <Badge variant={statusVariant(match.match_status)}>Match {STATUS_LABELS[match.match_status] ?? match.match_status}</Badge>
            {summaryConfidence(summary) && <Badge variant="outline">IA {summaryConfidence(summary)}</Badge>}
          </div>
          <h3 className="mt-3 text-base font-semibold text-foreground">{match.deal.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{addressForMatch(match)}</p>
          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{aiSnippet(summary)}</p>
        </div>
        <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center">
          <MiniScore label="Universal" value={match.deal.opportunity_score ?? '-'} />
          <MiniScore label="Fit estratégia" value={fit ? Math.round(fit.score) : '-'} />
          <MiniScore label="Cliente" value={`${match.match_score}%`} />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{match.deal.price_text ?? formatMoney(match.deal.price_amount) ?? 'Preço indisponível'}</span>
          <span>·</span>
          <span>{match.deal.property_type ?? match.deal.commercial_type ?? 'Tipo indisponível'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/imoveis/${match.listing_id}?clientId=${client.id}`}>
              <ArrowUpRight className="mr-2 size-4" />
              Abrir
            </Link>
          </Button>
          <ClientOpportunityStatusButtons clientId={client.id} opportunityId={match.listing_id} />
        </div>
      </div>
    </article>
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

function MatchesTab({
  client,
  matches,
  clientRows,
  summaries,
}: {
  client: InvestorRow
  matches: PersistedInvestorMatch[]
  clientRows: ClientOpportunityRow[]
  summaries: Map<string, AiDealSummary | null>
}) {
  const stateByListing = clientOpportunityByListing(clientRows)

  if (matches.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <Target className="mx-auto mb-3 size-9 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Nenhum match para este cliente ainda</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Use a busca do workspace ou recalcule os matches após importar oportunidades globais.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-3">
      {matches.map((match) => (
        <MatchOpportunityCard
          key={match.id}
          client={client}
          match={match}
          clientOpportunity={stateByListing.get(match.listing_id)}
          summary={summaries.get(match.listing_id) ?? null}
        />
      ))}
    </section>
  )
}

function PipelineTab({
  client,
  items,
  summaries,
}: {
  client: InvestorRow
  items: PipelineItem[]
  summaries: Map<string, AiDealSummary | null>
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <KanbanSquare className="mx-auto mb-3 size-9 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Pipeline vazio para este cliente</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Salve, envie ou rejeite oportunidades na aba Matches para criar o acompanhamento específico deste cliente.
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
              const fit = strategyFitForDeal(item.deal, client)
              const summary = summaries.get(item.deal.id) ?? null
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
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{aiSnippet(summary)}</p>
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
                    <div className="grid min-w-[280px] grid-cols-3 gap-2 text-center">
                      <MiniScore label="Universal" value={item.deal.opportunity_score ?? '-'} />
                      <MiniScore label="Fit estratégia" value={fit ? Math.round(fit.score) : '-'} />
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

function ClientMapTab({
  clientId,
  matches,
  selectedOpportunityId,
}: {
  clientId: string
  matches: PersistedInvestorMatch[]
  selectedOpportunityId: string | undefined
}) {
  const mapped = matches.filter((match) => coordinateForMatch(match))
  const selected = mapped.find((match) => match.listing_id === selectedOpportunityId) ?? mapped[0] ?? null

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="overflow-hidden rounded-md border border-border bg-card">
        <div className="border-b border-border p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mapa do cliente</p>
          <h2 className="text-lg font-semibold text-foreground">{mapped.length} oportunidades com coordenadas</h2>
        </div>
        <div className="relative h-[520px] bg-muted">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:54px_54px]" />
          {mapped.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <MapPin className="mb-3 size-9 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">Sem oportunidades mapeáveis</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Enriquecimento local ou coordenadas são necessários para exibir pins.
              </p>
            </div>
          ) : (
            mapped.map((match) => (
              <Link
                key={match.id}
                href={`/investors/${clientId}?tab=map&opportunity=${match.listing_id}`}
                className={cn(
                  'absolute z-10 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-md transition-transform hover:scale-110',
                  mapTone(match.match_score),
                  selected?.listing_id === match.listing_id && 'ring-4 ring-foreground/20'
                )}
                style={mapPointStyle(match, mapped)}
                title={`${match.deal.title} · ${match.match_score}%`}
              >
                {match.match_score}
              </Link>
            ))
          )}
        </div>
      </section>
      <section className="rounded-md border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência da oportunidade</p>
        {selected ? (
          <div className="mt-3 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">{selected.deal.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{addressForMatch(selected)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniScore label="Match cliente" value={`${selected.match_score}%`} />
              <MiniScore label="Score global" value={selected.deal.opportunity_score ?? '-'} />
            </div>
            <p className="text-sm text-muted-foreground">{selected.explanation}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={`/imoveis/${selected.listing_id}?clientId=${clientId}`}>Abrir oportunidade</Link>
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Clique em um pin para abrir o painel.</p>
        )}
      </section>
    </div>
  )
}

function SavedTab({
  client,
  items,
}: {
  client: InvestorRow
  items: PipelineItem[]
}) {
  const savedStatuses = new Set(['saved', 'sent', 'interested', 'negotiating', 'closed'])
  const savedItems = items.filter((item) => savedStatuses.has(normalizeStatus(item.row.status)))

  if (savedItems.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <Star className="mx-auto mb-3 size-9 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Nenhuma oportunidade salva para este cliente</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Salve uma oportunidade na aba Matches para montar a shortlist do cliente.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-3">
      {savedItems.map((item) => {
        const status = normalizeStatus(item.row.status)
        const matchScore = item.row.match_score ?? item.match?.match_score ?? null

        return (
          <article key={item.row.id} className="space-y-4 rounded-md border border-border bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge variant={statusVariant(status)}>{STATUS_LABELS[status]}</Badge>
                <h3 className="mt-3 text-base font-semibold text-foreground">{item.deal.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{addressForDeal(item.deal)}</p>
                {item.row.notes && (
                  <p className="mt-3 line-clamp-2 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                    {item.row.notes}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <MiniScore label="Match cliente" value={matchScore !== null ? `${matchScore}%` : '-'} />
                <Button asChild size="sm" variant="outline">
                  <Link href={`/imoveis/${item.deal.id}?clientId=${client.id}`}>
                    <ArrowUpRight className="mr-2 size-4" />
                    Abrir
                  </Link>
                </Button>
              </div>
            </div>
            <ClientOpportunityNotesForm
              clientId={client.id}
              opportunityId={item.deal.id}
              status={status}
              notes={item.row.notes ?? null}
            />
          </article>
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

export default async function InvestorDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const query = await searchParams
  const tab = normalizeTab(query?.tab)
  const selectedOpportunityId = firstParam(query?.opportunity)
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
  const summaryListingIds = Array.from(new Set([
    ...matches.map((match) => match.listing_id),
    ...pipelineItems.map((item) => item.deal.id),
  ]))
  const summaries = await loadSummaries(supabase, userId, summaryListingIds)
  const { getOmSendsForInvestorAction } = await import('@/lib/actions/om-actions')
  const omSends = tab === 'exports' ? await getOmSendsForInvestorAction(client.id) : []

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
              As melhores oportunidades para este cliente, sem duplicar imóveis: matches, shortlist, mapa, notas e busca contextual sobre o motor global.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <RecalculateClientWorkspaceButton clientId={client.id} />
            <InvestorFormModal investor={client} />
          </div>
        </div>
      </div>

      <FindClientOpportunitiesForm
        clientId={client.id}
        defaultLocation={defaultSearchLocation(client)}
        defaultSearchTerm={defaultSearchTerm(client)}
      />

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
      {tab === 'matches' && <MatchesTab client={client} matches={matches} clientRows={clientRows} summaries={summaries} />}
      {tab === 'pipeline' && <PipelineTab client={client} items={pipelineItems} summaries={summaries} />}
      {tab === 'map' && <ClientMapTab clientId={client.id} matches={matches} selectedOpportunityId={selectedOpportunityId} />}
      {tab === 'saved' && <SavedTab client={client} items={pipelineItems} />}
      {tab === 'exports' && <InvestorExportsTab investorId={client.id} sends={omSends} />}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Send className="size-4" />
        <span>{matches.length} matches específicos</span>
        <span>·</span>
        <span>{clientRows.filter((row) => row.status === 'saved').length} salvos</span>
        <span>·</span>
        <span>oportunidades continuam globais</span>
      </div>
    </div>
    </PageContent>
  )
}
