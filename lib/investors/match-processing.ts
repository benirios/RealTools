import 'server-only'
import { createHash } from 'node:crypto'
import { calculateInvestorDealMatch, type InvestorDealMatch } from '@/lib/investors/matching'
import { enrichListingFields } from '@/lib/listings/enrichment'
import type { Database, Json } from '@/types/supabase'

type InvestorRow = Database['public']['Tables']['investors']['Row']
type ListingRow = Database['public']['Tables']['listings']['Row']
type LocationInsightRow = Database['public']['Tables']['location_insights']['Row']
type OpportunityScoreRow = Database['public']['Tables']['opportunity_scores']['Row']
type StrategyFitScoreRow = Database['public']['Tables']['strategy_fit_scores']['Row']
type InvestorListingMatchRow = Database['public']['Tables']['investor_listing_matches']['Row']

type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

export type MatchDeal = Pick<
  ListingRow,
  | 'id'
  | 'title'
  | 'price_text'
  | 'price_amount'
  | 'neighborhood'
  | 'location_text'
  | 'city'
  | 'state'
  | 'property_type'
  | 'commercial_type'
  | 'confidence'
  | 'tags'
  | 'source_url'
  | 'description'
> & {
  opportunity_score?: number | null
  location_insight?: LocationInsightRow | null
  strategy_fit_scores?: StrategyFitScoreRow[]
}

export type PersistedInvestorMatch = InvestorDealMatch & {
  id: string
  investor_id: string
  listing_id: string
  processed_at: string
  deal: MatchDeal
}

export type PersistedListingMatch = InvestorDealMatch & {
  id: string
  investor: Pick<InvestorRow, 'id' | 'name' | 'strategy' | 'risk_level'>
  processed_at: string
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function buildExplanation(result: InvestorDealMatch) {
  return result.explanation || `${result.match_score}/100 compatibility: ${result.reasons.slice(0, 3).join('; ')}.`
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, next]) => `${JSON.stringify(key)}:${stableStringify(next)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function inputHash(value: unknown) {
  return createHash('sha256').update(stableStringify(value)).digest('hex')
}

async function loadInvestors(
  supabase: SupabaseLike,
  userId: string,
  investorIds?: string[]
): Promise<InvestorRow[]> {
  let query = supabase.from('investors')
    .select('*')
    .eq('user_id', userId)

  if (investorIds?.length) query = query.in('id', unique(investorIds))

  const { data } = await query
  return (data ?? []) as InvestorRow[]
}

async function loadDeals(
  supabase: SupabaseLike,
  userId: string,
  listingIds?: string[]
): Promise<MatchDeal[]> {
  let listingQuery = supabase.from('listings')
    .select('*')
    .eq('user_id', userId)

  if (listingIds?.length) listingQuery = listingQuery.in('id', unique(listingIds))

  const { data: listings } = await listingQuery.order('created_at', { ascending: false })
  const rows = (listings ?? []) as ListingRow[]
  if (rows.length === 0) return []

  const ids = rows.map((listing) => listing.id)

  const { data: insights } = await supabase.from('location_insights')
    .select('*')
    .eq('user_id', userId)
    .in('listing_id', ids)

  const { data: scores } = await supabase.from('opportunity_scores')
    .select('*')
    .eq('user_id', userId)
    .in('listing_id', ids)
    .order('total_score', { ascending: false })

  const { data: strategyScores } = await supabase.from('strategy_fit_scores')
    .select('*')
    .eq('user_id', userId)
    .in('listing_id', ids)

  const insightByListing = new Map<string, LocationInsightRow>()
  for (const insight of ((insights ?? []) as LocationInsightRow[])) {
    if (insight.listing_id && !insightByListing.has(insight.listing_id)) {
      insightByListing.set(insight.listing_id, insight)
    }
  }

  const scoreByListing = new Map<string, OpportunityScoreRow>()
  for (const score of ((scores ?? []) as OpportunityScoreRow[])) {
    if (score.strategy_slug === 'any' || !scoreByListing.has(score.listing_id)) {
      scoreByListing.set(score.listing_id, score)
    }
  }

  const strategyScoresByListing = new Map<string, StrategyFitScoreRow[]>()
  for (const score of ((strategyScores ?? []) as StrategyFitScoreRow[])) {
    const current = strategyScoresByListing.get(score.listing_id) ?? []
    current.push(score)
    strategyScoresByListing.set(score.listing_id, current)
  }

  return rows.map((listing) => {
    const inferred = enrichListingFields(listing)
    const score = scoreByListing.get(listing.id)

    return {
      id: listing.id,
      title: listing.title,
      price_text: listing.price_text,
      price_amount: listing.price_amount ?? inferred.priceAmount ?? null,
      neighborhood: listing.neighborhood,
      location_text: listing.location_text,
      city: listing.city,
      state: listing.state,
      property_type: listing.property_type ?? inferred.propertyType ?? null,
      commercial_type: listing.commercial_type,
      confidence: listing.confidence,
      tags: listing.tags?.length ? listing.tags : inferred.tags,
      source_url: listing.source_url,
      description: listing.description,
      opportunity_score: score?.total_score ?? null,
      location_insight: insightByListing.get(listing.id) ?? null,
      strategy_fit_scores: strategyScoresByListing.get(listing.id) ?? [],
    }
  })
}

async function setListingsMatchingStatus(
  supabase: SupabaseLike,
  userId: string,
  listingIds: string[],
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error: string | null = null
) {
  if (listingIds.length === 0) return

  const payload = status === 'completed'
    ? { matching_status: status, matching_error: null, matching_last_processed_at: new Date().toISOString() }
    : { matching_status: status, matching_error: error }

  await supabase.from('listings')
    .update(payload)
    .eq('user_id', userId)
    .in('id', unique(listingIds))
}

async function upsertMatch(
  supabase: SupabaseLike,
  userId: string,
  investor: InvestorRow,
  deal: MatchDeal,
  matchResult: InvestorDealMatch
) {
  const generatedAt = new Date().toISOString()
  const payload = {
    user_id: userId,
    investor_id: investor.id,
    listing_id: deal.id,
    match_score: matchResult.match_score,
    match_status: matchResult.match_status,
    confidence: matchResult.confidence,
    explanation: buildExplanation(matchResult),
    reasons: matchResult.reasons as unknown as Json,
    breakdown: matchResult.breakdown as unknown as Json,
    strengths: matchResult.strengths as unknown as Json,
    concerns: matchResult.concerns as unknown as Json,
    recommended_action: matchResult.recommended_action,
    missing_data: matchResult.missing_data as unknown as Json,
    input_data_hash: inputHash({ investor, deal }),
    generated_at: generatedAt,
    processed_at: generatedAt,
  }

  const dbResult = await supabase.from('investor_listing_matches')
    .upsert(payload, { onConflict: 'user_id,investor_id,listing_id' })

  if (!dbResult.error) return dbResult

  const message = String(dbResult.error.message ?? '')
  const schemaLooksOlder =
    message.includes('confidence') ||
    message.includes('strengths') ||
    message.includes('concerns') ||
    message.includes('recommended_action') ||
    message.includes('missing_data') ||
    message.includes('input_data_hash') ||
    message.includes('generated_at')

  if (!schemaLooksOlder) return dbResult

  const legacyPayload = {
    user_id: userId,
    investor_id: investor.id,
    listing_id: deal.id,
    match_score: matchResult.match_score,
    match_status: matchResult.match_status,
    explanation: buildExplanation(matchResult),
    reasons: matchResult.reasons as unknown as Json,
    breakdown: matchResult.breakdown as unknown as Json,
    processed_at: generatedAt,
  }

  return supabase.from('investor_listing_matches')
    .upsert(legacyPayload, { onConflict: 'user_id,investor_id,listing_id' })
}

export async function recalculateMatches(
  supabase: SupabaseLike,
  userId: string,
  options: {
    investorIds?: string[]
    listingIds?: string[]
    force?: boolean
  } = {}
): Promise<{ matchedCount: number; investorCount: number; listingCount: number; skipped: boolean; error?: string }> {
  const listingIds = options.listingIds ? unique(options.listingIds) : undefined

  if (listingIds?.length && !options.force) {
    const { data: processingRows } = await supabase.from('listings')
      .select('id')
      .eq('user_id', userId)
      .in('id', listingIds)
      .eq('matching_status', 'processing')

    if ((processingRows ?? []).length > 0) {
      return { matchedCount: 0, investorCount: 0, listingCount: 0, skipped: true }
    }
  }

  try {
    const investors = await loadInvestors(supabase, userId, options.investorIds)
    const deals = await loadDeals(supabase, userId, listingIds)
    const matchedListingIds = deals.map((deal) => deal.id)

    await setListingsMatchingStatus(supabase, userId, matchedListingIds, 'processing')

    let matchedCount = 0
    for (const investor of investors) {
      for (const deal of deals) {
        const result = calculateInvestorDealMatch(investor as unknown as Record<string, unknown>, deal as unknown as Record<string, unknown>)
        const { error } = await upsertMatch(supabase, userId, investor, deal, result)
        if (error) throw new Error(error.message ?? 'Failed to save match.')
        matchedCount += 1
      }
    }

    await setListingsMatchingStatus(supabase, userId, matchedListingIds, 'completed')

    return {
      matchedCount,
      investorCount: investors.length,
      listingCount: deals.length,
      skipped: false,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to recalculate matches.'
    if (listingIds?.length) {
      await setListingsMatchingStatus(supabase, userId, listingIds, 'failed', message)
    }
    return { matchedCount: 0, investorCount: 0, listingCount: 0, skipped: false, error: message }
  }
}

export async function recalculateMatchesForInvestor(
  supabase: SupabaseLike,
  userId: string,
  investorId: string,
  force = false
) {
  return recalculateMatches(supabase, userId, { investorIds: [investorId], force })
}

export async function recalculateMatchesForListing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  force = false
) {
  return recalculateMatches(supabase, userId, { listingIds: [listingId], force })
}

export async function recalculateAllMatches(
  supabase: SupabaseLike,
  userId: string,
  force = false
) {
  return recalculateMatches(supabase, userId, { force })
}

export async function loadPersistedMatchesForInvestor(
  supabase: SupabaseLike,
  userId: string,
  investorId: string,
  limit = 25
): Promise<PersistedInvestorMatch[]> {
  const { data: matches } = await supabase.from('investor_listing_matches')
    .select('*')
    .eq('user_id', userId)
    .eq('investor_id', investorId)
    .order('match_score', { ascending: false })
    .limit(limit)

  const rows = (matches ?? []) as InvestorListingMatchRow[]
  if (rows.length === 0) return []

  const deals = await loadDeals(supabase, userId, rows.map((match) => match.listing_id))
  const dealById = new Map(deals.map((deal) => [deal.id, deal]))

  return rows.flatMap((match) => {
    const deal = dealById.get(match.listing_id)
    if (!deal) return []

    return [{
      id: match.id,
      investor_id: match.investor_id,
      listing_id: match.listing_id,
      processed_at: match.processed_at,
      deal,
      match_score: match.match_score,
      match_status: match.match_status as InvestorDealMatch['match_status'],
      confidence: (match.confidence ?? 'medium') as InvestorDealMatch['confidence'],
      explanation: match.explanation,
      reasons: Array.isArray(match.reasons) ? match.reasons.filter((item): item is string => typeof item === 'string') : [],
      breakdown: match.breakdown as InvestorDealMatch['breakdown'],
      strengths: Array.isArray(match.strengths) ? match.strengths.filter((item): item is string => typeof item === 'string') : [],
      concerns: Array.isArray(match.concerns) ? match.concerns.filter((item): item is string => typeof item === 'string') : [],
      recommended_action: match.recommended_action ?? '',
      missing_data: Array.isArray(match.missing_data) ? match.missing_data.filter((item): item is string => typeof item === 'string') : [],
      point_id: match.listing_id,
    }]
  })
}

export async function loadPersistedMatchesForListing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  limit = 10
): Promise<PersistedListingMatch[]> {
  const { data: matches } = await supabase.from('investor_listing_matches')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .order('match_score', { ascending: false })
    .limit(limit)

  const rows = (matches ?? []) as InvestorListingMatchRow[]
  if (rows.length === 0) return []

  const investors = await loadInvestors(supabase, userId, rows.map((match) => match.investor_id))
  const investorById = new Map(investors.map((investor) => [investor.id, investor]))

  return rows.flatMap((match) => {
    const investor = investorById.get(match.investor_id)
    if (!investor) return []

    return [{
      id: match.id,
      investor: {
        id: investor.id,
        name: investor.name,
        strategy: investor.strategy,
        risk_level: investor.risk_level,
      },
      processed_at: match.processed_at,
      match_score: match.match_score,
      match_status: match.match_status as InvestorDealMatch['match_status'],
      confidence: (match.confidence ?? 'medium') as InvestorDealMatch['confidence'],
      explanation: match.explanation,
      reasons: Array.isArray(match.reasons) ? match.reasons.filter((item): item is string => typeof item === 'string') : [],
      breakdown: match.breakdown as InvestorDealMatch['breakdown'],
      strengths: Array.isArray(match.strengths) ? match.strengths.filter((item): item is string => typeof item === 'string') : [],
      concerns: Array.isArray(match.concerns) ? match.concerns.filter((item): item is string => typeof item === 'string') : [],
      recommended_action: match.recommended_action ?? '',
      missing_data: Array.isArray(match.missing_data) ? match.missing_data.filter((item): item is string => typeof item === 'string') : [],
      investor_id: match.investor_id,
      point_id: match.listing_id,
    }]
  })
}
