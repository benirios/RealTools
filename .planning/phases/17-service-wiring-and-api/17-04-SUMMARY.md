---
phase: 17-service-wiring-and-api
plan: "04"
subsystem: scoring
tags: [server-actions, scoring, auth-guard, revalidation, best-fit]
dependency_graph:
  requires:
    - 17-03 (lib/scoring/service.ts — scoreListingService)
    - 17-02 (lib/scoring/data.ts — data access layer)
  provides:
    - lib/actions/scoring-actions.ts: scoreListingAction, getBestFitAction server actions
  affects:
    - Phase 18 UI (will import scoreListingAction and getBestFitAction directly)
    - app/(app)/imoveis/[id]/page.tsx (revalidatePath target)
tech_stack:
  added: []
  patterns:
    - "'use server' + getUser() auth guard + redirect('/auth/login') (mirrors location-insight-actions.ts)"
    - "revalidatePath + revalidateTag('opportunity_score') after each mutation"
    - "BEST_FIT_SLUGS hard-coded const (not derived from STRATEGIES keys per D-04)"
    - "strategySlug validated against STRATEGY_SLUGS before service call (T-17-02)"
    - "Promise.all for concurrent 3-strategy scoring in getBestFitAction"
key_files:
  created:
    - lib/actions/scoring-actions.ts
  modified: []
decisions:
  - "BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy'] as const — hard-coded per D-04, not derived from STRATEGIES keys"
  - "scoreListingAction returns { message, score, errors } from ScoringActionState — not raw ScoringOutcome"
  - "getBestFitAction filters topStrategies to only entries where state.score is non-null before ranking"
metrics:
  duration: "~1 minute"
  completed: "2026-05-10T22:17:29Z"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 17 Plan 04: Scoring Server Actions Summary

'use server' module exporting scoreListingAction (auth + strategy validation + single score) and getBestFitAction (auth + concurrent 3-strategy scoring + ranked top-2 output), both using getUser() auth guard, revalidatePath, and revalidateTag('opportunity_score').

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create lib/actions/scoring-actions.ts — scoreListingAction and getBestFitAction | df8d5a0 | lib/actions/scoring-actions.ts |

## What Was Built

### lib/actions/scoring-actions.ts

New 'use server' module that is the primary UI-facing surface for all scoring operations.

Key implementation details:

**scoreListingAction(listingId, strategySlug)**
- Calls `createSupabaseServerClient()` then `supabase.auth.getUser()`; redirects to `/auth/login` if null (T-17-03)
- Validates `strategySlug` against `STRATEGY_SLUGS` const from `lib/scoring/strategies`; returns `{errors:{general:['Estratégia inválida.']}}` on invalid slug (T-17-02)
- Calls `scoreListingService(supabase, user.id, listingId, strategySlug)` — user ID comes exclusively from `getUser()`, never from request body
- Calls `revalidatePath(/imoveis/${listingId})` and `revalidateTag('opportunity_score')` after mutation (D-15)
- Returns `ScoringActionState` — not raw `ScoringOutcome` (D-07)

**getBestFitAction(listingId)**
- Same `getUser()` auth guard + redirect pattern
- `BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy'] as const` — hard-coded, not derived from STRATEGIES keys (D-04)
- `Promise.all(BEST_FIT_SLUGS.map(...))` runs all 3 scoreListingService calls concurrently; each call upserts to DB (D-05)
- Calls `revalidatePath` and `revalidateTag` after all 3 upserts
- Filters to entries where `state.score` is non-null, sorts by `totalScore DESC`, slices to top 2 (D-06)
- Returns `{ scores: ScoringActionState[], topStrategies: [{slug, label, totalScore, fitLabel}] }`

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` errors on scoring-actions.ts | 0 |
| `grep "'use server'" lib/actions/scoring-actions.ts` | 1 line (first line) |
| `grep "getUser()" lib/actions/scoring-actions.ts \| wc -l` | 2 |
| `grep "redirect('/auth/login')" lib/actions/scoring-actions.ts \| wc -l` | 2 |
| `grep "BEST_FIT_SLUGS" lib/actions/scoring-actions.ts` | contains 'cafe', 'logistics', 'pharmacy' |
| `grep "revalidateTag('opportunity_score')" lib/actions/scoring-actions.ts \| wc -l` | 2 |
| `grep "revalidatePath" lib/actions/scoring-actions.ts \| wc -l` | 3 (import + 2 calls) |
| `grep "STRATEGY_SLUGS" lib/actions/scoring-actions.ts \| wc -l` | 2 (import + validation) |
| `grep "Estratégia inválida" lib/actions/scoring-actions.ts` | 1 line |
| `grep "^export async function" lib/actions/scoring-actions.ts \| wc -l` | 2 |
| `grep "getSession" lib/actions/scoring-actions.ts` | 0 lines (PASS) |
| `grep "retail\|services\|any" lib/actions/scoring-actions.ts` in BEST_FIT_SLUGS | 0 |
| `node --test tests/scoring-engine.test.mjs` | 15 pass, 0 fail (no regression) |

## Deviations from Plan

None — plan executed exactly as written. The file content matches the `<action>` template verbatim.

## Known Stubs

None. Both actions are fully implemented and wired to `scoreListingService`.

## Threat Flags

No new threat surface beyond what the plan's threat model covers. All three threats from the plan's STRIDE register are mitigated:
- T-17-01 (Spoofing): userId derived from `getUser()` only — not from any request parameter
- T-17-02 (Tampering): strategySlug validated against STRATEGY_SLUGS before service call
- T-17-03 (Elevation of Privilege): Both actions call `getUser()` first; unauthenticated callers are redirected to /auth/login via Next.js redirect()

## Self-Check: PASSED

- `lib/actions/scoring-actions.ts` created: confirmed (64 lines)
- Commit `df8d5a0` exists: confirmed
- No unexpected file deletions: confirmed (empty deletions list)
- `npx tsc --noEmit` exits 0 (zero errors)
- `node --test tests/scoring-engine.test.mjs` exits 0 (15 pass, 0 fail — no regressions)
