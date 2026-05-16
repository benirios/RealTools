# Requirements: RealTools v1.6 Opportunity Scoring Engine

**Defined:** 2026-05-10
**Core Value:** Brokers can instantly see how attractive a commercial property is for a specific business strategy, with an explainable score that surfaces the strongest signals and top risks.

## v1.6 Requirements

### Scoring Engine

- [ ] **SCO-01**: System stores opportunity scores per property/strategy combination in a dedicated `opportunity_scores` table with RLS, listing linkage, and a UNIQUE constraint on `(user_id, listing_id, strategy_slug)`.
- [ ] **SCO-02**: Scoring engine computes a composite 0–100 score from five weighted categories: Demographics Fit, Location Quality, Foot Traffic Potential, Risk, and Investor Fit.
- [ ] **SCO-03**: Strategy profiles for café, logistics, and pharmacy define distinct category weight distributions, producing meaningfully different score rankings for each business type (each profile differs from the median by >15 pts in at least one category).
- [ ] **SCO-04**: Each score includes a full breakdown: per-category sub-scores (0–100), the weight applied, and a list of positive signals and risk flags per category.
- [ ] **SCO-05**: The engine derives a plain-language explainability payload: top 3–5 positive signals and top 3 risk flags, in Portuguese.
- [ ] **SCO-06**: The engine assigns a fit label (`forte`, `moderado`, `fraco`) based on total score thresholds (≥70 = forte, ≥50 = moderado, <50 = fraco).
- [ ] **SCO-07**: Scoring logic is deterministic and rule-based. Same inputs always produce the same output. No ML or external API calls during scoring.
- [ ] **SCO-08**: Score computation requires a `location_insights` row for the listing. If none exists, the system returns a clear error directing the broker to enrich the location first.

### API

- [x] **SCO-09**: `POST /api/listings/[id]/score` computes and saves a score for a given `strategy_slug`. Returns the saved `ScoreResult`.
- [x] **SCO-10**: `GET /api/listings/[id]/score?strategy=[slug]` retrieves the latest saved score for that strategy.
- [x] **SCO-11**: Scores can be recomputed on demand. Recomputation increments `score_version` and overwrites the existing row.
- [x] **SCO-12**: API endpoints are user-scoped (auth check + `user_id` filter on all DB reads/writes).

### UI

- [x] **SCO-13**: Broker can select a strategy from a strategy selector on the listing detail page (`/imoveis/[id]`) and trigger scoring with one action.
- [x] **SCO-14**: Score card displays: total score (0–100) with color band (green/yellow/orange/red), strategy label, fit label, per-category breakdown bars, top positive signals, and top risk flags.
- [x] **SCO-15**: If no `location_insights` row exists for the listing, the score card shows a clear prompt to enrich the location first instead of rendering a score.
- [x] **SCO-16**: When no saved score exists yet for the selected strategy, the card shows a clear call-to-action to compute the score.

### Testing

- [ ] **SCO-17**: Unit tests cover: scoring consistency (same inputs → same output), strategy weight shifting (same listing scores differently for café vs. logistics), explainability output shape, and all five category functions independently.
- [x] **SCO-18**: Integration tests cover: score save/fetch round-trip, missing location insight error path, recompute increments `score_version`.
- [x] **SCO-19**: System scores all three strategy profiles for a listing and surfaces the top 1–2 best-fit business types based on highest composite score.
- [x] **SCO-20**: Each on-demand recompute creates a new score version (increments `score_version`); user can view the score history for a listing/strategy combination.

## Future Requirements

### Scoring Expansion

- **SCO-F1**: Score trend visualization — chart score changes across versions to show whether opportunity is improving or deteriorating.
- **SCO-F2**: Score comparison across listings — side-by-side score card view for 2–3 listings under the same strategy.
- **SCO-21**: Score comparison across listings — side-by-side score card view for 2–3 listings under the same strategy.

### Brazilian Market Data Expansion

- **SCO-22**: CNPJ sector trend integration — use Receita Federal business opening/closure data to flag whether a business category is growing or dying in the area.
- **SCO-23**: Zoning data — incorporate Brazilian commercial zoning (Zona Comercial, Zona Mista) as a factor in the Logistics and Healthcare clinic strategy profiles.

## Out of Scope

| Feature | Reason |
|---------|--------|
| ML-based scoring | No training data exists yet. Deterministic rule-based scoring is the right first step and easier to inspect, debug, and iterate. |
| Real-time foot traffic data (Placer.ai, Foursquare, Safegraph) | Requires paid API licensing. POI proximity is an adequate proxy for v1.6. |
| User-configurable weight sliders | Adds UI complexity and undermines the strategy-profile concept. Not needed while broker UX is still being validated. |
| Score framed as formal property valuation | Avaliação de Imóveis is a regulated profession in Brazil. The score is an "opportunity attractiveness" indicator, not a valuation. |
| Nationwide competitive benchmarking | Requires ingesting all market listings. Relative ranking within the user's own portfolio is sufficient for v1.6. |
| ESG scoring | No ESG data fields in `location_insights`. Defer until data model grows. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCO-01 | Phase 16 | Pending |
| SCO-02 | Phase 16 | Pending |
| SCO-03 | Phase 16 | Pending |
| SCO-04 | Phase 16 | Pending |
| SCO-05 | Phase 16 | Pending |
| SCO-06 | Phase 16 | Pending |
| SCO-07 | Phase 16 | Pending |
| SCO-08 | Phase 16 | Pending |
| SCO-09 | Phase 17 | Complete |
| SCO-10 | Phase 17 | Complete |
| SCO-11 | Phase 17 | Complete |
| SCO-12 | Phase 17 | Complete |
| SCO-13 | Phase 18 | Complete |
| SCO-14 | Phase 18 | Complete |
| SCO-15 | Phase 18 | Complete |
| SCO-16 | Phase 18 | Complete |
| SCO-17 | Phase 16 | Pending |
| SCO-18 | Phase 17 | Complete |
| SCO-19 | Phase 17 | Complete |
| SCO-20 | Phase 17 | Complete |

**Coverage:**
- v1.6 core requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-05-10*
*Research basis: .planning/research/FEATURES.md, ARCHITECTURE.md, STACK.md*
