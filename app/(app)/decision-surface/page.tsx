import { redirect } from 'next/navigation'
import { DecisionSurface, type DecisionOpportunity } from '@/components/listings/decision-surface'
import { getAiSummaryJson } from '@/lib/ai/deal-summary-service'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { AiDealSummary } from '@/lib/ai/deal-summary-schema'
import type { Database, Json } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']
type ScoreRow = Database['public']['Tables']['opportunity_scores']['Row']
type LocationInsightRow = Database['public']['Tables']['location_insights']['Row']
type MatchRow = Database['public']['Tables']['investor_listing_matches']['Row']
type InvestorRow = Database['public']['Tables']['investors']['Row']
type AiSummaryRow = Database['public']['Tables']['listing_ai_summaries']['Row']

type LoadError = { message?: string } | null

function jsonArray(value: Json | null): unknown[] {
  return Array.isArray(value) ? value : []
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function numberOrNull(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isBrazilCoordinate(lat: number, lng: number) {
  return lat >= -34 && lat <= 6 && lng >= -74 && lng <= -34
}

function normalizeBrazilCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
) {
  const nextLat = numberOrNull(lat)
  const nextLng = numberOrNull(lng)

  if (nextLat === null || nextLng === null) {
    return { lat: null, lng: null }
  }

  if (isBrazilCoordinate(nextLat, nextLng)) {
    return { lat: nextLat, lng: nextLng }
  }

  if (isBrazilCoordinate(nextLng, nextLat)) {
    return { lat: nextLng, lng: nextLat }
  }

  return { lat: nextLat, lng: nextLng }
}

function parseNearbyBusiness(item: unknown) {
  const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
  const distance = row.distanceMeters ?? row.distance_meters

  return {
    name: typeof row.name === 'string' ? row.name : null,
    category: typeof row.category === 'string' ? row.category : null,
    distanceMeters: typeof distance === 'number' && Number.isFinite(distance) ? distance : null,
  }
}

function isReliableNearbyBusiness(item: unknown) {
  const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
  const source = String(row.source ?? '').toLowerCase()
  return source !== 'mock' && source !== 'mock_places' && source !== 'demo'
}

function pickScore(scores: ScoreRow[]) {
  return scores.find((score) => score.strategy_slug === 'any') ?? scores[0] ?? null
}

function scoreByListing(scores: ScoreRow[]) {
  const grouped = new Map<string, ScoreRow[]>()

  for (const score of scores) {
    const current = grouped.get(score.listing_id) ?? []
    current.push(score)
    grouped.set(score.listing_id, current)
  }

  return new Map(Array.from(grouped.entries()).map(([listingId, rows]) => [listingId, pickScore(rows)]))
}

function latestByListing<T extends { listing_id: string | null }>(
  rows: T[],
  dateKey: keyof T
) {
  const byListing = new Map<string, T>()

  for (const row of rows) {
    if (!row.listing_id) continue
    const current = byListing.get(row.listing_id)
    const nextDate = String(row[dateKey] ?? '')
    const currentDate = current ? String(current[dateKey] ?? '') : ''

    if (!current || nextDate > currentDate) {
      byListing.set(row.listing_id, row)
    }
  }

  return byListing
}

function matchesByListing(matches: MatchRow[]) {
  const byListing = new Map<string, MatchRow[]>()

  for (const match of matches) {
    const current = byListing.get(match.listing_id) ?? []
    current.push(match)
    byListing.set(match.listing_id, current)
  }

  return byListing
}

function buildAddress(listing: ListingRow) {
  const location = [listing.neighborhood, listing.city, listing.state].filter(Boolean).join(', ')
  return listing.address_text || location || listing.location_text || null
}

function buildLastProcessed(listing: ListingRow, score: ScoreRow | null, summaryRow: AiSummaryRow | null) {
  return [
    listing.enrichment_last_processed_at,
    listing.matching_last_processed_at,
    score?.computed_at,
    summaryRow?.generated_at,
  ].filter(Boolean).sort().at(-1) ?? null
}

export default async function DecisionSurfacePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listingData, error: listingError } = await (supabase.from('listings') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: ListingRow[] | null; error: LoadError }

  if (listingError) {
    return (
      <DecisionSurface
        opportunities={[]}
        loadError={listingError.message ?? 'Não foi possível carregar os imóveis.'}
      />
    )
  }

  const listings = (listingData ?? []).filter((listing) => listing.is_commercial !== false)
  const listingIds = listings.map((listing) => listing.id)

  let scores: ScoreRow[] = []
  let insights: LocationInsightRow[] = []
  let matches: MatchRow[] = []
  let summaries: AiSummaryRow[] = []
  let investors: InvestorRow[] = []

  if (listingIds.length > 0) {
    const [scoreResult, insightResult, matchResult, summaryResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('opportunity_scores') as any)
        .select('*')
        .eq('user_id', user.id)
        .in('listing_id', listingIds)
        .order('total_score', { ascending: false }) as Promise<{ data: ScoreRow[] | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('location_insights') as any)
        .select('*')
        .eq('user_id', user.id)
        .in('listing_id', listingIds)
        .order('updated_at', { ascending: false }) as Promise<{ data: LocationInsightRow[] | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('investor_listing_matches') as any)
        .select('*')
        .eq('user_id', user.id)
        .in('listing_id', listingIds)
        .order('match_score', { ascending: false }) as Promise<{ data: MatchRow[] | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('listing_ai_summaries') as any)
        .select('*')
        .eq('user_id', user.id)
        .in('listing_id', listingIds)
        .order('updated_at', { ascending: false }) as Promise<{ data: AiSummaryRow[] | null }>,
    ])

    scores = scoreResult.data ?? []
    insights = insightResult.data ?? []
    matches = matchResult.data ?? []
    summaries = summaryResult.data ?? []

    const investorIds = Array.from(new Set(matches.map((match) => match.investor_id)))
    if (investorIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('investors') as any)
        .select('*')
        .eq('user_id', user.id)
        .in('id', investorIds) as { data: InvestorRow[] | null }
      investors = data ?? []
    }
  }

  const scoreMap = scoreByListing(scores)
  const insightMap = latestByListing(insights, 'updated_at')
  const summaryMap = latestByListing(summaries, 'updated_at')
  const matchMap = matchesByListing(matches)
  const investorMap = new Map(investors.map((investor) => [investor.id, investor]))

  const opportunities: DecisionOpportunity[] = listings.map((listing) => {
    const score = scoreMap.get(listing.id) ?? null
    const insight = insightMap.get(listing.id) ?? null
    const summaryRow = summaryMap.get(listing.id) ?? null
    const aiSummary = getAiSummaryJson(summaryRow) as AiDealSummary | null
    const listingMatches = (matchMap.get(listing.id) ?? []).slice(0, 8)
    const coordinates = normalizeBrazilCoordinates(
      listing.lat ?? insight?.latitude,
      listing.lng ?? insight?.longitude
    )

    return {
      id: listing.id,
      title: listing.title,
      address: buildAddress(listing),
      location: [listing.neighborhood, listing.city, listing.state].filter(Boolean).join(', ') || listing.location_text,
      priceText: listing.price_text,
      priceAmount: numberOrNull(listing.price_amount),
      propertyType: listing.property_type ?? listing.commercial_type,
      commercialType: listing.commercial_type,
      confidence: numberOrNull(listing.confidence),
      lat: coordinates.lat,
      lng: coordinates.lng,
      tags: listing.tags ?? [],
      sourceUrl: listing.source_url,
      enrichmentStatus: listing.enrichment_status ?? 'pending',
      matchingStatus: listing.matching_status ?? 'pending',
      enrichmentLastProcessedAt: listing.enrichment_last_processed_at,
      matchingLastProcessedAt: listing.matching_last_processed_at,
      firstSeenAt: listing.first_seen_at,
      lastProcessedAt: buildLastProcessed(listing, score, summaryRow),
      score: score ? {
        total: score.total_score,
        fitLabel: score.fit_label,
        location: score.location_score,
        demographics: score.demographics_score,
        footTraffic: score.foot_traffic_score,
        competition: score.competition_score,
        investorFit: score.investor_fit_score,
        risk: score.risk_score,
        breakdown: score.breakdown,
        risks: score.risks,
        signals: score.signals,
        computedAt: score.computed_at,
      } : null,
      aiSummary,
      aiSummaryStatus: summaryRow?.status ?? 'pending',
      aiSummaryGeneratedAt: summaryRow?.generated_at ?? null,
      investorMatches: listingMatches.map((match) => {
        const investor = investorMap.get(match.investor_id)

        return {
          id: match.id,
          investorName: investor?.name ?? 'Investidor',
          matchScore: match.match_score,
          matchStatus: match.match_status,
          explanation: match.explanation,
          reasons: stringArray(match.reasons),
          investorTags: investor?.tags ?? [],
          investorPreferences: [
            investor?.strategy,
            investor?.risk_level,
            ...(investor?.property_types ?? []),
            ...(investor?.preferred_neighborhoods ?? []),
          ].filter((item): item is string => Boolean(item)),
        }
      }),
      nearbyBusinesses: jsonArray(insight?.nearby_businesses ?? null)
        .filter(isReliableNearbyBusiness)
        .slice(0, 8)
        .map(parseNearbyBusiness),
      localIntelligence: insight ? {
        consumerProfile: insight.consumer_profile,
        avgIncome: insight.avg_income,
        populationDensity: insight.population_density,
        confidenceScore: insight.confidence_score,
        updatedAt: insight.updated_at,
      } : null,
    }
  })

  return <DecisionSurface opportunities={opportunities} />
}
