import 'server-only'
import { createHash } from 'node:crypto'
import { createDealSummaryProvider, getDealSummaryProviderConfig } from '@/lib/ai/deal-summary-provider'
import { AiDealSummarySchema, type AiDealSummary, type DealSummaryInput } from '@/lib/ai/deal-summary-schema'
import type { Database, Json } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']
type LocationInsightRow = Database['public']['Tables']['location_insights']['Row']
type OpportunityScoreRow = Database['public']['Tables']['opportunity_scores']['Row']
type InvestorListingMatchRow = Database['public']['Tables']['investor_listing_matches']['Row']
type AiSummaryRow = Database['public']['Tables']['listing_ai_summaries']['Row']

type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

export type AiSummaryResult = {
  ok: boolean
  skipped?: boolean
  summary?: AiSummaryRow | null
  error?: string
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    return `{${entries.join(',')}}`
  }

  return JSON.stringify(value)
}

function hashInput(input: DealSummaryInput) {
  return createHash('sha256').update(stableStringify(input)).digest('hex')
}

function firstArray(value: Json | null): unknown[] {
  return Array.isArray(value) ? value : []
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseNearbyBusiness(item: unknown) {
  const business = item && typeof item === 'object' ? item as Record<string, unknown> : {}
  return {
    name: typeof business.name === 'string' ? business.name : null,
    category: typeof business.category === 'string' ? business.category : null,
    distanceMeters: toNumber(business.distanceMeters ?? business.distance_meters),
  }
}

function isReliableNearbyBusiness(item: unknown) {
  const business = item && typeof item === 'object' ? item as Record<string, unknown> : {}
  const source = String(business.source ?? '').toLowerCase()
  return source !== 'mock' && source !== 'mock_places' && source !== 'demo'
}

function normalizeSummary(value: Json | null): AiDealSummary | null {
  const parsed = AiDealSummarySchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

async function loadListing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<ListingRow | null> {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .eq('id', listingId)
    .maybeSingle()

  return (data ?? null) as ListingRow | null
}

async function loadLocationInsight(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<LocationInsightRow | null> {
  const { data } = await supabase
    .from('location_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data ?? null) as LocationInsightRow | null
}

async function loadUniversalScore(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<OpportunityScoreRow | null> {
  const { data } = await supabase
    .from('opportunity_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('strategy_slug', 'any')
    .maybeSingle()

  return (data ?? null) as OpportunityScoreRow | null
}

async function loadMatches(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<InvestorListingMatchRow[]> {
  const { data } = await supabase
    .from('investor_listing_matches')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .order('match_score', { ascending: false })
    .limit(5)

  return (data ?? []) as InvestorListingMatchRow[]
}

export async function loadAiDealSummary(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<AiSummaryRow | null> {
  const { data, error } = await supabase
    .from('listing_ai_summaries')
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (error) return null
  return (data ?? null) as AiSummaryRow | null
}

export function getAiSummaryJson(row: AiSummaryRow | null): AiDealSummary | null {
  if (!row || row.status !== 'completed') return null
  return normalizeSummary(row.summary)
}

export async function buildDealSummaryInput(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<{ input: DealSummaryInput | null; inputHash: string | null; error?: string }> {
  try {
    const listing = await loadListing(supabase, userId, listingId)
    if (!listing) return { input: null, inputHash: null, error: 'Imóvel não encontrado.' }

    const [insight, score, matches] = await Promise.all([
      loadLocationInsight(supabase, userId, listingId),
      loadUniversalScore(supabase, userId, listingId),
      loadMatches(supabase, userId, listingId),
    ])

    const nearbyBusinesses = firstArray(insight?.nearby_businesses ?? null)
      .filter(isReliableNearbyBusiness)
      .slice(0, 8)
      .map(parseNearbyBusiness)

    const input: DealSummaryInput = {
      listing: {
        title: listing.title,
        address: listing.address_text ?? null,
        location: [listing.neighborhood, listing.city, listing.state].filter(Boolean).join(', ') || listing.location_text,
        price: listing.price_amount ?? listing.price_text ?? null,
        areaSize: null,
        propertyType: listing.property_type ?? listing.commercial_type ?? null,
      },
      opportunityScore: {
        totalScore: score?.total_score ?? null,
        fitLabel: score?.fit_label ?? null,
        breakdown: score?.breakdown ?? [],
        signals: score?.signals ?? [],
        risks: score?.risks ?? [],
      },
      demographics: insight ? {
        avgIncome: insight.avg_income,
        populationDensity: insight.population_density,
        consumerProfile: insight.consumer_profile,
        confidenceScore: insight.confidence_score,
      } : null,
      nearbyBusinesses,
      investorMatches: matches.map((match) => ({
        investorName: null,
        matchScore: match.match_score,
        matchStatus: match.match_status,
        explanation: match.explanation,
      })),
    }

    return { input, inputHash: hashInput(input) }
  } catch (error) {
    return {
      input: null,
      inputHash: null,
      error: error instanceof Error ? error.message : 'Não foi possível montar os dados do resumo.',
    }
  }
}

async function upsertSummaryStatus(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  payload: Partial<AiSummaryRow> & { status: string }
) {
  const config = getDealSummaryProviderConfig()

  return supabase
    .from('listing_ai_summaries')
    .upsert({
      user_id: userId,
      listing_id: listingId,
      provider: payload.provider ?? config.provider,
      model: payload.model ?? config.model,
      ...payload,
    }, { onConflict: 'user_id,listing_id' })
    .select('*')
    .single()
}

function unavailableSummary(): AiDealSummary {
  return {
    headline: 'AI summary unavailable',
    best_fit: ['Dados insuficientes'],
    strengths: ['Resumo indisponível no momento'],
    risks: ['Configure a chave de API para gerar o resumo'],
    investor_angle: 'Não foi possível gerar a análise automática com a configuração atual.',
    recommended_action: 'Configure a chave de API do provedor e tente regenerar o resumo.',
    confidence: 'low',
  }
}

export async function generateAiDealSummary(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  options: { force?: boolean } = {}
): Promise<AiSummaryResult> {
  const built = await buildDealSummaryInput(supabase, userId, listingId)
  if (!built.input || !built.inputHash) {
    return { ok: false, error: built.error ?? 'Não foi possível montar os dados do resumo.' }
  }

  const existing = await loadAiDealSummary(supabase, userId, listingId)
  if (
    !options.force &&
    existing?.status === 'completed' &&
    existing.input_data_hash === built.inputHash &&
    normalizeSummary(existing.summary)
  ) {
    return { ok: true, skipped: true, summary: existing }
  }

  try {
    await upsertSummaryStatus(supabase, userId, listingId, {
      status: 'processing',
      input_data_hash: built.inputHash,
      error_message: null,
    })

    const config = getDealSummaryProviderConfig()
    const provider = createDealSummaryProvider()
    const summary = await provider.generate({
      input: built.input,
      temperature: config.temperature,
    })

    const { data, error } = await upsertSummaryStatus(supabase, userId, listingId, {
      status: 'completed',
      summary: summary as unknown as Json,
      provider: provider.provider,
      model: provider.model,
      generated_at: new Date().toISOString(),
      input_data_hash: built.inputHash,
      error_message: null,
    })

    if (error || !data) throw new Error(error?.message ?? 'Não foi possível salvar o resumo.')
    return { ok: true, summary: data as AiSummaryRow }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI summary unavailable.'
    try {
      const { data } = await upsertSummaryStatus(supabase, userId, listingId, {
        status: 'failed',
        summary: unavailableSummary() as unknown as Json,
        input_data_hash: built.inputHash,
        error_message: message,
      })

      return { ok: false, summary: (data ?? null) as AiSummaryRow | null, error: message }
    } catch {
      return { ok: false, summary: null, error: message }
    }
  }
}
