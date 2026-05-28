---
phase: 15-enrichment-api-and-insight-ui
plan: 15
type: execute
wave: 1
depends_on:
  - 14
files_modified:
  - lib/location-intelligence/api.ts
  - app/api/location-insights/route.ts
  - app/api/location-insights/[id]/route.ts
  - app/api/listings/[id]/location-insight/route.ts
  - app/api/listings/[id]/enrich-location/route.ts
  - lib/actions/location-insight-actions.ts
  - components/listings/location-insight-action.tsx
  - app/(app)/imoveis/[id]/page.tsx
  - tests/location-intelligence.test.mjs
autonomous: true
requirements:
  - LOC-08
  - LOC-09
  - LOC-10
must_haves:
  truths:
    - "Authenticated users can create, read, and enrich location insights through route-level APIs."
    - "A listing can expose its latest linked location insight through a dedicated endpoint."
    - "The enrich endpoint loads the authenticated user's listing, geocodes if needed, resolves demographic and nearby-business data, saves the result, and returns the saved insight."
    - "The authenticated listing detail page keeps a compact enrich action and saved insight card."
    - "Tests cover geocoding, passthrough, fallback data, nearby-business formatting, and save/fetch flows without live provider keys."
  artifacts:
    - path: "lib/location-intelligence/api.ts"
      provides: "Shared auth-scoped helpers for create/read/read-linked/enrich operations."
      exports: ["createStandaloneLocationInsight", "getLocationInsightById", "getListingLocationInsightByListingId", "enrichListingLocationInsight"]
    - path: "app/api/location-insights/route.ts"
      provides: "POST endpoint for standalone insight creation."
    - path: "app/api/location-insights/[id]/route.ts"
      provides: "GET endpoint for one insight by id."
    - path: "app/api/listings/[id]/location-insight/route.ts"
      provides: "GET endpoint for the latest listing-linked insight."
    - path: "app/api/listings/[id]/enrich-location/route.ts"
      provides: "POST endpoint for authenticated listing enrichment."
    - path: "lib/actions/location-insight-actions.ts"
      provides: "Thin authenticated action wrapper or shared call site for the existing button flow."
    - path: "components/listings/location-insight-action.tsx"
      provides: "Compact enrich/demo action control with pending and inline feedback states."
    - path: "app/(app)/imoveis/[id]/page.tsx"
      provides: "Authenticated listing-detail host that renders the action and saved insight card."
    - path: "tests/location-intelligence.test.mjs"
      provides: "Node tests for route/service contract and fallback behavior."
  key_links:
    - from: "app/api/listings/[id]/enrich-location/route.ts"
      to: "lib/location-intelligence/api.ts"
      via: "shared enrichment helper"
      pattern: "enrichListingLocationInsight"
    - from: "app/api/location-insights/[id]/route.ts"
      to: "lib/location-intelligence/api.ts"
      via: "shared read helper"
      pattern: "getLocationInsightById"
    - from: "app/api/listings/[id]/location-insight/route.ts"
      to: "lib/location-intelligence/api.ts"
      via: "shared read helper"
      pattern: "getListingLocationInsightByListingId"
    - from: "components/listings/location-insight-action.tsx"
      to: "app/api/listings/[id]/enrich-location/route.ts"
      via: "fetch or shared action call"
      pattern: "Enriquecer localização"
    - from: "app/(app)/imoveis/[id]/page.tsx"
      to: "app/api/listings/[id]/location-insight/route.ts"
      via: "server-side read path"
      pattern: "location_insights.*listing_id.*user_id"
---

<objective>
Create the Phase 15 Enrichment API and Insight UI so brokers can trigger location enrichment, fetch saved insights, and see the result on the listing detail page.

Purpose: expose the Phase 14 engine through practical route-level APIs and keep the authenticated UI small and useful.
Output: create/read/read-linked/enrich APIs, a shared location-intelligence request layer, a compact listing action, and tests that prove the flow works with fallback data.
</objective>

<execution_context>
@/Users/beni/.codex/get-shit-done/workflows/execute-plan.md
@/Users/beni/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/STATE.md
@.planning/phases/15-enrichment-api-and-insight-ui/RESEARCH.md
@.planning/phases/15-enrichment-api-and-insight-ui/PATTERNS.md
@app/(app)/imoveis/[id]/page.tsx
@app/(app)/listings/import/page.tsx
@app/(app)/listings/import/runs/[id]/page.tsx
@app/api/investors/route.ts
@app/api/investors/[id]/route.ts
@app/api/investors/[id]/matches/route.ts
@lib/actions/listing-import-actions.ts
@lib/actions/location-insight-actions.ts
@lib/location-intelligence/insights.ts
@lib/location-intelligence/providers.js
@lib/schemas/location-insight.ts
@lib/supabase/server.ts
@types/supabase.ts

Implementation anchors:
- Use `app/api/investors/route.ts` and `app/api/investors/[id]/route.ts` as the route-handler style reference: `NextResponse.json`, auth check, user-scoped select, and compact error handling.
- Use `lib/actions/listing-import-actions.ts` as the auth + revalidate pattern if the existing server action wrapper remains part of the flow.
- Use `lib/location-intelligence/insights.ts` and `lib/location-intelligence/providers.js` as the core engine and persistence boundary; do not rebuild the provider logic in the route files.
- Use `app/(app)/imoveis/[id]/page.tsx` as the only listing-detail host. Keep the current light card surface and Portuguese labels.
- Use `tests/location-intelligence.test.mjs` as the Node test style reference. Keep tests deterministic and mock provider calls.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add a thin shared API layer and the four route endpoints</name>
  <files>lib/location-intelligence/api.ts, app/api/location-insights/route.ts, app/api/location-insights/[id]/route.ts, app/api/listings/[id]/location-insight/route.ts, app/api/listings/[id]/enrich-location/route.ts</files>
  <behavior>
    - LOC-08: routes support create, read, read-linked, and enrich.
    - All reads and writes stay user-scoped through `auth.uid()` and `user_id`.
    - The enrich route loads the listing, builds the enrichment input, calls the existing Phase 14 engine, persists the result, and returns the saved insight.
    - The standalone create route accepts either address-only or coordinate-based payloads.
  </behavior>
  <action>Create `lib/location-intelligence/api.ts` as the shared request layer. It should own the user-scoped listing lookup, input normalization, and calls into `createLocationInsight`, `getLocationInsight`, `getListingLocationInsight`, `resolveLocationIntelligence`, and `upsertLocationInsightForListing`. Then add the four Next route handlers. Follow the existing investor route pattern: `createSupabaseServerClient()`, `supabase.auth.getUser()`, `404` for missing owned records, `400` for invalid bodies, and compact `NextResponse.json` payloads. Keep the route files thin and do not duplicate provider logic inside them.</action>
  <verify>
    <automated>rg -n "NextResponse.json|createSupabaseServerClient|getUser|location-insights|enrich-location|location-insight" app/api lib/location-intelligence/api.ts</automated>
    <automated>npm run lint</automated>
    <automated>npm run test</automated>
  </verify>
  <done>The Phase 15 API surface exists and can create, read, read-linked, and enrich location insights without breaking the existing Phase 14 engine.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Keep the listing-detail UI wired to the saved insight flow</name>
  <files>lib/actions/location-insight-actions.ts, components/listings/location-insight-action.tsx, components/listings/location-insight-card.tsx, app/(app)/imoveis/[id]/page.tsx</files>
  <behavior>
    - LOC-09: a broker can trigger enrichment from the listing page and immediately inspect the saved result.
    - The UI stays compact: one primary enrich button, one optional demo button if still useful, and one insight card.
    - The page keeps showing listing title, price, images, badges, source link, and description exactly as before.
  </behavior>
  <action>Keep the current detail-page host and make only the minimum changes needed so it reads the latest saved insight and refreshes cleanly after enrichment. If the existing server action wrapper remains the simplest path, keep it; if the route layer is the primary path, wire the button to that route and preserve the same optimistic/pending feedback. Do not add new layout sections, maps, filters, or a second UI surface.</action>
  <verify>
    <automated>rg -n "Enriquecer localização|location_insights|LocationInsightCard|router.refresh|seedDemoLocationInsightsAction|enrichListingLocationAction" components/listings app/(app)/imoveis/[id]/page.tsx lib/actions/location-insight-actions.ts</automated>
    <automated>npm run lint</automated>
  </verify>
  <done>The authenticated listing page can trigger enrichment and show the persisted insight summary without disturbing the rest of the listing view.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Extend tests for route/service contract and fallback flows</name>
  <files>tests/location-intelligence.test.mjs</files>
  <behavior>
    - LOC-10: tests cover geocoding, lat/lng passthrough, fallback data, nearby-business formatting, and save/fetch flows.
    - Tests must not depend on live provider keys.
    - The assertions should prove route/service outputs stay stable and user-scoped.
  </behavior>
  <action>Extend the existing Node test file or add one small companion file if needed. Cover coordinate passthrough, address geocoding fallback, provider timeout fallback, demographic fallback, nearby-business formatting, consumer profile generation, confidence penalties, save/fetch of standalone and listing-linked insights, and the route-level contract for at least one create/read/enrich path. Keep mocks small and explicit.</action>
  <verify>
    <automated>node --test tests/location-intelligence.test.mjs</automated>
    <automated>npm run test</automated>
    <automated>npm run lint</automated>
    <automated>npm run build</automated>
  </verify>
  <done>The Phase 15 test suite proves the enrichment flow and fallback behavior without live external services.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser -> route handler | User-controlled listing IDs and request bodies enter location-insight APIs. |
| route handler -> Supabase | Authenticated writes create or read `location_insights` rows scoped by `user_id`. |
| route handler -> Phase 14 engine | Request inputs are normalized before being passed to the enrichment engine. |
| provider response -> database/UI | Fallback or provider payloads are converted into stable insight fields before persistence or display. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-15-01 | Spoofing | `app/api/location-insights/*` | mitigate | Use `supabase.auth.getUser()` in every route and never trust client-supplied `user_id`. |
| T-15-02 | Tampering | enrich/read routes | mitigate | Load listings and insights with both `id` and `user_id`; reject cross-user access. |
| T-15-03 | Information Disclosure | route responses | mitigate | Return only the normalized insight fields needed by the UI, not raw provider payloads unless already stored as internal evidence. |
| T-15-04 | Denial of Service | enrich route | mitigate | Keep requests single-listing/on-demand and rely on the existing fallback adapters and timeouts from Phase 14. |
| T-15-05 | Elevation of Privilege | shared API layer | mitigate | Keep the API layer server-only and do not introduce service-role credentials. |
| T-15-06 | Legal/Compliance | provider access | mitigate | Use only lawful geocoding/places APIs or fallback adapters; do not add protected/private scraping. |
</threat_model>

<verification>
Run these checks after all tasks:

```bash
npm run test
npm run lint
npm run build
node --test tests/location-intelligence.test.mjs
rg -n "location-insights|enrich-location|getListingLocationInsight|getLocationInsight|resolveLocationIntelligence" app/api lib/location-intelligence tests/location-intelligence.test.mjs
rg -n "Enriquecer localização|LocationInsightCard|location_insights|router.refresh" components/listings app/(app)/imoveis/[id]/page.tsx lib/actions/location-insight-actions.ts
```

Manual smoke check when a dev server is available:
1. Open `/imoveis/[existing-listing-id]` while authenticated.
2. Confirm the listing detail page still renders title, price, OLX link, images, badges, and description.
3. Click `Enriquecer localização`.
4. Confirm the page shows a saved insight card or a clear inline error.
5. Open the new API routes directly and confirm they return user-scoped JSON.
6. Confirm the saved card shows income, density, consumer profile, nearby businesses, and confidence.
</verification>
