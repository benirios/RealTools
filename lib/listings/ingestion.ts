import { ListingDraftSchema, ListingImportTargetSchema, type ListingDraft, type ListingImportTarget } from '@/lib/schemas/listing'
import type { Database, Json } from '@/types/supabase'

type ListingInsert = Database['public']['Tables']['listings']['Insert']
type ListingImportTargetInsert = Database['public']['Tables']['listing_import_targets']['Insert']
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (relation: string) => any }

export function toListingInsert(userId: string, draft: ListingDraft): ListingInsert {
  const parsed = ListingDraftSchema.parse(draft)

  return {
    user_id:         userId,
    source:          parsed.source,
    source_url:      parsed.sourceUrl,
    title:           parsed.title,
    description:     parsed.description,
    price_text:      parsed.priceText,
    price_amount:    parsed.priceAmount,
    location_text:   parsed.locationText,
    address_text:    parsed.addressText,
    country:         parsed.country,
    state:           parsed.state,
    city:            parsed.city,
    neighborhood:    parsed.neighborhood,
    tags:            parsed.tags,
    property_type:   parsed.propertyType,
    lat:             parsed.lat,
    lng:             parsed.lng,
    images:          parsed.images,
    is_commercial:   parsed.isCommercial,
    commercial_type: parsed.commercialType,
    confidence:      parsed.confidence,
    reasoning:       parsed.reasoning,
    raw_payload:     parsed.rawPayload as Json,
  }
}

export function toListingTargetInsert(userId: string, target: ListingImportTarget): ListingImportTargetInsert {
  const parsed = ListingImportTargetSchema.parse(target)

  return {
    user_id:     userId,
    source:      parsed.source,
    country:     parsed.country,
    state:       parsed.state,
    city:        parsed.city,
    search_term: parsed.searchTerm,
    is_active:   parsed.isActive,
  }
}

export async function upsertListing(
  supabase: SupabaseLike,
  userId: string,
  draft: ListingDraft
) {
  const now = new Date().toISOString()
  const insertData: ListingInsert = {
    ...toListingInsert(userId, draft),
    last_seen_at: now,
    updated_at:   now,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('listings') as any).upsert(insertData, {
    onConflict: 'user_id,source,source_url',
  })
}

export async function upsertListingImportTarget(
  supabase: SupabaseLike,
  userId: string,
  target: ListingImportTarget
) {
  const insertData: ListingImportTargetInsert = {
    ...toListingTargetInsert(userId, target),
    updated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('listing_import_targets') as any).upsert(insertData, {
    onConflict: 'user_id,source,country,state,city,search_term',
  })
}
