# RealTools — Fix Plan

_Cross-referenced from `fix.md` (user-reported bugs) + `tests.md` (unchecked items)._
_Excluded: entire **API ROUTES** section of tests.md (confirmed working). Conflicts between files resolve toward `fix.md`._

Legend: 🔴 confirmed broken · 🟠 needs investigation · 🟣 design decision (needs your call) · 🆕 new feature

---

## P0 — Core loops broken (do first)

### A. OLX import pipeline 🔴
Root cluster for FOUR fix.md items + 3 unchecked tests. The grid code (`imoveis-grid.tsx`) *does* render price + images — so these are **empty-data** bugs from the scraper, not UI bugs.

| Symptom (source) | Root-cause hypothesis |
|---|---|
| no price shown in /imoveis (fix.md) | scraper not writing `price_text` / `price_amount` |
| no images shown in /imoveis (fix.md) | scraper not writing `images[]` |
| fetching imóveis not related to search term (fix.md) | OLX query URL / result filter ignores `searchTerm` |
| save imóveis don't exist (fix.md) | no "Salvar" action on search results, or `saveListingAction` missing/broken |
| Import targets not working (tests.md `[-]`) | target CRUD actions (`createImportTargetAction` / toggle / delete) not wired |
| Import Runs table, Seed Default Targets (unchecked) | downstream of above |

**Files:** `lib/listings/olx.ts`, `ingestion.ts`, `enrichment.ts`, `lib/actions/listing-import-actions.ts`, `components/listings/import-actions.tsx`, `import-targets-table.tsx`, `import-runs-table.tsx`
**Plan:** (1) instrument one OLX scrape, log raw parsed fields → confirm what scraper actually captures. (2) fix selectors for price/images. (3) bind search term into the OLX query + post-filter. (4) verify save flow exists end-to-end. (5) wire target CRUD + seed.

### B. AI summary 404 / resumo IA 🔴 (quick win)
`deal-summary-provider.ts:36` → provider defaults `openrouter`, model defaults `google/gemini-flash-1.5`; env overrides model to `google/gemini-2.0-flash-001` which OpenRouter does not route → 404.
**Files:** `.env` / `.env.example`, `lib/ai/deal-summary-provider.ts`
**Plan:** pin a valid model. Either (a) `AI_DEAL_SUMMARY_PROVIDER=gemini` + `GEMINI_API_KEY` + `GEMINI_MODEL=gemini-2.0-flash` (direct Google), or (b) keep openrouter with a real id (`google/gemini-2.0-flash-001` → use `google/gemini-flash-1.5` or `google/gemini-2.0-flash-exp`). Reconcile code default with `.env.example` (also a law.md "Now" item).

### C. OM feature 🔴 / 🟠
fix.md: "no OM generator visible" + "OM sender not working". `OmRecipientsCard` IS imported in `imoveis/[id]/page.tsx:24`, so the card mounts — but send UI/flow fails.
**Files:** `components/listings/om-recipients-card.tsx`, `lib/actions/om-actions.ts`, `lib/resend.ts`, `lib/email/om-template.ts`
**Plan:** confirm card renders the "Enviar OM" button + investor selector; confirm `RESEND_API_KEY` set (sendOmAction silently no-ops email if `createResendClient()` returns null but still inserts rows). Surface errors. Add unsubscribe header (law.md). Verify `/api/track/[token]` + `/om/listing/[id]` public render.

### D. Decision-surface scoring 🔴
fix.md: "all imóveis getting same score". `pickScore()` returns `scores.find(strategy_slug==='any') ?? scores[0]` — if listings are unscored, all collapse to one default value.
**Files:** `app/(app)/decision-surface/page.tsx`, `components/listings/decision-surface.tsx`, `lib/scoring/service.ts`
**Plan:** confirm per-listing `opportunity_scores` rows exist + differ; check the join isn't grabbing a shared/global row; fix the map coords (`[-]` in tests.md).

### E. Location-intelligence data integrity 🔴
fix.md: "non-existing address mocks false data" + "no images of fetched places". `providers.js` has `buildMockDemographicEstimate` / `DEMO_GEO_LOOKUPS` that fabricate on geocode miss. law.md flagged the same (`real-vs-mock provenance`).
**Files:** `lib/location-intelligence/providers.js` (+ `.ts` sibling), `api.ts/js`, `components/listings/location-insight-card.tsx`, address-demographic-search component
**Plan:** on geocode/enrichment miss → return explicit "endereço não encontrado", do NOT fabricate. Gate mock strictly behind demo seed. Tag every record with `source` provenance + UI-label estimates. Render place photos (proxy-image) for nearby businesses.

---

## P1 — Visible gaps

### F. Profile 404 🔴
Page is correct at `/profile`. A nav link points to `/app/profile` (route group `(app)` adds no URL segment).
**Files:** sidebar/nav component, `middleware.ts` matcher. **Plan:** fix the href to `/profile`; confirm matcher doesn't exclude it.

### G. Investor count not displayed 🔴
`/investors` page renders the table but no count header.
**Files:** `app/(app)/investors/page.tsx`. **Plan:** render `investors.length` in the header subtitle.

### H. AI-normalized listing descriptions 🆕
fix.md: "description of each imóvel should pass thru the AI first, it should organize the info".
**Files:** `lib/listings/processing.ts` (add step), `lib/ai/*`, `components/listings/listing-description.tsx`
**Plan:** add an AI normalization step in `enrichScoreAndMatchListing` that cleans/structures the raw scraped description → store normalized field → render it. Depends on **B** (working AI provider).

### I. Client/investor fuzzy search 🆕
fix.md: "overall searching not searching for clients only (no fuzzy search)".
**Files:** `app/(app)/investors/page.tsx`, `investors-table.tsx`
**Plan:** add a search input scoped to investors; fuzzy match on name/email/tags (client-side filter or `ilike` server filter).

---

## P2 — Investigate / lower

- **J. Files section** 🟠 (tests.md L79-85 all unchecked) — verify `files-section.tsx` upload → `deal_files` row → signed URL → delete. May be broken.
- **K. Activity log** 🟠 (L88-90 unchecked) — verify activities render.
- **L. "Put notes in a deal"** 🟠 (fix.md) — ambiguous; notes section tests pass. Likely a UX/discoverability ask. Clarify.
- **M. Opportunity-score empty states** 🟠 (L142-143) — wire the two empty-state CTAs.

---

## 🟢 Design decisions — RESOLVED

1. **Strategy layer → condense into ONE simpler card.** Not a full delete. Merge "score por estratégia" + "fit por estratégia" into a single, simplified card on the listing detail. Keep the engine/tables; collapse the two UI surfaces (`strategy-fit-card.tsx` + the per-strategy bits of `opportunity-score-card.tsx`/`strategy-selector.tsx`) into one component showing the consolidated result. Reduce visual/cognitive load.
2. **AI description normalization → BOTH.** Extract structured fields (area, type, price, features) AND produce a cleaned PT-BR summary. One LLM call per listing at import. Depends on **B**. Store fields + normalized text; guard against hallucination (only use scraped data, mark uncertainty).
3. **Fuzzy search → Fuse.js.** Add `fuse.js` dependency; client-side typo-tolerant fuzzy over investor name/email/tags on `/investors`.

---

## Excluded from this plan
- **API ROUTES** (tests.md) — confirmed working.
- **Server Actions** section — unchecked in tests.md but exercised via passing UI flows; treated as working unless their UI fails.
- **UI Components / Edge Cases / Performance / Accessibility / DB State** sections — untested ≠ broken. Separate **verification backlog**, not fixes. Surface after P0–P1 land.
