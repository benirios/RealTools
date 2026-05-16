# Phase 15: Enrichment API And Insight UI - Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 7 inferred new/modified files
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/location-intelligence/api.ts` | service | request-response | `lib/actions/listing-import-actions.ts` + `lib/location-intelligence/insights.ts` | exact |
| `app/api/location-insights/route.ts` | route | request-response | `app/api/investors/route.ts` | exact |
| `app/api/location-insights/[id]/route.ts` | route | request-response | `app/api/investors/[id]/route.ts` | exact |
| `app/api/listings/[id]/location-insight/route.ts` | route | request-response | `app/api/investors/[id]/matches/route.ts` | role-match |
| `app/api/listings/[id]/enrich-location/route.ts` | route | request-response | `app/api/investors/[id]/matches/route.ts` + `lib/actions/listing-import-actions.ts` | role-match |
| `components/listings/location-insight-action.tsx` | component | request-response | `components/listings/import-actions.tsx` | exact |
| `app/(app)/imoveis/[id]/page.tsx` | component | request-response | `app/(app)/imoveis/[id]/page.tsx` | exact |

## Pattern Assignments

### `app/api/investors/route.ts` and `app/api/investors/[id]/route.ts`

These are the closest route-handler analogs.

Pattern to reuse:

- `NextResponse.json(...)`
- `createSupabaseServerClient()`
- `supabase.auth.getUser()`
- `404` for missing owned records
- `400` for invalid payloads
- user-scoped queries using `user_id`

Use the same shape for location-insight routes.

### `lib/actions/listing-import-actions.ts`

This is the best model for authenticated mutation logic.

Pattern to reuse:

- `'use server'`
- load authenticated user first
- validate inputs before work starts
- wrap external work in `try/catch`
- revalidate affected paths after persistence

Phase 15 should keep that discipline even if the route handlers become the primary API surface.

### `components/listings/import-actions.tsx`

This is the closest UI-action pattern for a compact, authenticated action button.

Pattern to reuse:

- small button group
- loading state per action
- inline success/error feedback
- no modal needed for the MVP

### `app/(app)/imoveis/[id]/page.tsx`

This is the right authenticated host for the phase 15 UI.

Pattern to reuse:

- load the listing with `user_id`
- load the latest linked insight with `listing_id` + `user_id`
- render the action and card in the same page
- keep the existing listing facts, OLX link, image block, and classification badges untouched

### `tests/location-intelligence.test.mjs`

This is the current Node test pattern for the feature.

Pattern to reuse:

- `node:test`
- mocked Supabase-like objects
- mocked provider responses and timeout behavior
- strict assertions on returned shape and fallback behavior

## File Boundary Guidance

- Keep route handlers thin.
- Keep enrichment logic in `lib/location-intelligence/*`.
- Keep UI rendering in `components/listings/*` and the listing detail page.
- Do not add a second enrichment engine.
- Do not introduce ML, background jobs, or bulk sync in this phase.

