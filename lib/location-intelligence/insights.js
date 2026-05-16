/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require('zod')
const {
  LocationInsightInputSchema,
  LocationInsightPersistedSchema,
} = require('../schemas/location-insight.js')

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

function isReliableNearbyBusiness(business) {
  const source = String(business.source ?? '').toLowerCase()
  return source !== 'mock' && source !== 'mock_places' && source !== 'demo'
}

function reliableNearbyBusinesses(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .filter(isReliableNearbyBusiness)
}

function mapRowToInsight(row) {
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
    rawGeocode: row.raw_geocode ?? {},
    rawDemographics: row.raw_demographics ?? {},
    rawPlaces: row.raw_places ?? {},
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  })
}

function toLocationInsightInsert(userId, insight) {
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
    nearby_businesses: reliableNearbyBusinesses(parsed.nearbyBusinesses),
    data_sources: parsed.dataSources,
    confidence_score: parsed.confidenceScore,
    raw_geocode: parsed.rawGeocode,
    raw_demographics: parsed.rawDemographics,
    raw_places: parsed.rawPlaces,
  }
}

async function createLocationInsight(supabase, userId, insight) {
  const payload = toLocationInsightInsert(userId, insight)
  const { data, error } = await supabase.from('location_insights')
    .insert(payload)
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to create location insight.' }
  }

  return { data: mapRowToInsight(data), error: null }
}

async function getLocationInsight(supabase, userId, insightId) {
  const { data } = await supabase.from('location_insights')
    .select('*')
    .eq('id', insightId)
    .eq('user_id', userId)
    .maybeSingle()

  return data ? mapRowToInsight(data) : null
}

async function getListingLocationInsight(supabase, userId, listingId) {
  const { data } = await supabase.from('location_insights')
    .select('*')
    .eq('listing_id', listingId)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ? mapRowToInsight(data) : null
}

async function upsertLocationInsightForListing(supabase, userId, listingId, insight) {
  const payload = toLocationInsightInsert(userId, {
    ...insight,
    listingId,
  })

  const { data, error } = await supabase.from('location_insights')
    .upsert(payload, {
      onConflict: 'user_id,listing_id',
    })
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to save location insight.' }
  }

  return { data: mapRowToInsight(data), error: null }
}

module.exports = {
  createLocationInsight,
  getListingLocationInsight,
  getLocationInsight,
  toLocationInsightInsert,
  upsertLocationInsightForListing,
}
