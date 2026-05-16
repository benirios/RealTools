# Phase 16 Summary: Scoring Engine Foundation

**Completed:** 2026-05-10
**Status:** Done

## What Was Built

### Database
- Migration `012_opportunity_scores.sql`: new `opportunity_scores` table with RLS, B-tree indexes, `score_version` column, UNIQUE on `(user_id, listing_id, strategy_slug)`, CHECK constraint on `strategy_slug`, `fit_label` CHECK enum, and `updated_at` trigger.
- `types/supabase.ts` updated with full Row/Insert/Update types for `opportunity_scores`.

### Scoring Module (`lib/scoring/`)

Four files — TypeScript source + CJS shims for `node:test` compatibility (matches `lib/location-intelligence/` pattern):

| File | Purpose |
|------|---------|
| `schemas.ts` / `schemas.js` | Zod schemas: `ScoreSignal`, `ScoreRisk`, `CategoryBreakdown`, `ScoreResult`, `StrategyProfile`, `ScoringActionState` |
| `strategies.ts` / `strategies.js` | Six strategy profiles (cafe, logistics, pharmacy, retail, services, any); `getStrategy()` falls back to `any` |
| `engine.ts` / `engine.js` | Six pure category functions + `computeScore()` + `RuleBasedScoringEngine` class |

### Strategy Profiles

All six profiles have weights summing to 1.0:

| Strategy | Dominant Weight | Key Affinities | Conflicts |
|----------|----------------|----------------|-----------|
| cafe | nearbyBusinesses 0.30 | school, office, mall, transit | cafe, restaurant, bakery |
| logistics | locationQuality 0.40 | highway, industrial, warehouse, port | none |
| pharmacy | demographics 0.25 + competition 0.25 | hospital, clinic, ubs | pharmacy, drogaria |
| retail | nearbyBusinesses 0.25 | mall, transit, bank | retail, loja |
| services | demographics 0.30 | office, residential, hospital | none |
| any | equal ~0.167 | none | none |

### Scoring Engine

Six deterministic category functions, all in Portuguese:

- `scoreDemographics`: BRL income brackets (null→40, <1500→20, 1500-2500→45, 2500-4000→65, 4000-7000→85, >7000→95); density ±5/10
- `scoreLocationQuality`: confidenceScore primary; lat/lng ±7/10
- `scoreNearbyBusinesses`: traffic generators + affinity matching; base 30; empty→20+risk
- `scoreCompetition`: 0 competitors→90, 1-2→70, 3-5→45, 6+→20; no conflicts profile→75
- `scoreRisk`: base 70; penalties for low confidence, missing income, empty nearby; +15 all-data bonus
- `scoreInvestorFit`: BRL price brackets; tag modifiers (distressed/leased)

`computeScore()` throws Portuguese error on null insight, aggregates weighted total, derives `fitLabel` (forte≥70, moderado≥50, fraco<50), runs through `ScoreResultSchema.parse()`.

### Tests (`tests/scoring-engine.test.mjs`)

15 unit tests via `node:test`:

- All 6 category functions tested individually
- `computeScore` shape, signal/risk population, Portuguese error throw
- Strategy weight sum validation across all 6 profiles
- cafe vs. logistics differentiation test (logistics scores higher on highway/port location)
- `fitLabel` forte and fraco threshold tests
- `RuleBasedScoringEngine` class interface parity test

**Result:** 15/15 pass, 0 lint errors, 0 TypeScript errors.

## Requirements Covered

| Req | Description | Status |
|-----|-------------|--------|
| SCO-02 | Composite 0–100 score from weighted categories | Done |
| SCO-03 | Strategy profiles produce meaningfully different rankings | Done |
| SCO-04 | Full breakdown with per-category sub-scores and signals | Done |
| SCO-05 | Portuguese explainability payload (top signals + risks) | Done |
| SCO-06 | fitLabel thresholds (forte/moderado/fraco) | Done |
| SCO-07 | Deterministic rule-based, no ML/external calls | Done |
| SCO-08 | Throws Portuguese error when insight is null | Done |
| SCO-17 | Unit tests for consistency, strategy shifting, explainability, category functions | Done |

SCO-01 (table + RLS) is also complete via the migration.

## Files Changed

```
supabase/migrations/012_opportunity_scores.sql   (new)
types/supabase.ts                                 (modified — added opportunity_scores types)
lib/scoring/schemas.ts                            (new)
lib/scoring/schemas.js                            (new — CJS shim)
lib/scoring/strategies.ts                         (new)
lib/scoring/strategies.js                         (new — CJS shim)
lib/scoring/engine.ts                             (new)
lib/scoring/engine.js                             (new — CJS shim)
tests/scoring-engine.test.mjs                     (new)
.planning/phases/16-scoring-engine-foundation/16-PLAN.md  (new)
.planning/REQUIREMENTS.md                         (updated — v1.6 SCO requirements)
.planning/ROADMAP.md                              (updated — v1.6 phases 16-18)
.planning/STATE.md                                (updated)
```

## Gate Check: std dev validation

Phase 16 gate requires std dev of total_score > 10 pts across 20+ real listings before Phase 17 planning proceeds. This requires running `computeScore` against existing enriched listings in the database. Verify before starting Phase 17.
