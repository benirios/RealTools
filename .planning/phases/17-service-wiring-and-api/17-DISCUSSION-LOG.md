# Phase 17: Service Wiring and API — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 17 — Service Wiring and API
**Areas discussed:** Best-fit persistence, Integration test approach

---

## Best-fit persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Compute only — return ranked list, don't save | Fast, no DB writes. Scores not queryable later. | |
| Persist all scored strategies | Upsert one row per strategy to opportunity_scores. Full portfolio queryability. | ✓ |
| Persist top 2 only | Save only top 2 highest-scoring strategies. Reduces DB writes. | |

**User's choice:** Persist all scored strategies
**Notes:** Then clarified scope — only 3 primary profiles (cafe, logistics, pharmacy), not all 6.

---

## Integration test approach

| Option | Description | Selected |
|--------|-------------|----------|
| Mock Supabase client | Tests with fake supabase client + fixture data. Fast, CI-friendly. | ✓ |
| Real Supabase (local dev DB) | Tests hit real local Supabase. Proves actual SQL/RLS. Slower. | |
| Skip — cover in Phase 18 E2E | Trust Phase 16 unit tests + Phase 18 Playwright. | |

**User's choice:** Mock Supabase client
**Notes:** Same node:test + CJS shims pattern as Phase 16.

---

## Claude's Discretion

- Score history model (user did not select this for discussion) — documented as single-row UPSERT, score_version counter, no historical snapshots. Aligned with STATE.md locked decision.
- Server action return shape — documented as ScoringActionState (consistent with schemas.ts existing type).
- All codebase patterns (SupabaseLike param, upsert conflict key) — deferred to planner.

## Deferred Ideas

- Time-series score history with previous computation values — requires schema change, deferred post-v1.6.
- Scoring retail/services/any profiles in getBestFitAction — deferred to v1.7.
