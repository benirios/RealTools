# fix.md Triage

_Generated 2026-07-03 by parallel codebase investigation (14 agents, 1 manual). Pick which items to greenlight — reply with numbers or "all"._

Legend: **bug** = broken code, real regression · **missing-feature** = never built, docs already flagged it · **partially-working** = works on one path, not another · **not-a-bug** = stale/contradicted by current code · **design-decision** = already decided by you, listed for scope only.

---

## Summary table

| # | Item | Status | Effort | One-line cause |
|---|---|---|---|---|
| 1 | Images of fetched places | missing-feature | medium | No photo field anywhere (provider→schema→UI), plus no `GOOGLE_MAPS_API_KEY` set so businesses list is empty locally |
| 2 | `/app/profile` 404 | not-a-bug | small | Route is `/profile` (route group strips `(app)`); wrong URL, not a bug — but check for a bad `/app/...` link somewhere |
| 3 | Notes in a deal | partially-working | small | Full notes UI exists on `/deals/[id]`, but dashboard's compact deal panel has a different component with read-only notes, no add-form |
| 4 | OM generator not visible / sender not working | bug | small | Card only renders when no `?clientId=` param — but every real nav link adds `clientId`, so it's dead on the main path; also `RESEND_API_KEY` unset so sends would fail anyway |
| 5 | No price/images/demo button in `/imoveis` | partially-working | medium | Price & image rendering code is correct — root cause is upstream: OLX scraper currently returns 0 listings (see #10/#11). "Criar Demo" button exists but only on detail page, not grid — fix.md conflated the two routes |
| 6 | Investor count not displayed | not-a-bug | small | Already fixed in commit `209944b` (2026-06-30). fix.md line is stale — tests.md is correct |
| 7 | Inteligencia-local mocks fake data for bad address | bug | medium | `geocodeLocation()` always falls back to hardcoded demo cities instead of returning null/not-found, unlike `getDemographicEstimate()` which already does this correctly |
| 8 | All imoveis same score on decision surface | bug | medium | `scoreCompetition()` hardcodes 75 whenever `nearbyConflicts` is empty (true for the `'any'` strategy, the only one auto-scored) + no Places API key means foot-traffic/demographics also collapse to constants |
| 9 | Import targets not working | missing-feature | medium | `createImportTargetAction`/`deleteImportTargetAction`/`toggleImportTargetAction` don't exist in the codebase at all — table has no actions column. Already flagged in `.planning/v1.3-MILESTONE-AUDIT.md` |
| 10 | OLX results unrelated to search term | bug | small | The one real relevance filter left is gated behind a 6-word regex (`isCommercialSearch`) — any search term that doesn't match it (i.e. most real input) skips filtering entirely. Prior fix commits progressively deleted the general filter by accident |
| 11 | Save imoveis don't exist | bug | small | Scraper's `/item/` URL match never matches real OLX imóveis URLs (`{uf}.olx.com.br/{region}/{category}/{slug}-{id}`, no `/item/` segment) — 0 candidates ever found, so save is never reached. Save layer itself verified working |
| 12 | Remove strategy fit + score por estrategia | design-decision | medium | You already chose full removal. Files: `lib/scoring/strategy-fit.ts`, `strategy-fit-service.ts`, `strategy-fit-data.ts`, `strategy-fit.js`, `components/listings/strategy-fit-card.tsx`, its call in `lib/listings/processing.ts` + `lib/actions/location-insight-actions.ts`. DB table `strategy_fit_scores` (migration 016) left in place, just unused |
| 13 | Overall search not client-only / no fuzzy | bug | medium | The only global search (`HeaderSearch`) hardcodes redirect to `/imoveis` with plain `ilike` — never touches investors, despite its own placeholder text promising "clientes". Real Fuse.js fuzzy search already exists but is trapped inside `investors-table.tsx` only |
| 14 | Resumo IA / OpenRouter 404 | bug | small | `.env.local`'s `AI_DEAL_SUMMARY_MODEL` was already hand-edited once to `google/gemini-3.5-flash` — not a real model id (Gemini has no 3.5 line). Needs a verified-current OpenRouter slug |
| 15 | Descriptions should pass through AI | missing-feature | medium | Confirmed: current "cleanup" is pure regex (`listing-description.tsx`), zero LLM involvement. Existing `lib/ai/deal-summary-*` pattern can be mirrored for this |

**Already-working, no action needed:** #2, #6 (stale fix.md lines — recommend deleting them from fix.md once confirmed).

---

## Details per item

### 1. Images of fetched places (medium)
`lib/location-intelligence/providers.js` `mapGooglePlaceResult` never reads Google's `place.photos[]` field. `NearbyBusinessSchema` (`lib/schemas/location-insight.ts`) has no `photoUrl` field either — would be silently stripped by Zod even if added upstream. `location-insight-card.tsx` has no `<img>` at all. Separately: no `GOOGLE_MAPS_API_KEY` in `.env.local`, so nearby-businesses is an empty array locally regardless (`unavailable` provider branch) — production would need the key set to get data at all, images require the 3-layer fix above on top of that.
**Fix:** add `photoUrl` through provider → schema → card, proxy the Places Photo endpoint server-side (never expose the API key client-side), and set `GOOGLE_MAPS_API_KEY`.

### 2. `/app/profile` 404 (small, likely not-a-bug)
`app/(app)` is a route group — its parens are stripped from the URL, so the real route is `/profile`, and that page loads fine. Recommend: grep for any `href="/app/..."` literal in the app (sidebar/header) in case a link is actually wrong; otherwise just confirm the right URL with whoever reported it.

### 3. Notes in a deal (small)
Two different notes UIs exist. `/deals/[id]` (full page) has the complete add/edit/delete flow — this is what tests.md verified. The dashboard's compact split-panel (`components/deals/deal-detail-panel.tsx`) shows notes read-only (first 4, no textarea) — you have to click "Abrir completo" to actually add one. Also noted: `/deals` and `/dashboard` aren't reachable from the sidebar at all, only via the header logo — worth a look regardless of this fix.
**Fix:** import `NotesSection` into `deal-detail-panel.tsx` in place of the read-only block.

### 4. OM generator / sender (small)
`OmRecipientsCard` only renders in the "no `clientId`" branch of the listing detail page, but every real link from the investor workspace adds `?clientId=...` — so the card is dead code on the path brokers actually use. Independently, `RESEND_API_KEY`/`RESEND_FROM_EMAIL` aren't set, so even a reachable send would fail with "Email não configurado."
**Fix:** render the card in the `clientId` branch too (`ClientOpportunityRecommendationView`), and set real Resend credentials (ops task, needs a verified sending domain).

### 5. `/imoveis` price/images/demo button (medium)
Grid component code is correct — it queries and renders `price_text`/`price_amount`/`images` properly with fallbacks. The real cause is upstream: the OLX scraper currently returns 0 listings on almost every run (see #10 and #11), so the table is empty or has stale/incomplete rows. "Criar Demo" button exists and works, just on `/imoveis/[id]` (detail page) not `/imoveis` (grid) — it's inherently per-listing so it can't live on the grid as-is. Recommend fixing #10/#11 first, then re-checking this one — it may resolve itself.

### 6. Investor count (small, not-a-bug)
Already fixed in commit `209944b` on 2026-06-30 — `/investors` page subtitle already shows `{count} cliente(s)`. fix.md just wasn't pruned after that fix shipped.

### 7. Inteligencia-local mock fallback (medium)
`geocodeLocation()` always returns a "success"-shaped object even on total failure — either matching a hardcoded demo city by loose substring, or literally `{latitude: null, provider: 'mock', confidence: 20}`. Contrast: `getDemographicEstimate()` in the same file already does this correctly (`return null` on failure). The geocode path just never got the same treatment.
**Fix:** mirror the demographics pattern — return `null` on real failure, gate all mock fallback behind an explicit dev-only flag, propagate a real 404/not-found up through the API route so the UI can show "endereço não encontrado" instead of fake data.

### 8. Decision surface — same score everywhere (medium)
Not a query bug. `scoreCompetition()` in the engine hardcodes `score: 75` whenever a strategy's `nearbyConflicts` list is empty — and the `'any'` strategy (the only one the automatic pipeline ever computes) has an empty list by design. Combined with no Google Places key (foot-traffic always defaults to a hardcoded 20) and demographics often collapsing too (invalid `'BR'` state fallback breaks the municipality lookup), 3-5 of 6 score categories become constants for most listings under the default strategy — only `investor_fit` (price-driven) varies.
**Fix:** don't treat "no conflicts defined" as "score 75" for the general-purpose strategy; fix the invalid `'BR'` state fallback; get a real Places key configured.

### 9. Import targets (medium)
Genuinely never built. `createImportTargetAction`, `deleteImportTargetAction`, `toggleImportTargetAction` don't exist anywhere in the repo — confirmed by grep. The table component has no actions column to wire them to. Schema already supports it (migration 008) — this is pure application-layer work, no migration needed.

### 10. OLX search relevance (small)
Despite 11 prior commits, the surviving filter only fires when the search term matches a 6-word hardcoded regex (`comercial|ponto|loja|sala|galpao|varejo|comercio`). Any other term — which is most real broker input — skips filtering entirely, because an earlier debug commit (`fa667b7`, "remove all filters to test if scraper extracts listings at all") deleted the general token-match check and it was never restored.
**Fix:** restore a general keyword-overlap check against `target.searchTerm` that runs unconditionally, keep the residential-exclusion as an additional layer on top (not a replacement), and move the `.slice(0, limit)` truncation to after filtering instead of before.

### 11. Save imoveis don't exist (small)
Root cause is upstream of the save layer, not in it. `isListingUrl()` requires an `/item/` path segment — but real OLX imóveis URLs follow `{uf}.olx.com.br/{region}/{category}/{slug}-{numericId}`, with no `/item/` anywhere. Live check: 0 of 837 anchors on a real search page matched. So `upsertListing` is never even called — verified the DB/save code itself works via a direct manual insert.
**Fix:** match on a trailing long numeric ID (`/-\d{6,}$/`) instead of requiring `/item/`, which covers both URL shapes while still excluding category/browse pages (the original bug commit `e64f368` was fixing).

### 12. Remove strategy fit layer (medium) — decision locked: full removal
Delete: `lib/scoring/strategy-fit.ts`, `strategy-fit-service.ts`, `strategy-fit-data.ts`, `strategy-fit.js`, `components/listings/strategy-fit-card.tsx`, and their call sites in `lib/listings/processing.ts` (import pipeline step) and `lib/actions/location-insight-actions.ts`. Leave the `strategy_fit_scores` DB table in place (no destructive migration) — just stop writing/reading it.

### 13. Client-only fuzzy search (medium)
`HeaderSearch` (the one global search, in the app header on every page) hardcodes a redirect to `/imoveis?q=...` with a plain Postgres `ilike` filter — despite its own placeholder text promising "Pesquisar imóveis **e clientes**". It never touches the investors table. Meanwhile real fuzzy search already exists (`fuse.js`, weighted on name/email/tags) but is trapped inside `investors-table.tsx`, used nowhere else.
**Fix (needs your call on UX):** either fix the copy to stop overpromising client search and leave it listings-only (minimal), or build a real cross-entity search (shared Fuse config + small API route querying both tables) — bigger, better UX, worth discussing before starting.

### 14. Resumo IA / OpenRouter 404 (small)
The exact string from the reported error (`google/gemini-2.0-flash-001`) isn't in the codebase anymore — a prior fix attempt already changed `.env.local`'s `AI_DEAL_SUMMARY_MODEL` to `google/gemini-3.5-flash`, which isn't a real model (no 3.5 generation exists for Gemini). So it's very likely still broken today with a different 404 for the same underlying reason: an invalid model slug.
**Fix:** set `AI_DEAL_SUMMARY_MODEL` to a verified-current OpenRouter model id. I'd recommend confirming the exact slug against OpenRouter's live `/models` endpoint before setting it, since my training data may be behind current model naming — I can check this live once you greenlight the fix.

### 15. Descriptions through AI (medium, new feature)
Confirmed: current description "cleanup" (`components/listings/listing-description.tsx`) is 100% regex/heuristic — strips known OLX boilerplate markers, pulls out phone numbers via keyword match, groups sentences into paragraphs. Zero LLM calls anywhere in the pipeline.
**Fix:** mirror the existing `lib/ai/deal-summary-*` provider/service/schema pattern (already proven in this codebase) for a new narrow "organize this description" call, wired into the same `enrichScoreAndMatchListing` pipeline stage, with hash-based skip-if-unchanged like deal summaries already do. One open question worth your input: should it keep surfacing the scraped seller's phone number as a "contact" highlight, or drop that now that RealTools' own OM flow is meant to be the contact channel?

---

## Suggested fix order (dependency-aware)

1. **#10 + #11** together (OLX relevance + save matching) — same file, same root symptom, unblocks real data flowing into the app at all
2. **#14** (OpenRouter model id) — trivial once confirmed, unblocks AI summary + description-AI feature
3. **#4** (OM card/env) — small, high visible impact
4. **#3** (notes in dashboard panel) — small
5. **#2, #6** — no code change, just prune fix.md
6. **#7** (inteligencia-local mock fallback) — medium, self-contained
7. **#8** (decision-surface scores) — medium, depends on understanding #7's provider changes since demographics/places share code
8. **#9** (import targets CRUD) — medium, net-new
9. **#12** (strategy-fit removal) — medium, mostly deletion, do after confirming nothing else depends on it
10. **#5** — re-check after #10/#11 land, may already be resolved
11. **#13** (fuzzy client search) — needs a UX decision first
12. **#15** (description AI) — new feature, do last

Reply with which numbers to green-light (or "all", or "1-4" etc.) and I'll start executing.
