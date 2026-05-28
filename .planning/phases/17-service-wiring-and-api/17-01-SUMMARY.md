---
phase: 17-service-wiring-and-api
plan: "01"
subsystem: scoring
tags: [types, testing, migration-013, opportunity-scores]
dependency_graph:
  requires: []
  provides:
    - types/supabase.ts opportunity_scores Row/Insert/Update with all 7 migration-013 columns
    - tests/scoring-service.test.mjs D-10 stub harness for Wave 3
  affects:
    - lib/scoring/data.ts (will use the corrected types from task 1)
    - tests (scoring-service.test.mjs stub filled by plan 17-04)
tech_stack:
  added: []
  patterns:
    - CJS require with try/catch shim to load before modules exist
    - node:test test.todo for Wave N stubs
key_files:
  created:
    - tests/scoring-service.test.mjs
  modified:
    - types/supabase.ts
decisions:
  - Manual patch of types/supabase.ts (local Supabase not running); additive-only, no other tables touched
  - test.todo stubs chosen over skipped tests so Wave 3 can fill them in place
metrics:
  duration: "~12 minutes"
  completed: "2026-05-10T22:06:06Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 17 Plan 01: Types Gap Remediation and Test Stub Creation Summary

Manual patch adds all 7 migration-013 NUMERIC category columns to types/supabase.ts opportunity_scores, and creates the integration test stub file with D-10 cases as test.todo entries for Wave 3 to fill.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix types/supabase.ts — add migration-013 columns to opportunity_scores | cafc85e | types/supabase.ts |
| 2 | Create tests/scoring-service.test.mjs with D-10 stub cases | 700a0a1 | tests/scoring-service.test.mjs |

## What Was Built

### Task 1: types/supabase.ts patch

Added 7 columns from migration 013 to the `opportunity_scores` Row, Insert, and Update interfaces:

- `competition_score: number | null` (Row) / `competition_score?: number | null` (Insert/Update)
- `demographics_score: number | null` / optional
- `engine_version: string` / `engine_version?: string`
- `foot_traffic_score: number | null` / optional
- `investor_fit_score: number | null` / optional
- `location_score: number | null` / optional
- `risk_score: number | null` / optional

Alphabetic ordering preserved. `npx tsc --noEmit` exits 0.

### Task 2: tests/scoring-service.test.mjs

New test file with:
- CJS require shim pattern (mirrors scoring-engine.test.mjs), wrapped in try/catch so the file loads before Wave 1 creates data.js and service.js
- Three fixture helpers: `makeListing`, `makeInsight`, `makeScoreRow` (all with migration-013 category columns)
- One concrete smoke test: "scoring-service test file loads" (passes immediately)
- Five `test.todo` stubs for D-10 cases (SCO-18, SCO-11/SCO-20, SCO-19, SCO-10/SCO-20)

Run result: 1 pass, 5 todo, 0 fail.

## Verification Results

| Check | Result |
|-------|--------|
| `grep "demographics_score" types/supabase.ts \| wc -l` | 3 |
| `grep "engine_version" types/supabase.ts \| wc -l` | 3 |
| `grep "investor_fit_score" types/supabase.ts \| wc -l` | 3 |
| `npx tsc --noEmit` | 0 (no errors) |
| `node --test tests/scoring-service.test.mjs` | 1 pass, 5 todo, 0 fail |
| `node --test tests/scoring-engine.test.mjs` | 15 pass, 0 fail (no regression) |

## Deviations from Plan

None — plan executed exactly as written. Local Supabase not running was expected and handled by the plan's fallback branch (manual patch).

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| tests/scoring-service.test.mjs | 5 `test.todo` entries (D-10 cases) | Intentional — Wave 3 (plan 17-04) will fill these once data.js and service.js exist |

## Self-Check: PASSED

- `types/supabase.ts` modified: confirmed (demographics_score count = 3)
- `tests/scoring-service.test.mjs` created: confirmed (86 lines)
- Commit `cafc85e` exists: confirmed
- Commit `700a0a1` exists: confirmed
- No unexpected file deletions in either commit
