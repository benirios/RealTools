import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
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
import { getListingLocationInsightByListingId } from '@/lib/location-intelligence/api'
import { loadPersistedMatchesForListing } from '@/lib/investors/match-processing'
import { getAiSummaryJson, loadAiDealSummary } from '@/lib/ai/deal-summary-service'
import { getScoreHistory, getStrategyFitScores } from '@/lib/scoring/data'
import { scoreRowToCardEntry } from '@/lib/scoring/score-card-ui'
import type { Database } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

function statusVariant(status: string) {
  if (status === 'failed') return 'destructive' as const
  if (status === 'completed') return 'default' as const
  return 'outline' as const
}

export default async function ImovelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase.from('listings') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: ListingRow | null }

  if (!listing) notFound()

  const locationInsight = await getListingLocationInsightByListingId(supabase, user.id, id)
  const scoreRows = await getScoreHistory(supabase, user.id, id)
  const scoreEntries = scoreRows.map(scoreRowToCardEntry)
  const strategyFitRows = await getStrategyFitScores(supabase, user.id, id)
  const investorMatches = await loadPersistedMatchesForListing(supabase, user.id, id)
  const aiSummaryRow = await loadAiDealSummary(supabase, user.id, id)
  const aiSummary = getAiSummaryJson(aiSummaryRow)
  const enrichmentStatus = listing.enrichment_status ?? 'pending'
  const matchingStatus = listing.matching_status ?? 'pending'

  const location = [listing.neighborhood, listing.city, listing.state].filter(Boolean).join(', ')
  const images = (listing.images as string[]) ?? []
  const isCloudflareBlock = (text: string | null) =>
    !!text && (text.includes('Please enable cookies') || text.includes('Cloudflare Ray ID'))
  const description = isCloudflareBlock(listing.description) ? null : listing.description
  const reasoning = isCloudflareBlock(listing.reasoning) ? null : listing.reasoning

  return (
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
            Enriquecimento: {enrichmentStatus}
          </Badge>
          <Badge variant={statusVariant(matchingStatus)}>
            Matches: {matchingStatus}
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
  )
}
