---
phase: 17-service-wiring-and-api
plan: "06"
subsystem: scoring
tags: [scoring, integration-tests, node-test, mock-supabase, tdd]
dependency_graph:
  requires:
    - 17-02: lib/scoring/data.js CJS shim (upsertScore, getScoreHistory)
    - 17-03: lib/scoring/service.js CJS shim (scoreListingService)
    - 17-04: scoring-actions.ts (scoreListingAction, getBestFitAction)
    - 17-05: score API route (GET+POST)
  provides:
    - tests/scoring-service.test.mjs with all 5 D-10 cases implemented and passing
  affects:
    - Phase 18 scoring UI (gated on these tests passing)
tech_stack:
  added: []
  patterns:
    - node:test with mock Supabase client chaining (select/eq/upsert/order/maybeSingle/single)
    - Call-counter pattern for TWO sequential calls to same Supabase table
    - Per-strategy independent mock instances for best-fit comparison tests
key_files:
  modified:
    - tests/scoring-service.test.mjs
decisions:
  - Used call-counter (opportunityCallCount) in makeServiceMock to route odd calls to read path and even calls to upsert path — handles the TWO sequential opportunity_scores calls made by upsertScore (read score_version then write)
  - Used independent mock instances (cafeSupabase, logisticsSupabase) in SCO-19 test to avoid call-counter state leaking across two scoreListingService invocations
  - Symlinked worktree RealTools/node_modules to main repo node_modules to resolve zod/engine dependencies without duplicating packages
metrics:
  duration: "12 minutes"
  completed: "2026-05-10T22:23:56Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
  files_created: 0
---

# Phase 17 Plan 06: D-10 Integration Tests Summary

**One-liner:** All 5 D-10 test stubs replaced with concrete passing tests covering save/fetch round-trip, Portuguese error on missing insight, score_version increment, cafe > logistics best-fit ranking, and multi-strategy history retrieval.

## What Was Built

Implemented all 5 D-10 integration test cases in `tests/scoring-service.test.mjs`, replacing `test.todo` stubs with concrete async test blocks using mock Supabase clients and fixture data. No real database required — fully offline.

### Test Cases Implemented

| Test | Requirement | Assertion |
|------|-------------|-----------|
| SCO-18 save/fetch round-trip | SCO-18 | upsertScore returns `error: null` + data; getScoreHistory returns array with saved row |
| SCO-18 missing location_insights | SCO-18 | scoreListingService returns `errors.general[0]` containing Portuguese "Enriqueça" |
| SCO-11/SCO-20 recompute increments version | SCO-11, SCO-20 | upsertScore reads `score_version: 3`, captured upsert payload has `score_version: 4` |
| SCO-19 best-fit cafe > logistics | SCO-19 | cafe totalScore (88) > logistics totalScore (85) on cafe-optimized nearbyBusinesses |
| SCO-10/SCO-20 history returns variants | SCO-10, SCO-20 | getScoreHistory returns array of 3 rows for cafe/logistics/pharmacy strategy variants |

### Mock Architecture

Three mock builder functions handle all Supabase chain patterns:

- `makeSupabaseMockForUpsert(existingScoreVersion, savedRow)` — call-counter routes call 1 to `select().eq().maybeSingle()` (read), call 2 to `upsert().select().single()` (write)
- `makeSupabaseMockForHistory(rows)` — chains `select().eq().eq().order()` returning rows array
- `makeServiceMock({ listingRow, insightRow, scoreVersion })` — handles listings + location_insights + opportunity_scores tables for full scoreListingService path

## Test Results

```
node --test tests/scoring-service.test.mjs:
  ✔ scoring-service test file loads
  ✔ SCO-18 save/fetch round-trip: upsertScore then getScoreHistory returns the saved row
  ✔ SCO-18 missing location_insights: scoreListingService returns Portuguese error in errors.general
  ✔ SCO-11/SCO-20 recompute increments score_version: upsertScore reads existing version and increments by 1
  ✔ SCO-19 getBestFitAction: cafe scores higher than logistics when nearbyBusinesses favor cafe
  ✔ SCO-10/SCO-20 getScoreHistory returns current row for listing (all strategy variants)
  tests 6 | pass 6 | fail 0 | todo 0

npm test (full suite):
  tests 43 | pass 40 | fail 3 | todo 0
  Failures: 3 pre-existing location-intelligence tests (unchanged from baseline)
```

## Deviations from Plan

None — plan executed exactly as written. The mock patterns from RESEARCH.md were used faithfully with minor adaptations for the call-counter approach in makeServiceMock.

**Infrastructure deviation (Rule 3 — blocking issue fix):** The worktree has no `node_modules` directory. Running `node --test` from the worktree path caused `Cannot find module 'zod'` because `lib/scoring/schemas.js` requires zod and Node resolves relative to the file location. Fix: created a symlink `RealTools/node_modules` → `/Users/beni/Dev/realtools/node_modules`. This is a worktree environment setup fix, not a code change.

## Known Stubs

None — all D-10 test cases are concrete passing tests with real assertions.

## Threat Flags

None — test file uses fixture non-PII data (user-001, listing-001). No new network endpoints or trust boundaries introduced.

## Self-Check

- [x] `tests/scoring-service.test.mjs` exists and is 338 lines (> 150 min)
- [x] Commit `8b93624` exists in git log
- [x] `node --test` exits 0 with 6 passing, 0 failing, 0 todo
- [x] `grep "test.todo"` returns 0 lines
- [x] `grep "^test("` returns 6 lines
- [x] SCO-18 mentioned 2 times, SCO-19 mentioned 1 time, SCO-11 mentioned 1 time
- [x] `npm test` exits with same 3 pre-existing failures; 40 passing (was 35)

## Self-Check: PASSED
