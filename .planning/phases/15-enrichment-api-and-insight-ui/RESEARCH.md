# Phase 15: Enrichment API And Insight UI - Research

**Researched:** 2026-05-03
**Scope:** LOC-08 through LOC-10 only
**Confidence:** HIGH for local route/UI/test patterns, MEDIUM for provider/API edge cases because they depend on runtime auth and optional provider keys

## Summary

Phase 14 already provides the core location-intelligence engine, persistence helpers, demo seed helper, and listing-detail UI host. Phase 15 should stay thin: add route-level APIs, keep the UI small, and reuse the existing enrichment/persistence modules instead of rebuilding them.

Best implementation shape:

1. Add a small shared API/service module under `lib/location-intelligence/` so route handlers and any server actions can reuse the same auth-scoped lookup and enrichment logic.
2. Add four Next route handlers for create/read/read-linked/enrich flows.
3. Keep the listing detail page as the authenticated host and preserve the existing button/card layout.
4. Extend the current location-intelligence tests with API-contract and save/fetch coverage.

## Route Shape

Use the same route-handler style already used by the investor endpoints:

- `app/api/location-insights/route.ts`
- `app/api/location-insights/[id]/route.ts`
- `app/api/listings/[id]/location-insight/route.ts`
- `app/api/listings/[id]/enrich-location/route.ts`

Recommended behavior:

- `POST /api/location-insights` creates a standalone insight from an address or coordinate payload.
- `GET /api/location-insights/:id` returns one user-owned insight.
- `GET /api/listings/:id/location-insight` returns the latest linked insight for the listing.
- `POST /api/listings/:id/enrich-location` loads the listing, builds the enrichment input, resolves location intelligence, saves the result, and returns the saved insight.

Keep the route handlers thin. They should:

- use `createSupabaseServerClient()`
- check `supabase.auth.getUser()`
- scope every query by `user_id`
- reject invalid/missing listing ownership with `404`
- return compact JSON objects such as `{ insight }` or `{ error }`

## Shared Service Boundary

Add one small module, likely `lib/location-intelligence/api.ts`, to avoid duplicating auth and lookup code across route handlers and server actions.

This module should own:

- loading a listing for a user
- normalizing request payloads into the phase 14 input shape
- calling `resolveLocationIntelligence`
- saving with `createLocationInsight` / `upsertLocationInsightForListing`
- reading a saved insight by id or listing id

Do not add a new table, queue, cache, or service-role shortcut. Phase 15 only needs request/response plumbing around the phase 14 engine.

## UI Approach

The current listing detail page already has the right host:

- `app/(app)/imoveis/[id]/page.tsx`
- `components/listings/location-insight-action.tsx`
- `components/listings/location-insight-card.tsx`

Keep that host. Only make small changes if needed so the UI consumes the saved insight returned by the new route/service layer and keeps refreshing cleanly after enrichment.

The UI should stay practical:

- one primary `Enriquecer localização` action
- one saved insight card
- no extra dashboard, no map overlay, no compare mode yet

## Testing Approach

Extend the existing Node test file or add one small companion file focused on route/service behavior.

Coverage should prove:

- address geocoding flow
- lat/lng passthrough flow
- fallback data when a provider key is missing
- nearby-business formatting
- save/fetch of standalone and listing-linked insights

The tests should not depend on live provider keys. Use mocked Supabase and mocked fetch where needed.

## Risks

- The main risk is duplicating phase 14 logic in route handlers and server actions. Avoid that by centralizing lookup and enrichment in one helper module.
- Another risk is overbuilding the UI. Do not add filters, maps, or comparison screens in this phase.
- Provider behavior is still optional at runtime. Routes must work with fallback data when keys are absent.

## RESEARCH COMPLETE
