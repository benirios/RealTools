# Phase 14: Location Intelligence Foundation - Research

**Researched:** 2026-05-03 [VERIFIED: local date]
**Scope:** LOC-01 through LOC-07 only. [VERIFIED: .planning/REQUIREMENTS.md]
**Confidence:** HIGH for local architecture/storage choices, MEDIUM for external provider choices because provider pricing/quotas can change. [VERIFIED: local codebase] [ASSUMED]

## Summary

Use one user-scoped `location_insights` table in Supabase Postgres, plus small server-only TypeScript adapters for geocoding, demographics, and nearby businesses. [VERIFIED: .planning/PROJECT.md] [VERIFIED: lib/listings/ingestion.ts] Keep MVP data mostly scalar for display/filtering, and store provider evidence in JSONB fields so Phase 15 can read/write without schema churn. [VERIFIED: supabase/migrations/008_listing_data_foundation.sql]

Primary recommendation: build the table and enrichment orchestration first with deterministic fallback adapters, then let real providers plug in behind the same interface when keys exist. [VERIFIED: .planning/STATE.md] [VERIFIED: .planning/REQUIREMENTS.md]

## location_insights Table Shape

Create `supabase/migrations/011_location_insights.sql` with a user-scoped table matching existing `listings` and `investors` patterns. [VERIFIED: supabase/migrations/008_listing_data_foundation.sql] [VERIFIED: supabase/migrations/010_investor_matching.sql]

Recommended columns:

```sql
CREATE TABLE location_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'BR',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  avg_income NUMERIC,
  population_density NUMERIC,
  consumer_profile TEXT,
  nearby_businesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  raw_geocode JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_demographics JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_places JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Add RLS and policies exactly like existing user-owned tables: `USING (auth.uid() = user_id)` and `WITH CHECK (auth.uid() = user_id)`. [VERIFIED: supabase/migrations/008_listing_data_foundation.sql] [CITED: https://supabase.com/docs/guides/auth/row-level-security]

Add indexes on `user_id`, `listing_id`, `(state, city)`, and optionally `(latitude, longitude)` for MVP lookup. [VERIFIED: supabase/migrations/008_listing_data_foundation.sql] Do not add PostGIS in Phase 14 unless map radius queries become a locked requirement; current requirements only need storage and enrichment, not geospatial querying. [VERIFIED: .planning/REQUIREMENTS.md]

## Address Geocoding Strategy

Define `lib/location/geocoding.ts` with:

```ts
export type GeocodeInput = {
  address?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type GeocodeResult = {
  latitude: number | null
  longitude: number | null
  normalizedAddress?: string | null
  provider: 'google' | 'nominatim' | 'mock' | 'passthrough'
  confidence: number
  raw?: unknown
}
```

If `latitude` and `longitude` are provided, return a `passthrough` result and skip provider calls. [VERIFIED: LOC-01/LOC-02 in .planning/REQUIREMENTS.md]

If coordinates are missing, use a provider chain: `GOOGLE_MAPS_API_KEY` geocoder first, else `NOMINATIM_USER_AGENT` geocoder, else mock geocoder. [ASSUMED] Google Geocoding supports address-to-coordinate geocoding. [CITED: https://developers.google.com/maps/documentation/geocoding/overview] Nominatim has strict usage limits and requires an identifying user agent, so it is acceptable for low-volume dev/demo use but not bulk enrichment. [CITED: https://operations.osmfoundation.org/policies/nominatim/]

Normalize Brazilian text before geocoding by joining available parts as `address, neighborhood, city, state, Brasil`. [VERIFIED: lib/listings/enrichment.ts uses existing text normalization] Keep "perfect address normalization" out of scope. [VERIFIED: .planning/PROJECT.md]

## Demographic Provider Adapter Strategy

Define `lib/location/demographics.ts` with one interface:

```ts
export type DemographicResult = {
  avgIncome: number | null
  populationDensity: number | null
  sourceNotes: string[]
  provider: 'external' | 'ibge_future' | 'mock'
  confidence: number
  raw?: unknown
}
```

For Phase 14, implement `MockDemographicsProvider` as the guaranteed default and optionally an `ExternalDemographicsProvider` only if a provider key/env var already exists. [VERIFIED: .planning/REQUIREMENTS.md] This matches the milestone decision to avoid dependence on one paid provider. [VERIFIED: .planning/STATE.md]

Keep IBGE as a future adapter, not the Phase 14 default, because LOC-05 only requires provider adapters plus fallback data, not full census integration. [VERIFIED: .planning/REQUIREMENTS.md] IBGE can be added later through the same adapter shape. [VERIFIED: Future LOC-13 in .planning/REQUIREMENTS.md]

## Nearby-Business Adapter Strategy

Define `lib/location/nearby-businesses.ts` with:

```ts
export type NearbyBusiness = {
  name: string
  category: string
  distanceMeters?: number | null
  address?: string | null
  source: string
}
```

Use provider chain: Google Places Nearby Search when `GOOGLE_MAPS_API_KEY` exists, else fallback nearby-business generator. [ASSUMED] Google Places supports nearby search around a location. [CITED: https://developers.google.com/maps/documentation/places/web-service/nearby-search]

Fallback data should be boring and clearly labeled: e.g. supermarkets, pharmacies, schools, banks, gyms, restaurants, and transit/service categories inferred from city/neighborhood only. [ASSUMED] Store fallback rows with `source: 'mock'` and add a `data_sources` note saying business data is default/mock. [VERIFIED: LOC-06/LOC-07 in .planning/REQUIREMENTS.md]

## Consumer Profile Derivation

Derive `consumer_profile` deterministically from enrichment results; do not add AI or ML in Phase 14. [VERIFIED: .planning/REQUIREMENTS.md] [VERIFIED: .planning/PROJECT.md]

Recommended rules:

- High `avg_income` + business mix including banks/gyms/restaurants -> `"Higher-income convenience and services audience"`. [ASSUMED]
- Medium income + dense nearby retail/services -> `"Mixed residential and neighborhood retail audience"`. [ASSUMED]
- Low/missing income + fallback places -> `"Baseline neighborhood audience; provider data unavailable"`. [ASSUMED]
- High population density -> append `"High-density foot-traffic potential"`. [ASSUMED]

Keep the output as a single readable text field for LOC-04, and keep structured evidence in `data_sources`, `raw_demographics`, and `raw_places`. [VERIFIED: LOC-04/LOC-07 in .planning/REQUIREMENTS.md]

## Fallback/Mock Behavior

Provider keys missing must not fail the enrichment flow. [VERIFIED: LOC-05/LOC-06 in .planning/REQUIREMENTS.md]

Required behavior:

- Missing geocoder key: if coordinates are provided, use passthrough; otherwise return mock coordinates only for recognized demo cities/neighborhoods and set low confidence. [ASSUMED]
- Missing demographics key: return default `avg_income`, `population_density`, source note, and confidence below real provider confidence. [VERIFIED: LOC-05 in .planning/REQUIREMENTS.md]
- Missing places key: return mock nearby businesses with `source: 'mock'`. [VERIFIED: LOC-06 in .planning/REQUIREMENTS.md]
- Any provider failure: catch error, add a `data_sources` warning, continue with fallback for that segment. [VERIFIED: .planning/REQUIREMENTS.md]
- Never silently mix mock and real data; each segment must identify provider and confidence. [VERIFIED: LOC-07 in .planning/REQUIREMENTS.md]

Recommended confidence scoring:

- Start at 100.
- Subtract 25 if geocoding is mock or low precision.
- Subtract 20 if demographics are mock.
- Subtract 15 if nearby businesses are mock.
- Clamp to 0-100 and store in `confidence_score`. [VERIFIED: LOC-04 requires confidence_score] [ASSUMED]

## Files Planner Should Create

- `supabase/migrations/011_location_insights.sql` [VERIFIED: existing migration pattern]
- `lib/location/geocoding.ts` [VERIFIED: existing `lib/listings/*` module pattern]
- `lib/location/demographics.ts` [VERIFIED: existing provider/module pattern in `.planning/PROJECT.md`]
- `lib/location/nearby-businesses.ts` [VERIFIED: existing provider/module pattern in `.planning/PROJECT.md`]
- `lib/location/enrichment.ts` for orchestration and consumer profile derivation. [VERIFIED: existing `lib/listings/enrichment.ts` pattern]
- `lib/schemas/location-insight.ts` using Zod validation like listing schemas. [VERIFIED: lib/schemas/listing.ts]
- `tests/location-intelligence.test.mjs` using Node's built-in test runner. [VERIFIED: package.json] [VERIFIED: tests/investor-matching.test.mjs]

## Sources

- `.planning/REQUIREMENTS.md` - LOC-01 through LOC-07 scope. [VERIFIED: local codebase]
- `.planning/PROJECT.md` and `.planning/STATE.md` - stack, constraints, fallback-adapter decision, Brazil-ready/state-agnostic decision. [VERIFIED: local codebase]
- `supabase/migrations/008_listing_data_foundation.sql` and `010_investor_matching.sql` - table, RLS, index patterns. [VERIFIED: local codebase]
- `lib/listings/ingestion.ts`, `lib/listings/enrichment.ts`, `lib/schemas/listing.ts` - existing ingestion/enrichment/schema patterns. [VERIFIED: local codebase]
- Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security [CITED]
- Google Geocoding docs: https://developers.google.com/maps/documentation/geocoding/overview [CITED]
- Google Places Nearby Search docs: https://developers.google.com/maps/documentation/places/web-service/nearby-search [CITED]
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/ [CITED]

## Assumptions Log

| Claim | Risk if Wrong |
|-------|---------------|
| Google Maps is the likely first real provider for geocoding and places. | Planner may need to swap provider env names and adapter implementation. |
| Mock coordinates should only cover known demo locations. | Demo behavior may need broader fallback coverage. |
| Rule-based consumer profile labels are enough for MVP. | User may want richer copy in Phase 15 UI. |

## RESEARCH COMPLETE
