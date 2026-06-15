# RealTools — Codebase Reference

_Last updated: 2026-06-14_

---

## What It Is

CRE broker SaaS for Brazil commercial property. One workspace per deal/listing covering:
- Deal management (notes, files, buyers, OM generation)
- Opportunity sourcing (OLX ingestion, national listing map)
- Location intelligence (demographics, nearby businesses, enrichment)
- Opportunity scoring (universal score + strategy fit + investor match)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Auth | Clerk (`@clerk/nextjs`) |
| Database | Supabase Postgres (anon key for queries, service role for server-only ops) |
| Storage | Supabase Storage (`deal-files` private, `om-images` public) |
| ORM | `@supabase/ssr` + `createServerClient` — typed via `types/supabase.ts` |
| UI | TailwindCSS + shadcn/ui + Radix UI |
| Email | Resend |
| Charts | Recharts (via shadcn chart) |
| Hosting | Vercel |
| Testing | Vitest / `.mjs` test files, Playwright (E2E, port 3100) |

---

## Auth Pattern (Clerk — post migration-019)

Migration `019_clerk_auth_migration.sql` moved auth from Supabase to Clerk:
- All `user_id` columns converted from `UUID` → `TEXT`
- RLS disabled on all tables — app-layer `user_id` filtering replaces it
- Supabase service role client does all DB writes; anon client does user-scoped reads filtered by `userId`

**In server actions / API routes:**
```ts
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()
```

**Middleware** (`middleware.ts`):
```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// Public: /auth/login, /auth/signup, /om/*, /api/track/*, /api/proxy-image/*
```

**Supabase client** (`lib/supabase/server.ts`):
- `createSupabaseServerClient()` — anon key, SSR cookie handling
- `lib/supabase/service.ts` — service role key, server-only, never `NEXT_PUBLIC_*`

> **Note:** `CLAUDE.md` says use `getUser()` + `@supabase/ssr` for auth — that was pre-Clerk. Auth is now Clerk. Supabase is data-only.

---

## Directory Map

```
app/
  (app)/              # Authenticated app routes (Clerk-protected)
    dashboard/
    deals/
    imoveis/[id]/     # Listing detail: images, scores, location insight
    listings/         # Listing grid + import UI
    investors/
    inteligencia-local/
    decision-surface/ # AI deal summary surface
    layout.tsx        # App shell (header + sidebar)
  api/
    imoveis/          # Listing API routes
    investors/
    listings/[id]/score/  # GET/POST opportunity score
    location-insights/
    track/            # OM open tracking (public)
    proxy-image/      # Image proxy (public)
  auth/               # Login/signup pages (public)
  om/                 # Public OM pages (no auth)

lib/
  actions/            # Server actions (all import { auth } from Clerk)
    deal-actions.ts
    scoring-actions.ts
    listing-import-actions.ts
    location-insight-actions.ts
    investor-actions.ts
    ai-summary-actions.ts
    client-opportunity-actions.ts
    note-actions.ts
    file-actions.ts
  scoring/            # Scoring engine (pure + service + data)
    engine.ts / engine.js
    strategies.ts / strategies.js
    schemas.ts / schemas.js
    data.ts / data.js
    service.ts / service.js
    strategy-fit.ts / strategy-fit.js
    strategy-fit-service.ts
    score-card-ui.ts
  location-intelligence/
    api.ts / api.js   # Enrichment API calls
    insights.ts / insights.js  # DB read/write for location_insights
    providers.js      # Provider adapters (Google Places etc.) — JS only, no .ts
    normalization.js
    demo-seeds.ts
  investors/
    matching.js       # Investor match scoring — JS only
    match-processing.ts
    data.ts
  listings/
    constants.ts      # National target cities/states
    enrichment.ts
    import-runs.ts
    ingestion.ts
    olx.ts            # OLX scraping adapter
    processing.ts     # enrichScoreAndMatchListing pipeline
  ai/
    deal-summary-provider.ts
    deal-summary-schema.ts
    deal-summary-service.ts
  supabase/
    client.ts         # Browser client
    server.ts         # SSR anon client
    service.ts        # Service role client (server-only)
    types.ts
  resend.ts
  utils.ts
  schemas/            # Zod schemas

components/
  listings/
    opportunity-score-card.tsx
    strategy-selector.tsx
    strategy-fit-card.tsx
    location-insight-card.tsx
    location-insight-action.tsx
    imoveis-grid.tsx
    listing-images.tsx
    listing-description.tsx
    listing-investor-matches.tsx
    ai-deal-summary-card.tsx
    decision-surface.tsx
    import-actions.tsx
    import-runs-table.tsx
    import-targets-table.tsx
  deals/
  files/
  investors/
  notes/
  ui/                 # shadcn primitives

types/
  supabase.ts         # Generated DB types (includes all tables)

supabase/
  migrations/         # 019 migrations total
```

---

## Database Schema (19 migrations)

| Migration | What it adds |
|---|---|
| 001 | Initial schema: deals, buyers, notes, deal_buyers, activities, deal_files |
| 002 | RLS policies (pre-Clerk era) |
| 003 | Indexes |
| 004 | Storage RLS |
| 005–007 | Column adjustments (price text, notes content, deal_files user_id) |
| 008 | Listings table (national CRE sourcing) |
| 009 | listing_import_runs |
| 010 | investor_listing_matches |
| 011 | location_insights |
| 012 | opportunity_scores |
| 013 | opportunity_scores category columns (5x NUMERIC(5,2)) |
| 014 | listing_processing_and_matches (processing state tracking) |
| 015 | listing_ai_summaries |
| 016 | strategy_fit_scores + richer investor match fields |
| 017 | client_opportunities |
| 018 | client_opportunities last_action column |
| 019 | **Clerk migration** — drops auth.users FKs, converts user_id UUID→TEXT, disables RLS on all tables |

**Key tables:**
- `listings` — sourced CRE listings (OLX ingestion)
- `location_insights` — enriched demographic + business data per listing
- `opportunity_scores` — universal scores (UNIQUE on user_id, listing_id, strategy_slug)
- `strategy_fit_scores` — per-strategy deterministic scores
- `investor_listing_matches` — personalized investor scores with sub-scores
- `listing_ai_summaries` — AI-generated deal summaries
- `client_opportunities` — pipeline tracking per investor/client

---

## Scoring Architecture (3 layers)

### Layer 1: Universal Opportunity Score
- **Engine:** `lib/scoring/engine.ts` — 6 pure category functions
  - `scoreDemographics`, `scoreLocationQuality`, `scoreFootTraffic`, `scoreCompetition`, `scoreRisk`, `scoreInvestorFit`
- **Strategies:** `lib/scoring/strategies.ts` — `cafe`, `logistics`, `pharmacy`, `retail`, `services`, `any`
- **Output states:** `SCORED | NEEDS_ENRICHMENT | ENRICHMENT_FAILED`
- **Score framing:** "opportunity attractiveness" / "fit score" — never "avaliação" (regulated term in Brazil)
- **Missing data:** zero-and-flag penalty, not neutral 50
- **Persistence:** `opportunity_scores` table via `lib/scoring/data.ts`
- **Service:** `lib/scoring/service.ts` — loads listing + location_insights, calls engine, upserts score, increments `score_version` on recompute

### Layer 2: Strategy Fit Score
- **Engine:** `lib/scoring/strategy-fit.ts`
- **Strategies:** `retail`, `warehouse_logistics`, `rental_income`, `food_beverage`, `pharmacy`, `gym_fitness`
- **Persistence:** `strategy_fit_scores` table
- **Service:** `lib/scoring/strategy-fit-service.ts` — persists with input hash for cache invalidation

### Layer 3: Investor Match Score
- **Engine:** `lib/investors/matching.js` (JS only)
- **Sub-scores:** `budget_fit`, `location_fit`, `property_type_fit`, `strategy_fit`, `risk_fit`, `tag_fit`, `opportunity_quality`
- **Persistence:** `investor_listing_matches`
- **Processing:** `lib/investors/match-processing.ts` — loads strategy fit scores into match inputs

### Import Pipeline (automatic scoring)
`lib/listings/processing.ts` → `enrichScoreAndMatchListing`:
1. Enrich location (location_intelligence)
2. Mark enrichment complete (independent of scoring)
3. Compute universal score
4. Compute strategy fit scores
5. Recompute investor matches
6. Generate AI deal summary (opportunistic)

---

## Server Actions Pattern

All actions in `lib/actions/` follow this shape:
```ts
import { auth } from '@clerk/nextjs/server'

export async function someAction(args) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  // DB ops filtered by userId
  revalidateTag('some-tag')
  revalidatePath('/some/path')
}
```

No Zustand/Redux. State = server components + server actions + `revalidatePath`.

---

## API Routes

| Route | Methods | Notes |
|---|---|---|
| `app/api/listings/[id]/score/route.ts` | GET, POST | GET: retrieve saved score (`?strategy=cafe`); POST: compute + save (`{ strategySlug }`) |
| `app/api/location-insights/` | — | Location enrichment endpoints |
| `app/api/investors/` | — | Investor match endpoints |
| `app/api/track/` | — | OM open tracking (public, no auth) |
| `app/api/proxy-image/` | — | Image proxy (public) |

---

## JS / TS Module Siblings

Several modules have both `.ts` and `.js` versions. Runtime and tests may load the `.js` sibling. **Updates must be mirrored to both files:**
- `lib/scoring/engine.ts` + `engine.js`
- `lib/scoring/strategies.ts` + `strategies.js`
- `lib/scoring/data.ts` + `data.js`
- `lib/scoring/service.ts` + `service.js`
- `lib/scoring/strategy-fit.ts` + `strategy-fit.js`
- `lib/location-intelligence/insights.ts` + `insights.js`
- `lib/location-intelligence/api.ts` + `api.js`
- `lib/location-intelligence/providers.js` — **JS only, no .ts**
- `lib/investors/matching.js` — **JS only, no .ts**

---

## Key Component: Listing Detail (`/imoveis/[id]`)

`app/(app)/imoveis/[id]/page.tsx` renders in order:
1. Listing title, price, images, OLX link, classification badges
2. Location insight card (`components/listings/location-insight-card.tsx`)
   - Nearby businesses hidden if `source: "mock"` / `"demo"` — only real provider data shown
3. Strategy selector (`components/listings/strategy-selector.tsx`)
   - Dropdown of strategies with PT-BR labels
   - Triggers `scoreListingAction` on selection
4. Opportunity score card (`components/listings/opportunity-score-card.tsx`)
   - Color bands: green ≥70, yellow ≥50, orange ≥40, red <40
   - Fit labels: `Forte` / `Moderado` / `Fraco`
   - Per-category breakdown bars, top 3–5 signals (green), top 3 risks (red/orange)
   - Empty state (no location insight): "Enriqueça a localização antes de calcular a pontuação"
   - Empty state (no score yet): "Calcular pontuação" CTA
5. Strategy fit card (`components/listings/strategy-fit-card.tsx`)
6. Investor matches (`components/listings/listing-investor-matches.tsx`)
7. AI deal summary card (`components/listings/ai-deal-summary-card.tsx`)

---

## OM Tracking (Legacy v1.0 feature)

- URL-based tracking is PRIMARY signal — `/om/[deal-id]?ref=[token]`
- Pixel tracking is secondary
- Tracked via `app/api/track/` (public route)
- Activity log records `om_sent`, `om_opened`, `note_added`, `file_uploaded`

---

## Current Milestone Status

**v1.6 Opportunity Scoring Engine — COMPLETE (2026-05-12)**

| Phase | Name | Status |
|---|---|---|
| 16 | Scoring Engine Foundation | Complete |
| 17 | Service Wiring and API | Complete (2026-05-10) |
| 18 | Score Card UI | Complete (2026-05-12) |

Tests: 56/56 passing, TSC clean, lint 0 errors.

---

## Known Deferred Items

| Item | Since |
|---|---|
| Phase 3 live UAT (Resend delivery + browser tracking confirmation) | v1.0 |
| Phase 9 public/auth/OM surface restyling | v1.2 |
| `016_strategy_fit_and_match_explanations.sql` needs prod DB apply | v1.5 |
| Per-user vs global score scope + recompute trigger decisions | v1.6 planning |
| Upgrade Supabase to Pro before stakeholder demo | ongoing |

---

## Next Step

Run `/gsd-verify-work 18` or `/gsd-complete-milestone` to close v1.6, then plan v1.7.
