import 'server-only'
import Fuse from 'fuse.js'
import type { Database } from '@/types/supabase'
import type { SupabaseLike } from '@/lib/supabase/types'

type InvestorRow = Pick<Database['public']['Tables']['investors']['Row'], 'id' | 'name' | 'email' | 'tags'>
type ListingRow = Pick<Database['public']['Tables']['listings']['Row'], 'id' | 'title' | 'city' | 'neighborhood' | 'address_text'>

export type InvestorSearchResult = {
  type: 'investor'
  id: string
  name: string
  email: string | null
}

export type ListingSearchResult = {
  type: 'listing'
  id: string
  title: string
  location: string | null
}

const INVESTOR_FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'email', weight: 1.5 },
    { name: 'tags', weight: 1 },
  ],
  threshold: 0.3,
  minMatchCharLength: 1,
}

const LISTING_FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'neighborhood', weight: 1 },
    { name: 'city', weight: 1 },
    { name: 'address_text', weight: 0.5 },
  ],
  threshold: 0.3,
  minMatchCharLength: 1,
}

export async function searchInvestorsAndListings(
  supabase: SupabaseLike,
  userId: string,
  query: string,
  limit = 5
): Promise<{ investors: InvestorSearchResult[]; listings: ListingSearchResult[] }> {
  const [{ data: investors }, { data: listings }] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('investors') as any).select('id, name, email, tags').eq('user_id', userId),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('listings') as any).select('id, title, city, neighborhood, address_text').eq('user_id', userId),
  ])

  const investorFuse = new Fuse((investors ?? []) as InvestorRow[], INVESTOR_FUSE_OPTIONS)
  const listingFuse = new Fuse((listings ?? []) as ListingRow[], LISTING_FUSE_OPTIONS)

  const investorMatches = investorFuse.search(query, { limit }).map(({ item }): InvestorSearchResult => ({
    type: 'investor',
    id: item.id,
    name: item.name,
    email: item.email,
  }))

  const listingMatches = listingFuse.search(query, { limit }).map(({ item }): ListingSearchResult => ({
    type: 'listing',
    id: item.id,
    title: item.title,
    location: [item.neighborhood, item.city].filter(Boolean).join(', ') || item.address_text,
  }))

  return { investors: investorMatches, listings: listingMatches }
}
