import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import type { Database } from '@/types/supabase'
import {
  LocationInsightInputSchema,
  LocationInsightPersistedSchema,
  type LocationInsightInput,
  type LocationInsightPersisted,
} from '@/lib/schemas/location-insight'
import {
  createLocationInsight,
  getListingLocationInsight,
  getLocationInsight,
  upsertLocationInsightForListing,
} from '@/lib/location-intelligence/insights'
import { resolveLocationIntelligence } from '@/lib/location-intelligence/providers'

type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}

type ListingRow = Database['public']['Tables']['listings']['Row']

export const CreateLocationInsightBodySchema = LocationInsightInputSchema

const ListingLocationInputSchema = z.object({
  listingId: z.string().uuid(),
})

export function buildListingLocationInput(listing: ListingRow): LocationInsightInput {
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

export function buildEphemeralLocationInsight(
  userId: string,
  insight: LocationInsightInput & {
    listingId?: string | null
    country?: string | null
    avgIncome?: number | null
    populationDensity?: number | null
    consumerProfile?: string | null
    nearbyBusinesses?: Array<Record<string, unknown>>
    dataSources?: Array<Record<string, unknown>>
    confidenceScore?: number
    rawGeocode?: unknown
    rawDemographics?: unknown
    rawPlaces?: unknown
  }
): LocationInsightPersisted {
  const rawGeocode = (insight.rawGeocode ?? {}) as Record<string, unknown>
  const rawDemographics = (insight.rawDemographics ?? {}) as Record<string, unknown>
  const rawPlaces = (insight.rawPlaces ?? {}) as Record<string, unknown>

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
    rawGeocode,
    rawDemographics,
    rawPlaces,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function resolveStandaloneLocationInsight(
  input: LocationInsightInput
): Promise<LocationInsightPersisted> {
  const parsed = CreateLocationInsightBodySchema.safeParse(input)
  if (!parsed.success) {
    throw new Error('Invalid location insight payload.')
  }

  const resolved = await resolveLocationIntelligence(parsed.data)
  return buildEphemeralLocationInsight(
    '00000000-0000-0000-0000-000000000000',
    resolved as Parameters<typeof buildEphemeralLocationInsight>[1]
  )
}

export async function persistStandaloneLocationInsight(
  supabase: SupabaseLike,
  userId: string,
  insight: LocationInsightInput
): Promise<{ data: LocationInsightPersisted | null; error: string | null }> {
  const parsed = CreateLocationInsightBodySchema.safeParse(insight)
  if (!parsed.success) {
    return { data: null, error: 'Invalid location insight payload.' }
  }

  const resolved = await resolveLocationIntelligence(parsed.data)
  return createLocationInsight(supabase, userId, resolved)
}

export async function loadListingForUser(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<ListingRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('listings') as any)
    .select('*')
    .eq('id', listingId)
    .eq('user_id', userId)
    .maybeSingle()

  return (data ?? null) as ListingRow | null
}

export async function createStandaloneLocationInsight(
  supabase: SupabaseLike,
  userId: string,
  input: LocationInsightInput
): Promise<{ data: LocationInsightPersisted | null; error: string | null }> {
  return persistStandaloneLocationInsight(supabase, userId, input)
}

export async function getLocationInsightById(
  supabase: SupabaseLike,
  userId: string,
  insightId: string
): Promise<LocationInsightPersisted | null> {
  return getLocationInsight(supabase, userId, insightId)
}

export async function getListingLocationInsightByListingId(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<LocationInsightPersisted | null> {
  return getListingLocationInsight(supabase, userId, listingId)
}

export async function enrichListingLocationInsight(
  supabase: SupabaseLike,
  userId: string,
  listingId: string
): Promise<{ data: LocationInsightPersisted | null; error: string | null }> {
  const listing = await loadListingForUser(supabase, userId, listingId)
  if (!listing) {
    return { data: null, error: 'Listing not found.' }
  }

  const resolved = await resolveLocationIntelligence(buildListingLocationInput(listing))
  return upsertLocationInsightForListing(supabase, userId, listing.id, resolved)
}

export async function normalizeCreateLocationInsightInput(
  input: unknown
): Promise<{ data: LocationInsightInput | null; error: string | null }> {
  const parsed = CreateLocationInsightBodySchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: 'Invalid location insight payload.' }
  }

  return { data: parsed.data, error: null }
}

export function parseListingLocationRequest(input: unknown): { data: { listingId: string } | null; error: string | null } {
  const parsed = ListingLocationInputSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: 'Invalid listing id.' }
  }

  return { data: parsed.data, error: null }
}
