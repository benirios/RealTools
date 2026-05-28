# Research Summary: v1.6 Opportunity Scoring Engine

*Synthesized: 2026-05-10 | Confidence: HIGH*

## Executive Summary

The v1.6 Opportunity Scoring Engine is a pure TypeScript computation layer on top of existing `location_insights` data — not a new data pipeline. It reads `avg_income`, `population_density`, `nearby_businesses`, and related fields already stored per listing, and produces a 0–100 composite score with six weighted categories. The only real new npm dependency is `recharts` v3 via `npx shadcn@latest add chart`. Architecture mirrors `lib/location-intelligence/` exactly. Three sequential phases: schema+engine (16), service+API (17), UI (18).

---

## Stack Additions

**New npm package:** `recharts` ^3.8 via `npx shadcn@latest add chart` — only real new dependency. React 19 compatible (shadcn PR #8486 confirmed).

**New DB table:** `opportunity_scores` (migration 012). `total_score` as real `NUMERIC(5,2)` column (not JSONB) for indexed `ORDER BY`. Each category score also a real column. `breakdown`/`signals`/`risks` in JSONB. `strategy_slug` with CHECK constraint. `engine_version TEXT` + `score_version INTEGER`. RLS in same migration: `USING (auth.uid() = user_id)`.

**New module:** `lib/scoring/` — pure TypeScript, zero new runtime packages.

**Do NOT add:** pgvector, any ML/stats library, Redis, BullMQ, Tremor, TanStack Query, Python microservice.

---

## Feature Categories

All six categories map to existing `location_insights` fields — no new data pipeline needed.

| Category | Label | Primary Inputs | Weight Range |
|----------|-------|---------------|--------------|
| Demographics Fit | Table stakes | `avg_income`, `population_density`, `consumer_profile` | 10–30% |
| Location Quality | Table stakes | `confidence_score`, lat/lng, `address`, `neighborhood` | 20–40% |
| Foot Traffic Potential | Table stakes | `nearby_businesses` JSONB, `raw_places` JSONB | 0–30% |
| Competition | Table stakes | `nearby_businesses` filtered by same category | 10–25% |
| Risk | Table stakes | `confidence_score`, derived signals | 10–20% |
| Investor Fit | Differentiator | Derived from composite + deal price | 5–15% |

**Score range:** 0–100. Bands: Strong (80–100 green), Moderate (60–79 yellow), Weak (40–59 orange), Poor (0–39 red).

**Investor archetype:** 75–100 = Core; 55–74 = Core-Plus; 35–54 = Value-Add; 0–34 = Opportunistic. Risk sub-score < 40 shifts one tier toward Opportunistic.

**Table stakes:** composite score, per-category sub-scores, strategy selector, explainability (≤3 signals / ≤3 risk flags), persistence, on-demand recompute.

**Differentiators (should have):** "Best fit business type" (score all strategies, surface top 2–3), investor archetype label.

**Defer to v2:** CNPJ sector trends, real-time foot traffic APIs, user-configurable weight sliders, nationwide benchmarking.

**Legal:** Frame as "opportunity attractiveness" or "fit score" — never "avaliação" (regulated profession in Brazil).

---

## Architecture Shape

```
lib/scoring/
  schemas.ts      -- Zod: ScoreResult, StrategyProfile, CategoryBreakdown, ScoreSignal, ScoreRisk
  strategies.ts   -- static TS config: STRATEGIES record + getStrategy(slug)
  engine.ts       -- ScoringEngine interface + RuleBasedScoringEngine (pure functions per category)
  data.ts         -- upsertScore, getScore, getScoresForListing (unstable_cache for reads)
  service.ts      -- orchestrator: load → three-state check → compute → persist
```

**New files:** `lib/actions/scoring-actions.ts`, `app/api/listings/[id]/score/route.ts`, `components/listings/opportunity-score-card.tsx`, `components/listings/strategy-selector.tsx`.

**Three-state output:** `SCORED | NEEDS_ENRICHMENT | ENRICHMENT_FAILED` — never crash on missing `location_insights`.

**ML upgrade path:** `engine.ts` exports `ScoringEngine` interface. `service.ts` accepts any implementation. Swapping `RuleBasedScoringEngine` for `ModelBasedScoringEngine` touches only `engine.ts`. Schema unchanged.

**Build order (strict dependency):**
- Phase 16 — Schema + Engine: migration, Zod schemas, strategy profiles, pure engine functions, data layer, unit tests. Gate: std dev > 10 pts over 20+ real listings.
- Phase 17 — Service + API: service.ts, server action, route handler, integration tests.
- Phase 18 — UI: strategy selector, score card, page integration, E2E tests.

---

## Critical Pitfalls

1. **Mock data credibility bomb** — Scores from `fallback: true` providers look authoritative. Wire `has_mock_data` from existing provider flag. Show visible warning banner. Address Phase 16.

2. **Score spread collapse** — Additive scoring with neutral (50) defaults clusters all listings at 60–80. Use zero-and-flag penalties for missing data. Add showstopper rules that can drive score < 30. Validate distribution before Phase 18.

3. **Strategy profiles look cosmetic** — If profiles differ by < 5% per category, brokers see through it. Each profile must differ from median by > 15 pts in at least one category. Competition scoring must receive `strategy` parameter.

4. **RLS wrong policy** — `USING (listing_id IN (SELECT id FROM listings))` leaks cross-user scores. Correct: `USING (auth.uid() = user_id)` plus ownership check in server action. Cannot be retrofitted.

5. **JSONB for score components** — Blocks indexed range queries and ML feature extraction. Each category score = real `NUMERIC(5,2)` column. JSONB only for explanation text.

---

## Watch Out For

1. Never emit score from `fallback: true` data without visible warning banner.
2. Missing data = zero-and-flag, not 50. Validate spread over 20+ listings before Phase 18.
3. `total_score` must be real `NUMERIC` column for B-tree indexing.
4. RLS: `USING (auth.uid() = user_id)` — listing existence ≠ ownership.
5. `strategy_slug` needs CHECK constraint listing valid values — free text blocks ML later.
6. Server action = correct scoring trigger. Not client-side fetch.
7. Wrap all `revalidatePath` in `revalidateScores(listingId)` utility.
8. Write strategy plain-English definition before coding its weights.
9. Separate `computeScores()` (numbers) from `generateExplanation()` (text).
10. Store `score_inputs` snapshot in `breakdown` JSONB — future ML training vector.
11. Inspect real `nearby_businesses` / `raw_places` JSONB keys in DB before writing foot-traffic/competition logic — do not assume field names.
12. Two distinct columns: `engine_version TEXT` (rule-based vs ML) and `score_version INTEGER` (recompute counter).

---

## Open Questions (Resolve in Phase 16)

- Strategy enum list: reconcile "café, logistics, pharmacy" framing with existing `investors` strategy taxonomy (`rental_income`, `flip`, `own_business`, etc.)
- `opportunity_scores` scope: `user_id + listing_id + strategy` (per-user) vs `listing_id + strategy` (global)
- Recompute trigger: on-demand UI button only, or auto-invalidate when `location_insights` updates?
- BRL income thresholds per strategy: validate against current IBGE data before hardcoding

*Research completed: 2026-05-10 | Ready for requirements: yes*
