---
phase: 14-location-intelligence-foundation
plan: 14
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/011_location_insights.sql
  - types/supabase.ts
  - lib/schemas/location-insight.ts
  - lib/location-intelligence/normalization.js
  - lib/location-intelligence/normalization.d.ts
  - lib/location-intelligence/providers.js
  - lib/location-intelligence/providers.d.ts
  - lib/location-intelligence/insights.ts
  - lib/location-intelligence/demo-seeds.ts
  - lib/actions/location-insight-actions.ts
  - components/listings/location-insight-action.tsx
  - components/listings/location-insight-card.tsx
  - app/(app)/imoveis/[id]/page.tsx
  - tests/location-intelligence.test.mjs
autonomous: true
requirements:
  - LOC-01
  - LOC-02
  - LOC-03
  - LOC-04
  - LOC-05
  - LOC-06
  - LOC-07
must_haves:
  truths:
    - "Authenticated users can create a location insight from an address, neighborhood, or coordinates."
    - "Address-only inputs resolve coordinates through a provider chain before persistence."
    - "Location insights can be stored either standalone or linked to a listing."
    - "Demographic, nearby-business, consumer-profile, source-note, and confidence data are persisted without depending on one paid provider."
    - "A listing detail page exposes a practical authenticated host for enrichment and insight display."
  artifacts:
    - path: "supabase/migrations/011_location_insights.sql"
      provides: "User-owned location_insights table with RLS, listing linkage, required LOC-04 columns, JSONB evidence fields, indexes, and updated_at trigger."
    - path: "lib/location-intelligence/providers.js"
      provides: "Geocoding, demographic, nearby-business, fallback, and consumer-profile provider orchestration."
      exports: ["resolveLocationIntelligence", "geocodeLocation", "getDemographicEstimate", "getNearbyBusinesses", "deriveConsumerProfile"]
    - path: "lib/location-intelligence/insights.ts"
      provides: "Supabase persistence helpers for standalone and listing-linked location insights."
      exports: ["toLocationInsightInsert", "createLocationInsight", "getListingLocationInsight", "upsertLocationInsightForListing"]
    - path: "lib/location-intelligence/demo-seeds.ts"
      provides: "Seed helper that creates one standalone demo insight and one listing-linked demo insight for a user."
      exports: ["createDemoLocationInsightsForListing"]
    - path: "app/(app)/imoveis/[id]/page.tsx"
      provides: "Authenticated listing detail host for enrichment action and saved insight card."
  key_links:
    - from: "app/(app)/imoveis/[id]/page.tsx"
      to: "location_insights"
      via: "Supabase select filtered by listing_id and user_id"
      pattern: "location_insights.*listing_id.*user_id"
    - from: "components/listings/location-insight-action.tsx"
      to: "lib/actions/location-insight-actions.ts"
      via: "server action form submission"
      pattern: "enrichListingLocationAction"
    - from: "lib/actions/location-insight-actions.ts"
      to: "lib/location-intelligence/providers.js"
      via: "resolveLocationIntelligence before save"
      pattern: "resolveLocationIntelligence"
    - from: "lib/location-intelligence/insights.ts"
      to: "types/supabase.ts"
      via: "Database['public']['Tables']['location_insights']"
      pattern: "location_insights"
---

<objective>
Create the Phase 14 Location Intelligence Foundation so RealTools can store and resolve location insights through replaceable provider adapters.

Purpose: Brokers need area context for listings or standalone addresses, but the system must stay Brazil-ready, state-agnostic, lawful, and independent from one paid provider.
Output: A user-owned `location_insights` table, typed validation and persistence helpers, provider/fallback enrichment modules, tests, and a small authenticated listing-detail UI host for triggering and displaying enrichment.
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
@.planning/phases/14-location-intelligence-foundation/RESEARCH.md
@.planning/phases/14-location-intelligence-foundation/PATTERNS.md
@app/(app)/imoveis/[id]/page.tsx
@app/(app)/imoveis/page.tsx
@app/(app)/listings/import/page.tsx
@app/(app)/listings/import/runs/[id]/page.tsx
@lib/listings/enrichment.ts
@lib/listings/ingestion.ts
@lib/listings/olx.ts
@lib/actions/listing-import-actions.ts
@lib/schemas/listing.ts
@lib/schemas/investor.ts
@lib/supabase/server.ts
@types/supabase.ts

Implementation anchors:
- Use `supabase/migrations/008_listing_data_foundation.sql` as the table/RLS/index pattern: user-owned rows, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`.
- Use `lib/schemas/listing.ts` and `lib/schemas/investor.ts` as the Zod style: camelCase inputs, `z.coerce.number()` for form numeric values, bounds checks, inferred exported types.
- Use `lib/listings/enrichment.ts` as the deterministic normalization and rule-based enrichment style.
- Use `lib/listings/ingestion.ts` as the persistence style: parse first, map camelCase to snake_case, accept `supabase` and `userId`, and keep `supabase.from()` casts at mutation/query sites when needed.
- Use `lib/actions/listing-import-actions.ts` as the server action style: `'use server'`, `getUser()`, redirect unauthenticated users, typed state objects, bounded inputs, `try/catch`, and `revalidatePath`.
- Use `app/(app)/imoveis/[id]/page.tsx` as the UI host. Insert the location insight card after the existing listing facts block or as a sibling panel beneath the main listing card. Keep Portuguese UI strings and the existing light dashboard card style.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add location insight storage, generated-style types, and validation schemas</name>
  <files>supabase/migrations/011_location_insights.sql, types/supabase.ts, lib/schemas/location-insight.ts</files>
  <behavior>
    - LOC-03/LOC-04: `location_insights` stores user-owned standalone records and optional listing-linked records.
    - LOC-04: rows include `id`, `listing_id`, `address`, `neighborhood`, `city`, `state`, `latitude`, `longitude`, `avg_income`, `population_density`, `consumer_profile`, `nearby_businesses`, `data_sources`, `confidence_score`, `created_at`, and `updated_at`.
    - Security: RLS prevents cross-user reads/writes and every write checks `auth.uid() = user_id`.
    - Validation: schemas reject invalid latitude outside -90..90, longitude outside -180..180, and confidence outside 0..100.
  </behavior>
  <action>Create `supabase/migrations/011_location_insights.sql` with a `location_insights` table using `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`, `listing_id UUID REFERENCES listings(id) ON DELETE SET NULL`, location text fields, `country TEXT NOT NULL DEFAULT 'BR'`, `latitude DOUBLE PRECISION`, `longitude DOUBLE PRECISION`, `avg_income NUMERIC`, `population_density NUMERIC`, `consumer_profile TEXT`, `nearby_businesses JSONB NOT NULL DEFAULT '[]'::jsonb`, `data_sources JSONB NOT NULL DEFAULT '[]'::jsonb`, `confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100)`, `raw_geocode JSONB NOT NULL DEFAULT '{}'::jsonb`, `raw_demographics JSONB NOT NULL DEFAULT '{}'::jsonb`, `raw_places JSONB NOT NULL DEFAULT '{}'::jsonb`, and timestamps. Add latitude/longitude check constraints, indexes on `user_id`, `listing_id`, `(state, city)`, and `(latitude, longitude)`, enable RLS, add `Users can manage own location insights` policy, and wire an `updated_at` trigger using the existing project trigger function if present or a local `update_location_insights_updated_at()` function if not. Update `types/supabase.ts` with a generated-style `location_insights` table entry and relationship to `listings`. Create `lib/schemas/location-insight.ts` with `LocationInsightInputSchema`, `LocationInsightPersistedSchema`, `NearbyBusinessSchema`, `LocationDataSourceSchema`, `LocationInsightActionState`, and inferred types. Do not add PostGIS, Pernambuco-only checks, paid-provider assumptions, or changes to existing tables beyond the optional generated relationship metadata.</action>
  <verify>
    <automated>npm run lint</automated>
    <automated>npm run test</automated>
    <automated>rg -n "CREATE TABLE location_insights|ENABLE ROW LEVEL SECURITY|Users can manage own location insights|confidence_score.*0.*100" supabase/migrations/011_location_insights.sql</automated>
    <automated>rg -n "location_insights|LocationInsightInputSchema|latitude.*-90|longitude.*-180" types/supabase.ts lib/schemas/location-insight.ts</automated>
  </verify>
  <done>`location_insights` schema, RLS, indexes, generated-style types, and Zod schemas exist and satisfy LOC-03/LOC-04 without weakening existing listing/import/deals/buyers/OM/tracking code.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement provider-based enrichment with deterministic fallback behavior</name>
  <files>lib/location-intelligence/normalization.js, lib/location-intelligence/normalization.d.ts, lib/location-intelligence/providers.js, lib/location-intelligence/providers.d.ts, lib/location-intelligence/insights.ts, lib/location-intelligence/demo-seeds.ts, tests/location-intelligence.test.mjs</files>
  <behavior>
    - LOC-01: address, neighborhood, or coordinate input produces an insight-ready result.
    - LOC-02: missing coordinates trigger geocoding; provided coordinates use passthrough without provider calls.
    - LOC-05: demographic enrichment uses adapters and falls back to mock/default data when real provider keys are absent or calls fail.
    - LOC-06: nearby businesses use a places/search adapter when configured and fallback businesses when missing.
    - LOC-07: consumer profile, data source notes, provider names, and confidence reflect the actual mix of real/fallback data.
    - Provider safety: outbound geocoding/places requests abort on timeout and continue with fallback data plus a source warning.
    - Roadmap demo criterion: a seed helper creates exactly one standalone demo insight and one listing-linked insight for the authenticated user/listing path.
  </behavior>
  <action>Create a CommonJS testable provider core to match the existing `lib/investors/matching.js` + `tests/*.test.mjs` pattern. In `normalization.js`, export accent-insensitive `normalizeLocationText`, `compactLocationText`, `buildBrazilLocationQuery`, and `clampConfidence`. In `providers.js`, export `fetchJsonWithTimeout(url, init, timeoutMs)`, `geocodeLocation(input, options)`, `getDemographicEstimate(location, options)`, `getNearbyBusinesses(location, options)`, `deriveConsumerProfile(result)`, and `resolveLocationIntelligence(input, options)`. `fetchJsonWithTimeout` must use `AbortController`, default external request timeout to 4000ms, accept an injectable `fetch` for tests, and convert timeout/abort/provider errors into segment-level fallback warnings instead of throwing out of the full enrichment flow. The provider chain must be replaceable: if `input.latitude` and `input.longitude` are valid, return geocode provider `passthrough`; else try Google geocoding only when `GOOGLE_MAPS_API_KEY` exists; else try Nominatim only when `NOMINATIM_USER_AGENT` exists; else use clearly labeled mock geocoding for recognized demo locations and null coordinates with low confidence for unrecognized locations. Places should try Google Places only when `GOOGLE_MAPS_API_KEY` exists and valid coordinates exist; otherwise return fallback businesses with `source: 'mock'`. Demographics should use a `MockDemographicsProvider` default and leave an interface slot for future real/IBGE providers. Catch provider failures segment-by-segment and continue with fallback data plus source warnings. Do not scrape protected/private data or hardcode Pernambuco-only rules; demo recognition may include Recife/PE examples but must also work generically from city/state text. In `insights.ts`, export `toLocationInsightInsert`, `createLocationInsight`, `getLocationInsight`, `getListingLocationInsight`, and `upsertLocationInsightForListing`, always accepting `supabase` and `userId`, validating with the schemas, mapping provider output to DB columns, and adding `.eq('user_id', userId)` on reads/updates. Create `lib/location-intelligence/demo-seeds.ts` exporting `createDemoLocationInsightsForListing(supabase, userId, listing)`; it must build two enriched results through `resolveLocationIntelligence`, save one standalone insight with `listing_id: null`, save one linked insight using the provided listing `id`, and return both saved rows or structured errors. The standalone demo input should derive city/state/neighborhood from the listing when present and only fall back to generic Brazil demo values when listing fields are missing; do not make the helper Pernambuco-only. Add `tests/location-intelligence.test.mjs` covering coordinate passthrough, address geocoding fallback, provider timeout fallback, demographic fallback, nearby-business fallback formatting, consumer profile generation, confidence penalties, insert mapping, and demo seed creation that produces one `listing_id: null` insert plus one `listing_id` insert.</action>
  <verify>
    <automated>npm run test</automated>
    <automated>npm run lint</automated>
    <automated>node --test tests/location-intelligence.test.mjs</automated>
    <automated>rg -n "passthrough|MockDemographicsProvider|source: 'mock'|GOOGLE_MAPS_API_KEY|NOMINATIM_USER_AGENT|AbortController|fetchJsonWithTimeout|timeout|deriveConsumerProfile|resolveLocationIntelligence|createDemoLocationInsightsForListing|listing_id: null" lib/location-intelligence tests/location-intelligence.test.mjs</automated>
  </verify>
  <done>Provider adapters, timeout fallback handling, persistence helpers, and demo seed helper satisfy LOC-01/LOC-02/LOC-05/LOC-06/LOC-07 plus the Phase 14 roadmap demo-data criterion with deterministic fallback behavior, lawful provider access boundaries, source notes, and automated tests.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add authenticated listing-detail enrichment host and saved insight card</name>
  <files>lib/actions/location-insight-actions.ts, components/listings/location-insight-action.tsx, components/listings/location-insight-card.tsx, app/(app)/imoveis/[id]/page.tsx</files>
  <behavior>
    - LOC-01/LOC-03: an authenticated listing detail page can trigger creation/update of a listing-linked location insight.
    - Roadmap demo criterion: an authenticated listing detail path can seed one standalone demo insight and one listing-linked demo insight through the mandatory helper from Task 2.
    - LOC-04/LOC-07: saved insight card displays income, density, profile, nearby businesses, source notes, and confidence when present.
    - Existing listing detail behavior remains intact: existing listing data, image display, OLX link, classification badges, and description sections still render.
  </behavior>
  <action>Create `lib/actions/location-insight-actions.ts` with `'use server'`, `enrichListingLocationAction(listingId: string): Promise<LocationInsightActionState>`, and `seedDemoLocationInsightsAction(listingId: string): Promise<LocationInsightActionState>`. Use `createSupabaseServerClient()`, `supabase.auth.getUser()`, redirect unauthenticated users to `/auth/login`, load the listing by `id` and `user_id`, build the enrichment input from `address_text`, `location_text`, `neighborhood`, `city`, `state`, `lat`, and `lng`, call `resolveLocationIntelligence`, save with `upsertLocationInsightForListing`, then `revalidatePath('/imoveis')` and `revalidatePath('/imoveis/${listingId}')`. `seedDemoLocationInsightsAction` must load the same user-scoped listing, call `createDemoLocationInsightsForListing`, and report that both a standalone and listing-linked insight were created; if either insert fails, return a typed error rather than claiming partial success. Return typed Portuguese success/error messages and never expose raw provider payloads in UI messages. Create a small client component `LocationInsightAction` using the server action pattern from `components/listings/import-actions.tsx`; it should render an icon button or compact button labeled `Enriquecer localização`, a secondary compact button labeled `Criar demo`, a pending state for each action, and inline error/success messages. Create `LocationInsightCard` as a presentational server-safe component accepting a typed insight row and rendering Portuguese labels for `Renda média`, `Densidade`, `Perfil consumidor`, `Negócios próximos`, `Fontes`, and confidence. Update `app/(app)/imoveis/[id]/page.tsx` to fetch the latest `location_insights` row for the listing with `.eq('listing_id', id).eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1).maybeSingle()`, render the action, and render the card if present. Keep all existing listing queries user-scoped and do not modify import/deals/buyers/OM/tracking workflows.</action>
  <verify>
    <automated>npm run lint</automated>
    <automated>npm run test</automated>
    <automated>rg -n "enrichListingLocationAction|seedDemoLocationInsightsAction|createDemoLocationInsightsForListing|LocationInsightAction|LocationInsightCard|location_insights|Enriquecer localização|Criar demo" "lib/actions/location-insight-actions.ts" "lib/location-intelligence/demo-seeds.ts" "components/listings/location-insight-action.tsx" "components/listings/location-insight-card.tsx" "app/(app)/imoveis/[id]/page.tsx"</automated>
    <automated>npm run build</automated>
  </verify>
  <done>Listing detail includes a practical authenticated location-enrichment host and saved insight display while preserving existing listing/import/deals/buyers/OM/tracking behavior.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser -> server action | User-controlled listing IDs/form data enter server-side enrichment actions. |
| server action -> Supabase | Authenticated writes create persisted `location_insights` rows scoped by `user_id`. |
| server -> external providers | Address/neighborhood/city/coordinate data may be sent to lawful geocoding or places providers when configured. |
| provider response -> database/UI | Untrusted provider or fallback payloads are transformed into persisted JSONB and display text. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-14-01 | Spoofing | `lib/actions/location-insight-actions.ts` | mitigate | Use `supabase.auth.getUser()` and redirect unauthenticated users; never trust client-supplied `user_id`. |
| T-14-02 | Tampering | `enrichListingLocationAction(listingId)` | mitigate | Load listing by both `id` and authenticated `user.id`; ignore any client-supplied listing data except the listing ID. |
| T-14-03 | Repudiation | `location_insights` writes | accept | Phase 14 stores timestamps and `user_id`; full audit/activity logging is not a Phase 14 requirement and existing OM activity workflows must remain untouched. |
| T-14-04 | Information Disclosure | provider calls in `providers.js` | mitigate | Send only location fields required for geocoding/places lookup; do not send broker identity, deal data, buyers, OM data, notes, or files to providers. |
| T-14-05 | Information Disclosure | `location_insights` table | mitigate | Enable RLS and add `FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)` policy; queries also filter by `user_id`. |
| T-14-06 | Denial of Service | provider calls | mitigate | Keep Phase 14 calls single-listing/on-demand, wrap outbound geocoding/places fetches in `AbortController` timeouts, catch timeout/provider failures, use fallback adapters, and do not add bulk enrichment loops. |
| T-14-07 | Elevation of Privilege | Supabase access | mitigate | Use normal server client with user auth for user-owned writes; do not introduce service-role access for location insights. |
| T-14-08 | Tampering | provider payloads rendered in UI | mitigate | Convert provider output into stable internal fields, store raw payloads separately, and render only sanitized React text values from known fields. |
| T-14-09 | Legal/Compliance | places/geocoding providers | mitigate | Use lawful API/provider access only; do not add protected/private scraping or anti-bot behavior for location intelligence. |
</threat_model>

<verification>
Run these checks after all tasks:

```bash
npm run test
npm run lint
npm run build
rg -n "CREATE TABLE location_insights|ENABLE ROW LEVEL SECURITY|Users can manage own location insights" supabase/migrations/011_location_insights.sql
rg -n "resolveLocationIntelligence|MockDemographicsProvider|getNearbyBusinesses|deriveConsumerProfile|AbortController|fetchJsonWithTimeout|createDemoLocationInsightsForListing|listing_id: null" lib/location-intelligence tests/location-intelligence.test.mjs
rg -n "enrichListingLocationAction|seedDemoLocationInsightsAction|LocationInsightCard|Enriquecer localização|Criar demo" lib/actions components/listings "app/(app)/imoveis/[id]/page.tsx"
```

Manual smoke check when a dev server is available:
1. Open `/imoveis/[existing-listing-id]` while authenticated.
2. Confirm the listing page still renders title, price, OLX link, images, description, classification badges, and listing facts.
3. Click `Enriquecer localização`.
4. Confirm the page returns with either a saved insight card or a clear inline error.
5. Click `Criar demo`.
6. Confirm the action reports that one standalone and one listing-linked insight were created.
7. Confirm the saved card shows confidence, consumer profile, nearby businesses, and source notes.
</verification>

<success_criteria>
- LOC-01: A user can create a location insight from address/neighborhood text or coordinates through the provider orchestration and listing-detail action.
- LOC-02: Address inputs without coordinates attempt geocoding and continue with labeled fallback behavior when no provider key is configured.
- LOC-03: Insights persist as standalone-capable rows and listing-linked rows in `location_insights`.
- Phase 14 roadmap demo criterion: `createDemoLocationInsightsForListing` and `seedDemoLocationInsightsAction` create one standalone insight and one listing-linked insight for an authenticated user/listing, with automated tests proving both paths.
- LOC-04: The table, types, schemas, persistence mapping, and UI card cover every required location insight field.
- LOC-05: Demographic enrichment is adapter-based and defaults to mock/fallback data without one paid provider dependency.
- LOC-06: Nearby businesses are adapter-based and fall back to labeled mock data when provider keys are missing.
- LOC-07: Consumer profile, data source notes, segment provider names, and confidence score are generated from enrichment results.
- Existing listings, import pages, deals, buyers, OM pages, and tracking routes are not modified except for the explicit listing-detail location insight integration.
</success_criteria>

<output>
After completion, create `.planning/phases/14-location-intelligence-foundation/14-SUMMARY.md`.
</output>
