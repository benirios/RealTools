# Roadmap: RealTools v1.6 Opportunity Scoring Engine

## Overview

RealTools v1.6 adds a rule-based opportunity scoring engine that rates commercial properties by acquisition attractiveness for a specific business strategy (café, logistics, pharmacy, etc.). The engine is explainable, strategy-adaptive, and deterministic. It reads from the existing `location_insights` table and writes scored results to a new `opportunity_scores` table.

Phase numbering continues from v1.5. This milestone starts at Phase 16.

## Phases

**Phase Numbering:**
- Integer phases (16, 17, 18): Planned v1.6 milestone work
- Decimal phases (16.1): Urgent insertions if needed

- [ ] **Phase 16: Scoring Engine Foundation** — Schema, Zod schemas, strategy profiles, pure scoring engine, category functions, and unit tests. No HTTP or UI dependency.
- [x] **Phase 17: Service Wiring and API** — Scoring service orchestrator, server action wrapper, API routes, best-fit surfacing, score history, and integration tests. Full save/fetch round-trip. (completed 2026-05-10)
- [x] **Phase 18: Score Card UI** — Strategy selector and score card on the listing detail page. Full broker workflow from listing to enrich to score to strategy change, plus E2E verification. (completed 2026-05-12)

## Phase Details

### Phase 16: Scoring Engine Foundation

**Goal**: A fully-tested, pure scoring engine and strategy profile system that computes deterministic 0–100 scores for any listing+strategy combination using existing `location_insights` data. No HTTP, no DB calls inside the engine itself.

**Depends on**: Phase 15 (location_insights table and enrichment flow must be in place)

**Requirements**: SCO-01, SCO-02, SCO-03, SCO-04, SCO-05, SCO-06, SCO-07, SCO-08, SCO-17

**Success Criteria** (what must be TRUE):
1. `supabase/migrations/012_opportunity_scores.sql` creates the `opportunity_scores` table with RLS policy `USING (auth.uid() = user_id)`, UNIQUE constraint on `(user_id, listing_id, strategy_slug)`, `total_score` as a real `NUMERIC(5,2)` column (not JSONB), each of the five category scores as individual `NUMERIC(5,2)` columns, B-tree indexes on `(user_id, strategy_slug)` and `(user_id, total_score DESC)`, a CHECK constraint on `strategy_slug` listing valid values, and `engine_version TEXT` plus `score_version INTEGER DEFAULT 1` columns.
2. `lib/scoring/engine.ts` exports six pure category functions (`scoreDemographics`, `scoreLocationQuality`, `scoreFootTraffic`, `scoreCompetition`, `scoreRisk`, `scoreInvestorFit`) and a `computeScore(listing, insight, profile)` function with zero side effects and zero I/O. The `scoreCompetition` function accepts the `strategy` parameter so competition scoring is strategy-aware.
3. `lib/scoring/strategies.ts` defines at minimum: `cafe`, `logistics`, `pharmacy`, `retail`, `services`, and `any` profiles; all six category weights in each profile sum to 1.0; each profile differs from the median profile by more than 15 pts in at least one category weight when compared across the three primary profiles (café, logistics, pharmacy).
4. Unit tests prove: same inputs always produce the same total score (determinism); `cafe` and `logistics` produce different total scores for the same listing/insight; all five category functions return a valid `CategoryBreakdown` shape; `fitLabel` is assigned correctly at all three thresholds (≥70 forte, ≥50 moderado, <50 fraco); explainability payload (signals + risks) is non-empty for any realistic input; the engine returns three-state output — `SCORED`, `NEEDS_ENRICHMENT`, or `ENRICHMENT_FAILED` — never throws on missing `location_insights`.
5. Score distribution validation: when the engine scores 20 or more real listings from the database, the standard deviation of `total_score` across those listings exceeds 10 pts. This gate must pass before Phase 17 planning starts. Missing data must produce zero-and-flag penalties (not neutral 50 defaults) to prevent score clustering at 60–80.
6. `types/supabase.ts` is updated with `opportunity_scores` table types and `lib/scoring/schemas.ts` exports Zod-validated types for `ScoreResult`, `StrategyProfile`, `CategoryBreakdown`, `ScoreSignal`, and `ScoreRisk`.

**Plans**: TBD

**UI hint**: no

---

### Phase 17: Service Wiring and API

**Goal**: Brokers and API consumers can trigger scoring, save results, retrieve them, see which business type fits best, and view score history. Full round-trip with auth, error handling, and recompute support.

**Depends on**: Phase 16

**Requirements**: SCO-09, SCO-10, SCO-11, SCO-12, SCO-18, SCO-19, SCO-20

**Success Criteria** (what must be TRUE):
1. `lib/scoring/data.ts` exports `upsertScore`, `getScore`, `getScoresForListing`, and `getScoreHistory` — mirroring the `lib/location-intelligence/insights.ts` pattern; reads use `unstable_cache` with a `opportunity_score` tag.
2. `lib/scoring/service.ts` loads the listing and its linked `location_insights` row, calls `computeScore`, and persists via `upsertScore`. Returns a typed three-state result (`SCORED | NEEDS_ENRICHMENT | ENRICHMENT_FAILED`) with a Portuguese error message when `location_insights` is absent. Recomputing the same listing+strategy increments `score_version` and overwrites the row.
3. `lib/actions/scoring-actions.ts` exports `scoreListingAction(listingId, strategySlug)` and `getBestFitAction(listingId)`: each performs an auth check, calls the service, then calls `revalidateTag('opportunity_score')` and `revalidatePath`. `getBestFitAction` scores all defined strategy profiles for the listing and returns the top 1–2 highest-scoring strategies.
4. `app/api/listings/[id]/score/route.ts` handles `POST` (compute and save, body: `{ strategySlug }`) and `GET` (retrieve saved score, query param: `?strategy=cafe`). Both endpoints enforce user-scoped auth check and filter all DB reads/writes by `user_id` — the RLS policy `USING (auth.uid() = user_id)` is the backstop, not a listing existence check.
5. Integration tests prove: score save/fetch round-trip succeeds; missing `location_insights` returns a clear Portuguese error message (not an unhandled exception); recompute of the same listing+strategy increments `score_version`; `getBestFitAction` returns the correct top strategy when `cafe` input data is stronger than `logistics` input data; score history endpoint returns all versions for a listing+strategy combination.

**Plans**: 6 plans

Plans:
- [x] 17-01-PLAN.md — Wave 0: types/supabase.ts migration-013 gap fix + test stub file creation
- [x] 17-02-PLAN.md — Wave 2A: lib/scoring/data.ts + lib/scoring/data.js (data access layer)
- [x] 17-03-PLAN.md — Wave 2B: lib/scoring/service.ts + lib/scoring/service.js (orchestrator)
- [x] 17-04-PLAN.md — Wave 3A: lib/actions/scoring-actions.ts (scoreListingAction + getBestFitAction)
- [x] 17-05-PLAN.md — Wave 3B: app/api/listings/[id]/score/route.ts (GET + POST handlers)
- [x] 17-06-PLAN.md — Wave 4: Fill in all 5 D-10 integration test cases in scoring-service.test.mjs

**UI hint**: no

---

### Phase 18: Score Card UI

**Goal**: Broker can select a strategy, trigger scoring, see a full explainable score card on the listing detail page, and review score history.

**Depends on**: Phase 17

**Requirements**: SCO-13, SCO-14, SCO-15, SCO-16

**Success Criteria** (what must be TRUE):
1. `components/listings/strategy-selector.tsx` renders a dropdown of strategy options with Portuguese labels, triggers `scoreListingAction` on selection via a server action call, and shows a loading state during computation.
2. `components/listings/opportunity-score-card.tsx` renders: total score (0–100) with color band (green ≥70, yellow ≥50, orange ≥40, red <40), strategy label, fit label (`Forte` / `Moderado` / `Fraco`), per-category breakdown bars with Portuguese labels, top 3–5 positive signals in green, and top 3 risk flags in red/orange.
3. When `locationInsight` is null for the listing, the score card section renders "Enriqueça a localização antes de calcular a pontuação" and a link to run enrichment — not an error state and not a blank region. This is the empty state specified by SCO-15 and must be tested explicitly.
4. When no saved score exists yet for the selected strategy, the card shows a "Calcular pontuação" call-to-action button (SCO-16 empty state).
5. `app/(app)/imoveis/[id]/page.tsx` integrates `StrategySelector` and `OpportunityScoreCard` below the location insight section. Changing strategy triggers a recompute and the card updates with the new strategy score. Existing listing behavior (title, price, images, OLX link, classification badges, location insight card) remains intact.
6. E2E tests cover: select strategy → score appears; enrich prompt shown when no location_insights; "Calcular pontuação" CTA shown when no score saved; score card updates when strategy changes.

**Plans**: 4 plans

Plans:
**Wave 1**
- [x] 18-01-PLAN.md — Wave 0: score card UI helpers, unit tests, and E2E scaffold
- [x] 18-02-PLAN.md — Wave 1: controlled strategy selector

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 18-03-PLAN.md — Wave 2: interactive opportunity score card

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 18-04-PLAN.md — Wave 3: listing detail integration and final UAT

**UI hint**: yes

---

## Progress

**Execution Order:**
Phases execute in numeric order: 16 → 17 → 18

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 16. Scoring Engine Foundation | 0/TBD | Not started | - |
| 17. Service Wiring and API | 6/6 | Complete    | 2026-05-10 |
| 18. Score Card UI | 4/4 | Complete    | 2026-05-12 |

## Requirement Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCO-01 | Phase 16 | Pending |
| SCO-02 | Phase 16 | Pending |
| SCO-03 | Phase 16 | Pending |
| SCO-04 | Phase 16 | Pending |
| SCO-05 | Phase 16 | Pending |
| SCO-06 | Phase 16 | Pending |
| SCO-07 | Phase 16 | Pending |
| SCO-08 | Phase 16 | Pending |
| SCO-09 | Phase 17 | Pending |
| SCO-10 | Phase 17 | Pending |
| SCO-11 | Phase 17 | Pending |
| SCO-12 | Phase 17 | Pending |
| SCO-13 | Phase 18 | Complete |
| SCO-14 | Phase 18 | Complete |
| SCO-15 | Phase 18 | Complete |
| SCO-16 | Phase 18 | Complete |
| SCO-17 | Phase 16 | Pending |
| SCO-18 | Phase 17 | Pending |
| SCO-19 | Phase 17 | Pending |
| SCO-20 | Phase 17 | Pending |

**Coverage:**
- v1.6 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0
