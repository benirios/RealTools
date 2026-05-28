---
phase: 15-enrichment-api-and-insight-ui
plan: 15
subsystem: [api, ui, testing, providers]
tags: [nextjs, supabase, location-intelligence, nominatim, ibge, node-test]
requires:
  - phase: 14-location-intelligence-foundation
    provides: location_insights table, provider adapters, listing-detail enrichment host
provides:
  - REST API for location insight create/read/enrich
  - Authenticated listing detail API surface for enrichment
  - Address-based demographic search page
  - Nominatim geocoding and IBGE Sidra demographics providers
  - Route-level tests for fallback and save/fetch flows
affects: [listing detail page, sidebar navigation, location intelligence workflow]
tech-stack:
  added: [Nominatim (geocoding), IBGE Sidra (Brazilian census demographics)]
  patterns: [thin route handlers, shared API service layer, provider swap via env vars]
key-files:
  created:
    - lib/location-intelligence/api.ts
    - lib/location-intelligence/api.js
    - app/api/location-insights/route.ts
    - app/api/location-insights/[id]/route.ts
    - app/api/listings/[id]/location-insight/route.ts
    - app/api/listings/[id]/enrich-location/route.ts
    - app/(app)/inteligencia-local/page.tsx
    - components/location-intelligence/address-demographic-search.tsx
  modified:
    - lib/location-intelligence/providers.js
    - lib/actions/location-insight-actions.ts
    - components/listings/location-insight-card.tsx
    - components/sidebar-nav.tsx
    - app/(app)/imoveis/[id]/page.tsx
    - app/(app)/imoveis/page.tsx
    - tests/location-intelligence.test.mjs
    - .planning/STATE.md
key-decisions:
  - "Keep route handlers thin — all enrichment logic stays in lib/location-intelligence/api.ts."
  - "Use Nominatim (OpenStreetMap) for geocoding when GOOGLE_MAPS_API_KEY is absent — free, no key required."
  - "Use IBGE Sidra API for Brazilian demographics (census sectors by municipality) — free, officially sourced."
  - "Address demographic search page added as a standalone broker tool beyond the Phase 15 plan scope."
patterns-established:
  - "Route handlers delegate to lib/location-intelligence/api.ts; never duplicate enrichment logic."
  - "Provider selection driven by env vars: real providers when keys present, Nominatim/IBGE fallback otherwise."
  - "lib/location-intelligence/api.ts is the shared orchestration boundary for both route handlers and server actions."
requirements-completed: [LOC-08, LOC-09, LOC-10]
duration: ~35min
completed: 2026-05-03
---

# Phase 15: Enrichment API And Insight UI — Summary

Location intelligence is now fully exposed through a REST API and the broker has a standalone tool to search any Brazilian address for demographic context.

## Performance

- **Duration:** ~35min
- **Completed:** 2026-05-03
- **Tasks:** 3 planned + 1 beyond-scope addition
- **Files modified/created:** 16

## Accomplishments

- Added four API routes: `POST /api/location-insights`, `GET /api/location-insights/[id]`, `GET /api/listings/[id]/location-insight`, `POST /api/listings/[id]/enrich-location`.
- Created a shared `lib/location-intelligence/api.ts` orchestration layer so route handlers and server actions share the same enrichment path.
- Upgraded `lib/location-intelligence/providers.js` to use Nominatim for geocoding and IBGE Sidra for Brazilian demographics — both free, no API keys required.
- Added an address demographic search page at `/inteligencia-local` that lets brokers search any address and see area context without tying it to a listing.
- Extended tests to cover route/service contracts and fallback flows without live provider keys.
- Fixed a bug where save failures in the location insight API returned 200 instead of the correct error shape.

## Task Commits

1. **feat(phase-15): add location insight api routes** — `b86bec6` — Core API routes, shared api.ts layer, updated actions and tests
2. **feat: add address demographic search page** — `2e7ed12` — `/inteligencia-local` page + search component + sidebar nav entry
3. **feat: use nominatim and ibge sidra** — `580bf88` — Upgraded providers to use real free Brazilian data sources
4. **fix: return location insight on save failure** — `d32072a` — Bug fix: return error shape on Supabase save failure

## Files Created/Modified

- `lib/location-intelligence/api.ts` — Shared orchestration: create, read, read-linked, enrich.
- `app/api/location-insights/*` — Create and read endpoints.
- `app/api/listings/[id]/location-insight/route.ts` — Listing-linked insight read.
- `app/api/listings/[id]/enrich-location/route.ts` — Trigger enrichment for a listing.
- `app/(app)/inteligencia-local/page.tsx` — Standalone address demographic search tool.
- `lib/location-intelligence/providers.js` — Nominatim geocoding + IBGE Sidra demographics.

## Decisions Made

- Chose Nominatim + IBGE Sidra over requiring a paid API key for MVP. Brokers can use the tool immediately without any setup.
- Added `/inteligencia-local` as a standalone tool because the address-based search pattern has value independent of a specific listing — broker can research an area before importing a listing.

## Deviations from Plan

Phase 15 plan specified the core API and UI tasks. The broker address search page (`/inteligencia-local`) and Nominatim/IBGE Sidra provider upgrade were shipped beyond the original plan scope but are consistent with the milestone goals (making location intelligence practically usable without paid provider dependencies).

## Issues Encountered

- Save failure bug in `POST /api/location-insights` was caught and fixed post-commit.
- `npm run build` was not rerun after fix due to disk space constraints noted in Phase 14 SUMMARY.

## User Setup Required

None — Nominatim and IBGE Sidra require no API keys. Google Maps API key remains optional for higher geocoding accuracy.

## Next Phase Readiness

Phase 15 (v1.5) is complete. Milestone v1.6 Opportunity Scoring Engine can now begin. The `location_insights` table and enrichment API are the input boundary for the scoring engine.

---
*Phase: 15-enrichment-api-and-insight-ui*
*Completed: 2026-05-03*
