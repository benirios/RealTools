---
phase: 17-service-wiring-and-api
plan: "05"
subsystem: scoring
tags: [scoring, api-route, next-js-15, auth, revalidateTag]
dependency_graph:
  requires:
    - 17-02 (lib/scoring/data.ts — getScoreHistory)
    - 17-03 (lib/scoring/service.ts — scoreListingService)
  provides:
    - app/api/listings/[id]/score/route.ts: GET and POST HTTP handlers for score retrieval and computation
  affects:
    - Phase 18 (UI fetch layer will call these endpoints)
    - External API consumers via GET/POST /api/listings/[id]/score
tech_stack:
  added: []
  patterns:
    - Next.js 15 async params (await params — required for dynamic route params)
    - getUser() at top of every handler (never getSession)
    - NextResponse.json with explicit status codes (401, 400, 422, 200)
    - revalidateTag in POST only (never revalidatePath in route handlers)
    - STRATEGY_SLUGS.includes() for enum validation (T-17-02 mitigate)
key_files:
  created:
    - app/api/listings/[id]/score/route.ts
  modified: []
decisions:
  - GET returns {scores:[]} always (never 404 for empty) — consistent with SCO-10 spec
  - POST validates strategy_slug in two layers: typeof check + STRATEGY_SLUGS membership
  - revalidateTag('opportunity_score') called in POST only after successful computation
  - 400 for missing/invalid body, 422 for service-layer error (score compute failure)
  - Route mirrors app/api/listings/[id]/location-insight/route.ts pattern exactly
metrics:
  duration: "~10 minutes"
  completed: "2026-05-10T23:05:00Z"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 17 Plan 05: Score API Route Summary

GET and POST HTTP handlers for `/api/listings/[id]/score` — auth-enforced endpoints for score retrieval (GET with optional `?strategy` filter returning `{scores:[]}`) and on-demand score computation (POST with `strategy_slug` validation against STRATEGY_SLUGS, calls scoreListingService, revalidateTag on success).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create app/api/listings/[id]/score/route.ts — GET and POST handlers | 3cbb5df | app/api/listings/[id]/score/route.ts |

## What Was Built

### app/api/listings/[id]/score/route.ts

Next.js 15 route handler file implementing two HTTP methods:

**GET handler:**
- `await params` to extract `id` (Next.js 15 async dynamic route params)
- Reads optional `?strategy` query param via `new URL(request.url).searchParams`
- `createSupabaseServerClient()` → `supabase.auth.getUser()` auth gate — returns 401 JSON if unauthenticated
- Calls `getScoreHistory(supabase, user.id, id, strategy?)` — returns all rows for listing, filtered by strategy if provided
- Always returns `{scores: [...]}` — empty array for no results, never 404

**POST handler:**
- `await params` to extract `id`
- `createSupabaseServerClient()` → `supabase.auth.getUser()` auth gate — returns 401 JSON if unauthenticated
- Parses request body with `.catch(() => ({}))` to handle malformed JSON gracefully
- Validates `strategy_slug` presence and string type → 400 `{error: 'strategy_slug is required'}`
- Validates `strategy_slug` against `STRATEGY_SLUGS` const → 400 `{error: 'Estratégia inválida.'}`
- Calls `scoreListingService(supabase, user.id, id, strategySlug)` — orchestrates full compute+persist
- If `result.errors` present → 422 `{error: result.errors.general?.[0] ?? fallback}`
- On success: calls `revalidateTag('opportunity_score')` → returns 200 `{score: result.score}`

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` errors mentioning score route | 0 |
| `npx tsc --noEmit` overall | Exit 0 |
| `grep "await params"` count | 2 (one per handler) |
| `grep "getUser()"` count | 2 (one per handler) |
| `grep "status: 401"` count | 2 (one per handler) |
| `grep "STRATEGY_SLUGS"` count | 2 (import + validation) |
| `grep "Estratégia inválida"` count | 1 |
| `grep "revalidateTag"` count | 2 (import + POST call) |
| `grep "revalidatePath"` count | 0 |
| `grep "status: 422"` count | 1 |
| `grep "status: 400"` count | 2 (missing body + invalid slug) |
| GET+POST exports count | 2 |
| `grep "getSession"` count | 0 |
| `grep "redirect("` count | 0 |
| `npm test` regression check | 35 pass, 3 fail (pre-existing location-intelligence failures, unrelated) |

## Deviations from Plan

None — plan executed exactly as written. The implementation follows the exact `<action>` block specification with the same imports, type definitions, handler bodies, and validation logic.

## Threat Model Coverage

All four threats in the plan's threat register are mitigated:

| Threat ID | Status |
|-----------|--------|
| T-17-03 (Elevation of Privilege) | Mitigated — `getUser()` at top of both handlers, 401 JSON before any DB operation |
| T-17-01 (Spoofing) | Mitigated — `user.id` from `getUser()` passed to `getScoreHistory`; service layer filters by `user_id`; RLS backstop |
| T-17-02 (Tampering) | Mitigated — two-layer validation: `typeof strategySlug !== 'string'` + `STRATEGY_SLUGS.includes()` |
| T-17-04 (Information Disclosure) | Mitigated — `getScoreHistory` uses `userId` as first unstable_cache key discriminator (Plan 02 implementation) |

## Known Stubs

None. The GET handler always returns `{scores: []}` — never 404 for empty results. This is intentional behavior per SCO-10, not a stub.

## Threat Flags

No new security surface beyond what was specified in the plan's threat model.

## Self-Check: PASSED

- `app/api/listings/[id]/score/route.ts` created: confirmed (53 lines)
- Commit `3cbb5df` exists: confirmed
- No unexpected file deletions in commit
- `npx tsc --noEmit` exits 0 (zero errors on route file)
- `npm test` regression check: 35 pass, 3 fail (pre-existing failures in location-intelligence.test.mjs — unrelated to this plan)
- All grep acceptance criteria pass
