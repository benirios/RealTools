# Handoff - RealTools Scoring and Enrichment Work

Updated: 2026-05-16

## Current State

The app now supports a 3-layer scoring model:

- Universal Opportunity Score: baseline commercial attractiveness, still stored in `opportunity_scores`.
- Strategy Fit Score: deterministic strategy-specific fit for `retail`, `warehouse_logistics`, `rental_income`, `food_beverage`, `pharmacy`, and `gym_fitness`.
- Investor Match Score: personalized investor/listing score with confidence, breakdown, explanation, strengths, concerns, and recommended action.

The scoring remains rule-based. No ML or LLM logic was introduced for scoring.

## Key Files

- `lib/scoring/strategy-fit.ts`
  - Main deterministic Strategy Fit scoring engine.
  - Contains editable weights/config for supported V1 strategies.

- `lib/scoring/strategy-fit.js`
  - CommonJS test/runtime sibling for Strategy Fit logic.

- `lib/scoring/strategy-fit-service.ts`
  - Loads listing + location insight, calculates all Strategy Fit scores, persists with input hash.

- `lib/scoring/data.ts`
  - Adds `upsertStrategyFitScore` and `getStrategyFitScores`.
  - `getStrategyFitScores` is defensive and returns `[]` if the table is unavailable.

- `lib/scoring/data.js`
  - CommonJS shim now also exports `upsertStrategyFitScore` and `getStrategyFitScores`.
  - This fixed the runtime error: `getStrategyFitScores is not a function`.

- `lib/investors/matching.js`
  - Investor Match Score now returns 0-100 sub-scores:
    - `budget_fit`
    - `location_fit`
    - `property_type_fit`
    - `strategy_fit`
    - `risk_fit`
    - `tag_fit`
    - `opportunity_quality`

- `lib/investors/match-processing.ts`
  - Loads strategy fit scores into match inputs.
  - Persists richer match fields when migration is present.
  - Falls back to legacy match columns if the DB has not yet been migrated.

- `lib/listings/processing.ts`
  - Automatic enrichment now marks location enrichment complete independently.
  - Scoring/matching failures no longer mark enrichment itself as failed.

- `components/listings/strategy-fit-card.tsx`
  - New point-detail UI for Strategy Fit.

- `components/listings/location-insight-card.tsx`
  - Nearby businesses section now hides fake/mock data and shows an unavailable message unless reliable provider data exists.

- `supabase/migrations/016_strategy_fit_and_match_explanations.sql`
  - Creates `strategy_fit_scores`.
  - Adds richer fields to `investor_listing_matches`.
  - Extends opportunity score strategy constraint.

## Fake Nearby Businesses Fix

The fake rows such as `Supermercado de bairro Rio de janeiro`, `Farmácia 24h`, and `Academia local` came from `MockPlacesProvider` fallback behavior in `lib/location-intelligence/providers.js`.

That behavior was removed:

- Fallback places now return:
  - `businesses: []`
  - `provider: "unavailable"`
  - `confidence: 0`
- Legacy persisted nearby businesses with `source: "mock"`, `source: "mock_places"`, or `source: "demo"` are filtered out on read/write.
- Decision surface and AI summary input also filter mock nearby businesses.

Result: nearby businesses are only shown when they come from a reliable provider such as Google Places.

## Automatic Pesquisa / Import Flow

Import actions call `processImportRunListings`, which loops saved listing URLs and calls `enrichScoreAndMatchListing`.

Current behavior:

1. Enrich location.
2. Mark enrichment as completed if location intelligence succeeds.
3. Calculate universal score.
4. Calculate Strategy Fit scores.
5. Recalculate investor matches.
6. Generate AI deal summary opportunistically.

Scoring and matching are intentionally isolated from enrichment status now. This prevents a missing strategy table or match schema mismatch from making the location enrichment look failed.

## Database Migration Required

Apply:

```sql
supabase/migrations/016_strategy_fit_and_match_explanations.sql
```

Without this migration:

- Imovel detail pages should no longer crash.
- Enrichment should still complete.
- Legacy investor matches can still persist.
- Strategy Fit rows and richer match fields will not persist fully.

## Verification

Latest local verification:

```bash
npm test
npx tsc --noEmit
npm run lint
```

Results:

- `npm test`: 56/56 passing
- `npx tsc --noEmit`: passing
- `npm run lint`: 0 errors; existing warnings remain in `tests/scoring-service.test.mjs`

## Known Notes

- Worktree is already heavily dirty with many unrelated modified/untracked files. Do not revert broad changes.
- `lib/location-intelligence/providers.js` is JavaScript-only; there is no `providers.ts`.
- Several modules have `.ts` and `.js` siblings. Runtime/tests may load the `.js` sibling, so updates often need to be mirrored.
- Real nearby businesses require configuring a reliable places provider, currently Google Places via the provider options path.
