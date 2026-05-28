import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { PageContent } from '@/components/page-content'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, ExternalLink, MapPin, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AiDealSummaryCard } from '@/components/listings/ai-deal-summary-card'
import { ListingImages } from '@/components/listings/listing-images'
import { ListingDescription } from '@/components/listings/listing-description'
import { ListingInvestorMatches } from '@/components/listings/listing-investor-matches'
import { LocationInsightAction } from '@/components/listings/location-insight-action'
import { LocationInsightCard } from '@/components/listings/location-insight-card'
import { OpportunityScoreCard } from '@/components/listings/opportunity-score-card'
import { StrategyFitCard } from '@/components/listings/strategy-fit-card'
import { ClientOpportunityNotesForm, ClientOpportunityPipelineActions } from '@/components/investors/client-workspace-actions'
import { getListingLocationInsightByListingId } from '@/lib/location-intelligence/api'
import { loadPersistedMatchesForListing, type PersistedListingMatch } from '@/lib/investors/match-processing'
import { getAiSummaryJson, loadAiDealSummary } from '@/lib/ai/deal-summary-service'
import type { AiDealSummary } from '@/lib/ai/deal-summary-schema'
import { getScoreHistory, getStrategyFitScores } from '@/lib/scoring/data'
import { scoreRowToCardEntry } from '@/lib/scoring/score-card-ui'
import type { Database } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']
type InvestorRow = Pick<Database['public']['Tables']['investors']['Row'], 'id' | 'name'>
type ClientOpportunityRow = Database['public']['Tables']['client_opportunities']['Row']
type WorkflowStatus = 'suggested' | 'saved' | 'sent' | 'interested' | 'rejected' | 'negotiating' | 'closed'
type ScoreEntry = ReturnType<typeof scoreRowToCardEntry>

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

function statusVariant(status: string) {
  if (status === 'failed') return 'destructive' as const
  if (status === 'completed') return 'default' as const
  return 'outline' as const
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  failed: 'Falhou',
}

const CLIENT_STATUS_LABELS: Record<WorkflowStatus, string> = {
  suggested: 'Sugerida',
  saved: 'Salva',
  sent: 'Enviada',
  interested: 'Interessado',
  rejected: 'Rejeitada',
  negotiating: 'Negociando',
  closed: 'Fechada',
}

function clientStatusVariant(status: WorkflowStatus) {
  if (['saved', 'sent', 'interested', 'negotiating', 'closed'].includes(status)) return 'default' as const
  if (status === 'rejected') return 'secondary' as const
  return 'outline' as const
}

function normalizeClientStatus(value: string | null | undefined): WorkflowStatus {
  const statuses: WorkflowStatus[] = ['suggested', 'saved', 'sent', 'interested', 'rejected', 'negotiating', 'closed']
  return statuses.includes(value as WorkflowStatus) ? value as WorkflowStatus : 'suggested'
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function uniqueItems(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))))
}

function clientFitLabel(score: number | null, matchStatus?: string) {
  if (matchStatus === 'strong' || (score !== null && score >= 80)) return 'Forte aderência para este cliente'
  if (matchStatus === 'medium' || (score !== null && score >= 60)) return 'Aderência moderada para este cliente'
  if (score !== null) return 'Aderência baixa para este cliente'
  return 'Aguardando cálculo de aderência'
}

function confidenceLabel(value: string | null | undefined) {
  if (value === 'high') return 'Confiança alta'
  if (value === 'medium') return 'Confiança média'
  if (value === 'low') return 'Confiança baixa'
  return 'Confiança em cálculo'
}

function compactSummary(summary: AiDealSummary | null, match: PersistedListingMatch | undefined) {
  return summary?.headline
    ?? summary?.investor_angle
    ?? match?.explanation
    ?? 'Resumo ainda não gerado. A oportunidade já pode ser avaliada pelos sinais de match disponíveis.'
}

function fitReasons(summary: AiDealSummary | null, match: PersistedListingMatch | undefined, scores: ScoreEntry[]) {
  const scoreSignals = scores.flatMap((entry) => entry.result.signals.map((signal) => signal.label))
  return uniqueItems([
    ...(summary?.best_fit ?? []),
    ...(summary?.strengths ?? []),
    ...(match?.strengths ?? []),
    ...(match?.reasons ?? []),
    ...scoreSignals,
  ]).slice(0, 4)
}

function riskReasons(summary: AiDealSummary | null, match: PersistedListingMatch | undefined, scores: ScoreEntry[]) {
  const scoreRisks = scores.flatMap((entry) => entry.result.risks.map((risk) => risk.label))
  return uniqueItems([
    ...(summary?.risks ?? []),
    ...(match?.concerns ?? []),
    ...scoreRisks,
  ]).slice(0, 4)
}

function ClientOpportunityRecommendationView({
  listing,
  client,
  clientOpportunity,
  clientMatch,
  location,
  images,
  description,
  reasoning,
  locationInsight,
  scoreEntries,
  strategyFitRows,
  aiSummaryRow,
  aiSummary,
}: {
  listing: ListingRow
  client: InvestorRow
  clientOpportunity: ClientOpportunityRow | null
  clientMatch: PersistedListingMatch | undefined
  location: string
  images: string[]
  description: string | null
  reasoning: string | null
  locationInsight: Awaited<ReturnType<typeof getListingLocationInsightByListingId>>
  scoreEntries: ScoreEntry[]
  strategyFitRows: Awaited<ReturnType<typeof getStrategyFitScores>>
  aiSummaryRow: Awaited<ReturnType<typeof loadAiDealSummary>>
  aiSummary: AiDealSummary | null
}) {
  const status = normalizeClientStatus(clientOpportunity?.status)
  const fitScore = clientOpportunity?.match_score ?? clientMatch?.match_score ?? scoreEntries[0]?.result.totalScore ?? null
  const confidence = clientMatch?.confidence ?? aiSummary?.confidence ?? null
  const reasons = fitReasons(aiSummary, clientMatch, scoreEntries)
  const risks = riskReasons(aiSummary, clientMatch, scoreEntries)
  const recommendedAction = clientMatch?.recommended_action || aiSummary?.recommended_action || 'Decida o próximo estágio deste cliente no pipeline.'

  return (
    <PageContent>
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/investors/${client.id}?tab=matches`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao workspace do cliente
        </Link>
        <Button asChild variant="outline" size="sm">
          <a href={listing.source_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 size-4" />
            Ver no OLX
          </a>
        </Button>
      </div>

      <section className="rounded-md border border-border bg-card p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recomendação para {client.name}</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground">{listing.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {location}
                </span>
              )}
              {listing.price_text && <span>{listing.price_text}</span>}
              {(listing.property_type || listing.commercial_type) && <span>{listing.property_type ?? listing.commercial_type}</span>}
            </div>
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client Fit Score</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-4xl font-semibold leading-none text-foreground">{fitScore ?? '-'}</span>
              <span className="pb-1 text-sm text-muted-foreground">/100</span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">{clientFitLabel(fitScore, clientMatch?.match_status)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={clientStatusVariant(status)}>{CLIENT_STATUS_LABELS[status]}</Badge>
              <Badge variant="outline">{confidenceLabel(confidence)}</Badge>
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-5">
            <ListingImages images={images} />
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-foreground">Por que faz sentido</h2>
          </div>
          {reasons.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Sinais de aderência ainda em cálculo.</p>
          )}
        </div>

        <div className="rounded-md border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">Riscos</h2>
          </div>
          {risks.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {risks.map((risk) => <li key={risk}>{risk}</li>)}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum risco principal registrado até agora.</p>
          )}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Resumo IA</h2>
        </div>
        <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {compactSummary(aiSummary, clientMatch)}
        </p>
      </section>

      <section className="rounded-md border border-border bg-card p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Próxima ação</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{recommendedAction}</h2>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/investors/${client.id}?tab=pipeline`}>Ver pipeline</Link>
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          <ClientOpportunityPipelineActions clientId={client.id} opportunityId={listing.id} />
          <ClientOpportunityNotesForm
            clientId={client.id}
            opportunityId={listing.id}
            status={status}
            notes={clientOpportunity?.notes ?? null}
          />
        </div>
      </section>

      <details className="group rounded-md border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Análise avançada</p>
            <h2 className="text-lg font-semibold text-foreground">Ver dados técnicos e enriquecimento</h2>
          </div>
          <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-border p-5">
          {description && <ListingDescription title={listing.title} description={description} />}
          {reasoning && (
            <div className="rounded-md border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Análise de classificação</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reasoning}</p>
            </div>
          )}

          <div className="space-y-4 rounded-md border border-border bg-background p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência de localização</p>
                <h3 className="text-base font-semibold text-foreground">Enriquecimento da localização</h3>
              </div>
              <LocationInsightAction listingId={listing.id} />
            </div>
            {locationInsight ? (
              <LocationInsightCard insight={locationInsight} />
            ) : (
              <p className="text-sm text-muted-foreground">Dados secundários ainda não disponíveis. O pipeline já pode usar o score e o resumo pré-calculados.</p>
            )}
          </div>

          <OpportunityScoreCard
            listingId={listing.id}
            locationInsightAvailable={Boolean(locationInsight)}
            initialScores={scoreEntries}
          />

          <StrategyFitCard
            listingId={listing.id}
            locationInsightAvailable={Boolean(locationInsight)}
            initialScores={strategyFitRows}
          />

          <AiDealSummaryCard
            listingId={listing.id}
            summaryRow={aiSummaryRow}
            summary={aiSummary}
          />
        </div>
      </details>
    </div>
    </PageContent>
  )
}

export default async function ImovelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const clientId = firstParam(query?.clientId)
  const { userId } = await auth()
  if (!userId) redirect('/auth/login')

  const supabase = createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase.from('listings') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single() as { data: ListingRow | null }

  if (!listing) notFound()

  const locationInsight = await getListingLocationInsightByListingId(supabase, userId, id)
  const scoreRows = await getScoreHistory(supabase, userId, id)
  const scoreEntries = scoreRows.map(scoreRowToCardEntry)
  const strategyFitRows = await getStrategyFitScores(supabase, userId, id)
  const investorMatches = await loadPersistedMatchesForListing(supabase, userId, id)
  const aiSummaryRow = await loadAiDealSummary(supabase, userId, id)
  const aiSummary = getAiSummaryJson(aiSummaryRow)
  const clientContext = clientId
    ? await (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: client } = await (supabase.from('investors') as any)
        .select('id, name')
        .eq('id', clientId)
        .eq('user_id', userId)
        .maybeSingle() as { data: InvestorRow | null }

      if (!client) return null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clientOpportunity } = await (supabase.from('client_opportunities') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('client_id', client.id)
        .eq('opportunity_id', id)
        .maybeSingle() as { data: ClientOpportunityRow | null }

      return { client, clientOpportunity }
    })()
    : null
  const enrichmentStatus = listing.enrichment_status ?? 'pending'
  const matchingStatus = listing.matching_status ?? 'pending'

  const location = [listing.neighborhood, listing.city, listing.state].filter(Boolean).join(', ')
  const images = (listing.images as string[]) ?? []
  const isCloudflareBlock = (text: string | null) =>
    !!text && (text.includes('Please enable cookies') || text.includes('Cloudflare Ray ID'))
  const description = isCloudflareBlock(listing.description) ? null : listing.description
  const reasoning = isCloudflareBlock(listing.reasoning) ? null : listing.reasoning
  const clientMatch = clientContext
    ? investorMatches.find((match) => match.investor.id === clientContext.client.id)
    : undefined

  if (clientContext) {
    return (
      <ClientOpportunityRecommendationView
        listing={listing}
        client={clientContext.client}
        clientOpportunity={clientContext.clientOpportunity}
        clientMatch={clientMatch}
        location={location}
        images={images}
        description={description}
        reasoning={reasoning}
        locationInsight={locationInsight}
        scoreEntries={scoreEntries}
        strategyFitRows={strategyFitRows}
        aiSummaryRow={aiSummaryRow}
        aiSummary={aiSummary}
      />
    )
  }

  return (
    <PageContent>
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Link
        href="/imoveis"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para Imóveis
      </Link>

      <div className="rounded-md border border-border bg-card p-5 md:p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-semibold leading-tight text-foreground">{listing.title}</h1>
            {listing.price_text && (
              <p className="text-xl font-semibold text-primary">{listing.price_text}</p>
            )}
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                <span>{location}</span>
              </div>
            )}
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <a href={listing.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Ver no OLX
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.commercial_type && (
            <Badge variant="outline">{listing.commercial_type}</Badge>
          )}
          {listing.confidence != null && (
            <Badge variant="outline">{listing.confidence}% comercial</Badge>
          )}
          {listing.is_commercial != null && (
            <Badge variant={listing.is_commercial ? 'default' : 'secondary'}>
              {listing.is_commercial ? 'Comercial' : 'Não comercial'}
            </Badge>
          )}
          <Badge variant={statusVariant(enrichmentStatus)}>
            Enriquecimento: {STATUS_LABELS[enrichmentStatus] ?? enrichmentStatus}
          </Badge>
          <Badge variant={statusVariant(matchingStatus)}>
            Matches: {STATUS_LABELS[matchingStatus] ?? matchingStatus}
          </Badge>
        </div>

        {images.length > 0 && <ListingImages images={images} />}

        {description && (
          <ListingDescription title={listing.title} description={description} />
        )}

        {reasoning && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Análise de classificação</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{reasoning}</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-4">
          {listing.address_text && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Endereço</p>
              <p className="text-sm text-foreground">{listing.address_text}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Fonte</p>
            <p className="text-sm text-foreground capitalize">{listing.source}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Encontrado em</p>
            <p className="text-sm text-foreground">{formatDate(listing.first_seen_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Última atualização</p>
            <p className="text-sm text-foreground">{formatDate(listing.last_seen_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Enriquecido em</p>
            <p className="text-sm text-foreground">{formatDate(listing.enrichment_last_processed_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Matches em</p>
            <p className="text-sm text-foreground">{formatDate(listing.matching_last_processed_at)}</p>
          </div>
        </div>

        {(listing.enrichment_error || listing.matching_error) && (
          <div className="rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
            {listing.enrichment_error ?? listing.matching_error}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência de localização</p>
            <h2 className="text-lg font-semibold text-foreground">Enriquecimento da localização</h2>
          </div>
          <LocationInsightAction listingId={listing.id} />
        </div>

        {locationInsight ? (
          <LocationInsightCard insight={locationInsight} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda sem enriquecimento desta localização. Use o botão acima para gerar o contexto da área.
          </p>
        )}
      </div>

      <OpportunityScoreCard
        listingId={listing.id}
        locationInsightAvailable={Boolean(locationInsight)}
        initialScores={scoreEntries}
      />

      <StrategyFitCard
        listingId={listing.id}
        locationInsightAvailable={Boolean(locationInsight)}
        initialScores={strategyFitRows}
      />

      <AiDealSummaryCard
        listingId={listing.id}
        summaryRow={aiSummaryRow}
        summary={aiSummary}
      />

      <ListingInvestorMatches matches={investorMatches} />
    </div>
    </PageContent>
  )
}
