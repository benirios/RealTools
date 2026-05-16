import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { rankInvestorDeals } from '@/lib/investors/matching'
import { enrichListingFields } from '@/lib/listings/enrichment'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: investor } = await (supabase.from('investors') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!investor) return NextResponse.json({ error: 'Investor not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listings, error } = await (supabase.from('listings') as any)
    .select('id, title, price_text, price_amount, neighborhood, location_text, address_text, city, state, property_type, commercial_type, confidence, tags, source, source_url, description, images, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 })

  const normalizedListings = (listings ?? []).map((listing: Record<string, unknown>) => {
    const enriched = enrichListingFields(listing)
    return {
      ...listing,
      price_amount: listing.price_amount ?? enriched.priceAmount ?? null,
      property_type: listing.property_type ?? enriched.propertyType ?? null,
      tags: Array.isArray(listing.tags) && listing.tags.length > 0 ? listing.tags : enriched.tags,
    }
  })

  const listingIds = normalizedListings.map((listing: Record<string, unknown>) => String(listing.id)).filter(Boolean)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: scores } = listingIds.length ? await (supabase.from('opportunity_scores') as any)
    .select('*')
    .eq('user_id', user.id)
    .in('listing_id', listingIds)
    .order('total_score', { ascending: false }) : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: insights } = listingIds.length ? await (supabase.from('location_insights') as any)
    .select('*')
    .eq('user_id', user.id)
    .in('listing_id', listingIds) : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: strategyScores } = listingIds.length ? await (supabase.from('strategy_fit_scores') as any)
    .select('*')
    .eq('user_id', user.id)
    .in('listing_id', listingIds) : { data: [] }

  const scoreByListing = new Map<string, Record<string, unknown>>()
  for (const score of (scores ?? []) as Record<string, unknown>[]) {
    const listingId = String(score.listing_id)
    if (score.strategy_slug === 'any' || !scoreByListing.has(listingId)) scoreByListing.set(listingId, score)
  }

  const insightByListing = new Map((insights ?? []).map((insight: Record<string, unknown>) => [String(insight.listing_id), insight]))
  const strategyScoresByListing = new Map<string, Record<string, unknown>[]>()
  for (const score of (strategyScores ?? []) as Record<string, unknown>[]) {
    const listingId = String(score.listing_id)
    const current = strategyScoresByListing.get(listingId) ?? []
    current.push(score)
    strategyScoresByListing.set(listingId, current)
  }

  const enrichedListings = normalizedListings.map((listing: Record<string, unknown>) => {
    const listingId = String(listing.id)
    const score = scoreByListing.get(listingId)
    return {
      ...listing,
      opportunity_score: typeof score?.total_score === 'number' ? score.total_score : null,
      location_insight: insightByListing.get(listingId) ?? null,
      strategy_fit_scores: strategyScoresByListing.get(listingId) ?? [],
    }
  })

  const matches = rankInvestorDeals(investor, enrichedListings).slice(0, 50)

  return NextResponse.json({ investor, matches })
}
