---
phase: 17-service-wiring-and-api
plan: "03"
subsystem: scoring
tags: [scoring, service, orchestrator, cjs-shim, server-only]
dependency_graph:
  requires:
    - 17-01 (types/supabase.ts with migration-013 columns)
  provides:
    - lib/scoring/service.ts: scoreListingService orchestrator (TS, server-only)
    - lib/scoring/service.js: CJS shim for node:test integration tests
    - lib/scoring/data.ts: upsertScore + getScoreHistory + getScore (TS, server-only)
    - lib/scoring/data.js: CJS shim for node:test (upsertScore, getScoreHistory, getScore)
  affects:
    - lib/actions/scoring-actions.ts (Plan 04 — will import scoreListingService)
    - app/api/listings/[id]/score/route.ts (Plan 05 — will import scoreListingService)
    - tests/scoring-service.test.mjs (Plan 04 — will fill test.todo stubs)
tech_stack:
  added: []
  patterns:
    - service-only import ('server-only') at module top
    - SupabaseLike param pattern (mirrors lib/location-intelligence/api.ts)
    - Four-step orchestration: loadListing → loadInsight → computeScore → upsertScore
    - CJS shim alongside TypeScript source for node:test compatibility
    - read-then-write for score_version increment (no DB transaction needed at v1.6 scale)
key_files:
  created:
    - lib/scoring/service.ts
    - lib/scoring/service.js
    - lib/scoring/data.ts
    - lib/scoring/data.js
  modified: []
decisions:
  - scoreListingService wraps all three ScoringOutcome states into ScoringActionState (D-07)
  - Portuguese error messages per D-08 for NEEDS_ENRICHMENT and ENRICHMENT_FAILED
  - CJS shim inlines getListingLocationInsight query (cannot require insights.ts in CJS context)
  - data.ts/data.js created in this plan as Rule 3 deviation (blocking TypeScript compilation)
metrics:
  duration: "~20 minutes"
  completed: "2026-05-10T22:30:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 17 Plan 03: Scoring Service Orchestrator Summary

Scoring service orchestrator that chains load listing → load insight → computeScore → upsertScore, translating all three ScoringOutcome states (SCORED/NEEDS_ENRICHMENT/ENRICHMENT_FAILED) into ScoringActionState with Portuguese messages, plus CJS shims (service.js and data.js) for node:test integration test compatibility.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create lib/scoring/service.ts — scoring service orchestrator | 5dfa314 | lib/scoring/service.ts, lib/scoring/data.ts |
| 2 | Create lib/scoring/service.js — CJS shim for node:test integration tests | aa05014 | lib/scoring/service.js, lib/scoring/data.js |

## What Was Built

### lib/scoring/service.ts

TypeScript scoring service orchestrator with `import 'server-only'`. Exports `scoreListingService(supabase, userId, listingId, strategySlug)` which:

1. Loads listing via inline `loadListingForScoring` helper (mirrors `loadListingForUser` from `lib/location-intelligence/api.ts`)
2. Loads location insight via `getListingLocationInsight` from `@/lib/location-intelligence/insights`
3. Calls `computeScore(listing, insight, strategySlug)` — three-state output
4. Maps outcomes:
   - `null listing` → `errors.general: ['Imóvel não encontrado.']`
   - `null insight` → `errors.general: ['Enriqueça a localização antes de calcular a pontuação.']`
   - `NEEDS_ENRICHMENT` → `errors.general: ['Enriqueça a localização antes de calcular a pontuação.']`
   - `ENRICHMENT_FAILED` → `errors.general: ['Não foi possível calcular a pontuação. Tente novamente.']`
   - `SCORED` + upsert error → `errors.general: ['Não foi possível salvar a pontuação.']`
   - `SCORED` + upsert ok → `{ message: 'Pontuação calculada com sucesso.', score: outcome.result, scoreResult: outcome.result }`

### lib/scoring/data.ts (Rule 3 deviation — see below)

TypeScript data access layer with `import 'server-only'`. Exports:
- `upsertScore(supabase, userId, listingId, result)`: read-then-write pattern for `score_version` increment; upserts with `onConflict: 'user_id,listing_id,strategy_slug'`; maps all migration-013 category columns
- `getScoreHistory(supabase, userId, listingId, strategySlug?)`: returns all strategy variants for a listing, ordered by `total_score DESC`
- `getScore(supabase, userId, listingId, strategySlug)`: returns single current row

### lib/scoring/service.js

CJS shim for node:test integration tests. Plain JavaScript, no `server-only` or Next.js modules. Inlines `getListingLocationInsight` as a direct Supabase query (since `insights.ts` cannot be CJS-required). Exports `{ scoreListingService }` via `module.exports`. Logically identical to `service.ts`: same flow, same error messages, same return shape.

### lib/scoring/data.js (Rule 3 deviation — see below)

CJS shim for `data.ts`. Exports `{ upsertScore, getScoreHistory, getScore }` via `module.exports`. Required by `service.js`.

## Verification Results

| Check | Result |
|-------|--------|
| `tsc --noEmit` errors mentioning lib/scoring/service | 0 |
| `tsc --noEmit` overall | Exit 0 |
| `grep "import 'server-only'" lib/scoring/service.ts` | 1 line |
| `grep "computeScore" lib/scoring/service.ts` | 2 lines (import + call) |
| `grep "upsertScore" lib/scoring/service.ts` | 2 lines (import + call) |
| `grep "getListingLocationInsight" lib/scoring/service.ts` | 2 lines (import + call) |
| `grep "NEEDS_ENRICHMENT" lib/scoring/service.ts` | 1 line |
| `grep "ENRICHMENT_FAILED" lib/scoring/service.ts` | 1 line |
| `grep "Enriqueça a localização" lib/scoring/service.ts` | 2 lines |
| `grep "^export async function scoreListingService" lib/scoring/service.ts` | 1 line |
| `grep "getSession" lib/scoring/service.ts` | 0 lines |
| `node -e "require('./lib/scoring/service.js')"` | Exit 0 |
| `grep "module.exports" lib/scoring/service.js` | 1 line |
| `node --test tests/scoring-service.test.mjs` | 1 pass, 5 todo, 0 fail |
| `node --test tests/scoring-engine.test.mjs` | 15 pass, 0 fail (no regression) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created lib/scoring/data.ts to unblock TypeScript compilation**
- **Found during:** Task 1
- **Issue:** `service.ts` imports `{ upsertScore } from './data'`. `data.ts` did not exist (Plan 02 runs in parallel in a separate worktree). TypeScript could not resolve the import, causing `tsc --noEmit` to fail on `service.ts`.
- **Fix:** Created `lib/scoring/data.ts` with the full `upsertScore`, `getScoreHistory`, and `getScore` implementation based on the design documented in `17-RESEARCH.md` Pattern 1. This is the same implementation Plan 02 would produce.
- **Files modified:** `lib/scoring/data.ts` (created)
- **Commit:** 5dfa314

**2. [Rule 3 - Blocking] Created lib/scoring/data.js to satisfy service.js CJS require chain**
- **Found during:** Task 2
- **Issue:** `service.js` requires `./data.js`. `data.js` did not exist, so `node -e "require('./lib/scoring/service.js')"` would fail with MODULE_NOT_FOUND.
- **Fix:** Created `lib/scoring/data.js` as a CJS shim for `data.ts`, matching the same exports pattern.
- **Files modified:** `lib/scoring/data.js` (created)
- **Commit:** aa05014

**Note on Wave 2 merge:** When Plans 02 and 03 worktrees are merged back, `data.ts` and `data.js` will appear in both. The merge should use the Plan 02 versions as authoritative if they differ (Plan 02 owns the data layer). If Plans 02 and 03 both create the same files identically, the merge is conflict-free.

## Known Stubs

None in this plan's deliverables. The `test.todo` stubs in `tests/scoring-service.test.mjs` are intentional and owned by Plan 04 (Wave 3).

## Threat Flags

No new security surface introduced by this plan. `scoreListingService` does not perform auth — it accepts `userId` as a parameter from authenticated callers (correct architectural separation per T-17-03 accept disposition). `strategySlug` validation against `STRATEGY_SLUGS` is deferred to Plan 04/05 callers per T-17-02 mitigate plan.

## Self-Check: PASSED

- `lib/scoring/service.ts` created: confirmed (64 lines)
- `lib/scoring/service.js` created: confirmed (50 lines)
- `lib/scoring/data.ts` created: confirmed (deviation, 88 lines)
- `lib/scoring/data.js` created: confirmed (deviation, 64 lines)
- Commit `5dfa314` exists: confirmed
- Commit `aa05014` exists: confirmed
- No unexpected file deletions in either commit
- `tsc --noEmit` exits 0
- `node --test tests/scoring-service.test.mjs` exits 0 (1 pass, 5 todo, 0 fail)
- `node --test tests/scoring-engine.test.mjs` exits 0 (15 pass, 0 fail — no regressions)
