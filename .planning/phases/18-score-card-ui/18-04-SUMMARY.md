---
phase: 18-score-card-ui
plan: 04
subsystem: ui
tags: [listing-detail, score-card, playwright, supabase-auth, e2e]
requires:
  - phase: 18-score-card-ui
    provides: Score card helpers, strategy selector, and interactive score card component
  - phase: 17-service-wiring-and-api
    provides: User-scoped score history and scoreListingAction server action
provides:
  - Listing detail score card integration below location intelligence
  - Authenticated Supabase-backed Playwright E2E workflow coverage
  - Dedicated Playwright dev-server port and Next env loading
affects: [listing-detail, score-card-ui, opportunity-scoring, e2e]
tech-stack:
  added: []
  patterns: [SSR Supabase auth cookie seeding for Playwright, fixed-port E2E web server]
key-files:
  created: []
  modified:
    - app/(app)/imoveis/[id]/page.tsx
    - playwright.config.ts
    - tests/fixtures/score-card-e2e.ts
    - tests/score-card.e2e.spec.ts
key-decisions:
  - "Score history is loaded server-side with getScoreHistory(supabase, user.id, id) and adapted with scoreRowToCardEntry before reaching the client."
  - "Playwright fixtures create real Supabase users/listings/insights/scores and inject SSR-compatible auth cookies instead of relying on a brittle UI login flow."
  - "The score-card E2E runs on a dedicated port 3100 unless PLAYWRIGHT_BASE_URL is explicitly provided."
patterns-established:
  - "Authenticated E2E setup can seed data with service-role Supabase access, then authenticate browser state with @supabase/ssr cookies."
  - "Score card assertions scope duplicate required copy with Playwright locator disambiguation instead of changing broker-facing text."
requirements-completed: [SCO-13, SCO-14, SCO-15, SCO-16]
duration: 1h 20m
completed: 2026-05-12
---

# Phase 18: Score Card UI Plan 04 Summary

**Listing detail score card integration with authenticated Supabase-backed browser workflow coverage**

## Performance

- **Duration:** 1h 20m
- **Started:** 2026-05-12T10:38:00Z
- **Completed:** 2026-05-12T11:58:36Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Confirmed `/imoveis/[id]` renders `OpportunityScoreCard` directly below the location intelligence section and passes user-scoped saved scores from the server page.
- Replaced placeholder E2E fixture behavior with real Supabase-backed fixture creation for authenticated users, listings with/without `location_insights`, and saved score rows.
- Made Playwright load Next env files, inject SSR-compatible auth cookies, and run on a dedicated dev-server port to avoid stale localhost processes.
- Passed the full Phase 18 automated gate: unit tests, lint, production build, and authenticated browser E2E.

## Task Commits

1. **Task 1: Wire saved scores into listing detail page** - `75ca083`
2. **Task 2: Finalize browser workflow validation** - `6f5c799`
3. **Task 3: Human visual UAT for score card polish** - Non-blocking polish checkpoint; automated E2E gate passed, human visual review remains optional before demo.

## Files Created/Modified

- `app/(app)/imoveis/[id]/page.tsx` - Loads score rows with `user.id`, adapts them to card entries, and renders the score card below location intelligence.
- `playwright.config.ts` - Loads `.env.local` through `@next/env` and uses port 3100 for isolated E2E runs.
- `tests/fixtures/score-card-e2e.ts` - Seeds authenticated Supabase-backed score-card scenarios and applies SSR auth cookies to Playwright.
- `tests/score-card.e2e.spec.ts` - Covers strategy selection, missing enrichment, no-score CTA, and strategy-change workflows against the integrated UI.

## Decisions Made

- Kept score reads server-side only; no client fetch path was added for saved scores.
- Used real Supabase fixture rows instead of mock cookies or test-only API routes so the E2E covers authenticated RLS-backed behavior.
- Scoped duplicate text locators in tests rather than changing required Portuguese score-card copy.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Remote scoring migrations were missing**
- **Found during:** Task 2 (browser workflow validation)
- **Issue:** The linked Supabase project lacked `public.opportunity_scores`, so E2E fixture creation could not insert saved score rows.
- **Fix:** Applied pending migrations `012_opportunity_scores.sql` and `013_opportunity_scores_category_columns.sql` with `supabase db push --dns-resolver https` after CLI authentication.
- **Files modified:** None locally; remote Supabase schema updated.
- **Verification:** Playwright fixture insertion reached score-card UI scenarios and `npx playwright test tests/score-card.e2e.spec.ts` passed.
- **Committed in:** Remote database migration, no local commit.

**2. [Rule 3 - Blocking] E2E auth depended on brittle UI login flow**
- **Found during:** Task 2 (browser workflow validation)
- **Issue:** The login form remained pending during the test and never navigated to `/dashboard`.
- **Fix:** Authenticated in the fixture with `@supabase/ssr` and injected server-readable session cookies into Playwright.
- **Files modified:** `tests/fixtures/score-card-e2e.ts`
- **Verification:** Authenticated Playwright scenarios reached protected listing pages.
- **Committed in:** `6f5c799`

**3. [Rule 3 - Blocking] Stale localhost server caused false E2E failures**
- **Found during:** Task 2 (browser workflow validation)
- **Issue:** Port 3000 was occupied by an older server while the current dev server started on a fallback port, so tests hit stale code.
- **Fix:** Moved default Playwright base URL and web server to a dedicated port 3100.
- **Files modified:** `playwright.config.ts`
- **Verification:** `npx playwright test tests/score-card.e2e.spec.ts` passed 4/4.
- **Committed in:** `6f5c799`

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All fixes were necessary to make the required authenticated E2E gate execute against the integrated UI. No score formula or product scope changed.

## Issues Encountered

- Initial `npm run build` needed network access for the configured Google font fetch.
- `npm run lint` passes with pre-existing warnings in `lib/scoring/data.js`, `lib/scoring/engine.ts`, and `tests/scoring-service.test.mjs`.
- Human visual UAT was not performed by a human in this session; it remains an additional non-blocking polish check before stakeholder demo.

## User Setup Required

None - no external service configuration required.

## Verification

- `npm test` - passed, 51 tests.
- `npm run lint` - passed with warnings only.
- `npm run build` - passed.
- `npx playwright test tests/score-card.e2e.spec.ts` - passed, 4/4 scenarios.

## Next Phase Readiness

Phase 18 automated delivery criteria are complete. The milestone is ready for `$gsd-verify-work` / milestone closeout, with optional human visual polish review before demo.

---
*Phase: 18-score-card-ui*
*Completed: 2026-05-12*
