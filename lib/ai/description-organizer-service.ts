import 'server-only'
import { hashInputs } from '@/lib/hash'
import { generateOrganizedDescription } from '@/lib/ai/description-organizer-provider'
import { OrganizedDescriptionSchema, type OrganizedDescription } from '@/lib/ai/description-organizer-schema'
import type { Database, Json } from '@/types/supabase'
import type { SupabaseLike } from '@/lib/supabase/types'

type ListingRow = Database['public']['Tables']['listings']['Row']

export type DescriptionOrganizerResult = {
  ok: boolean
  skipped?: boolean
  error?: string
}

function isCloudflareBlock(text: string) {
  return text.includes('Please enable cookies') || text.includes('Cloudflare Ray ID')
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

export function getOrganizedDescriptionJson(
  listing: Pick<ListingRow, 'description_organized' | 'description_organized_status'>
): OrganizedDescription | null {
  if (listing.description_organized_status !== 'completed') return null
  const parsed = OrganizedDescriptionSchema.safeParse(listing.description_organized)
  return parsed.success ? parsed.data : null
}

export async function generateDescriptionForListing(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  options: { force?: boolean } = {}
): Promise<DescriptionOrganizerResult> {
  const listing = await loadListing(supabase, userId, listingId)
  if (!listing) return { ok: false, error: 'Imóvel não encontrado.' }

  const rawDescription = listing.description
  if (!rawDescription || isCloudflareBlock(rawDescription)) {
    return { ok: false, error: 'Sem descrição disponível para organizar.' }
  }

  const inputHash = hashInputs({ title: listing.title, rawDescription })

  if (
    !options.force &&
    listing.description_organized_status === 'completed' &&
    listing.description_organized_hash === inputHash
  ) {
    return { ok: true, skipped: true }
  }

  await supabase
    .from('listings')
    .update({ description_organized_status: 'processing', description_organized_error: null })
    .eq('id', listingId)
    .eq('user_id', userId)

  try {
    const organized = await generateOrganizedDescription({ title: listing.title, rawDescription })

    const { error } = await supabase
      .from('listings')
      .update({
        description_organized: organized as unknown as Json,
        description_organized_status: 'completed',
        description_organized_hash: inputHash,
        description_organized_error: null,
      })
      .eq('id', listingId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message ?? 'Não foi possível salvar a descrição organizada.')
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível organizar a descrição.'
    await supabase
      .from('listings')
      .update({
        description_organized_status: 'failed',
        description_organized_hash: inputHash,
        description_organized_error: message,
      })
      .eq('id', listingId)
      .eq('user_id', userId)

    return { ok: false, error: message }
  }
}
