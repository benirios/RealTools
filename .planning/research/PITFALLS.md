# Domain Pitfalls

**Domain:** CRE Opportunity Scoring Engine — adding rule-based weighted scoring to an existing Next.js App Router + Supabase RLS platform
**Milestone:** v1.6 Opportunity Scoring Engine
**Researched:** 2026-05-10
**Overall confidence:** HIGH for integration pitfalls (verified against existing codebase); MEDIUM for scoring design pitfalls (industry patterns + first-principles analysis)

---

## Context: What Already Exists

Before reading these pitfalls, understand the terrain this scoring engine lands in:

- `location_insights` table stores `avg_income`, `population_density`, `nearby_businesses` (JSONB), and a `confidence_score` (0–100). Providers are `nominatim`, `ibge_sidra`, `mock`, and `passthrough`. The mock provider is active for most demographics.
- `listings` table has `is_commercial`, `confidence`, `lat`, `lng`, `state`, `city`, `neighborhood` — all nullable.
- `location_insights` has a `UNIQUE(user_id, listing_id)` constraint — one insight per listing per user.
- The existing `investors` table (migration 010) has `strategy` and `risk_level` columns — a hint at strategy concepts that predated this milestone.
- All tables use RLS with `auth.uid() = user_id` policies. Service role is restricted to server-only modules.
- No Zustand/Redux — server components + server actions + `revalidatePath` only.

---

## Critical Pitfalls

Mistakes that cause rewrites, user trust collapse, or security regressions.

---

### Pitfall 1: Scoring Mock Data Without Flagging It — The Silent Credibility Bomb

**Confidence:** HIGH

**What goes wrong:**
The location intelligence layer already uses mock providers for demographics (provider value `'mock'` in `DemographicEstimate`). When the scoring engine consumes `avg_income: null` or `populationDensity: null` from a mock source and produces a score of, say, 72/100, the broker sees 72 — not "72 computed from placeholder data." The score looks authoritative. The broker uses it to guide a client decision.

This is the single highest-risk pitfall for this milestone. The existing provider system already has `fallback: boolean` and `confidence` fields on `LocationIntelligenceDataSource`. The scoring engine must read these and propagate the warning visibly.

**Why it happens:**
Scoring logic is written and tested against fixtures where all fields are populated. The mock case is never run during development because the developer uses seeded data. The warning path is skipped because it "adds complexity."

**Consequences:**
- Broker trusts a score derived from placeholder demographics
- Wrong strategy recommended to a commercial buyer
- When broker discovers scores were meaningless, the entire product loses credibility — not recoverable in a small-broker trust economy

**Prevention:**
1. The score output type must carry a `dataQuality` object: `{ hasMockData: boolean, missingFields: string[], overallConfidence: number }`.
2. If any upstream `LocationIntelligenceDataSource` has `fallback: true`, the score card UI must render a visible warning: "Score based on estimated data — enrich this location for a reliable result."
3. The scoring engine must distinguish between "field is null (not available)" and "field is zero (genuinely zero)." A `populationDensity: null` should not be treated as a low-density area; it should trigger the mock-data warning path.
4. Test the scoring engine explicitly with mock-provider inputs. This must be a required test case, not optional.

**Detection:**
- Score card shows no data quality indicator at all
- `data_sources` array in `location_insights` contains entries with `fallback: true` but no warning appears in the UI
- Score of 65–85 appears for a listing whose `location_insights` has `avg_income: null`

**Phase to address:** Phase 1 of scoring milestone (schema + engine design). The `dataQuality` field must be in the output schema before any scoring logic is written.

---

### Pitfall 2: The Always-High Score Problem — No Floor and No Spread

**Confidence:** HIGH

**What goes wrong:**
Rule-based scoring with additive weights and lenient zero-handling produces a systematic floor. If every category defaults to "neutral" (e.g., 50/100) when data is missing, and weights sum to 100, then a listing with no data at all scores 50. Add mild positive signals (a few nearby businesses, a mid-range income estimate) and the score reaches 65–75. Now most listings in a real batch score 60–80 and the engine loses all discrimination power.

The broker presents three listings to a client and all three show "Opportunity Score: 74, 71, 78." This is useless for decision-making.

**Why it happens:**
Engineers set defaults to avoid NaN/undefined, always picking neutral midpoint values. The weights feel correct individually but the aggregate behavior is never tested against a real distribution of listings.

**Consequences:**
- Score card becomes a decorative badge, not a decision tool
- Broker stops consulting it after week one
- Feature is shipped but unused — wasted milestone

**Prevention:**
1. After the engine is built but before UI work, run it against at least 20–30 real OLX listings from the existing database. Check the score distribution. If the standard deviation is less than 10 points, the engine is not differentiating.
2. Use multiplicative penalties for data absence, not neutral defaults. If `avg_income` is null, do not award "half points" — award zero for that sub-component and flag it explicitly.
3. Hard-code at least one "show stopper" rule that can drive a score below 30: e.g., no geocoded coordinates, zero nearby businesses, and null demographics simultaneously.
4. Cap the "neutral default score" deliberately: a listing with missing data should score in the 20–40 range, not 50.

**Detection:**
- Score histogram for a batch of 20+ listings clusters in a 15-point band
- No listing in real data ever scores below 40 or above 85
- Strategy switching (café vs. logistics) produces score changes of less than 5 points

**Phase to address:** Phase 1 (engine design) and Phase 2 (engine validation against real data before UI).

---

### Pitfall 3: Upstream Data Dependency Trap — Scoring Requires Location Insight That May Not Exist

**Confidence:** HIGH (specific to this codebase)

**What goes wrong:**
The scoring engine will depend on `location_insights` rows to access demographics and nearby businesses. But `location_insights` has a `UNIQUE(user_id, listing_id)` constraint and is populated on demand — the broker must trigger enrichment first. Many listings in the existing database have no associated `location_insights` row at all.

If the scoring engine throws an error, returns null, or silently produces a default score when `location_insights` is absent, the broker encounters one of:
- A crash when opening the score tab
- A score with no indication that enrichment is required first
- A prompt to enrich, but enrichment itself fails because the listing has no `lat`/`lng` (also nullable)

**Why it happens:**
The scoring engine is developed with seeded data that always has a corresponding `location_insights` row. The "no insight yet" code path is the last thing tested.

**Consequences:**
- Score tab unusable for most listings until enrichment is manually triggered
- If enrichment is hidden behind a different UI flow, the broker never figures out why scores are missing
- Listings imported from OLX without geocoding produce silent failures throughout

**Prevention:**
1. The scoring engine must have three explicit states: `SCORED`, `NEEDS_ENRICHMENT`, `ENRICHMENT_FAILED`. These states must be reflected in the UI before score values are shown.
2. The score API must check for `location_insights` presence before computing. If absent, return `{ state: 'NEEDS_ENRICHMENT', score: null }` — not an error.
3. If `location_insights` exists but `lat`/`lng` are null, the nearby-businesses sub-score must be zeroed and flagged, not estimated.
4. In the score card UI, the primary CTA for a listing in `NEEDS_ENRICHMENT` state is "Enrich this location" — which triggers the existing enrichment flow.

**Detection:**
- Score request for a listing without `location_insights` throws a 500 or returns a malformed response
- Score card renders with all zeros and no explanation for unenriched listings
- Listings with `lat: null` in the `listings` table produce no visible difference in score breakdown

**Phase to address:** Phase 1 (engine design). The state machine must be designed before any scoring logic is written.

---

### Pitfall 4: Hard-Coded Weights That Cannot Be Explained or Updated Without a Deploy

**Confidence:** HIGH

**What goes wrong:**
The first version stores strategy weight profiles as TypeScript constants:

```typescript
// DO NOT DO THIS
const CAFE_WEIGHTS = {
  demographics: 0.30,
  locationQuality: 0.25,
  nearbyBusinesses: 0.20,
  competition: 0.10,
  risk: 0.10,
  investorFit: 0.05,
}
```

This is fine for the first deploy. But three sprints later, a broker says "pharmacies don't care about demographics, they care about foot traffic." The developer updates `PHARMACY_WEIGHTS`, deploys, and now every previously-saved pharmacy score in the database is wrong — but still stored and displayed as if they were computed with the new weights.

The version gap between stored scores and current weights is silent. There is no way to tell, looking at a stored score, which weight version produced it.

**Why it happens:**
Version tracking for weights feels like premature engineering. It is skipped. Two months later it becomes a correctness crisis.

**Consequences:**
- Stored scores silently become stale after any weight change
- A/B testing different weight profiles is impossible without a schema migration
- Explaining "why did this score change?" to a broker is not possible

**Prevention:**
1. Store strategy weight profiles in the database (`scoring_profiles` table), not in TypeScript constants.
2. Every stored score row must include a `profile_version` column (or a `profile_id` FK) that references the weight profile used to compute it.
3. When weights change, either: (a) mark all existing scores as stale and trigger recomputation, or (b) keep the old profile as a read-only version and create a new one.
4. Expose the weight breakdown in the score card UI ("Demographics: 30% weight, score 68 → contributes 20.4 pts") so brokers can verify and trust the calculation.

**Detection:**
- Weight profile changes require modifying a TypeScript file and redeploying
- No `profile_version` or `computed_with_weights` metadata on stored score rows
- Scores from 3 months ago appear with no indication they used different weights

**Phase to address:** Phase 1 (schema design). The `scoring_profiles` table must exist before any scoring logic is written.

---

### Pitfall 5: Scores Table Schema That Cannot Be Queried, Filtered, or Compared

**Confidence:** HIGH

**What goes wrong:**
The tempting shortcut is to store the entire score as a single JSONB blob:

```sql
-- ANTI-PATTERN
CREATE TABLE property_scores (
  id UUID PRIMARY KEY,
  listing_id UUID,
  strategy TEXT,
  score_data JSONB -- contains total_score, breakdown, flags, everything
);
```

This produces two problems:

**Problem A — Query hell:** "Show me all listings where demographics score > 60 for the café strategy" requires `score_data->>'demographics_score' > 60` with a cast. No index, slow scan, fragile string casting.

**Problem B — ML migration blocker:** When the time comes to train a model, you need a feature matrix. Each score component is a training feature. If those components are buried in JSONB, extraction requires a migration and a messy ETL step. With normalized columns, the feature matrix is a single SELECT.

**Prevention:**

Store scores with normalized columns for the components that will be queried or trained on, and a JSONB column only for the explainability narrative text:

```sql
CREATE TABLE property_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id            UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy              TEXT NOT NULL,
  profile_version       INTEGER NOT NULL DEFAULT 1,
  total_score           NUMERIC(5,2) NOT NULL,
  demographics_score    NUMERIC(5,2),
  location_score        NUMERIC(5,2),
  businesses_score      NUMERIC(5,2),
  competition_score     NUMERIC(5,2),
  risk_score            NUMERIC(5,2),
  investor_fit_score    NUMERIC(5,2),
  data_quality          TEXT NOT NULL DEFAULT 'full', -- 'full' | 'partial' | 'mock'
  has_mock_data         BOOLEAN NOT NULL DEFAULT false,
  missing_fields        TEXT[] DEFAULT '{}',
  explanation           JSONB NOT NULL DEFAULT '{}', -- human-readable breakdown text only
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id, strategy)
);
```

Index on `(user_id, strategy, total_score)` for "list my best café opportunities."

**Detection:**
- Score table has a single `score_data JSONB` column
- No composite index on `(user_id, strategy, total_score)`
- Filtering by score component requires `score_data->>'field'::numeric > value` syntax

**Phase to address:** Phase 1 (schema). This cannot be retrofitted without a full data migration.

---

### Pitfall 6: RLS on the Scores Table — Three Common Failures

**Confidence:** HIGH (specific to this codebase and project rules)

**What goes wrong:**

**Failure A — RLS not enabled at all:** The existing codebase rules require RLS on every table. New tables added in haste during feature development often skip the pattern. A `property_scores` table without RLS exposes one broker's property evaluations to another.

**Failure B — Policy references `listing_id` without checking ownership:** A policy like `USING (listing_id IN (SELECT id FROM listings))` checks that the listing exists but not that the listing belongs to `auth.uid()`. One broker can query another broker's scores for any listing.

**Failure C — Score recomputation triggered via a route that lacks `getUser()` check:** If scoring is triggered by a button that hits an API route (`/api/score`), and that route reads `listing_id` from the request body without verifying the listing belongs to the requester, any authenticated user can score any listing and persist the result.

**Correct pattern:**

```sql
-- Migration must include both
ALTER TABLE property_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scores"
  ON property_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

For the server action that triggers scoring:

```typescript
// server action — always verify ownership before scoring
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')

const listing = await supabase.from('listings')
  .select('id')
  .eq('id', listingId)
  .eq('user_id', user.id)  // ownership check
  .single()
if (!listing.data) throw new Error('Listing not found')
```

**Phase to address:** Phase 1 (schema migration). RLS in the same migration as table creation. Ownership check in the server action before any scoring logic runs.

---

### Pitfall 7: Strategy Profiles That Produce Identical or Near-Identical Scores

**Confidence:** HIGH

**What goes wrong:**
If five strategy profiles (café, pharmacy, logistics, retail, restaurant) all assign 25–30% weight to demographics and 20–25% to location quality, the profiles are effectively the same engine with a thin veneer of naming. A listing that scores 74 for "café" also scores 71 for "logistics" and 73 for "pharmacy." The broker sees the strategy selector as cosmetic.

This is especially easy to produce when:
- All profiles are derived by copying the default profile and adjusting weights by 5%
- "Competition" and "nearby businesses" sub-scores are calculated identically regardless of strategy (a pharmacy doesn't care if there are many coffee shops nearby, but a café very much does)
- The strategy profiles are defined without first writing "what makes THIS strategy score high" in plain English

**Prevention:**
1. Before coding any weight profile, write a one-paragraph strategy definition: "A café scores high when: population density > X, avg income in Y range, few competing cafés within 500m, high foot-traffic business density nearby (restaurants, offices), visibility score high."
2. Each strategy must have at least one weight category where it differs from the median profile by more than 15 percentage points.
3. After building all profiles, score the same 10 listings across all strategies and produce a heatmap. If the rankings are identical across strategies, the profiles need rework.
4. "Competition" scoring must be strategy-aware: a high density of coffee shops is negative for café but irrelevant for logistics. If the competition sub-score is computed identically regardless of strategy, fix that first.

**Detection:**
- Ranking of 10 listings is the same across 3+ strategies
- Weight differences between any two profiles are less than 5% per category
- "Competition" sub-score computation ignores `strategy` parameter

**Phase to address:** Phase 1 (strategy profile design). Profile definitions must exist in writing before implementation.

---

## Moderate Pitfalls

---

### Pitfall 8: Server Action vs. API Route Choice for Scoring Triggers

**Confidence:** HIGH (specific to project tech stack rules)

**What goes wrong:**
The project rule is: no Zustand/Redux, server components + server actions + `revalidatePath` only. But scoring has characteristics that tempt API routes:

- Scoring can be slow (multiple DB reads, enrichment check, computation)
- The broker may want to trigger scoring from the listing detail page without a form submit
- Future webhook or cron-based recomputation needs an HTTP endpoint

If scoring is put behind an API route (`/api/score`), three new problems appear:
1. The API route does not automatically revalidate the score card component — `revalidatePath` is only available in Server Actions and Route Handlers, but the developer must call it explicitly
2. API routes are harder to protect against CSRF if they accept JSON POST bodies
3. The project's "no client-side state management" rule gets violated as soon as the client needs to poll for the score result

**Recommended pattern:**
Use a Server Action for the "score this listing" trigger (covers the button-click case, handles `revalidatePath`, enforces auth via `getUser()`). Use an API Route Handler only for the recomputation webhook/cron path, and that route must verify a shared secret, not a user session.

**Detection:**
- Score trigger button uses `fetch('/api/score', ...)` in a Client Component
- No `revalidatePath` called after a score is computed and persisted
- Score card shows stale score after recompute because cache was not invalidated

**Phase to address:** Phase 2 (scoring API). Decide the trigger pattern before implementing the score card UI.

---

### Pitfall 9: Explainability Output That Confuses More Than It Helps

**Confidence:** MEDIUM

**What goes wrong:**
Explainability is a feature that sounds simple but requires more design thought than the scoring math itself. Three common anti-patterns:

**Anti-pattern A — Raw numbers without context:**
"Demographics score: 43.7 / 100. Weight: 0.30. Contribution: 13.1 pts."
A broker has no idea if 43.7 is good or bad for demographics. Numbers alone do not explain.

**Anti-pattern B — Too many signals at once:**
Listing every sub-factor ("foot traffic index: 0.62, income percentile: 0.44, competitor density: 0.81, transit score: N/A, zoning risk: low") creates cognitive overload. The broker cannot extract the single most important insight.

**Anti-pattern C — Generic positive framing:**
"This location has decent demographics" — meaningless filler. Or always-present risk flags ("Market conditions may change") that apply to every property and train brokers to ignore the entire risk section.

**Good explainability for this context:**
- Maximum 3 "why this score is high" signals in plain Portuguese/English
- Maximum 3 risk flags — only real, specific flags, not generic ones
- One "best fit business type" recommendation with a one-sentence reason
- For each category score, a simple label: "Strong / Moderate / Weak / Insufficient Data"
- The JSONB `explanation` field in the scores table stores the text; the UI renders it without arithmetic

**Detection:**
- Explanation JSON has more than 5 top-level keys
- Risk section says "data may be incomplete" for every listing
- Broker testing reveals they scroll past the breakdown to see only the number

**Phase to address:** Phase 2 (score card UI design). Write the explanation format spec before implementing the engine's explanation generator.

---

### Pitfall 10: UNIQUE Constraint on `(user_id, listing_id, strategy)` — Recomputation and Version Drift

**Confidence:** MEDIUM

**What goes wrong:**
Recommended schema (Pitfall 5) includes `UNIQUE(user_id, listing_id, strategy)`. This means upsert-on-conflict is used when recomputing. Two issues:

**Issue A — Stale scores appear fresh:** After weight profiles change, old score rows are overwritten by new ones with the same key. The `computed_at` timestamp updates but there is no indication the weights changed between the first and second computation.

**Issue B — Comparing scores across time is impossible:** If a broker wants to see "did this location improve after new demographic data was loaded?", overwriting the previous score deletes that history.

**Prevention:**
1. Keep the UNIQUE constraint for the "current score" pattern (one active score per listing/strategy) — this is correct for the MVP.
2. Add `profile_version` to the unique constraint: `UNIQUE(user_id, listing_id, strategy, profile_version)`. When weights change, bump the version. Old scores remain; new scores are inserted alongside.
3. The "current score" query filters `WHERE profile_version = (SELECT MAX(profile_version) FROM scoring_profiles WHERE strategy = $1)`.
4. For the MVP, profile_version = 1 for everything. When the first weight change happens, this pays off.

**Phase to address:** Phase 1 (schema design). Version tracking in the schema costs nothing now; retrofitting it after data exists is painful.

---

### Pitfall 11: `revalidatePath` Scope Too Narrow After Scoring

**Confidence:** MEDIUM (specific to this codebase)

**What goes wrong:**
After a score is computed and persisted, `revalidatePath` is called for the listing detail page. But the broker's deal dashboard may also show a score badge for deals linked to that listing. If `revalidatePath('/listings/[id]')` is called but `revalidatePath('/deals/[dealId]')` is not, the deal hub shows the old score.

The problem scales: a listing can be linked to a deal, and a score can appear in the opportunity map view, the listing card, the deal hub, and a future comparison table. Each path segment must be revalidated.

**Prevention:**
Use `revalidateTag('scores')` with `fetch` cache tags, or define a `revalidateScores(listingId: string)` utility function that calls `revalidatePath` for all affected routes in one place. Call this utility at the end of every server action that writes to `property_scores`.

**Phase to address:** Phase 2 (score card integration). Define the revalidation utility before building any UI that displays scores.

---

## ML Upgrade Path Blockers

Decisions made now that make swapping to model-based scoring painful later.

---

### Blocker 1: Storing Human-Readable Text in Score Fields Instead of Normalized Numerics

**What blocks ML:**
If the scoring engine stores `"Strong foot traffic"` in a `location_quality_score` column instead of a `0.82` float, there is nothing to train on. ML models need numerical feature vectors. Text labels require re-encoding.

**What to do instead:**
The `explanation` field holds text. All score component fields (`demographics_score`, `location_score`, etc.) must be `NUMERIC(5,2)` representing the 0–100 range. No text in numeric columns.

---

### Blocker 2: Not Logging Raw Input Features Alongside Scores

**What blocks ML:**
A model needs training data: input features → output label. If only the computed score is stored (the output) but not the raw input values used to produce it (the features), there is no training set. When ML is introduced, the team must re-run the rule-based engine against historical data to regenerate features — which is fragile if provider data has changed.

**What to do instead:**
The `property_scores` table (or a companion `score_inputs` table) should store a snapshot of the raw inputs used: `avg_income`, `population_density`, `nearby_business_count`, `competitor_count`, `geocode_confidence`, etc. This is the feature vector for future model training. JSONB is acceptable here because it is a snapshot, not a query target.

---

### Blocker 3: Strategy as a Free-Text Column Instead of a Typed Enum

**What blocks ML:**
A column `strategy TEXT` with values `'café'`, `'cafe'`, `'Café'`, `'coffee_shop'` from different broker inputs creates label noise. A classifier trained on this data will have poor strategy-level splits.

**What to do instead:**
Add a `CHECK` constraint limiting `strategy` to a defined enum list. Enforce it at the database level, not just in the TypeScript type. When new strategies are added, add them to the constraint explicitly.

---

### Blocker 4: Explanation Logic Entangled With Score Computation

**What blocks ML:**
If the function that computes numeric scores also generates explanation text in the same pass, replacing the computation with a model output requires rewriting the explanation generator too. The two concerns are coupled.

**What to do instead:**
Separate the scoring engine into two pure functions:
1. `computeScores(inputs) → ScoreComponents` — returns only numbers, no text
2. `generateExplanation(inputs, components) → Explanation` — takes the numbers and produces text

When a model replaces step 1, step 2 needs minimal changes (it already takes score components as input, regardless of how they were produced).

---

### Blocker 5: No `computed_at` or `data_snapshot` on Stored Scores

**What blocks ML:**
If stored scores have no timestamp or input snapshot, there is no way to align historical scores with the data that was available at the time of computation. Demographics data may have been updated after the score was stored. The training labels (ground truth) become misaligned with the features.

**What to do instead:**
`computed_at TIMESTAMPTZ NOT NULL DEFAULT now()` on every score row (already in the recommended schema). The `explanation JSONB` field should include a `inputs_snapshot` sub-object with the raw values used, even if they are duplicated. Storage cost is negligible; training data value is high.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema design | No `profile_version` on scores table | Add version tracking before first score is written |
| Schema design | Score components stored as JSONB, not normalized columns | Normalized columns for all numeric score components; JSONB only for explanation text |
| Schema design | RLS missing or policies check listing existence not listing ownership | `UNIQUE(user_id, listing_id, strategy)` + `USING (auth.uid() = user_id)` policy |
| Engine design | Missing data treated as neutral midpoint | Zero-and-flag approach for missing fields; no generous defaults |
| Engine design | Strategy profiles derived by copying default and tweaking 5% | Write strategy definition in plain language first; verify rankings diverge across profiles |
| Engine design | Explanation generator entangled with score computation | Separate `computeScores()` and `generateExplanation()` from day one |
| Engine design | No `NEEDS_ENRICHMENT` state | Three-state enum (`SCORED` / `NEEDS_ENRICHMENT` / `ENRICHMENT_FAILED`) in score output type |
| Scoring trigger | API route chosen over server action | Server action for user-triggered scoring; API route only for cron/webhook with shared-secret auth |
| Scoring trigger | `revalidatePath` called for only one route after scoring | `revalidateScores(listingId)` utility that invalidates all affected paths |
| Score card UI | Explanation shows raw numbers without context labels | "Strong / Moderate / Weak / Insufficient Data" labels; max 3 positive signals, 3 risk flags |
| Score card UI | No data quality warning for mock-provider inputs | Visible warning when `has_mock_data = true` or `data_quality = 'mock'` |
| ML upgrade | String labels in score component columns | All score components `NUMERIC(5,2)`; no text in numeric fields |
| ML upgrade | No input snapshot stored alongside output score | `score_inputs` snapshot in `explanation JSONB` from first write |
| ML upgrade | Strategy as unconstrained `TEXT` | `CHECK` constraint enumerating valid strategy values in the migration |

---

## Sources

- Existing codebase: `lib/location-intelligence/providers.d.ts`, `supabase/migrations/011_location_insights.sql`, `supabase/migrations/010_investor_matching.sql` — HIGH confidence, direct inspection
- Supabase RLS docs and production patterns: [Row Level Security in Supabase](https://blog.starmorph.com/blog/row-level-security-supabase-tables-nextjs), [Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — HIGH confidence
- RLS performance: [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — HIGH confidence
- PostgreSQL JSONB vs normalized columns: [Hidden Cost of JSONB in Postgres](https://medium.com/@thequeryabhishek/the-hidden-cost-of-using-jsonb-in-postgres-bad78a2bf249), [JSONB Performance Guide](https://www.sitepoint.com/postgresql-jsonb-query-performance-indexing/) — HIGH confidence
- Rule-based scoring staleness and rigidity: [Why Rule-Based Scoring Won't Cut It](https://www.forwrd.ai/blog/why-rule-based-scoring-just-wont-cut-it-in-2023) — MEDIUM confidence
- Weighted scoring overlap: [Weighted Scoring Prioritization](https://www.6sigma.us/six-sigma-in-focus/weighted-scoring-prioritization/) — MEDIUM confidence
- ML migration blockers: [High-Stakes Model Migration](https://www.conformanceai.com/post/high-stakes-model-migration-navigating-the-inevitable-model-switch) — MEDIUM confidence
- Next.js Server Actions: [Makerkit Server Actions Guide](https://makerkit.dev/blog/tutorials/nextjs-server-actions) — HIGH confidence
- Mock data vs real data discrepancy: [Why Mocking Data is a Bad Practice for Testing](https://medium.com/@queenskisivuli/why-mocking-data-is-a-bad-practice-for-testing-a20d2d7104aa) — MEDIUM confidence
