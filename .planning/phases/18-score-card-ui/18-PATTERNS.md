# Phase 18: Score Card UI - Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 5
**Analogs found:** 4 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(app)/imoveis/[id]/page.tsx` | route/server component | request-response + CRUD read | `app/(app)/imoveis/[id]/page.tsx` | exact |
| `components/listings/strategy-selector.tsx` | component | event-driven controlled input | `components/investors/investor-form-modal.tsx` + `components/ui/select.tsx` | role-match |
| `components/listings/opportunity-score-card.tsx` | component | event-driven + request-response action | `components/listings/location-insight-action.tsx` + `components/listings/location-insight-card.tsx` | exact |
| `tests/score-card-ui.test.mjs` | test | transform + request-response contract | `tests/scoring-engine.test.mjs` + `tests/scoring-service.test.mjs` | role-match |
| `score-card.e2e.spec.ts` or Playwright scaffold | test | browser E2E/event-driven | none | no analog |

## Pattern Assignments

### `app/(app)/imoveis/[id]/page.tsx` (route/server component, request-response + CRUD read)

**Analog:** `app/(app)/imoveis/[id]/page.tsx`

**Imports pattern** (lines 1-11):
```tsx
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ListingImages } from '@/components/listings/listing-images'
import { LocationInsightAction } from '@/components/listings/location-insight-action'
import { LocationInsightCard } from '@/components/listings/location-insight-card'
import { getListingLocationInsightByListingId } from '@/lib/location-intelligence/api'
import type { Database } from '@/types/supabase'
```

**Auth and data load pattern** (lines 25-39):
```tsx
const { id } = await params
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: listing } = await (supabase.from('listings') as any)
  .select('*')
  .eq('id', id)
  .eq('user_id', user.id)
  .single() as { data: ListingRow | null }

const locationInsight = await getListingLocationInsightByListingId(supabase, user.id, id)

if (!listing) notFound()
```

**Integration slot pattern** (lines 132-148):
```tsx
<div className="space-y-4 rounded-md border border-border bg-card p-5">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência de localização</p>
      <h2 className="text-lg font-semibold text-foreground">Enriquecimento da localização</h2>
    </div>
    <LocationInsightAction listingId={listing.id} />
  </div>

  {locationInsight ? (
    <LocationInsightCard insight={locationInsight} />
  ) : (
    <p className="text-sm text-muted-foreground">
      Ainda sem enriquecimento desta localização. Use o botão acima para gerar o contexto da área.
    </p>
  )}
</div>
```

**Score-row load pattern to copy:** import `getScoreHistory` from `lib/scoring/data.ts`, call it after `locationInsight`, and pass rows into the score UI. `getScoreHistory` already filters by user/listing and returns current rows.

Source `lib/scoring/data.ts` (lines 63-86):
```ts
export async function getScoreHistory(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug?: string
): Promise<OpportunityScoreRow[]> {
  return unstable_cache(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from('opportunity_scores') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('listing_id', listingId)

      if (strategySlug) {
        query = query.eq('strategy_slug', strategySlug)
      }

      const { data } = await query.order('total_score', { ascending: false })
      return (data ?? []) as OpportunityScoreRow[]
    },
    ['opportunity_score', userId, listingId, ...(strategySlug ? [strategySlug] : [])],
    { tags: ['opportunity_score'] }
  )()
}
```

---

### `components/listings/strategy-selector.tsx` (component, event-driven controlled input)

**Analogs:** `components/ui/select.tsx`, `components/investors/investor-form-modal.tsx`, `lib/scoring/strategies.ts`

**Primitive import/use pattern** from `components/investors/investor-form-modal.tsx` (lines 17, 111-122):
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<div className="space-y-2">
  <Label>Estratégia</Label>
  <Select name="strategy" defaultValue={investor?.strategy ?? 'any'} disabled={isPending}>
    <SelectTrigger><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="any">Qualquer</SelectItem>
      <SelectItem value="rental_income">Renda de aluguel</SelectItem>
      <SelectItem value="flip">Revenda</SelectItem>
      <SelectItem value="own_business">Negócio próprio</SelectItem>
      <SelectItem value="land_banking">Reserva de terreno</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Select styling/accessibility pattern** from `components/ui/select.tsx` (lines 13-31, 81-101):
```tsx
function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-4 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center rounded-md py-2 pr-8 pl-3 text-sm outline-none select-none focus:bg-muted focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
```

**Strategy source-of-truth pattern** from `lib/scoring/strategies.ts` (lines 4-18, 108-110):
```ts
export const STRATEGY_SLUGS = [
  'cafe',
  'logistics',
  'pharmacy',
  'retail',
  'services',
  'any',
] as const

export type StrategySlug = (typeof STRATEGY_SLUGS)[number]

export const STRATEGIES: Record<string, StrategyProfile> = {
  cafe: {
    slug: 'cafe',
    label: 'Café / Alimentação',
```

```ts
export function getStrategy(slug: string): StrategyProfile {
  return STRATEGIES[slug] ?? STRATEGIES['any']
}
```

**Planner instruction:** Do not duplicate hardcoded strategy labels. Render `STRATEGY_SLUGS.map((slug) => <SelectItem value={slug}>{STRATEGIES[slug].label}</SelectItem>)`.

---

### `components/listings/opportunity-score-card.tsx` (component, event-driven + request-response action)

**Analogs:** `components/listings/location-insight-action.tsx`, `components/listings/location-insight-card.tsx`, `lib/actions/scoring-actions.ts`, `lib/scoring/schemas.ts`

**Client action imports/state pattern** from `components/listings/location-insight-action.tsx` (lines 1-19):
```tsx
'use client'

import { useState, useTransition } from 'react'
import { Database, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { enrichListingLocationAction, seedDemoLocationInsightsAction } from '@/lib/actions/location-insight-actions'
import type { LocationInsightActionState } from '@/lib/schemas/location-insight'
import { useRouter } from 'next/navigation'

type Props = {
  listingId: string
}

export function LocationInsightAction({ listingId }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [tone, setTone] = useState<'success' | 'error' | null>(null)
  const [enrichPending, startEnrichTransition] = useTransition()
  const [demoPending, startDemoTransition] = useTransition()
```

**Result handling pattern** from `components/listings/location-insight-action.tsx` (lines 21-33):
```tsx
const handleResult = (result: LocationInsightActionState) => {
  if (result.errors?.general?.[0]) {
    setTone('error')
    setMessage(result.errors.general[0])
    return
  }

  if (result.message) {
    setTone('success')
    setMessage(result.message)
    router.refresh()
  }
}
```

**Button pending pattern** from `components/listings/location-insight-action.tsx` (lines 38-52):
```tsx
<Button
  type="button"
  size="sm"
  variant="outline"
  disabled={enrichPending}
  onClick={() => {
    startEnrichTransition(async () => {
      const result = await enrichListingLocationAction(listingId)
      handleResult(result)
    })
  }}
>
  {enrichPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
  Enriquecer localização
</Button>
```

**Compact card/list visual pattern** from `components/listings/location-insight-card.tsx` (lines 30-43, 64-79):
```tsx
return (
  <div className="space-y-5 rounded-md border border-border bg-card p-5">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência de localização</p>
        <h2 className="text-lg font-semibold text-foreground">Contexto da área</h2>
      </div>
      <div className="flex items-center gap-2">
        {insight.confidenceScore != null && (
          <Badge variant="outline">{insight.confidenceScore}% confiança</Badge>
        )}
        <Badge variant="secondary">{insight.city}, {insight.state}</Badge>
      </div>
    </div>
```

```tsx
<div className="space-y-3">
  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Negócios próximos</p>
  {businesses.length > 0 ? (
    <ul className="grid gap-2 sm:grid-cols-2">
      {businesses.map((business, index) => (
        <li key={`${business.name ?? 'business'}-${index}`} className="rounded-md border border-border bg-muted/40 px-3 py-2">
          <p className="text-sm font-medium text-foreground">{business.name ?? 'Negócio próximo'}</p>
          <p className="text-xs text-muted-foreground">
            {[business.category, formatDistance(business.distanceMeters)].filter(Boolean).join(' · ')}
          </p>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm text-muted-foreground">Sem negócios próximos registrados.</p>
  )}
</div>
```

**Scoring server action contract** from `lib/actions/scoring-actions.ts` (lines 12-30):
```ts
export async function scoreListingAction(
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // T-17-02: validate strategy_slug before passing to engine
  if (!STRATEGY_SLUGS.includes(strategySlug as typeof STRATEGY_SLUGS[number])) {
    return { errors: { general: ['Estratégia inválida.'] } }
  }

  const result = await scoreListingService(supabase, user.id, listingId, strategySlug)

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  return { message: result.message, score: result.score, errors: result.errors }
}
```

**Score type contract** from `lib/scoring/schemas.ts` (lines 3-33, 58-74):
```ts
export const ScoreSignalSchema = z.object({
  category: z.string(),
  label: z.string(),
  impact: z.enum(['positive', 'neutral', 'negative']),
  value: z.union([z.string(), z.number()]).nullable().optional(),
})

export const ScoreRiskSchema = z.object({
  category: z.string(),
  label: z.string(),
  severity: z.enum(['high', 'medium', 'low']),
})

export const CategoryBreakdownSchema = z.object({
  category: z.string(),
  label: z.string(),
  score: z.number().int().min(0).max(100),
  weight: z.number().min(0).max(1),
  weighted: z.number().min(0).max(100),
  signals: z.array(ScoreSignalSchema).default([]),
  risks: z.array(ScoreRiskSchema).default([]),
})

export const ScoreResultSchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  breakdown: z.array(CategoryBreakdownSchema),
  signals: z.array(ScoreSignalSchema),
  risks: z.array(ScoreRiskSchema),
  fitLabel: z.enum(['forte', 'moderado', 'fraco']),
  strategySlug: z.string(),
  computedAt: z.string(),
})
```

```ts
export const ScoringActionStateSchema = z.object({
  message: z.string().optional(),
  score: ScoreResultSchema.nullable().optional(),
  errors: z
    .object({
      general: z.array(z.string()).optional(),
    })
    .optional(),
})

export type ScoreSignal = z.infer<typeof ScoreSignalSchema>
export type ScoreRisk = z.infer<typeof ScoreRiskSchema>
export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>
export type ScoreResult = z.infer<typeof ScoreResultSchema>
export type ScoringOutcome = z.infer<typeof ScoringOutcomeSchema>
export type StrategyProfile = z.infer<typeof StrategyProfileSchema>
export type ScoringActionState = z.infer<typeof ScoringActionStateSchema>
```

**Saved row shape for adapter** from `types/supabase.ts` (lines 586-607):
```ts
opportunity_scores: {
  Row: {
    breakdown: Json
    competition_score: number | null
    computed_at: string | null
    created_at: string | null
    demographics_score: number | null
    engine_version: string
    fit_label: string | null
    foot_traffic_score: number | null
    id: string
    investor_fit_score: number | null
    listing_id: string
    location_score: number | null
    risks: Json
    risk_score: number | null
    score_version: number
    signals: Json
    strategy_slug: string
    total_score: number
    updated_at: string | null
    user_id: string
  }
```

**Planner instruction:** Use a local UI adapter type such as `{ result: ScoreResult; scoreVersion?: number }`. Normalize saved row snake_case fields to `ScoreResult` camelCase fields. Keep `score_version` metadata outside `ScoreResult`.

---

### `tests/score-card-ui.test.mjs` (test, transform + request-response contract)

**Analogs:** `tests/scoring-engine.test.mjs`, `tests/scoring-service.test.mjs`

**Node test runner pattern** from `tests/scoring-engine.test.mjs` (lines 1-15):
```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  scoreDemographics,
  scoreLocationQuality,
  scoreNearbyBusinesses,
  scoreCompetition,
  computeScore,
  RuleBasedScoringEngine,
} = require('../lib/scoring/engine.js')
const { STRATEGIES, getStrategy } = require('../lib/scoring/strategies.js')
```

**Fixture pattern** from `tests/scoring-engine.test.mjs` (lines 20-67):
```js
function makeListing(overrides = {}) {
  return {
    id: 'listing-001',
    user_id: 'user-001',
    title: 'Ponto Comercial Boa Viagem',
    source: 'olx',
    source_url: 'https://olx.com.br/1',
    country: 'BR',
    price_amount: 450000,
    lat: -8.12,
    lng: -34.90,
    tags: [],
    commercial_type: 'ponto_comercial',
    property_type: null,
    city: 'Recife',
    state: 'PE',
    ...overrides,
  }
}

function makeInsight(overrides = {}) {
  return {
    id: 'insight-001',
    userId: 'user-001',
    city: 'Recife',
    state: 'PE',
    country: 'BR',
    avgIncome: 4500,
    populationDensity: 6000,
    confidenceScore: 85,
    nearbyBusinesses: [
      { name: 'Escola Municipal', category: 'school', distanceMeters: 200, source: 'google' },
      { name: 'Shopping Center', category: 'mall', distanceMeters: 350, source: 'google' },
      { name: 'Café do João', category: 'cafe', distanceMeters: 100, source: 'google' },
      { name: 'Padaria Nova', category: 'bakery', distanceMeters: 300, source: 'google' },
    ],
    dataSources: [],
    consumerProfile: 'Consumidor urbano classe média-alta',
    latitude: -8.12,
    longitude: -34.90,
    rawGeocode: {},
    rawDemographics: {},
    rawPlaces: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}
```

**Existing score persistence assertions** from `tests/scoring-service.test.mjs` (lines 211-242, 329-344):
```js
test('SCO-18 save/fetch round-trip: upsertScore then getScoreHistory returns the saved row', async () => {
  const scoreRow = makeScoreRow({ score_version: 1, total_score: 72, strategy_slug: 'cafe' })

  // upsertScore: no existing row (existingScoreVersion = null), save returns scoreRow
  const upsertSupabase = makeSupabaseMockForUpsert(null, scoreRow)

  const fakeResult = {
    totalScore: 72, strategySlug: 'cafe', fitLabel: 'forte',
    breakdown: [
      { category: 'demographics', score: 65 },
      { category: 'location_quality', score: 70 },
      { category: 'nearby_businesses', score: 62 },
      { category: 'competition', score: 68 },
      { category: 'risk', score: 75 },
      { category: 'investor_fit', score: 70 },
    ],
    signals: [], risks: [], computedAt: new Date().toISOString(),
  }

  const upsertResult = await upsertScore(upsertSupabase, 'user-001', 'listing-001', fakeResult)
  assert.equal(upsertResult.error, null, 'upsertScore should succeed without error')
  assert.ok(upsertResult.data, 'upsertScore should return saved data')
  assert.equal(upsertResult.data.score_version, 1, 'saved row should have score_version = 0+1 = 1')

  // getScoreHistory: returns array with the saved row
  const historySupabase = makeSupabaseMockForHistory([scoreRow])
  const history = await getScoreHistory(historySupabase, 'user-001', 'listing-001')
  assert.ok(Array.isArray(history), 'getScoreHistory should return an array')
  assert.equal(history.length, 1, 'history should contain 1 row')
  assert.equal(history[0].strategy_slug, 'cafe', 'returned row should be for cafe strategy')
  assert.equal(history[0].total_score, 72, 'returned row should have correct total_score')
})
```

```js
test('SCO-10/SCO-20 getScoreHistory returns current row for listing (all strategy variants)', async () => {
  const rows = [
    makeScoreRow({ strategy_slug: 'cafe', total_score: 72 }),
    makeScoreRow({ strategy_slug: 'logistics', total_score: 55 }),
    makeScoreRow({ strategy_slug: 'pharmacy', total_score: 61 }),
  ]

  const supabase = makeSupabaseMockForHistory(rows)
  const history = await getScoreHistory(supabase, 'user-001', 'listing-001')

  assert.ok(Array.isArray(history), 'getScoreHistory should return an array')
  assert.equal(history.length, 3, 'should return all 3 strategy variant rows')
  assert.equal(history[0].strategy_slug, 'cafe', 'first row should be cafe (highest score)')
  assert.equal(history[1].strategy_slug, 'logistics', 'second row should be logistics')
  assert.equal(history[2].strategy_slug, 'pharmacy', 'third row should be pharmacy')
})
```

**Test command pattern** from `package.json` (lines 8-16):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "test": "node --test tests/*.test.mjs",
  "cli": "tsx --tsconfig tsconfig.json scripts/rt.ts",
  "ui": "tsx --tsconfig tsconfig.json scripts/ui/rt-ui.tsx",
  "agent:localhost": "node scripts/localhost-playwright-agent.mjs",
  "start": "next start",
  "lint": "eslint"
}
```

---

### `score-card.e2e.spec.ts` or Playwright scaffold (test, browser E2E/event-driven)

**Analog:** none in repo.

No Playwright spec/config analog exists. `package.json` has `playwright` installed and `agent:localhost`, but `rg --files` found only Node `.test.mjs` files under `tests/`.

**Planner instruction:** If Phase 18 requires automated E2E, create a minimal Playwright scaffold deliberately and call out it is a new pattern. If keeping scope narrow, use manual browser UAT plus `npm test`, `npm run lint`, and `npm run build` as the phase verification gate.

## Shared Patterns

### Authentication and Ownership Filtering
**Source:** `app/(app)/imoveis/[id]/page.tsx` lines 26-39  
**Apply to:** server page score-row loading
```tsx
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: listing } = await (supabase.from('listings') as any)
  .select('*')
  .eq('id', id)
  .eq('user_id', user.id)
  .single() as { data: ListingRow | null }
```

### Server Action Error Handling
**Source:** `components/listings/location-insight-action.tsx` lines 21-33  
**Apply to:** score compute/recompute client action handling
```tsx
if (result.errors?.general?.[0]) {
  setTone('error')
  setMessage(result.errors.general[0])
  return
}

if (result.message) {
  setTone('success')
  setMessage(result.message)
  router.refresh()
}
```

### Revalidation Contract
**Source:** `lib/actions/scoring-actions.ts` lines 25-30  
**Apply to:** client component should trust action result and refresh route after success
```ts
const result = await scoreListingService(supabase, user.id, listingId, strategySlug)

revalidatePath(`/imoveis/${listingId}`)
revalidateTag('opportunity_score')

return { message: result.message, score: result.score, errors: result.errors }
```

### Dark Sharp Surface and Badge Pattern
**Source:** `components/listings/location-insight-card.tsx` lines 30-43 and `components/ui/badge.tsx` lines 6-15  
**Apply to:** score card container, fit badge, strategy label, metadata
```tsx
<div className="space-y-5 rounded-md border border-border bg-card p-5">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inteligência de localização</p>
      <h2 className="text-lg font-semibold text-foreground">Contexto da área</h2>
    </div>
    <div className="flex items-center gap-2">
      {insight.confidenceScore != null && (
        <Badge variant="outline">{insight.confidenceScore}% confiança</Badge>
      )}
      <Badge variant="secondary">{insight.city}, {insight.state}</Badge>
    </div>
  </div>
```

```ts
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-muted-foreground",
        secondary: "border-foreground bg-foreground text-background",
        destructive: "border-destructive/30 bg-transparent text-destructive",
        outline: "border-border bg-card text-muted-foreground",
      },
```

### Button Loading and Focus Pattern
**Source:** `components/ui/button.tsx` lines 7-30 and `components/listings/location-insight-action.tsx` lines 38-52  
**Apply to:** `Calcular pontuação` / `Recalcular pontuação`
```ts
const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
```

```tsx
{enrichPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
Enriquecer localização
```

### Fixed Five Category Bars
**Source:** `18-UI-SPEC.md` plus `lib/scoring/data.ts` lines 41-46  
**Apply to:** category breakdown helper in `OpportunityScoreCard`
```ts
demographics_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'demographics')?.score ?? null,
location_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'location_quality')?.score ?? null,
foot_traffic_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'nearby_businesses')?.score ?? null,
competition_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'competition')?.score ?? null,
risk_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'risk')?.score ?? null,
investor_fit_score: result.breakdown.find((c: CategoryBreakdown) => c.category === 'investor_fit')?.score ?? null,
```

Planner should render only these five UI bars in this order: `demographics`, `locationQuality`/`location_quality`, `nearbyBusinesses`/`nearby_businesses`, `competition`, `risk`. Do not render `investorFit` as a sixth bar.

### Copy Constraints
**Source:** `18-CONTEXT.md` decisions D-05/D-06 and `18-UI-SPEC.md` copy contract  
**Apply to:** all score UI states

Required exact missing-enrichment copy:
```text
Enriqueça a localização antes de calcular a pontuação
```

Forbidden terms:
```text
avaliação
valor de mercado
```

Use opportunity/fit language:
```text
Pontuação de oportunidade
atratividade
fit
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `score-card.e2e.spec.ts` or Playwright scaffold | test | browser E2E/event-driven | Playwright dependency exists, but no local Playwright config/spec pattern exists. |

## Metadata

**Analog search scope:** `app/(app)/imoveis/[id]`, `components/listings`, `components/investors`, `components/ui`, `lib/actions`, `lib/scoring`, `types`, `tests`, `package.json`  
**Files scanned:** 18 direct files plus `rg` search over TS/TSX/MJS project files  
**Pattern extraction date:** 2026-05-11
