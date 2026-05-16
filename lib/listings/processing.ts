import 'server-only'
import { enrichListingLocationInsight } from '@/lib/location-intelligence/api'
import { scoreListingService } from '@/lib/scoring/service'
import { calculateStrategyFitScoresForListingService } from '@/lib/scoring/strategy-fit-service'
import { recalculateMatchesForListing } from '@/lib/investors/match-processing'
import { generateAiDealSummary } from '@/lib/ai/deal-summary-service'
import type { Database, Json } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']
type ImportRunRow = Database['public']['Tables']['listing_import_runs']['Row']

type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

type ListingProcessingResult = {
  listingId: string
  enriched: boolean
  scored: boolean
  matched: boolean
  aiSummarized: boolean
  skipped: boolean
  error?: string
}

function isCommercialPoint(listing: ListingRow) {
  return listing.is_commercial === true || Boolean(listing.commercial_type) || Boolean(listing.property_type)
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

async function loadListingForProcessing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<ListingRow | null> {
  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data ?? null) as ListingRow | null
}

async function updateListingProcessing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  values: Partial<Pick<
    ListingRow,
    | 'enrichment_status'
    | 'enrichment_last_processed_at'
    | 'enrichment_error'
    | 'matching_status'
    | 'matching_last_processed_at'
    | 'matching_error'
  >>
) {
  await supabase
    .from('listings')
    .update(values)
    .eq('id', listingId)
    .eq('user_id', userId)
}

export async function enrichScoreAndMatchListing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  options: { force?: boolean } = {}
): Promise<ListingProcessingResult> {
  const listing = await loadListingForProcessing(supabase, userId, listingId)
  if (!listing) {
    return { listingId, enriched: false, scored: false, matched: false, aiSummarized: false, skipped: false, error: 'Listing not found.' }
  }

  if (!options.force && listing.enrichment_status === 'processing') {
    return { listingId, enriched: false, scored: false, matched: false, aiSummarized: false, skipped: true }
  }

  await updateListingProcessing(supabase, userId, listingId, {
    enrichment_status: 'processing',
    enrichment_error: null,
  })

  try {
    const enrichment = await enrichListingLocationInsight(supabase, userId, listingId)
    if (enrichment.error) throw new Error(enrichment.error)

    await updateListingProcessing(supabase, userId, listingId, {
      enrichment_status: 'completed',
      enrichment_error: null,
      enrichment_last_processed_at: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process listing.'
    await updateListingProcessing(supabase, userId, listingId, {
      enrichment_status: 'failed',
      enrichment_error: message,
      enrichment_last_processed_at: new Date().toISOString(),
    })

    return { listingId, enriched: false, scored: false, matched: false, aiSummarized: false, skipped: false, error: message }
  }

  await updateListingProcessing(supabase, userId, listingId, {
    matching_status: 'processing',
    matching_error: null,
  })

  let scored = false
  try {
    const scoring = await scoreListingService(supabase, userId, listingId, 'any')
    if (scoring.errors?.general?.[0]) throw new Error(scoring.errors.general[0])

    const strategyFit = await calculateStrategyFitScoresForListingService(supabase, userId, listingId)
    if (strategyFit.errors?.general?.[0]) {
      await updateListingProcessing(supabase, userId, listingId, {
        matching_error: strategyFit.errors.general[0],
      })
    }
    scored = true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to calculate listing scores.'
    await updateListingProcessing(supabase, userId, listingId, {
      matching_error: message,
    })
  }

  const matching = await recalculateMatchesForListing(supabase, userId, listingId, options.force)
  if (matching.error) {
    await updateListingProcessing(supabase, userId, listingId, {
      matching_status: 'failed',
      matching_error: matching.error,
      matching_last_processed_at: new Date().toISOString(),
    })
    return { listingId, enriched: true, scored, matched: false, aiSummarized: false, skipped: false, error: matching.error }
  }

  const aiSummary = await generateAiDealSummary(supabase, userId, listingId, { force: false })

  return {
    listingId,
    enriched: true,
    scored,
    matched: !matching.skipped,
    aiSummarized: aiSummary.ok,
    skipped: matching.skipped,
  }
}

async function loadRunListingsByUrls(
  supabase: SupabaseLike,
  userId: string,
  savedUrls: string[]
): Promise<ListingRow[]> {
  const urls = unique(savedUrls)
  if (urls.length === 0) return []

  const { data } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', userId)
    .in('source_url', urls)

  return ((data ?? []) as ListingRow[]).filter(isCommercialPoint)
}

async function loadImportRun(
  supabase: SupabaseLike,
  userId: string,
  runId: string
): Promise<ImportRunRow | null> {
  const { data } = await supabase
    .from('listing_import_runs')
    .select('*')
    .eq('id', runId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data ?? null) as ImportRunRow | null
}

async function updateRunAutomationMetadata(
  supabase: SupabaseLike,
  userId: string,
  runId: string,
  metadata: Json | null,
  automation: Record<string, Json>
) {
  const base = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata
    : {}

  await supabase
    .from('listing_import_runs')
    .update({
      metadata: {
        ...base,
        automation,
      },
    })
    .eq('id', runId)
    .eq('user_id', userId)
}

export async function processImportRunListings(
  supabase: SupabaseLike,
  userId: string,
  runId: string,
  savedUrls: string[],
  options: { force?: boolean } = {}
) {
  const run = await loadImportRun(supabase, userId, runId)
  const listings = await loadRunListingsByUrls(supabase, userId, savedUrls)

  const results: ListingProcessingResult[] = []
  for (const listing of listings) {
    results.push(await enrichScoreAndMatchListing(supabase, userId, listing.id, options))
  }

  const automation = {
    status: results.some((result) => result.error) ? 'partial' : 'completed',
    force: Boolean(options.force),
    commercialCount: listings.length,
    enrichedCount: results.filter((result) => result.enriched).length,
    scoredCount: results.filter((result) => result.scored).length,
    matchedCount: results.filter((result) => result.matched).length,
    aiSummaryCount: results.filter((result) => result.aiSummarized).length,
    skippedCount: results.filter((result) => result.skipped).length,
    failedCount: results.filter((result) => result.error).length,
    processedAt: new Date().toISOString(),
    failures: results
      .filter((result) => result.error)
      .slice(0, 10)
      .map((result) => ({ listingId: result.listingId, error: result.error ?? 'Unknown error' })),
  }

  if (run) {
    await updateRunAutomationMetadata(supabase, userId, runId, run.metadata, automation as Record<string, Json>)
  }

  return { listings, results, automation }
}
