# Phase 17: Service Wiring and API — Pattern Map

**Mapped:** 2026-05-10
**Files analyzed:** 5 new files
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/scoring/data.ts` | service (data layer) | CRUD | `lib/location-intelligence/insights.ts` | exact |
| `lib/scoring/service.ts` | service (orchestrator) | request-response | `lib/location-intelligence/api.ts` | exact |
| `lib/actions/scoring-actions.ts` | server action | request-response | `lib/actions/location-insight-actions.ts` | exact |
| `app/api/listings/[id]/score/route.ts` | API route | request-response | `app/api/listings/[id]/location-insight/route.ts` + `enrich-location/route.ts` | exact (composite) |
| `tests/scoring-service.test.mjs` | test (integration) | CRUD | `tests/location-intelligence.test.mjs` + `tests/scoring-engine.test.mjs` | exact (composite) |

---

## Pattern Assignments

### `lib/scoring/data.ts` (service/data-layer, CRUD)

**Analog:** `lib/location-intelligence/insights.ts`

**Imports pattern** (lines 1–16):
```typescript
import type { Database, Json } from '@/types/supabase'
import type { ScoreResult } from './schemas'
import 'server-only'

type OpportunityScoreRow = Database['public']['Tables']['opportunity_scores']['Row']
// NOTE: types/supabase.ts does NOT yet include migration 013 category columns.
// Cast insert payloads as `any` for those extra columns — consistent with project
// eslint-disable-next-line @typescript-eslint/no-explicit-any pattern throughout.
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}
```

**Row-to-typed-object mapper** (mirrors `mapRowToInsight`, lines 38–62 in analog):
```typescript
// The analog uses Zod `.parse()` inside the mapper.
// For scoring, the returned shape is OpportunityScoreRow — pass through directly
// (or map camelCase if a local ScoreHistoryRow type is defined).
// Pattern: always return null-safe defaults for nullable columns.
function mapRowToScoreResult(row: OpportunityScoreRow): OpportunityScoreRow {
  return row  // rows are returned directly; no domain transformation needed here
}
```

**Optional insert helper** (mirrors `toLocationInsightInsert`, lines 64–90 in analog):
```typescript
// Per Claude's Discretion: may export toOpportunityScoreInsert() or inline.
// Inline is simpler for this module; export only if reused across files.
```

**Core upsert pattern** (mirrors `upsertLocationInsightForListing`, lines 144–168):
```typescript
// analog: (supabase.from('location_insights') as any)
//   .upsert(payload, { onConflict: 'user_id,listing_id' })
//   .select('*').single()
//   → { data: ..., error: ... }
//
// Key difference: scoring adds a read-then-write for score_version increment.
// Step 1: read current score_version (maybeSingle())
// Step 2: upsert with score_version + 1, onConflict: 'user_id,listing_id,strategy_slug'

export async function upsertScore(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  result: ScoreResult
): Promise<{ data: OpportunityScoreRow | null; error: string | null }> {
  const { data: existing } = await (supabase.from('opportunity_scores') as any)
    .select('score_version')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('strategy_slug', result.strategySlug)
    .maybeSingle()

  const nextVersion = (existing?.score_version ?? 0) + 1

  const payload = {
    user_id: userId,
    listing_id: listingId,
    strategy_slug: result.strategySlug,
    total_score: result.totalScore,
    score_version: nextVersion,
    breakdown: result.breakdown as Json,
    signals: result.signals as Json,
    risks: result.risks as Json,
    fit_label: result.fitLabel,
    computed_at: result.computedAt,
    // migration 013 category columns — cast as any to work around missing types
    demographics_score: result.breakdown.find(c => c.category === 'demographics')?.score ?? null,
    location_score: result.breakdown.find(c => c.category === 'location_quality')?.score ?? null,
    foot_traffic_score: result.breakdown.find(c => c.category === 'nearby_businesses')?.score ?? null,
    competition_score: result.breakdown.find(c => c.category === 'competition')?.score ?? null,
    risk_score: result.breakdown.find(c => c.category === 'risk')?.score ?? null,
    investor_fit_score: result.breakdown.find(c => c.category === 'investor_fit')?.score ?? null,
    engine_version: '1.0',
  }

  const { data, error } = await (supabase.from('opportunity_scores') as any)
    .upsert(payload, { onConflict: 'user_id,listing_id,strategy_slug' })
    .select('*')
    .single()

  if (error || !data) {
    return { data: null, error: error?.message ?? 'Failed to save score.' }
  }
  return { data: data as OpportunityScoreRow, error: null }
}
```

**Read pattern** (mirrors `getListingLocationInsight`, lines 127–142):
```typescript
// analog: .select('*').eq('listing_id', ...).eq('user_id', ...).order(...).limit(1).maybeSingle()
// scoring variant: no limit (returns all strategy rows), orders by total_score DESC

export async function getScoreHistory(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug?: string
): Promise<OpportunityScoreRow[]> {
  let query = (supabase.from('opportunity_scores') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)

  if (strategySlug) {
    query = query.eq('strategy_slug', strategySlug)
  }

  const { data } = await query.order('total_score', { ascending: false })
  return (data ?? []) as OpportunityScoreRow[]
}
```

**Error shape** (lines 105–109 in analog):
```typescript
if (error || !data) {
  return { data: null, error: error?.message ?? 'Failed to save score.' }
}
```

---

### `lib/scoring/service.ts` (service/orchestrator, request-response)

**Analog:** `lib/location-intelligence/api.ts`

**Imports pattern** (lines 1–16 in analog):
```typescript
import type { Database } from '@/types/supabase'
import { computeScore } from './engine'
import { upsertScore, getScoreHistory } from './data'
import { getListingLocationInsight } from '@/lib/location-intelligence/insights'
import type { ScoringActionState, ScoreResult } from './schemas'

type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}
type ListingRow = Database['public']['Tables']['listings']['Row']
```

**loadListingForUser helper** (lines 118–131 in analog — reuse exactly):
```typescript
// analog: lib/location-intelligence/api.ts lines 118-131
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
```

**Orchestrator: load → enrich → compute → persist** (mirrors `enrichListingLocationInsight`, lines 157–169):
```typescript
// analog pattern: load listing → call provider → upsert result → return { data, error }
// scoring variant: load listing → load insight → computeScore (3-state) → upsertScore

export async function scoreListingService(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState & { scoreResult?: ScoreResult }> {
  const listing = await loadListingForUser(supabase, userId, listingId)
  if (!listing) {
    return { errors: { general: ['Imóvel não encontrado.'] } }
  }

  const insight = await getListingLocationInsight(supabase, userId, listingId)

  // three-state engine output — map to ScoringActionState (D-07, D-08)
  const outcome = computeScore(listing, insight, strategySlug)

  if (outcome.status === 'NEEDS_ENRICHMENT') {
    return { errors: { general: ['Enriqueça a localização antes de calcular a pontuação.'] } }
  }
  if (outcome.status === 'ENRICHMENT_FAILED') {
    return { errors: { general: ['Não foi possível calcular a pontuação. Tente novamente.'] } }
  }

  const saveResult = await upsertScore(supabase, userId, listingId, outcome.result)
  if (saveResult.error) {
    return { errors: { general: ['Não foi possível salvar a pontuação.'] } }
  }

  return { message: 'Pontuação calculada com sucesso.', score: outcome.result, scoreResult: outcome.result }
}
```

**Error shape from analog** (lines 165–168):
```typescript
// analog: if (!listing) { return { data: null, error: 'Listing not found.' } }
// scoring: map to ScoringActionState errors.general array (Portuguese), never raw Error
```

---

### `lib/actions/scoring-actions.ts` (server action, request-response)

**Analog:** `lib/actions/location-insight-actions.ts`

**File header + imports** (lines 1–8 in analog):
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { scoreListingService } from '@/lib/scoring/service'
import { getScoreHistory } from '@/lib/scoring/data'
import type { ScoringActionState } from '@/lib/scoring/schemas'
import { STRATEGIES } from '@/lib/scoring/strategies'
```

**Auth gate pattern** (lines 22–25 in analog — identical for all actions):
```typescript
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
```

**errorState / successState helpers** (lines 10–16 in analog):
```typescript
function errorState(message: string): ScoringActionState {
  return { errors: { general: [message] } }
}
function successState(message: string, score?: ScoreResult): ScoringActionState {
  return { message, score }
}
```

**Single-strategy action** (mirrors `enrichListingLocationAction`, lines 22–35):
```typescript
// analog: service call → error check → revalidatePath × 2 → return state
// scoring: service call → revalidatePath + revalidateTag → return ScoringActionState
export async function scoreListingAction(
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await scoreListingService(supabase, user.id, listingId, strategySlug)

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')           // D-15: tag-based cache bust

  return { message: result.message, score: result.score, errors: result.errors }
}
```

**Best-fit action** (D-04, D-05, D-06 — new pattern; no exact analog):
```typescript
// Hard-code exactly 3 slugs per D-04. Do NOT enumerate STRATEGIES.
const BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy'] as const

export async function getBestFitAction(listingId: string): Promise<{
  scores: ScoringActionState[]
  topStrategies: { slug: string; label: string; totalScore: number; fitLabel: string }[]
}> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // parallel upserts are safe — each targets a different (user_id, listing_id, strategy_slug) row
  const results = await Promise.all(
    BEST_FIT_SLUGS.map(slug => scoreListingService(supabase, user.id, listingId, slug))
  )

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  const scored = results
    .map((r, i) => ({ slug: BEST_FIT_SLUGS[i], state: r }))
    .filter(x => x.state.score !== undefined && x.state.score !== null)
    .sort((a, b) => b.state.score!.totalScore - a.state.score!.totalScore)

  return {
    scores: results,
    topStrategies: scored.slice(0, 2).map(x => ({
      slug: x.slug,
      label: STRATEGIES[x.slug].label,
      totalScore: x.state.score!.totalScore,
      fitLabel: x.state.score!.fitLabel,
    })),
  }
}
```

**Cache invalidation** (D-15 — use BOTH `revalidatePath` and `revalidateTag`):
```typescript
// revalidatePath — updates the listing detail page RSC cache
revalidatePath(`/imoveis/${listingId}`)
// revalidateTag — busts all unstable_cache entries tagged 'opportunity_score'
revalidateTag('opportunity_score')
```

---

### `app/api/listings/[id]/score/route.ts` (API route, request-response)

**Analog (GET):** `app/api/listings/[id]/location-insight/route.ts`
**Analog (POST):** `app/api/listings/[id]/enrich-location/route.ts`

**RouteContext type + params await** (lines 4–6 in location-insight analog):
```typescript
type RouteContext = {
  params: Promise<{ id: string }>
}
// always: const { id } = await params   (Next.js 15 App Router — params is a Promise)
```

**Auth gate in route handler** (lines 9–13 in location-insight analog):
```typescript
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

**GET handler** (mirrors location-insight GET, lines 9–19):
```typescript
export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const strategy = searchParams.get('strategy') ?? undefined   // optional filter

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scores = await getScoreHistory(supabase, user.id, id, strategy)
  return NextResponse.json({ scores })
}
```

**POST handler** (mirrors enrich-location POST, lines 9–22):
```typescript
export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // body validation (zod or manual) — strategy_slug is required
  const body = await request.json().catch(() => ({}))
  const strategySlug = body?.strategy_slug
  if (!strategySlug || typeof strategySlug !== 'string') {
    return NextResponse.json({ error: 'strategy_slug is required' }, { status: 400 })
  }

  const result = await scoreListingService(supabase, user.id, id, strategySlug)
  if (result.errors) {
    return NextResponse.json(
      { error: result.errors.general?.[0] ?? 'Scoring failed' },
      { status: 422 }
    )
  }

  revalidateTag('opportunity_score')   // NOT revalidatePath — route handlers use tag only
  return NextResponse.json({ score: result.score })
}
```

**Error status mapping** (mirrors enrich-location lines 16–18):
```typescript
// analog: const status = result.error === 'Listing not found.' ? 404 : 500
// scoring: use 422 for engine-level failures (enrichment missing), 404 for listing not found
```

---

### `tests/scoring-service.test.mjs` (integration test)

**Analog (test structure):** `tests/scoring-engine.test.mjs`
**Analog (mock Supabase):** `tests/location-intelligence.test.mjs`

**File header + CJS shim** (lines 1–5 in scoring-engine analog):
```javascript
import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// Import compiled .js outputs (not .ts) — same pattern as Phase 16
const { upsertScore, getScoreHistory } = require('../lib/scoring/data.js')
const { scoreListingService } = require('../lib/scoring/service.js')
```

**Fixture builders** (mirrors `makeListing` / `makeInsight`, lines 20–67 in scoring-engine analog):
```javascript
function makeScoreRow(overrides = {}) {
  return {
    id: 'score-001',
    user_id: 'user-001',
    listing_id: 'listing-001',
    strategy_slug: 'cafe',
    total_score: 72,
    score_version: 1,
    breakdown: [],
    signals: [],
    risks: [],
    fit_label: 'forte',
    fit_label: 'forte',
    computed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeListing(overrides = {}) {
  return { id: 'listing-001', user_id: 'user-001', city: 'Recife', state: 'PE',
    country: 'BR', price_amount: 450000, lat: -8.12, lng: -34.90, tags: [],
    commercial_type: 'ponto_comercial', ...overrides }
}

function makeInsight(overrides = {}) {
  return { id: 'insight-001', userId: 'user-001', city: 'Recife', state: 'PE',
    country: 'BR', avgIncome: 4500, populationDensity: 6000, confidenceScore: 85,
    nearbyBusinesses: [], dataSources: [], consumerProfile: null,
    latitude: -8.12, longitude: -34.90, rawGeocode: {}, rawDemographics: {},
    rawPlaces: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    ...overrides }
}
```

**Mock Supabase builder** (mirrors location-intelligence.test.mjs lines 399–440 — chained builder pattern):
```javascript
// Pattern: .from(table) returns object with .select()/.upsert() returning chainable
// objects ending in async .maybeSingle() / .single() / array resolve.
// CRITICAL: the chain must handle all method calls that the implementation uses.

function makeSupabaseMock({ scoreRow = null, noExisting = false, listingRow = null, insightRow = null } = {}) {
  return {
    from(table) {
      if (table === 'opportunity_scores') {
        return {
          select() {
            const chain = {
              eq() { return chain },
              order() { return chain },
              maybeSingle: async () => ({ data: noExisting ? null : scoreRow, error: null }),
              single: async () => ({ data: scoreRow, error: null }),
            }
            return chain
          },
          upsert(payload) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: { ...makeScoreRow(), ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      }
      if (table === 'location_insights') {
        const chain = {
          eq() { return chain },
          order() { return chain },
          limit() { return chain },
          maybeSingle: async () => ({ data: insightRow, error: null }),
        }
        return { select() { return chain } }
      }
      if (table === 'listings') {
        const chain = {
          eq() { return chain },
          maybeSingle: async () => ({ data: listingRow, error: null }),
        }
        return { select() { return chain } }
      }
    },
  }
}
```

**D-10 required test cases** (test names to implement):
```javascript
// From D-10 — all 5 cases must be present:

test('save/fetch round-trip: upsertScore then getScoreHistory returns the row', async () => { ... })

test('missing location_insights returns Portuguese error in errors.general', async () => { ... })

test('recompute of same listing+strategy produces score_version increment in upsert payload', async () => {
  // Capture upsert payload, assert score_version === existing.score_version + 1
  // mirrors RESEARCH.md code example lines 580-608
})

test('getBestFitAction returns cafe as top strategy when cafe input data is stronger', async () => { ... })

test('history endpoint: getScoreHistory returns current score row for listing', async () => { ... })
```

**score_version increment test** (from RESEARCH.md lines 580–608):
```javascript
test('recompute increments score_version in upsert payload', async () => {
  let upsertPayload = null
  const supabase = {
    from(table) {
      return {
        select() {
          const chain = {
            eq() { return chain },
            maybeSingle: async () => ({ data: { score_version: 3 }, error: null }),
          }
          return chain
        },
        upsert(payload) {
          upsertPayload = payload
          return { select() { return { single: async () => ({ data: { ...payload }, error: null }) } } }
        },
      }
    },
  }

  const fakeResult = { totalScore: 75, strategySlug: 'cafe', fitLabel: 'forte',
    breakdown: [], signals: [], risks: [], computedAt: new Date().toISOString() }

  await upsertScore(supabase, 'user-001', 'listing-001', fakeResult)

  assert.equal(upsertPayload.score_version, 4, 'score_version should be 3+1=4')
})
```

**Test run command** (from RESEARCH.md):
```bash
node --test tests/scoring-service.test.mjs
# Full suite:
npm test
```

---

## Shared Patterns

### Authentication (apply to all new server actions and route handlers)

**Source:** `lib/actions/location-insight-actions.ts` lines 23–25 and `app/api/listings/[id]/location-insight/route.ts` lines 11–13

Server action:
```typescript
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')   // actions use redirect()
```

API route:
```typescript
const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })   // routes use NextResponse
```

**Rule:** Always `getUser()`, never `getSession()`. Two different failure modes: actions `redirect`, routes return 401.

### SupabaseLike Type (apply to all data-layer and service files)

**Source:** `lib/location-intelligence/insights.ts` lines 13–16, `lib/location-intelligence/api.ts` lines 18–21

```typescript
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (relation: string) => any
}
```

Use `(supabase.from('table') as any)` for all chained queries. This is the established pattern to work around Supabase's complex generic types.

### Error Return Shape (apply to all data and service functions)

**Source:** `lib/location-intelligence/insights.ts` lines 105–109

```typescript
if (error || !data) {
  return { data: null, error: error?.message ?? 'Failed to save score.' }
}
return { data: mapResult(data), error: null }
```

Data functions return `{ data: T | null; error: string | null }`. Service/action functions return `ScoringActionState` with `errors.general` as string array (Portuguese messages).

### Cache Invalidation (apply to all mutation paths)

**Source:** D-15 in CONTEXT.md; pattern from `lib/actions/location-insight-actions.ts` lines 32–34

```typescript
// In server actions — use both:
revalidatePath(`/imoveis/${listingId}`)
revalidateTag('opportunity_score')

// In API route POST handlers — use tag only (not revalidatePath):
revalidateTag('opportunity_score')
```

**unstable_cache key shape** (per Claude's Discretion in CONTEXT.md):
- Full listing read: `['opportunity_score', userId, listingId]`
- Strategy-specific read: `['opportunity_score', userId, listingId, strategySlug]`
- Always include `userId` as first discriminator to prevent cross-user cache leaks.

### CJS Test Shim (apply to all test files)

**Source:** `tests/scoring-engine.test.mjs` lines 1–5, `tests/location-intelligence.test.mjs` lines 1–6

```javascript
import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// Require .js compiled output — NOT .ts source files
const { functionName } = require('../lib/scoring/data.js')
```

**Note:** The `.js` files must exist (compiled from TypeScript). If `lib/scoring/data.js` does not exist, add a Wave 0 compile step (`tsc --noEmit false`) or switch test imports to use `tsx` loader.

---

## No Analog Found

All 5 files have close analogs. The `getBestFitAction` function inside `lib/actions/scoring-actions.ts` has no direct analog (it is a new multi-strategy orchestration pattern) but is composed entirely of existing patterns: the auth gate, `scoreListingService` calls, and `Promise.all` with sort.

---

## Key Pitfalls (copy into plan action notes)

| Pitfall | Consequence | Guard |
|---|---|---|
| `types/supabase.ts` missing migration 013 columns | TypeScript error on category column writes | Wave 0: attempt `npx supabase gen types typescript --local`; fallback: cast payload as `any` |
| `score_version` read-then-write race | Version increments by 1 under concurrent recompute | Acceptable for v1.6; document as known limitation |
| `unstable_cache` key without `userId` | Cross-user cache leak | Always include `userId` as first element in key array |
| `revalidatePath` in route handler | Non-idiomatic | Use `revalidateTag` only inside route handlers |
| `getBestFitAction` using all 6 strategies | Violates D-04 | Hard-code `['cafe', 'logistics', 'pharmacy']`; do not enumerate `STRATEGIES` |
| Tests importing `.ts` directly | CJS require fails | Import compiled `.js` or use `tsx` loader |

---

## Metadata

**Analog search scope:** `lib/location-intelligence/`, `lib/actions/`, `app/api/listings/`, `tests/`
**Files scanned:** 7 analog files read in full
**Pattern extraction date:** 2026-05-10
