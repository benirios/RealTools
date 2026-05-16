/* eslint-disable @typescript-eslint/no-require-imports */
const { z } = require('zod')
const { randomUUID } = require('crypto')
const { LocationInsightPersistedSchema } = require('../schemas/location-insight.js')
const {
  createLocationInsight,
  getListingLocationInsight,
  getLocationInsight,
  upsertLocationInsightForListing,
} = require('./insights.js')
const { resolveLocationIntelligence } = require('./providers.js')

const LocationInsightInputSchema = z.object({
  listingId: z.string().uuid().nullable().optional(),
  address: z.string().min(2).nullable().optional(),
  neighborhood: z.string().min(1).nullable().optional(),
  city: z.string().min(1).nullable().optional(),
  state: z.string().min(1).nullable().optional(),
  country: z.string().default('BR'),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
})

const ListingLocationRequestSchema = z.object({
  listingId: z.string().uuid(),
})

function buildListingLocationInput(listing) {
  return LocationInsightInputSchema.parse({
    listingId: listing.id,
    address: listing.address_text ?? listing.location_text ?? null,
    neighborhood: listing.neighborhood ?? null,
    city: listing.city ?? null,
    state: listing.state ?? null,
    country: listing.country ?? 'BR',
    latitude: listing.lat ?? null,
    longitude: listing.lng ?? null,
  })
}

function buildEphemeralLocationInsight(userId, insight) {
  return LocationInsightPersistedSchema.parse({
    id: randomUUID(),
    userId,
    listingId: insight.listingId ?? null,
    address: insight.address ?? null,
    neighborhood: insight.neighborhood ?? null,
    city: insight.city,
    state: insight.state,
    country: insight.country ?? 'BR',
    latitude: insight.latitude ?? null,
    longitude: insight.longitude ?? null,
    avgIncome: insight.avgIncome ?? null,
    populationDensity: insight.populationDensity ?? null,
    consumerProfile: insight.consumerProfile ?? null,
    nearbyBusinesses: insight.nearbyBusinesses ?? [],
    dataSources: insight.dataSources ?? [],
    confidenceScore: insight.confidenceScore ?? 0,
    rawGeocode: insight.rawGeocode ?? {},
    rawDemographics: insight.rawDemographics ?? {},
    rawPlaces: insight.rawPlaces ?? {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

async function resolveStandaloneLocationInsight(input) {
  const parsed = LocationInsightInputSchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('Invalid location insight payload.')
  }

  const resolved = await resolveLocationIntelligence(parsed.data)
  return buildEphemeralLocationInsight('00000000-0000-0000-0000-000000000000', resolved)
}

async function persistStandaloneLocationInsight(supabase, userId, input) {
  const parsed = LocationInsightInputSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: 'Invalid location insight payload.' }
  }

  const resolved = await resolveLocationIntelligence(parsed.data)
  return createLocationInsight(supabase, userId, resolved)
}

async function loadListingForUser(supabase, userId, listingId) {
  const { data } = await supabase.from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('user_id', userId)
    .maybeSingle()

  return data ?? null
}

async function createStandaloneLocationInsight(supabase, userId, input) {
  return persistStandaloneLocationInsight(supabase, userId, input)
}

async function getLocationInsightById(supabase, userId, insightId) {
  return getLocationInsight(supabase, userId, insightId)
}

async function getListingLocationInsightByListingId(supabase, userId, listingId) {
  return getListingLocationInsight(supabase, userId, listingId)
}

async function enrichListingLocationInsight(supabase, userId, listingId) {
  const listing = await loadListingForUser(supabase, userId, listingId)
  if (!listing) {
    return { data: null, error: 'Listing not found.' }
  }

  const resolved = await resolveLocationIntelligence(buildListingLocationInput(listing))
  return upsertLocationInsightForListing(supabase, userId, listing.id, resolved)
}

async function normalizeCreateLocationInsightInput(input) {
  const parsed = LocationInsightInputSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: 'Invalid location insight payload.' }
  }

  return { data: parsed.data, error: null }
}

function parseListingLocationRequest(input) {
  const parsed = ListingLocationRequestSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: 'Invalid listing id.' }
  }

  return { data: parsed.data, error: null }
}

module.exports = {
  buildListingLocationInput,
  buildEphemeralLocationInsight,
  createStandaloneLocationInsight,
  enrichListingLocationInsight,
  getListingLocationInsightByListingId,
  getLocationInsightById,
  loadListingForUser,
  persistStandaloneLocationInsight,
  normalizeCreateLocationInsightInput,
  parseListingLocationRequest,
  resolveStandaloneLocationInsight,
}
