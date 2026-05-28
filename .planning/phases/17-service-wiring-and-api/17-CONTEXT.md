# Phase 17: Service Wiring and API — Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the scoring engine into the application stack: service orchestrator, server actions, API routes, best-fit surfacing, and integration tests. Backend only — no UI components. Full save/fetch round-trip with auth, error handling, and recompute support.

**Out of scope:** Any UI components, React state, or client-side rendering (those belong to Phase 18).

</domain>

<decisions>
## Implementation Decisions

### Score History Model

- **D-01:** Score history uses UPSERT semantics — one row per `(user_id, listing_id, strategy_slug)` UNIQUE constraint. Recomputing a listing+strategy **overwrites** the existing row and increments `score_version`. There is no separate history table and no JSONB snapshot array of past scores.
- **D-02:** `getScoreHistory` (from ROADMAP success criteria) returns the single current row for a given listing+strategy. The `score_version` counter tells the broker how many times the score has been recomputed. Previous values are not retained.
- **D-03:** The ROADMAP phrase "all versions for a listing+strategy combination" means all strategy variants for a listing (e.g., all rows where `listing_id = X`), not time-series snapshots of the same strategy.

### Best-Fit Action

- **D-04:** `getBestFitAction(listingId)` scores exactly **3 strategy profiles: cafe, logistics, pharmacy** — matching the SCO-03 primary profile scope. The `retail`, `services`, and `any` profiles are not scored by this action.
- **D-05:** Best-fit results are **persisted** — each of the 3 strategy scores is upserted to `opportunity_scores` (one row per strategy). Three DB upserts per call.
- **D-06:** Return value: ranked array of `{ strategySlug, totalScore, fitLabel }` for top 1–2 highest-scoring strategies, plus the full `ScoringOutcome` for each (so the caller can show the full breakdown if needed).

### Server Action Return Shape

- **D-07:** `scoreListingAction` and `getBestFitAction` return **`ScoringActionState`** (already defined in `lib/scoring/schemas.ts` as `{ message?, score?, errors? }`). They do NOT return the raw `ScoringOutcome` discriminated union. The three-state logic is internal to the service — the action surface wraps it into the state shape the UI layer can consume without switching on `status`.
- **D-08:** When the engine returns `NEEDS_ENRICHMENT` or `ENRICHMENT_FAILED`, the action translates to `errors.general` with a Portuguese message.

### Integration Tests

- **D-09:** Integration tests use a **mock Supabase client** returning fixture data — no real DB required. Same `node:test` + CJS shims pattern as Phase 16 (`tests/scoring-service.test.mjs` or similar).
- **D-10:** Test cases must cover: save/fetch round-trip succeeds; missing `location_insights` returns Portuguese error in `errors.general`; recompute of same listing+strategy produces `score_version` increment in the upsert payload; `getBestFitAction` returns cafe as top strategy when cafe input data is stronger; history endpoint returns the current score row.

### Patterns (Carried Forward)

- **D-11:** `lib/scoring/data.ts` mirrors `lib/location-intelligence/insights.ts` — takes a `SupabaseLike` client parameter, returns `{ data, error }` shapes, maps DB rows to typed objects.
- **D-12:** `lib/scoring/service.ts` mirrors `lib/location-intelligence/api.ts` — orchestrates: load listing → load `location_insights` → call `computeScore` → persist via `upsertScore`.
- **D-13:** `lib/actions/scoring-actions.ts` mirrors `lib/actions/location-insight-actions.ts` — `'use server'`, `getUser()` auth check, service call, `revalidatePath('/imoveis/${listingId}')`.
- **D-14:** API route pattern: `app/api/listings/[id]/score/route.ts` mirrors `app/api/listings/[id]/location-insight/route.ts` — `getUser()` auth, return JSON.
- **D-15:** Cache reads use `unstable_cache` with tag `'opportunity_score'`. Mutations call `revalidateTag('opportunity_score')`.
- **D-16:** RLS on `opportunity_scores` is the DB-level backstop: `USING (auth.uid() = user_id)`. Service layer also filters by `user_id` explicitly for defense in depth.

### Claude's Discretion

- Exact field names and SQL for `upsertScore` (whether to use `.upsert(..., { onConflict: 'user_id,listing_id,strategy_slug' })` or a manual update path).
- `unstable_cache` key shape (per-user, per-listing, or per-listing+strategy granularity).
- Whether to export a `toOpportunityScoreInsert` helper (mirroring `toLocationInsightInsert`) or inline the mapping.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scoring Module (Phase 16 output)
- `lib/scoring/schemas.ts` — `ScoringOutcome`, `ScoringActionState`, `ScoreResult`, `CategoryBreakdown`, `ScoreSignal`, `ScoreRisk` types
- `lib/scoring/engine.ts` — `computeScore()` function, `RuleBasedScoringEngine`, three-state output contract
- `lib/scoring/strategies.ts` — `STRATEGIES`, `getStrategy()`, all 6 strategy profile definitions
- `supabase/migrations/012_opportunity_scores.sql` — table schema, RLS policy, UNIQUE constraint, indexes
- `supabase/migrations/013_opportunity_scores_category_columns.sql` — individual NUMERIC(5,2) category columns, `engine_version` column

### Location Intelligence (Pattern to mirror)
- `lib/location-intelligence/insights.ts` — data access layer pattern (`SupabaseLike` param, `mapRowToInsight`, upsert pattern)
- `lib/location-intelligence/api.ts` — service orchestrator pattern (load listing → enrich → persist)
- `lib/actions/location-insight-actions.ts` — server action pattern (`'use server'`, `getUser()`, `revalidatePath`)
- `app/api/listings/[id]/location-insight/route.ts` — API route pattern

### Types and DB
- `types/supabase.ts` — `opportunity_scores` Row/Insert/Update types (added in Phase 16)

### Requirements
- `.planning/REQUIREMENTS.md` — SCO-09, SCO-10, SCO-11, SCO-12, SCO-18, SCO-19, SCO-20

### Architecture Constraints
- `CLAUDE.md` — stack rules: `getUser()` not `getSession()`, `@supabase/ssr`, no Redux/Zustand, service-role key server-only

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createSupabaseServerClient` from `@/lib/supabase/server` — used by all server actions and API routes
- `ScoringActionState` type from `@/lib/scoring/schemas` — already defined, use as action return type
- `computeScore` from `@/lib/scoring/engine` — pure function, ready to call
- `getStrategy`, `STRATEGIES` from `@/lib/scoring/strategies` — use to enumerate profiles for getBestFitAction

### Established Patterns
- Server actions: `'use server'` → `getUser()` → service call → `revalidatePath` → return state shape
- Data layer: accepts `SupabaseLike` client, returns `{ data: T | null, error: string | null }`
- API routes: `await params`, `getUser()`, `maybeSingle()` or `.select('*')`
- Upsert conflict key: `onConflict: 'user_id,listing_id'` pattern from location-intelligence (adapt to `user_id,listing_id,strategy_slug`)

### Integration Points
- `app/(app)/imoveis/[id]/page.tsx` — listing detail page (Phase 18 will integrate here)
- `opportunity_scores` table — target for all writes; UNIQUE on `(user_id, listing_id, strategy_slug)`
- `location_insights` table — source for enrichment data; loaded by service via `getListingLocationInsight`

</code_context>

<specifics>
## Specific Ideas

- Score history query: `getScoreHistory(supabase, userId, listingId)` returns all rows for that listing (all strategy variants), ordered by `total_score DESC`. Not time-series — strategy variants.
- API GET endpoint: `?strategy=cafe` returns the saved score for that strategy. Without query param, return all saved scores for the listing (array).
- `getBestFitAction` return: `{ scores: ScoringActionState[], topStrategies: { slug: string, label: string, totalScore: number, fitLabel: string }[] }` — top 2 sorted by total_score DESC.

</specifics>

<deferred>
## Deferred Ideas

- Score history as time-series (keeping previous computation values) — deferred post-v1.6. Requires schema change (remove UNIQUE or add history table).
- Scoring via `retail`, `services`, `any` profiles in getBestFitAction — deferred to v1.7 if user demand warrants it.
- Webhook/push notification when score crosses a threshold — out of scope for v1.6.

</deferred>

---

*Phase: 17-service-wiring-and-api*
*Context gathered: 2026-05-10*
