import { z } from 'zod'
import type { Database, Json } from '@/types/supabase'
import {
  LocationInsightInputSchema,
  LocationInsightPersistedSchema,
  type LocationInsightInput,
  type LocationInsightPersisted,
} from '@/lib/schemas/location-insight'
import type { ResolvedLocationIntelligence } from '@/lib/location-intelligence/providers'

type LocationInsightRow = Database['public']['Tables']['location_insights']['Row']
type LocationInsightInsert = Database['public']['Tables']['location_insights']['Insert']
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

const ResolvedLocationInsightSchema = LocationInsightInputSchema.extend({
  listingId: z.string().uuid().nullable().optional(),
  address: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default('BR'),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  avgIncome: z.number().nonnegative().nullable().optional(),
  populationDensity: z.number().nonnegative().nullable().optional(),
  consumerProfile: z.string().nullable().optional(),
  nearbyBusinesses: z.array(z.record(z.unknown())).default([]),
  dataSources: z.array(z.record(z.unknown())).default([]),
  confidenceScore: z.number().int().min(0).max(100),
  rawGeocode: z.unknown().default({}),
  rawDemographics: z.unknown().default({}),
  rawPlaces: z.unknown().default({}),
})

function isReliableNearbyBusiness(business: Record<string, unknown>): boolean {
  const source = String(business.source ?? '').toLowerCase()
  return source !== 'mock' && source !== 'mock_places' && source !== 'demo'
}

function reliableNearbyBusinesses(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .filter(isReliableNearbyBusiness)
}

function mapRowToInsight(row: LocationInsightRow): LocationInsightPersisted {
  return LocationInsightPersistedSchema.parse({
    id: row.id,
    userId: row.user_id,
    listingId: row.listing_id,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    avgIncome: row.avg_income,
    populationDensity: row.population_density,
    consumerProfile: row.consumer_profile,
    nearbyBusinesses: reliableNearbyBusinesses(row.nearby_businesses),
    dataSources: Array.isArray(row.data_sources) ? row.data_sources : [],
    confidenceScore: row.confidence_score,
    rawGeocode: (row.raw_geocode ?? {}) as Record<string, unknown>,
    rawDemographics: (row.raw_demographics ?? {}) as Record<string, unknown>,
    rawPlaces: (row.raw_places ?? {}) as Record<string, unknown>,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  })
}

export function toLocationInsightInsert(
  userId: string,
  insight: ResolvedLocationIntelligence
): LocationInsightInsert {
  const parsed = ResolvedLocationInsightSchema.parse(insight)

  return {
    user_id: userId,
    listing_id: parsed.listingId ?? null,
    address: parsed.address ?? null,
    neighborhood: parsed.neighborhood ?? null,
    city: parsed.city,
    state: parsed.state,
    country: parsed.country ?? 'BR',
    latitude: parsed.latitude ?? null,
    longitude: parsed.longitude ?? null,
    avg_income: parsed.avgIncome ?? null,
    population_density: parsed.populationDensity ?? null,
    consumer_profile: parsed.consumerProfile ?? null,
    nearby_businesses: reliableNearbyBusinesses(parsed.nearbyBusinesses) as Json,
    data_sources: parsed.dataSources as Json,
    confidence_score: parsed.confidenceScore,
    raw_geocode: parsed.rawGeocode as Json,
    raw_demographics: parsed.rawDemographics as Json,
    raw_places: parsed.rawPlaces as Json,
  }
}

export async function createLocationInsight(
  supabase: SupabaseLike,
  userId: string,
  insight: ResolvedLocationIntelligence
): Promise<{ data: LocationInsightPersisted | null; error: string | null }> {
  const payload = toLocationInsightInsert(userId, insight)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('location_insights') as any)
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to create location insight.' }
  }

  return { data: mapRowToInsight(data as LocationInsightRow), error: null }
}

export async function getLocationInsight(
  supabase: SupabaseLike,
  userId: string,
  insightId: string
): Promise<LocationInsightPersisted | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('location_insights') as any)
    .select('*')
    .eq('id', insightId)
    .eq('user_id', userId)
    .maybeSingle()

  return data ? mapRowToInsight(data as LocationInsightRow) : null
}

export async function getListingLocationInsight(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<LocationInsightPersisted | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('location_insights') as any)
    .select('*')
    .eq('listing_id', listingId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ? mapRowToInsight(data as LocationInsightRow) : null
}

export async function upsertLocationInsightForListing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  insight: ResolvedLocationIntelligence
): Promise<{ data: LocationInsightPersisted | null; error: string | null }> {
  const payload = toLocationInsightInsert(userId, {
    ...insight,
    listingId,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('location_insights') as any)
    .upsert(payload, {
      onConflict: 'user_id,listing_id',
    })
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to save location insight.' }
  }

  return { data: mapRowToInsight(data as LocationInsightRow), error: null }
}

export type { LocationInsightPersisted, LocationInsightInput }
