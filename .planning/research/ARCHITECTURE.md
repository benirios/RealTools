# Architecture Patterns: Opportunity Scoring Engine

**Domain:** Commercial property opportunity scoring for CRE brokers
**Researched:** 2026-05-10
**Overall confidence:** HIGH — based on direct codebase inspection + verified patterns

---

## Existing System Summary (Confirmed by Source Inspection)

The codebase already establishes the patterns this engine must follow:

| Layer | Existing example | Pattern to mirror |
|-------|-----------------|-------------------|
| Service module | `lib/location-intelligence/api.ts` | Pure orchestrator: validate → resolve → persist |
| Provider interface | `lib/location-intelligence/providers.d.ts` | `.d.ts` type-only boundary; implementations alongside |
| Data access | `lib/location-intelligence/insights.ts` | Functions receive `SupabaseLike`, return typed result objects |
| Server action | `lib/actions/location-insight-actions.ts` | `'use server'`, auth check, call service, `revalidatePath` |
| API route | `app/api/listings/[id]/enrich-location/route.ts` | Auth check, delegate to service, return JSON |
| Zod schemas | `lib/schemas/location-insight.ts` | Input, Persisted, ActionState schemas per domain |
| Scoring precedent | `lib/investors/matching.d.ts` | `MatchBreakdown` with per-category scores + `reasons[]` |

**Key constraint from `investors/matching.d.ts`:** The existing investor match shape (`match_score`, `match_status`, `reasons[]`, `breakdown`) is already the mental model in the codebase. The opportunity scoring engine should extend this shape, not invent a competing one.

---

## 1. Database Schema: Separate Table (Recommended)

**Decision: A dedicated `opportunity_scores` table, not a JSONB column on `listings`.**

### Why not a JSONB column on `listings`

- Scores are keyed by `(listing_id, strategy_slug)` — multiple rows per listing. A JSONB column on `listings` can only hold one value without a nested map, which makes querying by strategy messy.
- Score history (recomputation over time) requires a separate dimension. A column on `listings` collapses all versions.
- Filtering `WHERE total_score > 70 AND strategy = 'cafe'` requires a typed column, not JSONB key access. PostgreSQL cannot use statistics on JSONB values, degrading query plans at scale.
- The `listings` table already has `confidence`, `is_commercial`, and `commercial_type` — adding score columns pushes it toward god-table territory.

### Recommended schema

```sql
-- 012_opportunity_scores.sql

CREATE TABLE opportunity_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  strategy_slug   TEXT NOT NULL,              -- 'cafe', 'logistics', 'pharmacy', 'any'
  total_score     INTEGER NOT NULL            -- 0-100, promoted to column for sorting/filtering
                  CHECK (total_score >= 0 AND total_score <= 100),
  score_version   INTEGER NOT NULL DEFAULT 1, -- increment on each recompute
  breakdown       JSONB NOT NULL DEFAULT '{}', -- category scores + weights
  signals         JSONB NOT NULL DEFAULT '[]', -- positive signals list
  risks           JSONB NOT NULL DEFAULT '[]', -- risk flags list
  fit_label       TEXT,                        -- 'strong' | 'moderate' | 'weak'
  computed_at     TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT opportunity_scores_strategy_check CHECK (
    strategy_slug IN ('cafe', 'logistics', 'pharmacy', 'retail', 'services', 'any')
  ),
  CONSTRAINT opportunity_scores_fit_label_check CHECK (
    fit_label IN ('strong', 'moderate', 'weak') OR fit_label IS NULL
  ),
  -- One live score per listing+strategy. score_version tracks recomputes.
  CONSTRAINT opportunity_scores_listing_strategy_unique UNIQUE (user_id, listing_id, strategy_slug)
);

ALTER TABLE opportunity_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own opportunity scores"
  ON opportunity_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_opportunity_scores_listing     ON opportunity_scores(listing_id);
CREATE INDEX idx_opportunity_scores_user_strat  ON opportunity_scores(user_id, strategy_slug);
CREATE INDEX idx_opportunity_scores_total       ON opportunity_scores(user_id, total_score DESC);
```

**`total_score` as a real column** (not inside JSONB) is the critical choice. It enables `ORDER BY total_score DESC` and `WHERE total_score >= 70` with a proper B-tree index. Everything else can live in JSONB because it is rendered, not filtered.

**Score history / versioning:** The `score_version` column increments on recompute. The UNIQUE constraint keeps one live score per `(user_id, listing_id, strategy_slug)`. For MVP, this is sufficient — the old score is overwritten, but `computed_at` timestamps the recomputation. If audit history becomes needed later, add a `opportunity_score_history` table that receives the old row via a trigger BEFORE UPDATE.

---

## 2. Scoring Engine Placement: Dedicated Service Module

**Decision: `lib/scoring/` service module — not a server action, not inlined in an API route.**

The `lib/location-intelligence/api.ts` pattern is the right model: a service module that is pure orchestration, testable in isolation, and called by both server actions and API routes.

```
lib/scoring/
  engine.ts          -- pure computation: computeScore(listing, insight, strategyProfile) → ScoreResult
  strategies.ts      -- strategy profile configs: STRATEGIES record, getStrategy(slug)
  service.ts         -- orchestrator: load → compute → persist (calls engine + data layer)
  schemas.ts         -- Zod: ScoreResult, StrategyProfile, ScoreBreakdown, ScoreSignal, ScoreRisk
  data.ts            -- DB read/write functions (mirror of location-intelligence/insights.ts pattern)
```

**Why not a server action for the compute step:** Server actions cannot be cached (they always POST), they are tied to React form semantics, and they are harder to call from API routes or background jobs. The compute step is a pure function — it belongs in a service module, not in action infrastructure.

**Server action still wraps the user-facing trigger:** `lib/actions/scoring-actions.ts` does auth check → calls `lib/scoring/service.ts` → `revalidatePath`. Consistent with `location-insight-actions.ts`.

**API route wraps programmatic access:** `app/api/listings/[id]/score/route.ts` (POST to score, GET to retrieve) follows the `enrich-location` route pattern.

---

## 3. Category Score Computation: Pure Functions Composed Into Total

**Pattern: Functional core, imperative shell.**

`engine.ts` contains only pure functions with no I/O. The service module calls them and handles persistence.

```typescript
// lib/scoring/engine.ts

export type CategoryScore = {
  category: string         // 'demographics' | 'location_quality' | 'nearby_businesses' | ...
  score: number            // 0-100 for this category
  weight: number           // from strategy profile, e.g. 0.25
  weighted: number         // score * weight
  signals: ScoreSignal[]   // what drove this score up
  risks: ScoreRisk[]       // what penalized this score
}

export type ScoreResult = {
  totalScore: number        // sum of weighted category scores, clamped 0-100
  breakdown: CategoryScore[]
  signals: ScoreSignal[]    // top positive signals across all categories
  risks: ScoreRisk[]        // top risk flags
  fitLabel: 'strong' | 'moderate' | 'weak'
  strategySlug: string
  computedAt: string
}

// One pure function per category — easy to test, easy to swap for ML later
export function scoreDemographics(insight: LocationInsightPersisted, profile: StrategyProfile): CategoryScore
export function scoreLocationQuality(listing: ListingRow, insight: LocationInsightPersisted, profile: StrategyProfile): CategoryScore
export function scoreNearbyBusinesses(insight: LocationInsightPersisted, profile: StrategyProfile): CategoryScore
export function scoreCompetition(insight: LocationInsightPersisted, profile: StrategyProfile): CategoryScore
export function scoreRisk(listing: ListingRow, insight: LocationInsightPersisted, profile: StrategyProfile): CategoryScore
export function scoreInvestorFit(listing: ListingRow, profile: StrategyProfile): CategoryScore

// Composition
export function computeScore(
  listing: ListingRow,
  insight: LocationInsightPersisted,
  profile: StrategyProfile
): ScoreResult
```

Each category function is `(inputs, profile) → CategoryScore`. `computeScore` calls all six, applies weights, sums, normalizes, and derives `fitLabel`. This is the only place that knows about the weight system — callers just receive `ScoreResult`.

---

## 4. Strategy Profile Storage: Static Config File (Recommended for MVP)

**Decision: `lib/scoring/strategies.ts` as a static TypeScript record — not a database table, not a JSON file.**

| Option | Trade-offs |
|--------|-----------|
| Hardcoded TS record | Instant import, type-safe, version-controlled, zero DB round-trip. Change requires a deploy but that is appropriate for v1. |
| JSON config file | Same as TS but loses compile-time type checking. No benefit over TS for this use case. |
| Database table | Enables runtime editing without deploy — needed only when brokers can define custom strategies. Not a v1.6 requirement. Adds a DB fetch per score computation unless cached. |

A static config in TypeScript is verifiable at compile time, testable without a DB, and can be migrated to a DB table in v2 without changing the scoring engine — the `StrategyProfile` type stays the same, only the fetch mechanism changes.

```typescript
// lib/scoring/strategies.ts

export type CategoryWeights = {
  demographics: number      // all six must sum to 1.0
  locationQuality: number
  nearbyBusinesses: number
  competition: number
  risk: number
  investorFit: number
}

export type StrategyProfile = {
  slug: string
  label: string                     // 'Café / Alimentação'
  weights: CategoryWeights
  preferredCommercialTypes: string[] // e.g. ['ponto_comercial', 'loja']
  riskTolerance: 'low' | 'medium' | 'high'
  nearbyAffinities: string[]         // categories that signal demand, e.g. ['office', 'school']
  nearbyConflicts: string[]          // categories that signal competition
}

export const STRATEGIES: Record<string, StrategyProfile> = {
  cafe: { slug: 'cafe', label: 'Café / Alimentação', weights: { ... }, ... },
  logistics: { ... },
  pharmacy:  { ... },
  retail:    { ... },
  services:  { ... },
  any:       { ... },  // equal weights fallback
}

export function getStrategy(slug: string): StrategyProfile {
  return STRATEGIES[slug] ?? STRATEGIES['any']
}
```

---

## 5. Caching: `unstable_cache` + `revalidateTag`

**Pattern: Cache score reads with `unstable_cache`; invalidate with `revalidateTag` on recompute.**

Score reads (GET) are expensive relative to their change frequency. The computed score is stable until the user explicitly triggers a recompute.

```typescript
// lib/scoring/data.ts

import { unstable_cache } from 'next/cache'

export const getCachedScore = unstable_cache(
  async (supabase: SupabaseLike, userId: string, listingId: string, strategySlug: string) => {
    // DB fetch from opportunity_scores
  },
  ['opportunity_score'],
  {
    tags: ['opportunity_score'],
    revalidate: 3600,  // 1-hour max staleness; scores change only on user action
  }
)
```

In the server action that triggers recomputation:

```typescript
revalidateTag('opportunity_score')
revalidatePath(`/imoveis/${listingId}`)
```

**Note on Supabase + Next.js cache:** Supabase does not use the native `fetch` wrapper, so it does not participate in the Next.js Data Cache automatically. `unstable_cache` manually wraps the Supabase client call to bring it into the cache. This is the documented pattern for Supabase + Next.js App Router.

**What NOT to cache:** The `computeScore` function itself is pure and sub-millisecond. The expensive step is the DB write and the `location_insights` read that feeds the engine. Cache the final persisted score row only.

---

## 6. Explainability Payload Shape

**Pattern: Extend the existing `MatchBreakdown` + `reasons[]` shape from `investors/matching.d.ts`.**

```typescript
// lib/scoring/schemas.ts (Zod)

export const ScoreSignalSchema = z.object({
  category: z.string(),             // 'demographics', 'location_quality', etc.
  label: z.string(),                // Human-readable: 'Alta densidade populacional'
  impact: z.enum(['positive', 'neutral', 'negative']),
  value: z.union([z.string(), z.number()]).nullable().optional(),
})

export const ScoreRiskSchema = z.object({
  category: z.string(),
  label: z.string(),                // 'Muitos concorrentes diretos na área'
  severity: z.enum(['high', 'medium', 'low']),
})

export const CategoryBreakdownSchema = z.object({
  category: z.string(),
  score: z.number().int().min(0).max(100),
  weight: z.number(),
  weighted: z.number(),
  signals: z.array(ScoreSignalSchema).default([]),
  risks: z.array(ScoreRiskSchema).default([]),
})

export const ScoreResultSchema = z.object({
  totalScore: z.number().int().min(0).max(100),
  breakdown: z.array(CategoryBreakdownSchema),
  signals: z.array(ScoreSignalSchema),   // top 3-5 positive signals for the card
  risks: z.array(ScoreRiskSchema),       // top 3 risks for the card
  fitLabel: z.enum(['strong', 'moderate', 'weak']),
  strategySlug: z.string(),
  computedAt: z.string(),
})
```

**DB column mapping:**

| `opportunity_scores` column | Source in `ScoreResult` |
|-----------------------------|------------------------|
| `total_score` (INTEGER) | `totalScore` — promoted to real column for filtering/sorting |
| `breakdown` (JSONB) | `breakdown[]` — full category array with per-category signals/risks |
| `signals` (JSONB) | `signals[]` — top positive signals for card render |
| `risks` (JSONB) | `risks[]` — top risk flags for card render |
| `fit_label` (TEXT) | `fitLabel` |

**Frontend rendering contract:**

- `signals` array drives the green "positive indicators" list on the score card.
- `risks` array drives the red "risk flags" section.
- `breakdown` array drives the per-category bar chart or score grid.
- `totalScore` drives the large number display and color threshold (e.g. green >= 70, yellow >= 50, red < 50).
- These are all pre-materialized at compute time — the frontend never needs to recompute.

---

## 7. ML Upgrade Path: Clean Service Boundaries

**The only code that needs to change when swapping rule-based for model-based scoring is the engine implementation behind the `ScoringEngine` interface.**

```typescript
// lib/scoring/engine.ts

export interface ScoringEngine {
  computeScore(
    listing: ListingRow,
    insight: LocationInsightPersisted,
    profile: StrategyProfile
  ): Promise<ScoreResult> | ScoreResult
}

// v1.6: rule-based implementation
export class RuleBasedScoringEngine implements ScoringEngine {
  computeScore(listing, insight, profile): ScoreResult { /* deterministic logic */ }
}

// Future ML replacement drops in here:
// export class ModelBasedScoringEngine implements ScoringEngine {
//   constructor(private modelEndpoint: string) {}
//   async computeScore(listing, insight, profile): Promise<ScoreResult> { /* model call */ }
// }
```

`lib/scoring/service.ts` accepts a `ScoringEngine` instance (defaulting to `new RuleBasedScoringEngine()`). No other layer knows which implementation is active.

**What must stay stable for the swap to be clean:**

1. `ScoreResult` type — the shape written to the DB and returned to the UI cannot change without a migration.
2. `StrategyProfile` type — the engine receives it; ML models can treat weights as soft priors or ignore them.
3. `opportunity_scores` table schema — `breakdown`, `signals`, `risks` are the canonical output contract.
4. `lib/scoring/data.ts` read/write functions — the service layer calls these regardless of which engine produced the score.

**Champion/Challenger pattern for future ML validation:** When an ML model is ready to test, `service.ts` can run both engines in parallel. The rule-based score writes to `opportunity_scores` (champion). The ML score writes to a shadow `opportunity_scores_ml` table (challenger). The UI uses champion scores only until the ML model is validated. This is the standard industry migration pattern.

---

## 8. Component Map: New vs Modified

### New components

| Path | Type | Responsibility |
|------|------|---------------|
| `supabase/migrations/012_opportunity_scores.sql` | Migration | `opportunity_scores` table, RLS, indexes |
| `lib/scoring/schemas.ts` | Validation | Zod schemas for `ScoreResult`, `StrategyProfile`, `CategoryBreakdown`, `ScoreSignal`, `ScoreRisk` |
| `lib/scoring/strategies.ts` | Config | Strategy profiles (café, logistics, pharmacy, retail, services, any) + `getStrategy()` |
| `lib/scoring/engine.ts` | Service (pure) | `ScoringEngine` interface, `RuleBasedScoringEngine`, per-category functions, `computeScore` |
| `lib/scoring/data.ts` | Data access | `upsertScore`, `getScore`, `getScoresForListing` — mirrors `insights.ts` pattern |
| `lib/scoring/service.ts` | Service (orchestrator) | Load listing + insight → compute → persist; calls engine and data layer |
| `lib/actions/scoring-actions.ts` | Server action | `scoreListingAction(listingId, strategySlug)` — auth + call service + revalidate |
| `app/api/listings/[id]/score/route.ts` | API route | POST (compute+save), GET (fetch saved score) |
| `components/listings/opportunity-score-card.tsx` | UI | Score card: total score, breakdown bars, signals list, risk flags |
| `components/listings/strategy-selector.tsx` | UI | Strategy dropdown; triggers `scoreListingAction` on change |

### Modified components

| Path | Change |
|------|--------|
| `app/(app)/imoveis/[id]/page.tsx` | Add `StrategySelector` and `OpportunityScoreCard` below the location insight section; pass `locationInsight` as a gate |
| `types/supabase.ts` | Regenerate after migration 012 to add `opportunity_scores` table types |

**No existing table is structurally modified** by the scoring engine. `listings` and `location_insights` are read-only inputs. The only schema change is the new `opportunity_scores` table.

---

## 9. Data Flow

```
User selects strategy in StrategySelector
  → scoreListingAction(listingId, strategySlug)  [server action]
  → scoring-actions.ts: getUser() → call service.ts
  → lib/scoring/service.ts:
      1. Load listing row from listings (read-only)
      2. Load location_insights row — if missing, return error "Enriqueça a localização primeiro"
      3. getStrategy(strategySlug) from strategies.ts (static config, no I/O)
      4. engine.computeScore(listing, insight, profile) → ScoreResult  (pure, no I/O)
      5. data.upsertScore(supabase, userId, listingId, strategySlug, result)
      6. Return ScoreResult
  → revalidateTag('opportunity_score') + revalidatePath('/imoveis/[id]')
  → Server component re-renders with fresh score from DB
  → OpportunityScoreCard renders breakdown, signals, risks
```

**Dependency constraint:** A score cannot be computed without a `location_insights` row for the listing. The UI surfaces this with a clear call-to-action: if `locationInsight` is null, show "Enriqueça a localização antes de calcular a pontuação" rather than a score button. This constraint is already established by the existing page structure in `app/(app)/imoveis/[id]/page.tsx`.

---

## 10. Suggested Build Order for Phases

Dependencies are strict: schema must precede data layer; engine must precede service; service must precede UI.

### Phase 16: Scoring Foundation (no UI)
1. Migration `012_opportunity_scores.sql` — table, RLS, indexes
2. `lib/scoring/schemas.ts` — all Zod schemas
3. `lib/scoring/strategies.ts` — strategy profiles
4. `lib/scoring/engine.ts` — pure category functions + `computeScore`; fully unit-testable, no I/O
5. `lib/scoring/data.ts` — upsert/read functions
6. `types/supabase.ts` regenerated
7. Unit tests: scoring consistency (same inputs → same output), strategy weight shifting, explainability output shape

**Gate:** All unit tests pass. Engine is completely isolated from HTTP and DB.

### Phase 17: Service Wiring + API
1. `lib/scoring/service.ts` — ties engine + data + location insight loading together
2. `lib/actions/scoring-actions.ts` — server action wrapper
3. `app/api/listings/[id]/score/route.ts` — POST (compute) + GET (fetch)
4. Integration tests: save/fetch round-trip, missing location insight returns clear error, recompute increments `score_version`

**Gate:** Scoring can be triggered and retrieved via API with no UI dependency.

### Phase 18: UI Integration
1. `components/listings/strategy-selector.tsx` — strategy picker
2. `components/listings/opportunity-score-card.tsx` — score card
3. Modify `app/(app)/imoveis/[id]/page.tsx`
4. E2E test: enrich location → score → change strategy → re-score → verify card updates

**Gate:** Full broker workflow from listing → enrich → score → strategy change works end-to-end.

---

## Integration Points with Existing Tables

| Existing table | How the scoring engine uses it | Access mode |
|----------------|-------------------------------|-------------|
| `listings` | Source of `commercial_type`, `price_amount`, `lat`, `lng`, `tags`, `property_type` for scoring inputs | Read-only |
| `location_insights` | Primary data source for demographics and nearby businesses categories (4 of 6 categories depend on it) | Read-only |
| `investors` | Not touched in v1.6; future: investor `strategy` + `risk_level` could seed a `StrategyProfile` | No change |
| `opportunity_scores` | New table; all scoring writes go here | Read + Write (new) |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|-----------|-------|
| Schema design | HIGH | Direct inspection of existing migrations + PostgreSQL JSONB vs column tradeoffs confirmed |
| Service module placement | HIGH | Direct inspection of `lib/location-intelligence/api.ts` as the exact pattern to follow |
| Pure function composition | HIGH | `matching.d.ts` precedent in same codebase; functional core pattern well-established |
| Strategy config as static TS | HIGH | v1.6 requirements have no broker-editable strategy requirement |
| Cache pattern | HIGH | `unstable_cache` + Supabase-specific guidance confirmed in official Next.js docs |
| ML upgrade path via interface | HIGH | Strategy/interface pattern well-established; champion/challenger is standard industry approach |
| Build order | HIGH | Dependencies are deterministic and flow from schema → engine → service → UI |

---

## Sources

- Codebase direct inspection: `lib/location-intelligence/api.ts`, `lib/investors/matching.d.ts`, `supabase/migrations/008_listing_data_foundation.sql`, `supabase/migrations/011_location_insights.sql`
- [When To Avoid JSONB In A PostgreSQL Schema — Heap](https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema)
- [Functions: unstable_cache — Next.js](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
- [Server Actions vs API Routes in Next.js 15 — Wisp CMS](https://www.wisp.blog/blog/server-actions-vs-api-routes-in-nextjs-15-which-should-i-use)
- [Design Patterns in Machine Learning Code and Systems — Eugene Yan](https://eugeneyan.com/writing/design-patterns/)
- [Integrating ML Models within Matured Business Process — DataDrivenInvestor](https://medium.com/datadriveninvestor/integrating-machine-learning-models-within-matured-business-process-7d6fec8337ff)
- [Building a scoring engine with pure TypeScript functions — DEV Community](https://dev.to/cs_alishopping/building-a-scoring-engine-with-pure-typescript-functions-no-ml-no-backend-3hcl)
