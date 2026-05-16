import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/types/supabase'

type ListingRow = Database['public']['Tables']['listings']['Row']

type ListingSummary = Pick<
  ListingRow,
  'id' | 'title' | 'price_text' | 'price_amount' | 'city' | 'neighborhood' | 'state' | 'address_text' | 'location_text' | 'commercial_type' | 'property_type' | 'confidence' | 'source_url' | 'first_seen_at' | 'images'
> & {
  enrichment_status?: string | null
  matching_status?: string | null
  matching_last_processed_at?: string | null
}

type SearchParams = Record<string, string | string[] | undefined>

type ListingFilters = {
  q: string
  location: string
  type: string
  minPrice: number | null
  maxPrice: number | null
  minConfidence: number | null
}

const BASE_LISTING_COLUMNS = 'id, title, price_text, price_amount, city, neighborhood, state, address_text, location_text, commercial_type, property_type, confidence, source_url, first_seen_at, images'
const PROCESSING_LISTING_COLUMNS = `${BASE_LISTING_COLUMNS}, enrichment_status, matching_status, matching_last_processed_at`

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

function statusVariant(status: string) {
  if (status === 'failed') return 'destructive' as const
  if (status === 'completed') return 'default' as const
  return 'outline' as const
}

function firstParam(searchParams: SearchParams | undefined, key: string) {
  const value = searchParams?.[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function parseMoneyParam(value: string) {
  if (!value.trim()) return null
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  if (!normalized.trim()) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parsePercentParam(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 0), 100) : null
}

function sanitizeFilterValue(value: string) {
  return value.trim().replace(/[,%()]/g, ' ').replace(/\s+/g, ' ')
}

function getFilters(searchParams: SearchParams | undefined): ListingFilters {
  return {
    q: firstParam(searchParams, 'q').trim(),
    location: firstParam(searchParams, 'location').trim(),
    type: firstParam(searchParams, 'type').trim(),
    minPrice: parseMoneyParam(firstParam(searchParams, 'minPrice')),
    maxPrice: parseMoneyParam(firstParam(searchParams, 'maxPrice')),
    minConfidence: parsePercentParam(firstParam(searchParams, 'minConfidence')),
  }
}

function hasFilters(filters: ListingFilters) {
  return Boolean(
    filters.q ||
    filters.location ||
    filters.type ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.minConfidence !== null
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyListingFilters(query: any, filters: ListingFilters) {
  let nextQuery = query
  const q = sanitizeFilterValue(filters.q)
  const location = sanitizeFilterValue(filters.location)
  const type = sanitizeFilterValue(filters.type)

  if (q) {
    nextQuery = nextQuery.or(`title.ilike.*${q}*,description.ilike.*${q}*,source_url.ilike.*${q}*`)
  }

  if (location) {
    nextQuery = nextQuery.or(`address_text.ilike.*${location}*,location_text.ilike.*${location}*,neighborhood.ilike.*${location}*,city.ilike.*${location}*,state.ilike.*${location}*`)
  }

  if (type) {
    nextQuery = nextQuery.or(`commercial_type.ilike.*${type}*,property_type.ilike.*${type}*`)
  }

  if (filters.minPrice !== null) {
    nextQuery = nextQuery.gte('price_amount', filters.minPrice)
  }

  if (filters.maxPrice !== null) {
    nextQuery = nextQuery.lte('price_amount', filters.maxPrice)
  }

  if (filters.minConfidence !== null) {
    nextQuery = nextQuery.gte('confidence', filters.minConfidence)
  }

  return nextQuery
}

function formatPrice(listing: ListingSummary) {
  if (listing.price_text) return listing.price_text
  if (listing.price_amount === null || listing.price_amount === undefined) return null
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(Number(listing.price_amount))
}

export default async function ImoveisPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const filters = getFilters(resolvedSearchParams)
  const filtersActive = hasFilters(filters)
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listingResult = await applyListingFilters((supabase.from('listings') as any)
    .select(PROCESSING_LISTING_COLUMNS)
    .eq('user_id', user.id), filters)
    .order('first_seen_at', { ascending: false }) as { data: ListingSummary[] | null; error: { message?: string } | null }
  let data = listingResult.data

  if (listingResult.error) {
    // Migration 014 adds processing columns. Keep old listings visible before the DB is migrated.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = await applyListingFilters((supabase.from('listings') as any)
      .select(BASE_LISTING_COLUMNS)
      .eq('user_id', user.id), filters)
      .order('first_seen_at', { ascending: false }) as { data: ListingSummary[] | null }

    data = fallback.data
  }

  const listings = (data ?? []).map((listing) => ({
    ...listing,
    enrichment_status: listing.enrichment_status ?? 'pending',
    matching_status: listing.matching_status ?? 'pending',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium leading-tight text-foreground">Imóveis</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {listings.length} imóvel{listings.length !== 1 ? 'is' : ''} {filtersActive ? 'encontrado' : 'importado'}{listings.length !== 1 ? 's' : ''}.
        </p>
      </div>

      <form action="/imoveis" className="rounded-md border border-border bg-card p-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.7fr_0.7fr_0.7fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="q">Buscar imóvel</Label>
            <Input
              id="q"
              name="q"
              defaultValue={filters.q}
              placeholder="Título, descrição ou link"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Endereço/localização</Label>
            <Input
              id="location"
              name="location"
              defaultValue={filters.location}
              placeholder="Rua, bairro, cidade"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Input
              id="type"
              name="type"
              defaultValue={filters.type}
              placeholder="loja, galpão"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minPrice">Preço min.</Label>
            <Input
              id="minPrice"
              name="minPrice"
              inputMode="numeric"
              defaultValue={firstParam(resolvedSearchParams, 'minPrice')}
              placeholder="250000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPrice">Preço max.</Label>
            <Input
              id="maxPrice"
              name="maxPrice"
              inputMode="numeric"
              defaultValue={firstParam(resolvedSearchParams, 'maxPrice')}
              placeholder="900000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="minConfidence">Comercial %</Label>
            <Input
              id="minConfidence"
              name="minConfidence"
              type="number"
              min={0}
              max={100}
              defaultValue={firstParam(resolvedSearchParams, 'minConfidence')}
              placeholder="70"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" className="w-full lg:w-auto">
              <Search className="mr-2 size-4" />
              Filtrar
            </Button>
            {filtersActive && (
              <Button asChild type="button" variant="outline" size="icon" aria-label="Limpar filtros">
                <Link href="/imoveis">
                  <X className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </form>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-full border border-foreground bg-card text-foreground">
            <Building2 className="size-6" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">Nenhum imóvel ainda.</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {filtersActive ? (
              <>Nenhum imóvel corresponde aos filtros atuais.</>
            ) : (
              <>Use a aba <Link href="/listings/import" className="underline">Pesquisas</Link> para importar imóveis do OLX.</>
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => {
            const thumb = listing.images?.[0]
            const location = [listing.neighborhood, listing.city, listing.state].filter(Boolean).join(', ')

            return (
              <Link
                key={listing.id}
                href={`/imoveis/${listing.id}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground"
              >
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/proxy-image?url=${encodeURIComponent(thumb)}`}
                    alt={listing.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-secondary">
                    <Building2 className="size-10 text-muted-foreground/40" />
                  </div>
                )}

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="space-y-1">
                    <h2 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                      {listing.title}
                    </h2>
                    {formatPrice(listing) && (
                      <p className="text-base font-semibold text-foreground">{formatPrice(listing)}</p>
                    )}
                  </div>

                  {location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {listing.commercial_type && (
                        <Badge variant="outline" className="text-xs">{listing.commercial_type}</Badge>
                      )}
                      {listing.confidence != null && (
                        <Badge variant="outline" className="text-xs">
                          {listing.confidence}% comercial
                        </Badge>
                      )}
                      <Badge variant={statusVariant(listing.enrichment_status)} className="text-xs">
                        Enriq. {listing.enrichment_status}
                      </Badge>
                      <Badge variant={statusVariant(listing.matching_status)} className="text-xs">
                        Match {listing.matching_status}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(listing.first_seen_at)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
