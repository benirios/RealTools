---
phase: 17-service-wiring-and-api
reviewed: 2026-05-10T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - app/api/listings/[id]/score/route.ts
  - lib/actions/scoring-actions.ts
  - lib/scoring/data.js
  - lib/scoring/data.ts
  - lib/scoring/service.js
  - lib/scoring/service.ts
  - tests/scoring-service.test.mjs
  - types/supabase.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-05-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Phase 17 wires the scoring engine to a REST route (`POST /api/listings/[id]/score`), a server action layer (`scoring-actions.ts`), a data layer (`data.ts` / `data.js`), a service layer (`service.ts` / `service.js`), and a Node test suite. The auth pattern is correct throughout — `getUser()` is used, never `getSession()`. The upsert logic, strategy validation, and error propagation are sound.

One critical issue was found: `unstable_cache` captures the `supabase` client inside the cache closure, which makes it impossible for Next.js to correctly serialize/deserialize the cached function — and silently returns stale data across requests for different users sharing the same cache key, because the captured client is request-scoped while the cache is process-scoped. Four warnings cover: `revalidatePath` being called even when scoring failed; a TOCTOU race in the two-step read-then-upsert for `score_version`; the test mock for `getBestFitAction` only covering two of the six strategies making the suite incomplete; and a missing auth guard for the `getScore` exported function. Three info items cover minor quality improvements.

---

## Critical Issues

### CR-01: `unstable_cache` closes over a request-scoped `supabase` client

**File:** `lib/scoring/data.ts:69` and `lib/scoring/data.ts:95`

**Issue:** Both `getScoreHistory` and `getScore` wrap the database query in `unstable_cache(fn, keys, { tags })()`. The anonymous async function passed as the first argument **closes over the `supabase` parameter**, which is a request-scoped object created by `createSupabaseServerClient()`. Next.js serializes the cache entry by executing the function once and storing the result; on a cache hit it returns the stored result without re-executing — but the closed-over `supabase` value is a different object on every request. This means:

1. The cache key includes `userId` and `listingId`, so two users with identical IDs (impossible but illustrative) or a single user who scores twice in the same process lifecycle may receive a cached DB response that was fetched using a **different request's auth cookie**, bypassing RLS at the application layer.
2. More practically: `unstable_cache` is designed for functions that are **pure with respect to their captured environment** (e.g., closing over only static config). Capturing a mutable, request-scoped Supabase client produces undefined behavior — in development this is often harmless, but in production with ISR or edge runtimes the cache can cross request boundaries.

The correct pattern is to move the query outside `unstable_cache` and only cache the result of a serializable, non-client-capturing function, or — more simply — remove `unstable_cache` entirely here and rely on `revalidateTag('opportunity_score')` via Next.js route-level caching on `fetch`, which Supabase SSR already wraps.

**Fix:**
```typescript
// data.ts — remove unstable_cache wrapper; the caller already revalidates via revalidateTag
export async function getScoreHistory(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug?: string
): Promise<OpportunityScoreRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('opportunity_scores') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)

  if (strategySlug) {
    query = query.eq('strategy_slug', strategySlug)
  }

  const { data } = await query.order('total_score', { ascending: false })
  return (data ?? []) as OpportunityScoreRow[]
}

export async function getScore(
  supabase: SupabaseLike,
  userId: string,
  listingId: string,
  strategySlug: string
): Promise<OpportunityScoreRow | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from('opportunity_scores') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('strategy_slug', strategySlug)
    .maybeSingle()
  return (data ?? null) as OpportunityScoreRow | null
}
```

---

## Warnings

### WR-01: `revalidatePath` and `revalidateTag` called even when scoring fails

**File:** `lib/actions/scoring-actions.ts:27-28`

**Issue:** In `scoreListingAction`, `revalidatePath` and `revalidateTag` are called unconditionally after `scoreListingService` returns — even when `result.errors` is set (i.e., the score was not computed). This causes unnecessary cache invalidation on every failed request, potentially evicting valid cached entries for no reason. The same pattern is repeated in `getBestFitAction` at lines 46-47, where a partial failure (e.g., one strategy errors out) still triggers revalidation.

**Fix:**
```typescript
export async function scoreListingAction(
  listingId: string,
  strategySlug: string
): Promise<ScoringActionState> {
  // ... auth + validation ...
  const result = await scoreListingService(supabase, user.id, listingId, strategySlug)

  // Only revalidate when a score was actually persisted
  if (!result.errors) {
    revalidatePath(`/imoveis/${listingId}`)
    revalidateTag('opportunity_score')
  }

  return { message: result.message, score: result.score, errors: result.errors }
}
```

---

### WR-02: TOCTOU race in `score_version` increment (read-then-upsert not atomic)

**File:** `lib/scoring/data.ts:20-53` and `lib/scoring/data.js:9-46`

**Issue:** `upsertScore` performs two separate round-trips:
1. `SELECT score_version WHERE user_id=? AND listing_id=? AND strategy_slug=?`
2. `UPSERT payload` with `nextVersion = existing + 1`

If two concurrent requests score the same listing with the same strategy simultaneously, both will read the same `score_version` (e.g., 3), compute `nextVersion = 4`, and both upsert with `score_version = 4`. One write silently overwrites the other. The `onConflict` upsert does not include `score_version` in the conflict target, so no error surfaces — the second writer simply wins and the first writer's result is lost.

For an audit trail use-case this is a correctness bug. The fix is to use a Postgres function (or a single `UPDATE ... RETURNING score_version + 1`) or accept that `score_version` is a best-effort counter and document it as such.

**Fix (minimal — accept best-effort):** Document the limitation, or use a DB-side counter:
```sql
-- migration: add a sequence-based increment via a trigger or generated column
-- OR use: UPDATE opportunity_scores SET score_version = score_version + 1 ... RETURNING *
```

Alternatively, use a single upsert with `score_version = COALESCE(excluded.score_version, 0) + 1` via a Postgres rule, removing the application-side read entirely.

---

### WR-03: `BEST_FIT_SLUGS` hardcoded list diverges from `STRATEGY_SLUGS` without enforcement

**File:** `lib/actions/scoring-actions.ts:10`

**Issue:** `BEST_FIT_SLUGS` is defined as `['cafe', 'logistics', 'pharmacy'] as const` directly in the module, duplicating a subset of the canonical `STRATEGY_SLUGS` from `lib/scoring/strategies.ts`. There is no compile-time or runtime check that these slugs are valid members of `STRATEGY_SLUGS`. If a slug is renamed or removed in `strategies.ts`, `getBestFitAction` will silently call `scoreListingService` with an invalid slug, which passes through to `computeScore` — and how `computeScore` handles an unknown slug determines whether this silently produces wrong output or errors.

**Fix:**
```typescript
import { STRATEGY_SLUGS } from '@/lib/scoring/strategies'

// Derive BEST_FIT_SLUGS from the canonical source so the type system enforces membership
const BEST_FIT_SLUGS = ['cafe', 'logistics', 'pharmacy'] as const satisfies
  ReadonlyArray<typeof STRATEGY_SLUGS[number]>
```

The `satisfies` keyword causes a compile-time error if any element is not a valid `StrategySlug`.

---

### WR-04: Test mock for `makeServiceMock` uses parity-based call counting — fragile coupling

**File:** `tests/scoring-service.test.mjs:164`

**Issue:** The `makeServiceMock` function tracks `opportunityCallCount` and uses `opportunityCallCount % 2 === 1` to decide whether to return the "read" or "write" chain. This assumes that every invocation of `scoreListingService` makes exactly one read call then exactly one write call to `opportunity_scores`, in strict alternation. If the implementation changes (e.g., adds a second read, or conditionally skips the write), the mock silently returns the wrong chain type — the read path returns on even calls, which returns a chainable object with `select/eq` but no `upsert`, causing a runtime error inside `upsertScore` without a clear test failure message.

The SCO-19 test (`getBestFitAction` surrogate) creates two independent `makeServiceMock` instances to avoid this, which is the right workaround — but `makeServiceMock` itself is still exported/used in a fragile way for single-call tests.

**Fix:** Use a queue-based mock that explicitly defines each expected call in order:
```javascript
function makeOpportunityMockQueue(responses) {
  let idx = 0
  return {
    from(table) {
      if (table !== 'opportunity_scores') return {}
      return responses[idx++]
    }
  }
}
```

This makes unexpected extra calls throw an index-out-of-bounds rather than silently returning the wrong chain.

---

## Info

### IN-01: `as any` casts on every Supabase query call — consider a typed helper

**File:** `lib/scoring/data.ts:20`, `52`, `72`, `98`

**Issue:** Each database call casts `supabase.from(...)` to `any` with an inline ESLint disable comment. This is repeated four times. While the `SupabaseLike` interface is intentionally loose for test-compatibility, the cast suppresses all type checking on the query builder chain, including `.select()`, `.eq()`, `.upsert()`, etc.

**Fix:** Extract a single typed accessor or widen `SupabaseLike` to include the Supabase query builder return type, reducing the number of suppression comments.

---

### IN-02: Error message language mixing — route returns Portuguese, HTTP status uses English convention

**File:** `app/api/listings/[id]/score/route.ts:39`

**Issue:** The API route returns `'Estratégia inválida.'` (Portuguese) as the JSON error body. This is consistent with the server action layer, but REST API consumers (mobile apps, third-party integrations) typically expect either locale-negotiated messages or English. Since this is a SaaS product the choice may be intentional — worth confirming and documenting.

**Fix:** No code change required if Portuguese-only is intentional, but add a comment:
```typescript
// Error messages are in Portuguese — this API is Brazil-market only (pt-BR UI)
return NextResponse.json({ error: 'Estratégia inválida.' }, { status: 400 })
```

---

### IN-03: `data.js` and `service.js` are CJS shims for test compatibility — risk of drift

**File:** `lib/scoring/data.js:1-73`, `lib/scoring/service.js:1-50`

**Issue:** The `.js` files are described in their headers as "CJS shims for node:test compatibility" that replicate the logic of their `.ts` counterparts without TypeScript or Next.js-specific APIs. This dual-maintenance pattern means that a bug fix or logic change in `data.ts` must be manually mirrored in `data.js`, and vice versa. There is no mechanism to detect drift. The current `upsertScore` implementations are consistent, but the `getListingLocationInsight` function in `service.js` (lines 5-10) has a slightly different query pattern from `service.ts` (which delegates to `getListingLocationInsight` from `@/lib/location-intelligence/insights`). The `.js` version inlines a direct Supabase query against `location_insights`, while the `.ts` version calls a shared service that may apply additional logic (e.g., filtering, ordering).

**Fix:** Consider moving tests to use `tsx` or `ts-node` with mock adapters so the TypeScript sources are tested directly, eliminating the shim files. If CJS shims are required, add a CI check that runs both the TS and JS implementations against the same fixture and asserts identical output.

---

_Reviewed: 2026-05-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
