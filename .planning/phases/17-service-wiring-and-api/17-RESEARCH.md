# Phase 17: Service Wiring and API — Research

**Researched:** 2026-05-10
**Domain:** Next.js 15 server actions, API routes, Supabase upsert, node:test integration tests
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Score history uses UPSERT semantics — one row per `(user_id, listing_id, strategy_slug)`. Recomputing overwrites and increments `score_version`. No separate history table.
- **D-02:** `getScoreHistory` returns the single current row for a given listing+strategy.
- **D-03:** "All versions for a listing+strategy" means all strategy variants for a listing (all rows where `listing_id = X`), not time-series snapshots.
- **D-04:** `getBestFitAction(listingId)` scores exactly 3 strategy profiles: `cafe`, `logistics`, `pharmacy`.
- **D-05:** Best-fit results are persisted — each of the 3 strategy scores is upserted to `opportunity_scores`.
- **D-06:** Return: ranked array of `{ strategySlug, totalScore, fitLabel }` for top 1–2, plus full `ScoringOutcome` for each.
- **D-07:** `scoreListingAction` and `getBestFitAction` return `ScoringActionState`. NOT the raw `ScoringOutcome`.
- **D-08:** `NEEDS_ENRICHMENT` or `ENRICHMENT_FAILED` translates to `errors.general` with a Portuguese message.
- **D-09:** Integration tests use a mock Supabase client with fixture data — no real DB required. Same `node:test` + CJS shims pattern as Phase 16.
- **D-10:** Test cases: save/fetch round-trip; missing `location_insights` returns Portuguese error; recompute increments `score_version`; `getBestFitAction` returns cafe as top when cafe data is stronger; history endpoint returns current score row.
- **D-11:** `lib/scoring/data.ts` mirrors `lib/location-intelligence/insights.ts` pattern.
- **D-12:** `lib/scoring/service.ts` mirrors `lib/location-intelligence/api.ts` pattern.
- **D-13:** `lib/actions/scoring-actions.ts` mirrors `lib/actions/location-insight-actions.ts` pattern.
- **D-14:** API route: `app/api/listings/[id]/score/route.ts` mirrors `app/api/listings/[id]/location-insight/route.ts`.
- **D-15:** Cache reads use `unstable_cache` with tag `'opportunity_score'`. Mutations call `revalidateTag('opportunity_score')`.
- **D-16:** RLS on `opportunity_scores` is the DB-level backstop. Service layer also filters by `user_id` explicitly.

### Claude's Discretion

- Exact field names and SQL for `upsertScore` (whether to use `.upsert(..., { onConflict: 'user_id,listing_id,strategy_slug' })` or a manual update path).
- `unstable_cache` key shape (per-user, per-listing, or per-listing+strategy granularity).
- Whether to export a `toOpportunityScoreInsert` helper or inline the mapping.

### Deferred Ideas (OUT OF SCOPE)

- Score history as time-series (keeping previous computation values).
- Scoring via `retail`, `services`, `any` profiles in `getBestFitAction`.
- Webhook/push notification when score crosses a threshold.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCO-09 | `POST /api/listings/[id]/score` computes and saves a score for a given `strategy_slug`. Returns saved `ScoreResult`. | API route pattern confirmed from `enrich-location/route.ts`; `computeScore` + `upsertScore` chain is clear. |
| SCO-10 | `GET /api/listings/[id]/score?strategy=[slug]` retrieves latest saved score for that strategy. | `getScoreHistory` data function + query param parsing covered by `maybeSingle()` pattern. |
| SCO-11 | Scores can be recomputed on demand. Recomputation increments `score_version` and overwrites row. | UPSERT with `score_version = EXCLUDED.score_version + 1` or `.update()` after SELECT — covered below. |
| SCO-12 | API endpoints are user-scoped (auth check + `user_id` filter on all DB reads/writes). | `getUser()` in route + `eq('user_id', user.id)` in data layer enforced at two levels. |
| SCO-18 | Integration tests: save/fetch round-trip, missing insight error path, recompute increments `score_version`. | `node:test` + mock Supabase client pattern from Phase 16 directly applicable. |
| SCO-19 | Score all 3 strategy profiles for a listing; surface top 1–2 best-fit business types. | `getBestFitAction` runs `computeScore` for `cafe`, `logistics`, `pharmacy` then sorts by `totalScore`. |
| SCO-20 | Each recompute creates a new score version; user can view score history (current row per strategy). | UPSERT increments `score_version`; `getScoreHistory` returns all rows for `listing_id` ordered by `total_score DESC`. |
</phase_requirements>

---

## Summary

Phase 17 wires Phase 16's pure engine (`computeScore`, `STRATEGIES`) into the application stack via four new modules and one API route pair. The pattern to follow is already proven: `lib/location-intelligence/` shows how the project separates data access (`insights.ts`) from orchestration (`api.ts`) from the action surface (`actions/`). This phase replicates that exact structure under `lib/scoring/`.

The key technical challenge is the UPSERT semantics for `score_version`. Supabase's `.upsert()` does not natively increment a counter on conflict — it can only set a literal value. The increment must either be handled with a raw SQL expression (`score_version = opportunity_scores.score_version + 1`) via `.rpc()`, or by reading the current row first and incrementing in TypeScript, then upserting. The read-then-write approach is simpler and stays consistent with the existing pattern of using typed `.from()` chains. Given scores are not high-frequency writes, the extra round-trip is acceptable.

The `supabase.ts` generated types have a gap: migration 013 added `demographics_score`, `location_score`, `foot_traffic_score`, `competition_score`, `risk_score`, `investor_fit_score`, and `engine_version` columns but these are not yet reflected in `types/supabase.ts`. The data layer must either extend the Row type locally or cast as `any` (consistent with existing project pattern). Regenerating types via `supabase gen types` is the clean fix, or the Insert payload can include those extra fields while the Row type is cast.

Integration tests follow the exact `node:test` + CJS shim + mock Supabase client pattern from `tests/scoring-engine.test.mjs` and `tests/location-intelligence.test.mjs`. The 15 scoring engine tests pass; 3 location-intelligence tests fail pre-existing (unrelated to this phase). New integration tests go in `tests/scoring-service.test.mjs`.

**Primary recommendation:** Follow the data → service → action → route module chain exactly, treat `score_version` increment as a read-then-write, and generate/extend types before writing the data layer.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Score computation | API / Backend (`lib/scoring/service.ts`) | — | Pure logic, no client execution |
| Score persistence (upsert) | API / Backend (`lib/scoring/data.ts`) | — | DB writes are server-only |
| Score reads / GET endpoint | API / Backend (`app/api/listings/[id]/score/route.ts`) | — | Auth-gated, user-scoped |
| Score compute / POST endpoint | API / Backend (same route, POST handler) | — | Triggers service orchestration |
| Server actions (UI trigger) | Frontend Server (`lib/actions/scoring-actions.ts`) | — | `'use server'`, called by React components |
| Cache invalidation | Frontend Server (`revalidatePath` / `revalidateTag`) | — | Co-located with mutation in server action |
| Best-fit orchestration | API / Backend (`lib/scoring/service.ts`) | — | Calls engine 3x, upserts 3x |
| Integration tests | Build-time (`tests/scoring-service.test.mjs`) | — | `node:test`, no browser |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | ^0.5.2 [VERIFIED: package.json] | Supabase client for server components/actions/routes | Project-mandated; `@supabase/auth-helpers-nextjs` is forbidden |
| `next` | 15.5.15 [VERIFIED: package.json] | App Router, server actions, API routes, `unstable_cache`, `revalidateTag` | Project foundation |
| `zod` | ^3.25.76 [VERIFIED: package.json] | Runtime validation for API request bodies and DB row mapping | Already used throughout schemas.ts |
| `node:test` | built-in (Node 25.9.0) [VERIFIED: runtime] | Integration test runner (no external dep) | Phase 16 pattern; CJS shims work |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/cache` | bundled with next 15 | `unstable_cache`, `revalidateTag`, `revalidatePath` | Cache reads (unstable_cache), invalidation on mutation |
| `server-only` | ^0.0.1 [VERIFIED: package.json] | Guard against data layer being imported client-side | All `lib/scoring/data.ts` exports |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Read-then-write for `score_version` | Supabase RPC with SQL increment | RPC adds more schema surface; read-then-write is simpler and consistent |
| `revalidatePath` only | `revalidateTag('opportunity_score')` | Tags are more granular; D-15 specifies both — use `revalidateTag` on mutations, `revalidatePath` on the listing page as secondary |

**No new npm dependencies required.** [VERIFIED: all needed packages already in package.json]

---

## Architecture Patterns

### System Architecture Diagram

```
POST /api/listings/[id]/score
  │  body: { strategy_slug }
  │
  ├─► getUser() [auth gate]
  │
  ├─► loadListingForUser(supabase, userId, listingId) ──────► listings table
  │
  ├─► getListingLocationInsight(supabase, userId, listingId) ► location_insights table
  │     │
  │     └── null ──► ScoringActionState { errors.general: "Enriqueça..." }
  │
  ├─► computeScore(listing, insight, strategySlug)
  │     │ SCORED        ──► ScoreResult
  │     │ NEEDS_ENRICHMENT  ──► ScoringActionState error
  │     └─ ENRICHMENT_FAILED ──► ScoringActionState error
  │
  ├─► upsertScore(supabase, userId, listingId, scoreResult)
  │     ├─► SELECT current score_version
  │     └─► UPSERT with score_version + 1  ──► opportunity_scores table
  │
  └─► NextResponse.json({ score: ScoreResult })


GET /api/listings/[id]/score?strategy=[slug]
  │
  ├─► getUser() [auth gate]
  ├─► getScoreHistory(supabase, userId, listingId, strategySlug?)
  │     └─► SELECT * WHERE user_id=? AND listing_id=? [AND strategy_slug=?]
  └─► NextResponse.json({ scores: [...] })


scoreListingAction(listingId, strategySlug)  [server action]
  │  'use server' ──► getUser() ──► scoreListingService(...)
  └─► revalidatePath('/imoveis/${listingId}')
      revalidateTag('opportunity_score')
      return ScoringActionState


getBestFitAction(listingId)  [server action]
  │  'use server' ──► getUser()
  ├─► scoreListingService(listing, insight, 'cafe')     ──► upsert
  ├─► scoreListingService(listing, insight, 'logistics') ──► upsert
  ├─► scoreListingService(listing, insight, 'pharmacy')  ──► upsert
  └─► sort by totalScore DESC ──► return top 1-2 + full outcomes
```

### Recommended Project Structure

```
lib/scoring/
├── schemas.ts          # EXISTING — ScoringOutcome, ScoringActionState, ScoreResult types
├── engine.ts           # EXISTING — computeScore(), RuleBasedScoringEngine
├── strategies.ts       # EXISTING — STRATEGIES, getStrategy(), STRATEGY_SLUGS
├── data.ts             # NEW — SupabaseLike data access: upsertScore, getScoreHistory
└── service.ts          # NEW — orchestrator: loadListing → loadInsight → compute → persist

lib/actions/
└── scoring-actions.ts  # NEW — 'use server': scoreListingAction, getBestFitAction

app/api/listings/[id]/
└── score/
    └── route.ts        # NEW — GET (retrieve) + POST (compute+save)

tests/
└── scoring-service.test.mjs  # NEW — integration tests, mock Supabase, D-10 cases
```

### Pattern 1: Data Layer (lib/scoring/data.ts)

**What:** SupabaseLike parameter, typed returns, mapRowToScore helper, upsertScore with version increment via read-then-write.

**When to use:** All DB reads/writes for `opportunity_scores`.

```typescript
// Source: mirrors lib/location-intelligence/insights.ts [VERIFIED: codebase]
import type { Database, Json } from '@/types/supabase'
import type { ScoreResult } from './schemas'
import 'server-only'

type OpportunityScoreRow = Database['public']['Tables']['opportunity_scores']['Row']
type SupabaseLike = { from: (relation: string) => any }

// Note: types/supabase.ts Row does NOT yet include category columns from migration 013.
// Cast the insert payload — planner must include a Wave 0 task to regenerate types
// OR extend OpportunityScoreRow locally with the missing columns.

export async function upsertScore(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  result: ScoreResult
): Promise<{ data: OpportunityScoreRow | null; error: string | null }> {
  // Step 1: Read current score_version (or 0 if not yet persisted)
  const { data: existing } = await (supabase.from('opportunity_scores') as any)
    .select('score_version')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('strategy_slug', result.strategySlug)
    .maybeSingle()

  const nextVersion = (existing?.score_version ?? 0) + 1

  // Step 2: Upsert with incremented version
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
    // category columns (migration 013)
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

### Pattern 2: Service Orchestrator (lib/scoring/service.ts)

**What:** Loads listing + location insight, calls `computeScore`, calls `upsertScore`. Returns `ScoringActionState`.

**When to use:** Called by both server actions and API routes.

```typescript
// Source: mirrors lib/location-intelligence/api.ts [VERIFIED: codebase]
import { computeScore } from './engine'
import { upsertScore, getScoreHistory } from './data'
import { getListingLocationInsight } from '@/lib/location-intelligence/insights'
import type { ScoringActionState, ScoreResult } from './schemas'
import type { Database } from '@/types/supabase'

type SupabaseLike = { from: (relation: string) => any }

export async function scoreListingService(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState & { scoreResult?: ScoreResult }> {
  // 1. Load listing
  const { data: listing } = await (supabase.from('listings') as any)
    .select('*').eq('id', listingId).eq('user_id', userId).maybeSingle()

  if (!listing) {
    return { errors: { general: ['Imóvel não encontrado.'] } }
  }

  // 2. Load location insight
  const insight = await getListingLocationInsight(supabase, userId, listingId)

  // 3. Compute (three-state engine)
  const outcome = computeScore(listing, insight, strategySlug)

  if (outcome.status === 'NEEDS_ENRICHMENT') {
    return { errors: { general: ['Enriqueça a localização antes de calcular a pontuação.'] } }
  }
  if (outcome.status === 'ENRICHMENT_FAILED') {
    return { errors: { general: ['Não foi possível calcular a pontuação. Tente novamente.'] } }
  }

  // 4. Persist
  const saveResult = await upsertScore(supabase, userId, listingId, outcome.result)
  if (saveResult.error) {
    return { errors: { general: ['Não foi possível salvar a pontuação.'] } }
  }

  return { message: 'Pontuação calculada com sucesso.', score: outcome.result, scoreResult: outcome.result }
}
```

### Pattern 3: Server Action (lib/actions/scoring-actions.ts)

**What:** `'use server'`, `getUser()`, delegate to service, `revalidatePath` + `revalidateTag`.

```typescript
// Source: mirrors lib/actions/location-insight-actions.ts [VERIFIED: codebase]
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { scoreListingService } from '@/lib/scoring/service'
import { getScoreHistory } from '@/lib/scoring/data'
import type { ScoringActionState } from '@/lib/scoring/schemas'
import { STRATEGIES } from '@/lib/scoring/strategies'

export async function scoreListingAction(
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const result = await scoreListingService(supabase, user.id, listingId, strategySlug)

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  return { message: result.message, score: result.score, errors: result.errors }
}

// getBestFitAction: scores cafe, logistics, pharmacy and returns ranked top strategies
export async function getBestFitAction(listingId: string): Promise<{
  scores: ScoringActionState[]
  topStrategies: { slug: string; label: string; totalScore: number; fitLabel: string }[]
}> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy'] as const
  const results = await Promise.all(
    BEST_FIT_SLUGS.map(slug => scoreListingService(supabase, user.id, listingId, slug))
  )

  revalidatePath(`/imoveis/${listingId}`)
  revalidateTag('opportunity_score')

  const scored = results
    .map((r, i) => ({ slug: BEST_FIT_SLUGS[i], state: r }))
    .filter(x => x.state.score !== undefined && x.state.score !== null)
    .sort((a, b) => (b.state.score!.totalScore) - (a.state.score!.totalScore))

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

### Pattern 4: API Route (app/api/listings/[id]/score/route.ts)

**What:** GET retrieves saved scores; POST computes+saves a score.

```typescript
// Source: mirrors app/api/listings/[id]/location-insight/route.ts [VERIFIED: codebase]
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { scoreListingService } from '@/lib/scoring/service'
import { getScoreHistory } from '@/lib/scoring/data'
import { revalidateTag } from 'next/cache'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const strategy = searchParams.get('strategy') ?? undefined

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scores = await getScoreHistory(supabase, user.id, id, strategy)
  return NextResponse.json({ scores })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const strategySlug = body?.strategy_slug
  if (!strategySlug || typeof strategySlug !== 'string') {
    return NextResponse.json({ error: 'strategy_slug is required' }, { status: 400 })
  }

  const result = await scoreListingService(supabase, user.id, id, strategySlug)
  if (result.errors) {
    return NextResponse.json({ error: result.errors.general?.[0] ?? 'Scoring failed' }, { status: 422 })
  }

  revalidateTag('opportunity_score')
  return NextResponse.json({ score: result.score })
}
```

### Anti-Patterns to Avoid

- **`getSession()` instead of `getUser()`:** Silent auth security hole. CLAUDE.md mandates `getUser()` always. [VERIFIED: CLAUDE.md]
- **Calling `computeScore` inside API route directly:** Bypass the service layer. All orchestration must live in `service.ts` so both the action and the API route share the same path.
- **Calling `revalidatePath` inside the API route:** `revalidatePath` is a Next.js server action primitive; calling it inside a route handler may work but is not idiomatic — use `revalidateTag` in routes.
- **Assuming `supabase.ts` types include migration 013 columns:** They don't (verified by grep). Either regenerate types or cast explicitly. Using the columns without acknowledging this will produce TypeScript errors.
- **Parallel upserts in `getBestFitAction` sharing a race on `score_version`:** Each `scoreListingService` call scopes to a different `strategy_slug`, so the UNIQUE constraint covers `(user_id, listing_id, strategy_slug)`. Running 3 parallel upserts is safe because they target different rows.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth check in routes | Custom session parsing | `supabase.auth.getUser()` | CLAUDE.md rule; `getSession()` is insecure |
| score_version increment in SQL | Custom Postgres function | Read-then-write in TypeScript | Avoids schema migration, consistent with project pattern |
| Response caching | Custom in-memory cache | `unstable_cache` with `revalidateTag` | Next.js built-in, works with ISR/RSC lifecycle |
| Test runner | Jest, Vitest | `node:test` (built-in) | Phase 16 pattern; no extra dep; Node 25.9.0 has full support |

---

## Runtime State Inventory

> Not applicable — this is a greenfield module addition. No rename/refactor involved.

---

## Common Pitfalls

### Pitfall 1: `types/supabase.ts` missing migration 013 columns

**What goes wrong:** TypeScript errors when writing `demographics_score`, `location_score`, etc. to the insert payload.
**Why it happens:** `types/supabase.ts` was generated before migrations 013 ran. It only reflects migration 012 columns.
**How to avoid:** Wave 0 task must regenerate types (`npx supabase gen types typescript --local > types/supabase.ts`) OR declare a local type extension for the insert payload.
**Warning signs:** TypeScript error `Object literal may only specify known properties` on category columns.

### Pitfall 2: `score_version` increment lost under race condition (single user, rapid recompute)

**What goes wrong:** Two near-simultaneous POST requests both read `score_version = 1`, both write `score_version = 2` — version only increments once.
**Why it happens:** Read-then-write is not atomic without a DB transaction or advisory lock.
**How to avoid:** Acceptable for v1.6 — brokers recompute manually, not at high frequency. Document the limitation. If it becomes an issue, a Postgres function with `UPDATE ... SET score_version = score_version + 1 ... RETURNING *` eliminates the race.
**Warning signs:** `score_version` stays lower than expected after rapid successive computes (observable only in load testing).

### Pitfall 3: `unstable_cache` key collision across users

**What goes wrong:** User A gets User B's cached score.
**Why it happens:** Cache key does not include `userId`.
**How to avoid:** Include `userId` in every `unstable_cache` key array: `['opportunity_score', userId, listingId, strategySlug]`.
**Warning signs:** Wrong scores returned to a user after another user triggers recompute on the same listing (shared listing scenario — not applicable in v1.6 since RLS is per-user, but defend against it anyway).

### Pitfall 4: `revalidateTag` not called on POST route

**What goes wrong:** `unstable_cache` returns stale score after POST compute.
**Why it happens:** Forgetting `revalidateTag('opportunity_score')` in the API route POST handler (server actions call it but the route must call it independently).
**Warning signs:** GET endpoint returns old score immediately after POST recompute.

### Pitfall 5: `getBestFitAction` calling `scoreListingService` with all 6 strategies instead of 3

**What goes wrong:** Violates D-04; `retail`, `services`, `any` are out of scope for best-fit per D-04.
**How to avoid:** Hard-code `BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy']` in the action; do not enumerate `STRATEGIES`.

---

## Code Examples

### Mock Supabase Client for Integration Tests

```javascript
// Source: pattern from tests/location-intelligence.test.mjs [VERIFIED: codebase]
// Adapted for opportunity_scores table

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
    computed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeSupabaseMock({ scoreRow = null, locationInsightRow = null, listingRow = null } = {}) {
  return {
    from(table) {
      if (table === 'opportunity_scores') {
        return {
          select() {
            const chain = {
              eq() { return chain },
              order() { return chain },
              maybeSingle: async () => ({ data: scoreRow, error: null }),
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
      if (table === 'location_insights') { /* similar chain returning locationInsightRow */ }
      if (table === 'listings') { /* similar chain returning listingRow */ }
    },
  }
}
```

### Test: score_version increment on recompute

```javascript
// Source: D-10, pattern from tests/scoring-engine.test.mjs [VERIFIED: codebase]
import test from 'node:test'
import assert from 'node:assert/strict'

test('recompute increments score_version in upsert payload', async () => {
  let upsertPayload = null
  const supabase = {
    from(table) {
      return {
        select() {
          // first call returns existing row with score_version: 3
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

  const { upsertScore } = require('../lib/scoring/data.js')
  const fakeResult = { totalScore: 75, strategySlug: 'cafe', fitLabel: 'forte',
    breakdown: [], signals: [], risks: [], computedAt: new Date().toISOString() }

  await upsertScore(supabase, 'user-001', 'listing-001', fakeResult)

  assert.equal(upsertPayload.score_version, 4, 'score_version should be 3+1=4')
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | Project standard [VERIFIED: CLAUDE.md] | `getServerSideProps` pattern obsolete |
| `getSession()` for auth | `getUser()` | Project standard [VERIFIED: CLAUDE.md] | `getSession()` trusts JWT without server verification |
| Zustand/Redux for shared state | Server components + server actions + `revalidatePath` | Project standard [VERIFIED: CLAUDE.md] | No client state management needed |
| `unstable_cache` with `revalidatePath` only | `revalidateTag` for granular cache busting | Next.js 14+ [ASSUMED] | Tags allow busting all score-related caches in one call |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `unstable_cache` + `revalidateTag` are available and stable in Next.js 15.5 | Standard Stack | Low — these are core Next.js 15 caching primitives available since 14; [VERIFIED: node_modules/next/cache.d.ts confirms the exports exist] |
| A2 | The read-then-write for `score_version` does not need a DB transaction for v1.6 | Architecture | Low — manual scoring at broker pace; no concurrent compute scenario |
| A3 | `supabase.ts` types do not include migration 013 columns | Pitfall 1 | Verified by grep — no matches for `demographics_score` in types/supabase.ts [VERIFIED: codebase grep] |

**No high-risk assumptions.** All critical claims are verified against the codebase.

---

## Open Questions (RESOLVED)

1. **Regenerate `types/supabase.ts` or extend locally?**
   - What we know: Migration 013 added 7 columns not in the generated types.
   - What's unclear: Whether `supabase gen types` will run cleanly in the dev environment (requires local Supabase running).
   - Recommendation: Wave 0 task should attempt `npx supabase gen types typescript --local > types/supabase.ts`. If Supabase local stack is not running, use a local type extension in `lib/scoring/data.ts` (cast payload as `any` for the extra columns, consistent with existing project pattern using `// eslint-disable-next-line @typescript-eslint/no-explicit-any`).

2. **`unstable_cache` key granularity (per-user+listing vs per-user+listing+strategy)?**
   - What we know: D-15 says use `unstable_cache` for reads.
   - What's unclear: Whether to cache at listing granularity (returns all strategy rows) or listing+strategy (single row).
   - Recommendation: Cache at `['opportunity_score', userId, listingId]` for the full listing read (GET without strategy param), and `['opportunity_score', userId, listingId, strategySlug]` for the strategy-specific read. Both invalidated by `revalidateTag('opportunity_score')`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `node:test` runner | Yes | 25.9.0 [VERIFIED] | — |
| `@supabase/ssr` | Server client | Yes | ^0.5.2 [VERIFIED: package.json] | — |
| `next` | App Router, cache | Yes | 15.5.15 [VERIFIED: package.json] | — |
| `zod` | Validation | Yes | ^3.25.76 [VERIFIED: package.json] | — |
| Supabase local stack | Type regeneration | Unknown | — | Cast with `any`, document debt |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | `node:test` (built-in, Node 25.9.0) |
| Config file | none — tests run via `node --test tests/*.test.mjs` |
| Quick run command | `node --test tests/scoring-service.test.mjs` |
| Full suite command | `npm test` (runs all `tests/*.test.mjs`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCO-09 | POST computes + saves score, returns ScoreResult | integration | `node --test tests/scoring-service.test.mjs` | No — Wave 0 |
| SCO-10 | GET retrieves latest saved score for a strategy | integration | `node --test tests/scoring-service.test.mjs` | No — Wave 0 |
| SCO-11 | Recompute increments `score_version` | integration | `node --test tests/scoring-service.test.mjs` | No — Wave 0 |
| SCO-12 | Auth check + user_id filter on all DB operations | integration | `node --test tests/scoring-service.test.mjs` | No — Wave 0 |
| SCO-18 | save/fetch round-trip; missing insight error; recompute version | integration | `node --test tests/scoring-service.test.mjs` | No — Wave 0 |
| SCO-19 | getBestFitAction returns cafe as top for cafe-optimized data | integration | `node --test tests/scoring-service.test.mjs` | No — Wave 0 |
| SCO-20 | getScoreHistory returns current row per strategy | integration | `node --test tests/scoring-service.test.mjs` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `node --test tests/scoring-service.test.mjs`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` with scoring-service tests all green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `tests/scoring-service.test.mjs` — covers SCO-09 through SCO-20 (all integration)
- [ ] `lib/scoring/data.js` (compiled) — required by CJS `require()` in test; TypeScript must compile or `tsx` must be used
- [ ] `lib/scoring/service.js` (compiled) — same as above

**Note on CJS compilation:** Phase 16 tests use `require('../lib/scoring/engine.js')` — the `.js` files exist alongside `.ts`. The planner must include a compile step (TSC or note that `.js` equivalents must be created/maintained) OR switch tests to use `tsx` for direct `.ts` import.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `supabase.auth.getUser()` — server-verified, not JWT-only |
| V3 Session Management | no | Supabase SSR handles session lifecycle |
| V4 Access Control | yes | RLS `USING (auth.uid() = user_id)` + `user_id` filter in every query |
| V5 Input Validation | yes | zod for `strategy_slug` in POST body; valid strategy check against `STRATEGY_SLUGS` |
| V6 Cryptography | no | No cryptographic operations in this phase |

### Known Threat Patterns for Next.js + Supabase stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Horizontal privilege escalation (reading another user's scores) | Spoofing | RLS `USING (auth.uid() = user_id)` + explicit `eq('user_id', userId)` in all queries |
| Invalid strategy_slug injection | Tampering | Validate against `STRATEGY_SLUGS` const before passing to engine; DB CHECK constraint as backstop |
| API route bypass of auth | Elevation of Privilege | `getUser()` mandatory at top of every handler; never trust path params alone |
| Stale cache leaking data between users | Information Disclosure | `unstable_cache` key must include `userId` as first discriminator |

---

## Sources

### Primary (HIGH confidence)

- `lib/location-intelligence/insights.ts` — data layer pattern (SupabaseLike, mapRow, upsert) [VERIFIED: codebase read]
- `lib/location-intelligence/api.ts` — service orchestrator pattern [VERIFIED: codebase read]
- `lib/actions/location-insight-actions.ts` — server action pattern (`'use server'`, `getUser()`, `revalidatePath`) [VERIFIED: codebase read]
- `app/api/listings/[id]/location-insight/route.ts` and `enrich-location/route.ts` — API route patterns [VERIFIED: codebase read]
- `lib/scoring/engine.ts`, `schemas.ts`, `strategies.ts` — Phase 16 output, 15/15 tests passing [VERIFIED: codebase + test run]
- `supabase/migrations/012_opportunity_scores.sql` + `013_opportunity_scores_category_columns.sql` — exact table schema [VERIFIED: codebase read]
- `types/supabase.ts` — confirmed opportunity_scores Row/Insert/Update types present, confirmed category columns from 013 are MISSING [VERIFIED: grep]
- `tests/scoring-engine.test.mjs` — CJS shim + mock pattern [VERIFIED: codebase read]
- `CLAUDE.md` — stack rules: `getUser()`, `@supabase/ssr`, no Zustand, service-role server-only [VERIFIED: project file]

### Secondary (MEDIUM confidence)

- Next.js 15 `cache.d.ts` — confirms `unstable_cache`, `revalidateTag`, `revalidatePath` exports available [VERIFIED: node_modules/next/cache.d.ts]

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages verified in package.json; no new deps needed
- Architecture: HIGH — patterns verified directly from codebase; decision constraints from CONTEXT.md are concrete
- Pitfalls: HIGH — `score_version` race and type gap are both confirmed by direct codebase inspection
- Integration tests: HIGH — `node:test` CJS pattern fully working in Phase 16 (15/15 pass)

**Research date:** 2026-05-10
**Valid until:** 2026-06-10 (stable stack)
