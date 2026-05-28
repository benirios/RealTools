---
phase: 17-service-wiring-and-api
plan: "02"
subsystem: scoring
tags: [data-layer, opportunity-scores, supabase, unstable_cache, cjs-shim]
dependency_graph:
  requires:
    - 17-01 (types/supabase.ts with all 7 migration-013 columns)
  provides:
    - lib/scoring/data.ts TypeScript data access layer for opportunity_scores
    - lib/scoring/data.js CJS shim for node:test integration test compatibility
  affects:
    - lib/scoring/service.ts (Wave 2 plan B — will import upsertScore, getScoreHistory, getScore)
    - tests/scoring-service.test.mjs (Wave 3 — will fill test.todo stubs using data.js)
tech_stack:
  added: []
  patterns:
    - SupabaseLike param pattern (mirrors lib/location-intelligence/insights.ts)
    - read-then-write for score_version increment (select + upsert, no raw SQL)
    - unstable_cache with userId as first key discriminator (prevents cross-user cache leakage)
    - CJS shim alongside TypeScript source (same pattern as engine.js/engine.ts)
key_files:
  created:
    - lib/scoring/data.ts
    - lib/scoring/data.js
  modified: []
decisions:
  - Read-then-write chosen for score_version increment (avoids Postgres RPC, consistent with project pattern)
  - unstable_cache key granularity — listing+strategy for getScore, listing-only (with optional strategy filter) for getScoreHistory
  - CategoryBreakdown type annotation on find() callbacks required to satisfy strict TypeScript
  - CJS shim omits server-only and unstable_cache (Node test runner has no Next.js runtime)
metrics:
  duration: "~4 minutes"
  completed: "2026-05-10T22:14:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 17 Plan 02: Data Access Layer (lib/scoring/data.ts + data.js) Summary

TypeScript data access layer for opportunity_scores with SupabaseLike client pattern, score_version read-then-increment, unstable_cache with user-scoped keys, and matching CJS shim for node:test compatibility.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create lib/scoring/data.ts — SupabaseLike data access layer | 33073ab | lib/scoring/data.ts |
| 2 | Create lib/scoring/data.js — CJS shim for node:test integration tests | 5cbc413 | lib/scoring/data.js |

## What Was Built

### Task 1: lib/scoring/data.ts

New TypeScript module that is the single source of truth for all DB reads/writes on `opportunity_scores`.

Key implementation details:
- Starts with `import 'server-only'` — prevents client-side import
- `SupabaseLike` type mirrors `lib/location-intelligence/insights.ts` exactly
- `upsertScore`: reads `score_version` via `.maybeSingle()`, computes `nextVersion = (existing?.score_version ?? 0) + 1`, builds payload with all 7 migration-013 category columns extracted from `breakdown`, upserts with `onConflict: 'user_id,listing_id,strategy_slug'`
- `getScoreHistory`: wrapped in `unstable_cache` with key `['opportunity_score', userId, listingId, ...strategySlug?]`, filters by `user_id` + `listing_id`, orders by `total_score DESC`
- `getScore`: wrapped in `unstable_cache` with key `['opportunity_score', userId, listingId, strategySlug]`, uses `.maybeSingle()`
- All three functions include explicit `.eq('user_id', userId)` filter (defense-in-depth per D-16, RLS is backstop)

Category column mapping in upsertScore:
- `demographics_score` ← `breakdown.find(c => c.category === 'demographics')?.score`
- `location_score` ← `breakdown.find(c => c.category === 'location_quality')?.score`
- `foot_traffic_score` ← `breakdown.find(c => c.category === 'nearby_businesses')?.score`
- `competition_score` ← `breakdown.find(c => c.category === 'competition')?.score`
- `risk_score` ← `breakdown.find(c => c.category === 'risk')?.score`
- `investor_fit_score` ← `breakdown.find(c => c.category === 'investor_fit')?.score`
- `engine_version: '1.0'` hardcoded

### Task 2: lib/scoring/data.js

CJS shim that enables `require('../lib/scoring/data.js')` in `tests/scoring-service.test.mjs`. Contains identical logic to `data.ts` but without TypeScript types, `server-only`, or `unstable_cache`.

- `module.exports = { upsertScore, getScoreHistory, getScore }`
- Same read-then-write score_version pattern
- Same category column extraction
- Direct Supabase chain (no `as any` casts needed in plain JS)

## Verification Results

| Check | Result |
|-------|--------|
| `grep "import 'server-only'" lib/scoring/data.ts` | 1 line |
| `grep "onConflict: 'user_id,listing_id,strategy_slug'" lib/scoring/data.ts` | 1 line |
| `grep "nextVersion" lib/scoring/data.ts \| wc -l` | 2 |
| `grep "unstable_cache" lib/scoring/data.ts \| wc -l` | 3 |
| `grep "eq('user_id'" lib/scoring/data.ts \| wc -l` | 3 |
| `grep "demographics_score" lib/scoring/data.ts` | 1 line |
| `grep "engine_version: '1.0'" lib/scoring/data.ts` | 1 line |
| `grep "^export async function" lib/scoring/data.ts \| wc -l` | 3 |
| `node -e "const d = require('./lib/scoring/data.js'); console.log(typeof d.upsertScore, typeof d.getScoreHistory, typeof d.getScore)"` | `function function function` |
| `grep "module.exports" lib/scoring/data.js` | 1 line |
| `grep "score_version" lib/scoring/data.js \| wc -l` | 4 |
| `node --test tests/scoring-service.test.mjs` | 1 pass, 5 todo, 0 fail |
| `node --test tests/scoring-engine.test.mjs` (from main project) | 15 pass, 0 fail (no regression) |
| TypeScript compilation (main project tsc) | 0 errors on lib/scoring/data.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added explicit CategoryBreakdown type annotation on find() callbacks**
- **Found during:** Task 1 TypeScript compilation check
- **Issue:** TypeScript strict mode raised `Parameter 'c' implicitly has an 'any' type` on 6 arrow functions inside the payload object even though `result.breakdown` is typed as `CategoryBreakdown[]`
- **Fix:** Added `(c: CategoryBreakdown)` explicit type annotation on each callback; imported `CategoryBreakdown` from `./schemas`
- **Files modified:** `lib/scoring/data.ts`
- **Commit:** 33073ab

### Environment Note

The git worktree at `/Users/beni/Dev/.claude/worktrees/agent-a80dee882823d1391/RealTools` has no `node_modules` directory. TypeScript type-checking and scoring-engine integration tests were verified by running from `/Users/beni/Dev/RealTools` (which shares the same tsconfig and source files via git worktree). The scoring-service test (`node --test tests/scoring-service.test.mjs`) runs successfully within the worktree because `data.js` has no npm dependencies.

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| tests/scoring-service.test.mjs | 5 `test.todo` entries (D-10 cases) | Intentional — Wave 3 (plan 17-04) will fill these once service.js exists |

## Threat Flags

No new threat surface introduced. Security mitigations from T-17-01 and T-17-04 are fully implemented:
- T-17-01 (Spoofing): All three functions include explicit `.eq('user_id', userId)` — no caller can substitute userId
- T-17-04 (Information Disclosure): Cache keys always start with `userId` — `['opportunity_score', userId, listingId, ...]`

## Self-Check: PASSED

- `lib/scoring/data.ts` created: confirmed (109 lines)
- `lib/scoring/data.js` created: confirmed (73 lines)
- Commit `33073ab` exists: confirmed
- Commit `5cbc413` exists: confirmed
- No unexpected file deletions in either commit
- TypeScript compiles clean (0 errors on data.ts from main project tsc)
- `node --test tests/scoring-service.test.mjs` exits with 0 failures
