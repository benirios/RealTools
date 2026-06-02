# RealTools — Technical Architecture

## Overview

RealTools is a CRE (Commercial Real Estate) deal management SaaS for individual brokers. Core flows: source listings → enrich locations → score opportunities → match investors → manage deal flow → send tracked OMs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Supabase Postgres (via `@supabase/ssr`) |
| File Storage | Supabase Storage |
| Email | Resend |
| Scraping | Playwright (Chromium, headless) |
| AI — Batch | OpenRouter or Google Gemini (deal summaries, classification) |
| AI — Chat | OpenRouter streaming (entity-aware assistant) |
| Validation | Zod |
| UI | TailwindCSS + shadcn/ui + Recharts |
| Hosting | Vercel |

---

## Authentication Architecture

### Provider: Clerk

Auth migrated from Supabase Auth → Clerk at migration `019_clerk_auth_migration.sql`. This migration:

1. Dropped all `auth.users` FK constraints across all tables
2. Converted `user_id UUID` → `user_id TEXT` on every table (Clerk user IDs are `user_xxx` strings, not UUIDs)
3. Disabled RLS on all tables (`DISABLE ROW LEVEL SECURITY`)
4. RLS policies were also dropped

**Security model after migration:** No database-layer enforcement. All auth/ownership checks are app-layer:
- Every server action calls `auth()` from `@clerk/nextjs/server` and extracts `userId`
- Every DB read/write includes `.eq('user_id', userId)` — enforced in application code
- All DB operations use the **service role client** (bypasses Supabase Auth entirely)

### Middleware (`middleware.ts`)

```
Clerk middleware → createRouteMatcher → public routes bypass auth.protect()
```

Public routes: `/`, `/auth/login(.*)`, `/auth/signup(.*)`, `/om(.*)`, `/api/track(.*)`

Everything else: `auth.protect()` — Clerk redirects unauthenticated requests.

### Supabase Client Tiers

| Client | File | Key | When Used |
|--------|------|-----|-----------|
| Server | `lib/supabase/server.ts` | `ANON_KEY` | SSR reads, cookie-based session (minimal use after Clerk migration) |
| Service | `lib/supabase/service.ts` | `SERVICE_ROLE_KEY` (server-only) | All mutations, tracking, admin operations |

`lib/supabase/service.ts` imports `'server-only'` — build fails if imported client-side.

---

## Application Shell

### Route Groups

```
app/
├── (app)/          # Authenticated app shell — AppLayout wraps all routes
│   ├── dashboard/
│   ├── deals/[id]/
│   ├── imoveis/[id]/
│   ├── imoveis/
│   ├── investors/[id]/
│   ├── investors/
│   ├── negocios/
│   ├── negocios/[id]/
│   ├── listings/import/
│   ├── decision-surface/
│   └── inteligencia-local/
├── om/[id]/        # Public OM page — no auth, no cookies()
├── auth/           # Login / Signup (Clerk hosted components)
└── api/            # Route handlers
```

`AppLayout` (`app/(app)/layout.tsx`): calls `auth()`, redirects if no `userId`, renders `AppHeader` + `Sidebar` + `<main>`.

### State Management

No Zustand/Redux. Pattern:
- Server Components fetch data and pass props
- Mutations via `'use server'` actions with `revalidatePath` / `revalidateTag`
- No client-side global state

---

## Database Schema

20 migrations. Current tables:

| Table | Purpose |
|-------|---------|
| `deals` | Broker deal records |
| `buyers` | Buyer CRM entries |
| `deal_buyers` | Deal↔Buyer join, tracking token, OM sent/opened timestamps |
| `notes` | Deal notes |
| `activities` | Deal event log (om_sent, om_opened, note_added, file_uploaded) |
| `deal_files` | File metadata; actual bytes in Supabase Storage (`deal-files` bucket) |
| `listings` | Scraped/imported property listings |
| `listing_import_targets` | OLX scrape targets (city, state, search term) |
| `listing_import_runs` | Scrape run history, status, counts |
| `investors` | Investor profiles (strategy, budget, preferences) |
| `investor_listing_matches` | Pre-computed investor↔listing match scores |
| `location_insights` | Enriched location data (geocode, demographics, nearby businesses) |
| `opportunity_scores` | Scored listings per strategy (6 NUMERIC category columns) |
| `listing_ai_summaries` | Cached AI-generated deal summaries |
| `strategy_fit_scores` | Per-listing strategy fit scores |
| `client_opportunities` | Investor↔Listing pipeline (status, match score, notes) |

Key schema decisions:
- `opportunity_scores.total_score` and category scores are `NUMERIC(5,2)` columns (not JSONB) — B-tree indexable, ML-ready
- `strategy_slug` has a CHECK constraint on valid values
- `deal_buyers.tracking_token UUID` — generated at insert, used for OM tracking

---

## Feature Architecture

### 1. Deal Hub

**Flow:** CRUD deals → upload files → generate OM → send to buyers → track opens → view activity log

**Server actions** (`lib/actions/deal-actions.ts`):
- `createDealAction`, `updateDealAction`, `deleteDealAction`
- Pattern: `auth()` → Zod parse → service client → `revalidatePath`
- `deleteDealAction` fetches `deal_files.storage_path` rows first, removes from Storage, then deletes deal (cascade removes DB rows)

**File handling** (`lib/actions/file-actions.ts`):
- Private bucket `deal-files` for broker files
- Public bucket `om-images` for OM property photos
- Signed URLs for private downloads

**OM page** (`app/om/[id]/page.tsx`):
- `export const dynamic = 'force-dynamic'` — never cached
- No `cookies()` call — uses service client directly (avoids crash on unauthenticated request)
- Reads `?ref=` param → calls `recordOmOpenByToken(ref)` (URL-primary tracking)
- Injects 1×1 pixel `<img src="/api/track/{ref}">` (secondary tracking)
- Lists images from `om-images/{deal_id}/` prefix via `storage.list()`

### 2. OM Tracking

**Dual-signal design:**

| Signal | Path | Mechanism |
|--------|------|-----------|
| Primary | OM Server Component load | `?ref=token` in URL → `recordOmOpenByToken` called server-side |
| Secondary | Pixel fallback | `/api/track/[token]` → `recordOmOpenByToken` → returns 1×1 GIF |

**`recordOmOpenByToken`** (`lib/tracking/record-om-open.ts`):
- `'server-only'` module
- Atomically updates `deal_buyers.om_opened_at` WHERE `tracking_token = token AND om_opened_at IS NULL`
- The null predicate in the UPDATE is the idempotency gate — concurrent URL+pixel calls both get the same result
- On first open: fetches buyer metadata → inserts `activities` row with `event_type: 'om_opened'`
- Unknown/repeat tokens: no-op, no error (prevents token enumeration)
- `/api/track/[token]` always returns HTTP 200 + GIF regardless of token validity

### 3. Listing Ingestion (OLX)

**Scraper** (`lib/listings/olx.ts`):
- Playwright Chromium, headless
- Patches `navigator.webdriver`, `navigator.languages`, `navigator.plugins` to reduce bot detection
- Wheel-scroll triggers IntersectionObserver lazy-load (window.scrollTo does not)
- Extracts from search results page: href, title, price, images
- Per-card: opens detail page, extracts JSON-LD structured data (images), falls back to DOM `img[src]`
- Cloudflare block detection: checks for `"Please enable cookies"` / `"Cloudflare Ray ID"` in body text
- `enrichListingFields` classifies commercial type via keyword rules
- Hard cap: 50 listings per run; default 25

**Persistence** (`lib/listings/ingestion.ts`):
- `upsertListing` with `onConflict: 'user_id,source,source_url'` — idempotent re-scrape
- `listing_import_runs` tracks status, counts, timestamps

**Import targets** (`listing_import_targets`): per-user OLX targets (city/state/search_term), activated by broker.

### 4. Location Intelligence

**Provider adapter pattern** (`lib/location-intelligence/providers.js`):
- Geocoding, demographics, nearby-business lookup abstracted behind adapters
- Mock/fallback implementations when provider keys absent
- `resolveLocationIntelligence(input)` → calls all providers → returns `ResolvedLocationIntelligence`

**Data layer** (`lib/location-intelligence/insights.ts`):
- `toLocationInsightInsert`: maps camelCase schema → snake_case DB columns
- `reliableNearbyBusinesses`: filters out source `'mock'` / `'mock_places'` / `'demo'` entries before persisting
- `upsertLocationInsightForListing` with `onConflict: 'user_id,listing_id'`

**API** (`lib/location-intelligence/api.ts`):
- `enrichListingLocationInsight`: loads listing → `resolveLocationIntelligence` → upsert
- `buildEphemeralLocationInsight`: creates an in-memory insight (no DB write) for standalone address queries

### 5. Opportunity Scoring Engine

**Architecture: pure function core, stateful service wrapper**

```
computeScore(listing, insight, strategy) → ScoringOutcome
        ↓
scoreListingService(supabase, userId, listingId, strategySlug)
        ↓
scoreListingAction(listingId, strategySlug)  ← server action
        ↓
app/api/listings/[id]/score/route.ts         ← API route
```

**Engine** (`lib/scoring/engine.ts`):
- Six pure category functions, zero I/O:
  - `scoreDemographics`: income thresholds + density bonus
  - `scoreLocationQuality`: geocoding confidence + coordinates presence
  - `scoreNearbyBusinesses`: foot traffic generators + affinity matches within 500m
  - `scoreCompetition`: competitor count within 500m/1000m radius
  - `scoreRisk`: data completeness + listing tags (`distressed`, `reforma`)
  - `scoreInvestorFit`: price range brackets + `leased`/`locado` tags
- `computeScore` returns three-state `ScoringOutcome`:
  - `SCORED` — full result
  - `NEEDS_ENRICHMENT` — `location_insight` is null
  - `ENRICHMENT_FAILED` — listing not found
- Total score: weighted sum across categories, `clamp(0..100)`
- `fitLabel`: `forte` (≥70), `moderado` (≥50), `fraco` (<50)

**Strategies** (`lib/scoring/strategies.ts`):

| Strategy | Demographics | Location | Nearby | Competition | Risk | InvestorFit |
|----------|-------------|----------|--------|-------------|------|-------------|
| `cafe` | 0.20 | 0.20 | **0.30** | 0.15 | 0.10 | 0.05 |
| `logistics` | 0.10 | **0.40** | 0.05 | 0.10 | 0.20 | 0.15 |
| `pharmacy` | **0.25** | 0.20 | 0.15 | **0.25** | 0.10 | 0.05 |
| `retail` | 0.20 | 0.20 | 0.25 | 0.20 | 0.10 | 0.05 |
| `services` | **0.30** | **0.25** | 0.10 | 0.10 | 0.15 | 0.10 |
| `any` | ~0.167 (equal) | ~0.167 | ~0.167 | ~0.167 | ~0.167 | ~0.165 |

Each strategy also defines `nearbyAffinities[]` (affinity category keywords) and `nearbyConflicts[]` (competitor keywords).

**Persistence**: `opportunity_scores` with `UNIQUE(user_id, listing_id, strategy_slug)` — upsert increments `score_version`.

### 6. Investor Matching

**Engine** (`lib/investors/matching.js`): CommonJS module (dual .js/.d.ts for compatibility)

Seven weighted dimensions:

| Dimension | Weight |
|-----------|--------|
| `budget_fit` | 0.18 |
| `opportunity_quality` | 0.18 |
| `location_fit` | 0.16 |
| `strategy_fit` | 0.16 |
| `property_type_fit` | 0.12 |
| `risk_fit` | 0.12 |
| `tag_fit` | 0.08 |

- `opportunity_quality` aggregates the listing's universal score (`opportunity_scores` where `strategy='any'`) + location intelligence signal
- `strategy_fit` reads persisted `strategy_fit_scores` when available, falls back to keyword matching on tags/description
- Returns `match_score`, `confidence` (low/medium/high based on missing data count), `strengths[]`, `concerns[]`, `recommended_action`, `breakdown`

Results stored in `investor_listing_matches`.

### 7. AI Deal Summary

**Provider-agnostic batch generation** (`lib/ai/deal-summary-provider.ts`):
- Supports `openrouter` (default) and `gemini` providers via `AI_DEAL_SUMMARY_PROVIDER` env
- Both providers extract JSON from response, parse through `AiDealSummarySchema`
- Retry wrapper: 2 attempts before throw
- Input: listing + location insight + opportunity score + top investor matches → structured `DealSummaryInput`
- Output schema: `headline`, `best_fit[]`, `strengths[]`, `risks[]`, `investor_angle`, `recommended_action`, `confidence`

**Deduplication** (`lib/ai/deal-summary-service.ts`):
- `inputHash` = SHA hash of the `DealSummaryInput` object
- If existing summary with matching hash exists → skip re-generation (unless `force: true`)
- Status lifecycle: `processing` → `completed` / `failed`
- On failure: persists `unavailableSummary()` stub so UI always has something to render

### 8. Entity Chat (AI Assistant)

**Route** (`app/api/chat/route.ts`):
- OpenRouter streaming endpoint, proxies SSE chunks as plain text stream
- `Content-Type: text/plain; charset=utf-8` — client reads incrementally
- In-memory rate limiter: 15 requests/minute per `userId` (per-instance only; note says to use Upstash for multi-instance)
- Entity types: `imovel`, `cliente`, `negocio`
- System prompt built by `lib/ai/chat-context.ts`:
  - `buildImovelContext`: listing + location insight + AI summary + opportunity scores + full listings catalog + clients catalog
  - `buildClienteContext`: investor profile + recent opportunities + catalogs
  - `buildNegocioContext`: composes imovel + cliente contexts + pipeline status
- Model configured via `AI_DEAL_SUMMARY_MODEL` env, default `google/gemini-flash-1.5`

---

## Security Headers

Configured in `next.config.ts` via `async headers()`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

OM pages (`/om/*`) override to `Referrer-Policy: no-referrer` — prevents tracking token leaking to external CDNs via `Referer` header.

---

## Data Flow Diagrams

### OM Send + Track Flow

```
Broker selects buyers → deal_buyers rows created with tracking_token UUIDs
→ Resend sends email with URL: /om/{dealId}?ref={token}
→ Buyer opens email link
→ /om/[id] Server Component loads
   → recordOmOpenByToken(token) [URL tracking — PRIMARY]
   → deal_buyers.om_opened_at SET (idempotent)
   → activities row inserted
→ Page HTML includes <img src="/api/track/{token}"> [PIXEL — SECONDARY]
   → /api/track/[token] fires (if email client loads images)
   → recordOmOpenByToken(token) called again — no-op (om_opened_at already set)
   → Returns 1×1 GIF, HTTP 200 always
```

### Listing → Score Flow

```
OLX scrape → listing_import_runs → listings (upsert)
→ Broker clicks "Enriquecer"
→ enrichListingLocationInsight()
  → resolveLocationIntelligence() [geocoding + demographics + nearby places]
  → upsertLocationInsightForListing()
→ Broker selects strategy
→ scoreListingAction(listingId, strategySlug)
  → scoreListingService()
    → loadListingForScoring() [user-scoped]
    → getListingLocationInsight() [user-scoped]
    → computeScore(listing, insight, strategySlug) [pure, no I/O]
    → upsertScore() → opportunity_scores (UNIQUE upsert, increments score_version)
→ UI renders OpportunityScoreCard
```

---

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Clerk over Supabase Auth | Supabase Auth requires `getUser()` (network call per request); Clerk JWT is verifiable locally. Migration eliminated RLS complexity. |
| Service role client everywhere | After Clerk migration, Supabase RLS is disabled. All data isolation is `.eq('user_id', userId)` in application code. |
| `user_id TEXT` (not UUID) | Clerk IDs are `user_xxx` strings. Migration cast all UUID columns to TEXT. |
| Pure scoring engine | `computeScore` has zero I/O and zero side effects. Can be unit-tested without DB, run in browser, or extracted to edge function. |
| `NUMERIC(5,2)` category columns | JSONB scores can't be B-tree indexed or used as ML features. Individual columns allow `ORDER BY total_score DESC` index. |
| Dual-signal OM tracking | URL tracking fires on SSR page load (no JS required). Pixel is fallback for email clients that block tracking pixels or prefetch links. Idempotency gate in the DB UPDATE (not application code) prevents races. |
| CommonJS for investor matching | `lib/investors/matching.js` is CommonJS so it can be `require()`'d from both Node scripts and Next.js server. |
| Mock-source filtering in location insights | `nearbyBusinesses` from `source: 'mock'` are stripped before persistence and before scoring to prevent mock data from inflating scores. |
| `?ref=` tracking token in URL, not cookie | Buyers open OM pages without authenticating. Cookies would require consent banners and would fail cross-browser. URL ref is the only reliable cross-context signal. |
| Referrer suppression on `/om/*` | `Referrer-Policy: no-referrer` prevents the `?ref=token` query string from appearing in the `Referer` header of requests to image CDNs embedded in the OM page. |
