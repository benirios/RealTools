# Feature Landscape: Opportunity Scoring Engine

**Domain:** Commercial real estate opportunity scoring / site selection intelligence
**Researched:** 2026-05-10
**Milestone:** v1.6 — Opportunity Scoring Engine
**Confidence:** HIGH for scoring categories and explainability patterns; HIGH for Brazil-specific context (OndeAbrir verified); MEDIUM for investor compatibility scoring (training data + web research)

---

## What Already Exists (Do Not Re-Implement)

The `location_insights` table already stores:

| Field | Type | Scoring Relevance |
|-------|------|-------------------|
| `avg_income` | NUMERIC | Demographics category input |
| `population_density` | NUMERIC | Foot traffic / market size input |
| `consumer_profile` | TEXT | Demographics category input |
| `nearby_businesses` | JSONB array | Competitor count, complementary POI count |
| `confidence_score` | INTEGER 0-100 | Data reliability signal, not opportunity score |
| `raw_demographics` | JSONB | Extended demographic signals |
| `raw_places` | JSONB | Extended nearby-business data |
| `latitude` / `longitude` | DOUBLE | Geocoded address for accessibility inference |

The scoring engine is a computation layer on top of this data — it does not replace or duplicate it. Every scoring category must map to fields already populated in `location_insights`.

---

## Score Range Convention

**Use 0–100 with four labeled bands.**

Rationale from research:
- OndeAbrir (leading Brazil CRE tool) uses 0–10 but with four bands (Green/Yellow/Orange/Red) — the bands are the primary UX signal
- GrowthFactor (US site selection platform) uses 0–100 with four-tier grading (Great/Good/OK/Bad at 80/70/60/<60 thresholds)
- Industry standard (S&P, investment rating frameworks) uses 0–100 + descriptive band
- Letter grades (A/B/C/D) are used in US property class ratings but carry investor-facing connotations that conflict with a site-selection context
- 0–100 is more legible for showing sub-score contributions (a 23/100 contribution from demographics means something; a 2.3/10 contribution is harder to parse in a UI)

**Recommended bands:**

| Range | Label | Color |
|-------|-------|-------|
| 80–100 | Strong | Green |
| 60–79 | Moderate | Yellow |
| 40–59 | Weak | Orange |
| 0–39 | Poor | Red |

---

## Scoring Categories

### Category Architecture

Six categories map to the five GrowthFactor lenses plus the Brazil-specific investor-fit dimension. Each category produces a sub-score 0–100. The composite score is a weighted average. Strategy profiles shift the weights.

| Category | What It Measures | Primary `location_insights` Fields |
|----------|-----------------|-------------------------------------|
| Demographics Fit | Income compatibility, population density, consumer profile match | `avg_income`, `population_density`, `consumer_profile`, `raw_demographics` |
| Location Quality | Accessibility, geocode confidence, address completeness | `latitude`, `longitude`, `confidence_score`, `address`, `neighborhood` |
| Foot Traffic Potential | Estimated foot traffic via POI proximity inference | `nearby_businesses` JSONB (transit, schools, malls), `raw_places` |
| Competition | Competitor density vs. demand consolidation signal | `nearby_businesses` JSONB (same-category businesses) |
| Risk | Data reliability, sector survival indicators, area volatility | `confidence_score`, `raw_demographics`, CNPJ trend data when available |
| Investor Fit | Match between property profile and investor strategy type | Derived from composite of other categories + deal price when linked |

---

## Table Stakes Features

Features that must exist for the scoring engine to feel complete and trustworthy. Absence makes the product feel like a toy.

| Feature | Why Expected | Complexity | location_insights Dependency |
|---------|--------------|------------|-------------------------------|
| Composite score 0–100 with band label | Every CRE scoring platform (GrowthFactor, OndeAbrir, S&P) shows a single headline number. Without it, brokers cannot rank properties. | Low | All category fields |
| Per-category sub-scores | A black-box composite score is useless ("a black-box score that says '78 out of 100' is useless if you can't explain what drives it" — GrowthFactor). Brokers need to see which dimension is weak. | Low-Med | Each category maps to specific fields |
| Strategy profile selector | Different businesses need different weights. A café and a logistics center have opposite requirements (pedestrian flow vs. highway access). This is the minimum viable customization. | Med | No new fields; weights are engine config |
| Explainability text per category | "High income area but low foot traffic" — plain-language justification. OndeAbrir does this. GrowthFactor calls it "glass box." Absence makes scores feel arbitrary. | Med | Derived from field values |
| Top positive signals list | Brokers need 2–3 bullet points of "why this location is good" for their pitch to buyers/investors. | Low | Derived from above-threshold category scores |
| Risk flags list | Investors/brokers expect explicit downside signals. A score of 72 with no risk context is irresponsible. | Low-Med | `confidence_score`, competitor density, income thresholds |
| Score persistence per property/strategy | Scores must be saved so brokers can compare across listings without recomputing. Retrieval by listing or by strategy type is needed. | Low | New `opportunity_scores` table; FK to `location_insights` |
| Score recomputation on demand | Location data can be refreshed. Score should be recomputable deterministically from current `location_insights` data. | Low | Pure function: `location_insights` → score |

---

## Differentiators

Features that go beyond what basic scoring tools offer and create meaningful competitive advantage for RealTools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 22-business-type strategy profiles | OndeAbrir supports 22 business types. Most Brazilian brokers deal in pontos comerciais for specific sectors. A pharmacy score vs. a café score should produce meaningfully different results for the same address. | Med | Start with 6–8 common types; schema should accommodate 22 |
| "Best fit business type" recommendation | Rather than only scoring a user-selected strategy, surface the strategy with the highest score for this location. Answers "what should go here?" which brokers find more useful than "how good is this for X?" | Med | Requires computing all strategy scores and picking top 2–3 |
| Investor profile compatibility | Map the composite score to investor risk archetype: Core (stable, cash-flow driven), Value-Add (needs improvement work), Opportunistic (repositioning/development play). Investors in Brazil use these same archetypes. | Med | Derived rule: high scores → Core; mid with weak factors → Value-Add; low → Opportunistic |
| Score trend over time | If the same listing is scored at two points in time, show whether the opportunity is improving or deteriorating. Relevant when location data is refreshed. | Med-High | Requires keeping prior score records rather than overwriting |
| CNPJ sector trend integration | OndeAbrir uses Receita Federal CNPJ opening/closure data (2015–2024) to flag whether a business category is growing or dying in the area. This is uniquely Brazil-relevant and differentiating. | High | Requires CNPJ data pipeline; flag for Phase 2 |
| Score comparison across listings | Side-by-side score cards for 2–3 listings lets the broker recommend the best opportunity to an investor without building a spreadsheet. | Med | Requires storing scores; UI addition only |

---

## Anti-Features

Things to explicitly not build in v1.6. Each one adds scope without proportional value at this stage.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| ML-based scoring | Requires training data that doesn't exist yet. Rule-based deterministic logic is faster to iterate, easier to debug, and fully explainable without SHAP analysis. | Deterministic weighted rules. Schema should be ML-upgrade-ready by keeping raw scores separate from weights. |
| Real-time foot traffic data | Placer.ai, Foursquare, and Safegraph data costs money and requires licensing. Mobile device signals are not available without a paid provider. | Use POI proximity as a foot traffic proxy. Nearby transit, schools, malls, and business density are strong predictors. |
| Predictive revenue forecasting | "Previsão de faturamento" (Cognatis/MapPoint) requires sector-specific models, historical data, and market calibration. Out of scope for rule-based MVP. | Surfaces risk flags and comparative scoring only; no revenue estimate. |
| User-configurable weights UI | Letting brokers drag sliders to adjust weights adds UI complexity and undermines the strategy-profile concept. Brokers are not data scientists. | Strategy profiles abstract weights. If a broker needs a custom profile, that is a later power-user feature. |
| Score as a valuation or appraisal | Brazilian property valuation (Avaliação de Imóveis) is a regulated profession (CREA/IBAPE). Calling the score a "valuation" creates legal risk. | Frame as "opportunity attractiveness" or "fit score" — not a price estimate or formal appraisal. |
| Nationwide competitive benchmarking | "How does this property rank among all São Paulo properties?" requires ingesting all listings in a market. The data pipeline is not there yet. | Rank within a user's own portfolio of scored listings; relative ranking within a session. |
| ESG scoring | ESG-aligned real estate is trending in Brazil (2025 IBRESP data). But ESG metrics (energy efficiency, sustainability certification) have no fields in `location_insights`. | Defer; note as a future differentiator once the data model grows. |

---

## Scoring Logic Per Strategy Profile

Research finding: the same five dimensions apply to all strategies, but the weights shift dramatically.

| Strategy | Demographics Weight | Foot Traffic Weight | Competition Weight | Location Quality Weight | Risk Weight | Investor Fit Weight |
|----------|--------------------|--------------------|-------------------|------------------------|-------------|---------------------|
| Café / Coffee Shop | 20% | 30% | 15% | 20% | 10% | 5% |
| Quick-Service Restaurant | 20% | 30% | 15% | 20% | 10% | 5% |
| Pharmacy / Drugstore | 25% | 15% | 25% | 20% | 10% | 5% |
| Logistics / Warehouse | 10% | 5% | 10% | 40% | 20% | 15% |
| Office / Professional Services | 30% | 10% | 10% | 25% | 15% | 10% |
| Retail / Clothing / General | 20% | 25% | 20% | 20% | 10% | 5% |
| Healthcare Clinic | 30% | 10% | 20% | 20% | 10% | 10% |
| Dark Kitchen / Delivery-Only | 25% | 0% | 20% | 25% | 20% | 10% |

**Weighting rationale:**
- Café/QSR: foot traffic is the dominant signal; high pedestrian flow compensates for moderate demographics
- Pharmacy: competition is critical — a pharmacy with 8 competitors within 500m "will struggle with minimal margins" (OndeAbrir research); income also matters for prescription volume
- Logistics: accessibility (location quality) dominates; pedestrian flow is irrelevant; risk is higher due to regulatory/zoning requirements
- Dark Kitchen: foot traffic irrelevant (delivery-only); population density at address matters more than street-level flow

---

## Explainability Patterns

Research finding: "glass box" scoring (every component visible, plain-language rationale) is the emerging standard and what differentiates modern tools from legacy black-box scores.

### Standard Pattern (GrowthFactor, OndeAbrir, S&P CRE Scorecard)

1. **Headline score** — single number (0–100) with band label
2. **Category breakdown bar chart or score ring** — each category sub-score visible
3. **Positive signals list** — 2–4 bullet points ("High income area: avg R$4,200/mo", "Low competition: 2 pharmacies within 1km")
4. **Risk flags list** — 1–3 bullet points ("Low data confidence: 45/100", "High competition density for cafés")
5. **Strategy fit label** — "Best fit: Quick-Service Restaurant (82), Pharmacy (74), Retail (61)"
6. **Investor type label** — "Profile match: Value-Add investor" with one-line rationale

### Traffic-Light (RAG) Pattern

Used as a secondary signal at the category level. Each category shows Green/Yellow/Orange/Red based on its sub-score band. Provides at-a-glance health check without requiring the broker to interpret numbers.

### What Not To Do

- Do not show raw field values (avg_income: 3800) without contextual label — raw numbers without benchmarks are not actionable
- Do not show a single composite score without the breakdown — brokers will not trust it
- Do not use confidence language ("possibly," "may be") in positive signals — it erodes trust in the tool

---

## Investor Compatibility Scoring

Research finding: the Core / Core-Plus / Value-Add / Opportunistic taxonomy is the universal framework for investor-property matching in CRE, used by institutional (LenderBox, FNRP, Adventures in CRE) and Brazilian platforms alike.

### Mapping Rules

| Composite Score | Investor Profile | Rationale |
|-----------------|-----------------|-----------|
| 75–100 | Core | Stable, high-quality location; predictable cash flow; low risk |
| 55–74 | Core-Plus | Good fundamentals with one or two addressable weaknesses |
| 35–54 | Value-Add | Below-average performance in key category; opportunity to improve |
| 0–34 | Opportunistic | Fundamental weaknesses; high-risk repositioning play |

**Modifier rules:**
- If Risk sub-score < 40: shift one tier toward Opportunistic regardless of composite
- If Location Quality sub-score > 85 AND Demographics > 80: can upgrade to Core even at 70+ composite
- If data confidence_score < 50: display "Investor profile requires higher-confidence data" warning

---

## MVP Scoring Category Definitions for Brazil

Minimum viable definitions using only existing `location_insights` fields:

### Demographics Fit (0–100)
Inputs: `avg_income`, `population_density`, `consumer_profile`

Rules:
- Base score from income bracket relative to strategy minimum (e.g., café needs R$2,500+/mo avg income)
- Density multiplier: >5,000 people/km² = bonus, <500 = penalty
- Consumer profile text match: if profile contains strategy-relevant keywords (e.g., "jovem urbano" for café), apply bonus

### Location Quality (0–100)
Inputs: `confidence_score`, `latitude/longitude` presence, `address` completeness, `neighborhood`

Rules:
- `confidence_score` is the primary input (0–100 from the enrichment pipeline, maps directly)
- Full geocode (lat+lon present) adds bonus
- Neighborhood populated adds bonus
- Degraded to 0 if city or state is missing

### Foot Traffic Potential (0–100)
Inputs: `nearby_businesses` JSONB, `raw_places` JSONB

Rules (proxy-based since real-time data is not available):
- Count transit stops, schools, malls, supermarkets in `nearby_businesses` within 500m
- Each traffic-generating POI type adds weighted points
- For logistics strategy: this score is set to 0 (irrelevant by definition)

### Competition (0–100)
Inputs: `nearby_businesses` JSONB filtered by same business category

Rules:
- Count competitors within 500m and 1km radius
- 0 competitors within 500m = very high score
- 1–3 within 500m = moderate (may indicate consolidated demand for high-frequency categories like café)
- 4+ within 500m = low score for most strategies
- Exception for "demand-consolidating" categories (cafés in malls): cluster score bonus

### Risk (0–100)
Inputs: `confidence_score`, derived from demographic and competition signals

Rules:
- Low data confidence (< 40) = high risk flag
- Very high competition (see above) = adds risk
- Missing income data = moderate risk flag
- Score is INVERTED: high risk = low score (consistent with other categories where higher = better)

### Investor Fit (0–100)
Inputs: Derived from composite of above categories using strategy weights

Rules:
- Computed last; uses a weighted composite of the other five categories
- Represents how well the property's overall profile matches the investor's likely expectations
- Outputs both a 0–100 score and the investor archetype label (Core / Core-Plus / Value-Add / Opportunistic)

---

## Feature Dependencies

```
location_insights (existing)
  └─ scoring engine (pure function: insight + strategy → scored result)
       ├─ Demographics Fit score
       ├─ Location Quality score
       ├─ Foot Traffic score
       ├─ Competition score
       ├─ Risk score
       └─ Investor Fit score (derived from above)
            └─ Composite score (weighted average by strategy)
                 └─ Explainability layer (positive signals, risk flags, best-fit label)
                      └─ opportunity_scores table (persisted per listing/strategy)
                           └─ Score Card UI (breakdown, strategy selector, risk indicators)
                                └─ "Best fit business" recommendation (score all strategies, surface top 2–3)
```

No circular dependencies. Scoring engine is a pure deterministic function; UI and persistence are downstream consumers.

---

## Brazil-Specific Context Notes

- **IBGE data** already integrated in `raw_demographics` — income and population density are available
- **CNPJ trend data** (Receita Federal business opening/closure by sector) is a high-value differentiator but requires a separate data pipeline — defer to Phase 2
- **OndeAbrir** is the closest Brazilian competitor: 0–10 scale, 12 indicators, 22 business types, IBGE + Receita Federal data. RealTools should match their category coverage at minimum.
- **Brazilian brokers** (corretores de imóveis comerciais) are familiar with "ponto comercial" evaluation criteria. The explainability output should use Portuguese-friendly labels: "Fluxo de Pedestres," "Concorrência," "Potencial Demográfico"
- **Renda per capita** context: Brazil income brackets differ substantially from US baselines. Scoring thresholds must use BRL benchmarks (e.g., R$2,000–4,000/mo = middle class in most cities)
- **Zoning awareness**: Brazilian commercial zoning (Zona Comercial, Zona Mista) is relevant for logistics and healthcare strategies but is not currently in `location_insights` — treat as a future enhancement

---

## Sources

- OndeAbrir — https://ondeabrir.com/blog/como-saber-se-ponto-comercial-e-bom (HIGH confidence — primary Brazil market reference, IBGE + Receita Federal methodology verified)
- OndeAbrir — https://ondeabrir.com/blog/como-analisar-ponto-comercial (HIGH confidence)
- GrowthFactor 5 Lenses — https://www.growthfactor.ai/resources/blog/five-lenses-site-scoring-framework (HIGH confidence — current platform documentation)
- Adventures in CRE Risk Profiles — https://www.adventuresincre.com/a-cre-101-cre-risk-profiles/ (HIGH confidence — CRE education resource)
- Lornell RE Site Selection Framework — https://www.lornellre.com/insights/how-to-evaluate-commercial-property-location (MEDIUM confidence)
- LenderBox Five-Dimensional Framework — https://lenderbox.ai/risk-assessment (MEDIUM confidence)
- CoreCast CRE Competitive Analysis — https://www.corecastre.com/corecast-blog/key-challenges-in-competitive-analysis-for-cre (MEDIUM confidence)
- Investment Rating for Real Estate (Wikipedia) — https://en.wikipedia.org/wiki/Investment_rating_for_real_estate (MEDIUM confidence)
- Project context: `/Users/beni/Dev/RealTools/.planning/PROJECT.md`
- Existing schema: `/Users/beni/Dev/RealTools/supabase/migrations/011_location_insights.sql`
