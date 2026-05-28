---
gsd_state_version: 1.0
milestone: v1.6
milestone_name: Opportunity Scoring Engine
status: phase-complete
last_updated: "2026-05-12T11:58:36.000Z"
last_activity: 2026-05-12 -- Phase 18 automated gates passed; ready for verify-work
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 11
  completed_plans: 11
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-10)

**Core value:** Every broker has one practical workspace to find, qualify, and manage commercial real estate opportunities without hunting across listing sites, Facebook posts, spreadsheets, email, and Drive.
**Current focus:** Phase 18 complete — score-card-ui

## Current Position

Phase: 18 (score-card-ui) — COMPLETE
Plan: 4 of 4
Status: Phase 18 automated execution complete; ready for verification
Last activity: 2026-05-12 -- Phase 18 automated gates passed

```
Progress: [████████████████████] 100% (3/3 phases)
```

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

Recent decisions affecting future work:

- Use `@supabase/ssr` + `createServerClient`; avoid deprecated auth helpers.
- Use `getUser()` server-side; never trust `getSession()` for authorization decisions.
- Middleware must exclude `/om/*` and `/api/track/*`.
- Service role key belongs only in `server-only` modules.
- Every migration needs RLS and at least one policy.
- Use private `deal-files` and public `om-images` buckets.
- URL-based tracking is the primary OM engagement signal; pixel is secondary.
- `supabase.from()` casts remain until the Supabase inference bug is removed or upgraded away.
- v1.2 intentionally supersedes the unfinished v1.1 dark UI direction with a Nexus-style light dashboard reference.
- Phase 7 completed the light foundation: root light tokens, default light theme, Geist operational typography, and shared light primitives.
- Phase 8 completed the authenticated workspace refactor: light app shell, mobile/desktop navigation, dashboard count cards, Deal Hub panels, buyers/profile surfaces, and workflow dialogs/forms now follow the Phase 7 light foundation while preserving behavior.
- v1.3 starts before v1.2 Phase 9 is completed because the user prioritized a national Brazil commercial listing map MVP.
- The opportunity-sourcing MVP is national in data model and filters, but initial ingestion should use controlled city/state batches instead of trying to scrape all Brazil at once.
- Facebook Marketplace automation/import is deferred for now; OLX on-demand website search is the active ingestion path.
- Commercial classification should start with Portuguese keyword rules and use optional AI only for ambiguous listings.
- Phase 10 created listing schema, generated-style types, validation schemas, national target constants, and ingestion upsert helpers.
- Phase 11 added import run tracking, controlled OLX ingestion, on-demand address/city/region OLX search, and a Listing Import admin page.
- Use provider adapters for geocoding, demographics, and nearby-business lookup, with fallback/mock implementations when provider keys are absent.
- Keep location intelligence Brazil-ready and state-agnostic so Pernambuco can be demo data without hardcoding the product to one state.
- v1.5 focused on location intelligence and demographic enrichment against listing locations and standalone addresses.
- v1.6 scoring engine reads from existing `location_insights` table — no new data pipeline. New table: `opportunity_scores` (migration 012). New module: `lib/scoring/`. New npm dependency: `recharts` ^3.8 via `npx shadcn@latest add chart`.
- RLS on `opportunity_scores` must be `USING (auth.uid() = user_id)` — not a listing existence check. This cannot be retrofitted.
- `total_score` and all five category scores must be real `NUMERIC(5,2)` columns (not JSONB) for B-tree indexing and future ML feature extraction.
- `strategy_slug` needs a CHECK constraint listing valid values — free text blocks ML later.
- Engine must produce three-state output: `SCORED | NEEDS_ENRICHMENT | ENRICHMENT_FAILED`. Never crash on missing `location_insights`.
- Missing data penalty: zero-and-flag (not neutral 50). Validate score std dev > 10 pts over 20+ real listings before Phase 18 starts.
- Score framing: "opportunity attractiveness" or "fit score" — never "avaliação" (regulated profession in Brazil).
- Phase 18 score-card UI loads score history server-side with `getScoreHistory(supabase, user.id, id)`, adapts rows through `scoreRowToCardEntry`, and renders below location intelligence on `/imoveis/[id]`.
- Phase 18 authenticated E2E uses Supabase-backed seeded users/listings/insights/scores and SSR-compatible auth cookies; default Playwright port is 3100 to avoid stale localhost processes.

### Pending Todos

- Resolve open questions before Phase 16 planning: (1) reconcile strategy enum with existing investor taxonomy; (2) confirm per-user vs. global score scope; (3) confirm recompute trigger (on-demand only vs. auto-invalidate); (4) validate BRL income thresholds per strategy against IBGE data.
- Inspect actual `nearby_businesses` and `raw_places` JSONB keys in the database before writing foot-traffic and competition logic — do not assume field names.

### Blockers/Concerns

- Phase 3 live UAT remains pending for Resend delivery, browser open tracking, and activity-log confirmation.
- v1.2 Phase 9 public/auth/OM surface restyling remains deferred.
- Phase 16 has a hard distribution gate: std dev of total_score must exceed 10 pts across 20+ real listings before Phase 17 planning proceeds.
- Phase 18 automated gates passed; optional human visual polish UAT remains useful before stakeholder demo.
- Upgrade Supabase to Pro before stakeholder demo if free tier pause risk matters.

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-05-01:

| Category | Item | Status |
|----------|------|--------|
| uat_gap | Phase 03 `03-HUMAN-UAT.md` — 4 pending scenarios | partial |
| verification_gap | Phase 03 `03-VERIFICATION.md` | human_needed |

## Session Continuity

Resume with `/gsd-verify-work 18` or `$gsd-complete-milestone` for v1.6 closeout. /clear first for fresh context.
