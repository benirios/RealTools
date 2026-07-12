import { ListingDraftSchema, ListingImportTargetSchema, type ListingDraft, type ListingImportTarget } from '@/lib/schemas/listing'
import type { Database, Json } from '@/types/supabase'

type ListingInsert = Database['public']['Tables']['listings']['Insert']
type ListingImportTargetInsert = Database['public']['Tables']['listing_import_targets']['Insert']
import type { SupabaseLike } from '@/lib/supabase/types'

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
  draft: ListingDraft,
  investorId?: string | null
) {
  const now = new Date().toISOString()
  const base = toListingInsert(userId, draft)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase.from('listings') as any)
    .select('id, investor_id')
    .eq('user_id', userId)
    .eq('source', base.source)
    .eq('source_url', base.source_url)
    .maybeSingle()

  const ownedByAnotherClient = Boolean(existing?.investor_id && investorId && existing.investor_id !== investorId)

  const insertData: ListingInsert = {
    ...base,
    investor_id: ownedByAnotherClient ? existing.investor_id : (investorId ?? existing?.investor_id ?? null),
    last_seen_at: now,
    updated_at:   now,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (supabase.from('listings') as any).upsert(insertData, {
    onConflict: 'user_id,source,source_url',
  })

  if (ownedByAnotherClient && existing) {
    // Client B's own search independently found a listing client A already
    // owns — link it into B's pipeline (same effect as a manual share)
    // rather than silently hiding a real match B's search legitimately found.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('investor_listing_matches') as any)
      .update({ is_manual_share: true })
      .eq('user_id', userId)
      .eq('investor_id', investorId)
      .eq('listing_id', existing.id)
  }

  return result
}

export async function upsertListingImportTarget(
  supabase: SupabaseLike,
  userId: string,
  target: ListingImportTarget,
  investorId?: string | null
) {
  const insertData: ListingImportTargetInsert = {
    ...toListingTargetInsert(userId, target),
    investor_id: investorId ?? null,
    updated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.from('listing_import_targets') as any).upsert(insertData, {
    onConflict: 'user_id,investor_id,source,country,state,city,search_term',
  })
}
