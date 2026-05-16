# Phase 14: Location Intelligence Foundation - Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 8 inferred new/modified files
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `supabase/migrations/011_location_insights.sql` | migration | CRUD | `supabase/migrations/008_listing_data_foundation.sql` | exact |
| `types/supabase.ts` | model | CRUD | `types/supabase.ts` listings table section | exact |
| `lib/schemas/location-insight.ts` | model | transform | `lib/schemas/listing.ts` | exact |
| `lib/location-intelligence/normalization.ts` | utility | transform | `lib/listings/enrichment.ts` | exact |
| `lib/location-intelligence/providers.ts` | service | request-response | `lib/listings/olx.ts` + `lib/listings/enrichment.ts` | role-match |
| `lib/location-intelligence/insights.ts` | service | CRUD | `lib/listings/ingestion.ts` + `lib/listings/import-runs.ts` | exact |
| `lib/actions/location-insight-actions.ts` | service | request-response | `lib/actions/listing-import-actions.ts` | exact |
| `app/(app)/imoveis/[id]/page.tsx` | component | request-response | `app/(app)/imoveis/[id]/page.tsx` | exact integration host |

## Pattern Assignments

### `supabase/migrations/011_location_insights.sql` (migration, CRUD)

**Analog:** `supabase/migrations/008_listing_data_foundation.sql`

**Table shape pattern** (lines 4-34):
```sql
CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source          TEXT NOT NULL,
  source_url      TEXT NOT NULL,
  title           TEXT NOT NULL,
  ...
  raw_payload     JSONB DEFAULT '{}'::jsonb,
  first_seen_at   TIMESTAMPTZ DEFAULT now(),
  last_seen_at    TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT listings_user_source_url_unique UNIQUE (user_id, source, source_url)
);
```

**RLS pattern** (lines 52-63):
```sql
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own listings"
  ON listings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Index pattern** (lines 65-69):
```sql
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_state_city ON listings(state, city);
CREATE INDEX idx_listings_commercial ON listings(is_commercial, commercial_type);
```

**Apply to Phase 14:** create `location_insights` with `user_id`, optional `listing_id REFERENCES listings(id) ON DELETE SET NULL`, address/neighborhood/city/state, `lat`, `lng`, JSONB columns for demographics, nearby businesses, data sources, confidence checks, timestamps, RLS policy using `auth.uid() = user_id`, and indexes for `user_id`, `listing_id`, `(state, city)`, and coordinate lookup if needed.

---

### `types/supabase.ts` (model, CRUD)

**Analog:** `types/supabase.ts`

**Generated table typing pattern** (lines 378-469):
```typescript
listings: {
  Row: {
    address_text: string | null
    city: string | null
    lat: number | null
    lng: number | null
    raw_payload: Json | null
    user_id: string
  }
  Insert: {
    address_text?: string | null
    city?: string | null
    lat?: number | null
    lng?: number | null
    raw_payload?: Json | null
    user_id: string
  }
  Update: {
    address_text?: string | null
    city?: string | null
    lat?: number | null
    lng?: number | null
    raw_payload?: Json | null
    user_id?: string
  }
  Relationships: []
}
```

**Apply to Phase 14:** update generated-style types manually only if this repo is not regenerating Supabase types during the phase. Include `Row`, `Insert`, `Update`, and `Relationships` for `location_insights`; use existing `Json` for demographics, nearby businesses, data sources, and provider payloads.

---

### `lib/schemas/location-insight.ts` (model, transform)

**Analog:** `lib/schemas/listing.ts`

**Imports and schema pattern** (lines 1-28):
```typescript
import { z } from 'zod'

export const ListingSourceSchema = z.enum(['olx'])

export const ListingDraftSchema = z.object({
  source:         ListingSourceSchema,
  sourceUrl:      z.string().url('Listing URL must be valid'),
  title:          z.string().min(2, 'Listing title is required'),
  priceAmount:    z.coerce.number().nonnegative().optional(),
  country:        z.string().default('BR'),
  lat:            z.coerce.number().optional(),
  lng:            z.coerce.number().optional(),
  confidence:     z.number().int().min(0).max(100).optional(),
  rawPayload:     z.record(z.unknown()).default({}),
})
```

**Exported inferred types** (lines 39-41):
```typescript
export type ListingSource = z.infer<typeof ListingSourceSchema>
export type ListingDraft = z.infer<typeof ListingDraftSchema>
export type ListingImportTarget = z.infer<typeof ListingImportTargetSchema>
```

**Apply to Phase 14:** define zod schemas for location input and persisted insight data. Follow camelCase at the boundary, default `country` to `BR`, use `z.coerce.number()` for coordinate form inputs, use `z.number().int().min(0).max(100)` for confidence, and export inferred types next to schemas.

---

### `lib/location-intelligence/normalization.ts` (utility, transform)

**Analog:** `lib/listings/enrichment.ts`

**Normalization pattern** (lines 1-6):
```typescript
function normalize(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
```

**Rule-based deterministic enrichment pattern** (lines 17-30):
```typescript
export function inferPropertyType(text: string | null | undefined): string | undefined {
  const normalized = normalize(text)
  const rules: Array<[string, string[]]> = [
    ['sala_comercial', ['sala comercial', 'sala escritorio', 'consultorio']],
    ['ponto_comercial', ['ponto comercial', 'ponto de comercio']],
  ]

  return rules.find(([, terms]) => terms.some((term) => normalized.includes(normalize(term))))?.[0]
}
```

**Combined input pattern** (lines 55-77):
```typescript
export function enrichListingFields(input: {
  title?: string | null
  description?: string | null
  locationText?: string | null
  location_text?: string | null
  addressText?: string | null
  address_text?: string | null
}) {
  const combinedText = [
    input.title,
    input.description,
    input.locationText ?? input.location_text,
    input.addressText ?? input.address_text,
  ].filter(Boolean).join(' ')

  return {
    priceAmount: parseBrazilianPrice(input.priceText ?? input.price_text),
    propertyType: inferPropertyType(combinedText),
    tags: inferListingTags(combinedText),
  }
}
```

**Apply to Phase 14:** keep geocode and area normalization deterministic, accent-insensitive, and bilingual where useful. Accept both camelCase and snake_case input only where bridging database rows and app-level objects.

---

### `lib/location-intelligence/providers.ts` (service, request-response)

**Analog:** `lib/listings/enrichment.ts` and existing provider boundary in `lib/listings/olx.ts`

**Provider result enrichment handoff** (from `lib/listings/olx.ts` lines 201-230, discovered via search):
```typescript
const enriched = enrichListingFields({
  title: raw.title,
  description,
  priceText: raw.priceText,
  locationText: raw.locationText,
  addressText,
})

return {
  title: compactText(raw.title) ?? 'OLX listing',
  priceAmount: enriched.priceAmount,
  tags: enriched.tags,
  propertyType: enriched.propertyType,
}
```

**Apply to Phase 14:** expose provider adapters behind project-owned functions such as `geocodeLocation`, `getDemographicEstimate`, and `getNearbyBusinesses`. Keep provider payloads converted to stable internal objects before persistence; do not leak provider-specific response shapes into pages or actions.

---

### `lib/location-intelligence/insights.ts` (service, CRUD)

**Analog:** `lib/listings/ingestion.ts`

**Typed insert builder pattern** (lines 1-7 and 9-37):
```typescript
import { ListingDraftSchema, type ListingDraft } from '@/lib/schemas/listing'
import type { Database, Json } from '@/types/supabase'

type ListingInsert = Database['public']['Tables']['listings']['Insert']
type SupabaseLike = { from: (relation: string) => any }

export function toListingInsert(userId: string, draft: ListingDraft): ListingInsert {
  const parsed = ListingDraftSchema.parse(draft)

  return {
    user_id:      userId,
    source:       parsed.source,
    source_url:   parsed.sourceUrl,
    raw_payload:  parsed.rawPayload as Json,
  }
}
```

**Upsert with scoped conflict pattern** (lines 53-69):
```typescript
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

  return (supabase.from('listings') as any).upsert(insertData, {
    onConflict: 'user_id,source,source_url',
  })
}
```

**Scoped update pattern** (from `lib/listings/import-runs.ts` lines 60-65):
```typescript
return (supabase.from('listing_import_runs') as any)
  .update(updateData)
  .eq('id', runId)
  .eq('user_id', userId)
```

**Apply to Phase 14:** create `toLocationInsightInsert`, `toLocationInsightUpdate`, `createLocationInsight`, `updateLocationInsight`, and `upsertLocationInsightForListing`. Always take `supabase` and `userId` as arguments. Always add `.eq('user_id', userId)` on reads/updates/deletes even with RLS enabled.

---

### `lib/actions/location-insight-actions.ts` (service, request-response)

**Analog:** `lib/actions/listing-import-actions.ts`

**Server action imports and auth pattern** (lines 1-10 and 32-39):
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function runOlxSearchImportAction(
  _prevState: OlxSearchImportState,
  formData: FormData
): Promise<OlxSearchImportState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
```

**Form validation and bounded numeric input pattern** (lines 40-54):
```typescript
const locationQuery = String(formData.get('locationQuery') ?? '').trim()
const maxListingsRaw = Number(formData.get('maxListings') ?? 25)
const maxListings = Number.isFinite(maxListingsRaw)
  ? Math.min(Math.max(Math.trunc(maxListingsRaw), 1), 50)
  : 25

if (locationQuery.length < 2) {
  return { errors: { locationQuery: ['Enter an address, city, or region.'] } }
}
```

**Try/catch with status persistence and revalidation pattern** (lines 71-132):
```typescript
try {
  const listings = await scrapeOlxListings({ searchTerm, region: locationQuery })
  ...
  revalidatePath('/listings/import')
  return { message: `OLX search finished: ${createdCount} saved, ${failedCount} failed.` }
} catch (error) {
  const message = getErrorMessage(error)
  await failImportRun(supabase, run.id, user.id, message, { source: 'olx' })
  revalidatePath('/listings/import')
  return { errors: { general: [message] } }
}
```

**Apply to Phase 14:** server actions should redirect unauthenticated users, return typed state objects for client forms, clamp coordinates/confidence/radius fields, catch provider failures into user-visible messages, and revalidate `/imoveis`, `/imoveis/[id]`, or the eventual insight route after writes.

---

### `app/api/location-insights/route.ts` and nested route handlers (route, request-response)

**Analog:** `app/api/investors/route.ts`

**GET and POST API pattern** (lines 1-18 and 21-35):
```typescript
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { InvestorSchema } from '@/lib/schemas/investor'
import { createInvestor } from '@/lib/investors/data'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase.from('investors') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to load investors' }, { status: 500 })
  return NextResponse.json({ investors: data ?? [] })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = InvestorSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const { data, error } = await createInvestor(supabase, user.id, parsed.data)
  if (error) return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 })
  return NextResponse.json({ investor: data }, { status: 201 })
}
```

**Dynamic route params pattern** (from `app/api/investors/[id]/matches/route.ts` lines 6-14):
```typescript
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**Apply to Phase 14/15 boundary:** if Phase 14 adds foundation-only API stubs, keep them authenticated and RLS-scoped. Use 401 for missing user, 400 for zod errors, 404 for missing scoped rows, and 500 for persistence/provider failures.

---

### `app/(app)/imoveis/[id]/page.tsx` (component, request-response)

**Analog:** `app/(app)/imoveis/[id]/page.tsx`

**Authenticated detail query pattern** (lines 17-34):
```typescript
export default async function ImovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: listing } = await (supabase.from('listings') as any)
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: ListingRow | null }

  if (!listing) notFound()
```

**Detail page action host pattern** (lines 53-72):
```tsx
<div className="rounded-lg border border-border bg-card p-5 shadow-[0_16px_36px_rgba(5,10,20,0.22)] md:p-6 space-y-5">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="space-y-2 min-w-0">
      <h1 className="text-2xl font-semibold leading-tight text-foreground">{listing.title}</h1>
    </div>
    <Button asChild variant="outline" size="sm" className="shrink-0">
      <a href={listing.source_url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="mr-2 size-4" />
        Ver no OLX
      </a>
    </Button>
  </div>
</div>
```

**Insight card section pattern** (lines 91-124):
```tsx
{reasoning && (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Análise de classificação</p>
    <p className="text-sm leading-relaxed text-muted-foreground">{reasoning}</p>
  </div>
)}

<div className="grid gap-3 sm:grid-cols-2 border-t border-border pt-4">
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Fonte</p>
    <p className="text-sm text-foreground capitalize">{listing.source}</p>
  </div>
</div>
```

**Apply to Phase 14:** listing detail is the right future host for an `Enrich location` button and saved insight summary. Keep the action in the existing header action area and render the insight as a bordered/top-separated section inside the existing listing card, or as a sibling card below it if Phase 15 needs a larger display.

---

### `components/location-insights/enrich-location-button.tsx` (component, event-driven)

**Analog:** `components/listings/import-actions.tsx`

**Client action button pattern** (lines 1-9 and 13-34):
```tsx
'use client'

import { useTransition } from 'react'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { runOlxImportAction } from '@/lib/actions/listing-import-actions'

export function RunOlxImportButton({ targetId }: { targetId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await runOlxImportAction(targetId)
          if (result.ok) toast.success(result.message)
          else toast.error(result.message)
        })
      }}
    >
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Play className="mr-2 size-4" />}
      Executar OLX
    </Button>
  )
}
```

**Form action state pattern** (lines 87-170):
```tsx
const [state, formAction, isPending] = useActionState(runOlxSearchImportAction, initialOlxSearchImportState)

return (
  <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-4">
    ...
    {state.errors?.general && (
      <p className="text-xs text-destructive">{state.errors.general[0]}</p>
    )}
    <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
      {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
      Buscar e importar
    </Button>
  </form>
)
```

**Apply to Phase 14/15 boundary:** use `useTransition` for a single listing-linked enrich button, with `toast.success/error` based on `{ ok, message }`. Use `useActionState` only if standalone insight creation has a multi-field form.

## Shared Patterns

### Supabase Server Client and Auth
**Source:** `lib/supabase/server.ts`
**Apply to:** server components, server actions, API routes
```typescript
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie mutation silently ignored.
          }
        },
      },
    }
  )
}
```

### RLS-Sensitive Query Scoping
**Source:** `app/(app)/imoveis/[id]/page.tsx`, `lib/listings/import-runs.ts`
**Apply to:** every location insight read/update/delete
```typescript
const { data: listing } = await (supabase.from('listings') as any)
  .select('*')
  .eq('id', id)
  .eq('user_id', user.id)
  .single()

return (supabase.from('listing_import_runs') as any)
  .update(updateData)
  .eq('id', runId)
  .eq('user_id', userId)
```

### UI Cards and Insight Display
**Source:** `components/ui/card.tsx`, `components/investors/match-card.tsx`
**Apply to:** location insight summary cards
```tsx
<div className="rounded-lg border border-border bg-card p-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h3 className="truncate text-base font-semibold text-foreground">{deal.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{location}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <Badge variant={statusVariant(match_status)}>{match_status}</Badge>
      <span className="text-2xl font-semibold text-foreground">{match_score}</span>
    </div>
  </div>
</div>
```

### Summary Metric Grid
**Source:** `app/(app)/listings/import/page.tsx`
**Apply to:** standalone location insight page if Phase 14 includes demo/seed visibility
```tsx
<div className="grid gap-3 md:grid-cols-4">
  {summary.map((item) => (
    <div key={item.label} className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{item.label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
    </div>
  ))}
</div>
```

## No Analog Found

All inferred Phase 14 file roles have close analogs. Provider adapters for demographics/business data do not have an exact external API analog; use the listing scraper/provider boundary plus deterministic enrichment helper style as the nearest project pattern.

## Metadata

**Analog search scope:** `app`, `components`, `lib`, `supabase`, `types`, `tests`, `.planning`
**Files scanned:** project file list plus targeted `rg` matches for listings, enrichment, Supabase, API routes, and UI cards
**Pattern extraction date:** 2026-05-03
