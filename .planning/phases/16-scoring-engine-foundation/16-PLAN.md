---
phase: 16-scoring-engine-foundation
plan: 16
type: execute
wave: 1
depends_on:
  - 15
files_modified:
  - supabase/migrations/012_opportunity_scores.sql
  - types/supabase.ts
  - lib/scoring/schemas.ts
  - lib/scoring/strategies.ts
  - lib/scoring/engine.ts
  - tests/scoring-engine.test.mjs
autonomous: true
requirements:
  - SCO-01
  - SCO-02
  - SCO-03
  - SCO-04
  - SCO-05
  - SCO-06
  - SCO-07
  - SCO-08
  - SCO-17
must_haves:
  truths:
    - "opportunity_scores table exists with RLS, UNIQUE constraint on (user_id, listing_id, strategy_slug), and total_score as a real integer column."
    - "Six strategy profiles are defined with weights that sum to 1.0 for each profile."
    - "computeScore is a pure function: same inputs always produce the same output."
    - "cafe and logistics profiles produce meaningfully different scores for the same input."
    - "Explainability payload (signals + risks) is non-empty for realistic inputs."
    - "fitLabel is assigned correctly: forte ≥70, moderado ≥50, fraco <50."
  artifacts:
    - path: "supabase/migrations/012_opportunity_scores.sql"
      provides: "opportunity_scores table with RLS, indexes, score_version, UNIQUE constraint, and updated_at trigger."
    - path: "lib/scoring/schemas.ts"
      provides: "Zod schemas for ScoreSignal, ScoreRisk, CategoryBreakdown, ScoreResult, StrategyProfile, ScoringActionState."
      exports: ["ScoreSignalSchema", "ScoreRiskSchema", "CategoryBreakdownSchema", "ScoreResultSchema", "StrategyProfileSchema", "ScoringActionStateSchema"]
    - path: "lib/scoring/strategies.ts"
      provides: "Strategy profiles (cafe, logistics, pharmacy, retail, services, any) with weights summing to 1.0."
      exports: ["STRATEGIES", "getStrategy", "STRATEGY_SLUGS"]
    - path: "lib/scoring/engine.ts"
      provides: "Pure scoring engine: six category functions + computeScore. No I/O, no side effects."
      exports: ["scoreDemographics", "scoreLocationQuality", "scoreNearbyBusinesses", "scoreCompetition", "scoreRisk", "scoreInvestorFit", "computeScore"]
    - path: "tests/scoring-engine.test.mjs"
      provides: "Unit tests for all engine functions, strategy weight shifting, explainability output, and fitLabel thresholds."
  key_links:
    - from: "lib/scoring/engine.ts"
      to: "lib/scoring/strategies.ts"
      via: "StrategyProfile type import"
      pattern: "getStrategy"
    - from: "lib/scoring/engine.ts"
      to: "lib/scoring/schemas.ts"
      via: "ScoreResult / CategoryBreakdown types"
      pattern: "ScoreResultSchema"
    - from: "tests/scoring-engine.test.mjs"
      to: "lib/scoring/engine.ts"
      via: "CommonJS require"
      pattern: "computeScore"
---

<objective>
Create the Phase 16 Scoring Engine Foundation so RealTools has a fully-tested, deterministic, pure opportunity scoring engine and persistence schema ready for Phase 17 service wiring.

Purpose: Brokers need explainable, strategy-adaptive opportunity scores for commercial properties. The engine must be correct, testable in isolation, and ML-upgrade-ready without adding ML complexity now.
Output: Migration, Zod schemas, strategy profiles, pure scoring engine with six category functions, and a comprehensive unit test suite.
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/research/FEATURES.md
@.planning/research/ARCHITECTURE.md
@.planning/research/STACK.md
@lib/investors/matching.js
@lib/schemas/location-insight.ts
@lib/location-intelligence/insights.ts
@supabase/migrations/011_location_insights.sql
@types/supabase.ts

Implementation anchors:
- Use `lib/investors/matching.js` as the pattern: pure functions, no I/O, `module.exports`, CommonJS for test compatibility.
- Use `supabase/migrations/011_location_insights.sql` as the migration pattern: RLS, policy, indexes, updated_at trigger.
- Use `lib/schemas/location-insight.ts` as the Zod schema style: named schemas, inferred types exported alongside.
- The scoring engine is a `.ts` file (used by the app) with a parallel `.js` CommonJS shim (used by `node:test`), matching the pattern established by `lib/location-intelligence/insights.ts` + `insights.js`.
- Do NOT add any npm dependencies. Recharts/shadcn chart is a Phase 18 concern. The engine is pure TypeScript arithmetic.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add opportunity_scores migration and updated types</name>
  <files>supabase/migrations/012_opportunity_scores.sql, types/supabase.ts</files>
  <behavior>
    - SCO-01: `opportunity_scores` stores user-owned scores per listing/strategy combination.
    - `total_score` is a real INTEGER column (not inside JSONB) for sortable/filterable queries.
    - `score_version` increments on recompute — UNIQUE constraint keeps one live score per (user_id, listing_id, strategy_slug).
    - `breakdown`, `signals`, `risks` are JSONB (read/rendered, not filtered).
    - `fit_label` is a nullable TEXT column with a CHECK constraint.
    - RLS prevents cross-user access. Every write checks auth.uid() = user_id.
  </behavior>
  <action>
    Create `supabase/migrations/012_opportunity_scores.sql`:

    ```sql
    -- 012_opportunity_scores.sql
    -- User-scoped opportunity scoring storage for commercial property strategy evaluation.

    CREATE TABLE opportunity_scores (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      strategy_slug   TEXT NOT NULL,
      total_score     INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
      score_version   INTEGER NOT NULL DEFAULT 1,
      breakdown       JSONB NOT NULL DEFAULT '[]',
      signals         JSONB NOT NULL DEFAULT '[]',
      risks           JSONB NOT NULL DEFAULT '[]',
      fit_label       TEXT CHECK (fit_label IN ('forte', 'moderado', 'fraco')),
      computed_at     TIMESTAMPTZ DEFAULT now(),
      created_at      TIMESTAMPTZ DEFAULT now(),
      updated_at      TIMESTAMPTZ DEFAULT now(),

      CONSTRAINT opportunity_scores_strategy_check CHECK (
        strategy_slug IN ('cafe', 'logistics', 'pharmacy', 'retail', 'services', 'any')
      ),
      CONSTRAINT opportunity_scores_listing_strategy_unique
        UNIQUE (user_id, listing_id, strategy_slug)
    );

    ALTER TABLE opportunity_scores ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can manage own opportunity scores"
      ON opportunity_scores FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    CREATE INDEX idx_opportunity_scores_listing    ON opportunity_scores(listing_id);
    CREATE INDEX idx_opportunity_scores_user_strat ON opportunity_scores(user_id, strategy_slug);
    CREATE INDEX idx_opportunity_scores_total      ON opportunity_scores(user_id, total_score DESC);

    CREATE OR REPLACE FUNCTION update_opportunity_scores_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_opportunity_scores_updated_at ON opportunity_scores;
    CREATE TRIGGER set_opportunity_scores_updated_at
    BEFORE UPDATE ON opportunity_scores
    FOR EACH ROW EXECUTE FUNCTION update_opportunity_scores_updated_at();
    ```

    Update `types/supabase.ts` to add an `opportunity_scores` table entry in the `public.Tables` section with Row, Insert, Update, and Relationships shapes matching the migration. Place it alphabetically between `notes` and the next table. The Row type must include: `id`, `user_id`, `listing_id`, `strategy_slug`, `total_score`, `score_version`, `breakdown`, `signals`, `risks`, `fit_label`, `computed_at`, `created_at`, `updated_at`. Use `Json` for JSONB columns, `string | null` for nullable text, `number` for integers. Add relationships for `user_id → auth.users` and `listing_id → listings`.
  </action>
  <verify>
    <automated>npm run lint</automated>
    <automated>rg -n "opportunity_scores|ENABLE ROW LEVEL SECURITY|Users can manage own opportunity scores|strategy_slug|total_score|score_version|fit_label" supabase/migrations/012_opportunity_scores.sql</automated>
    <automated>rg -n "opportunity_scores" types/supabase.ts</automated>
  </verify>
  <done>opportunity_scores table migration exists with RLS, UNIQUE constraint, B-tree indexes, and updated_at trigger. types/supabase.ts includes the table typing.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add Zod schemas and strategy profiles</name>
  <files>lib/scoring/schemas.ts, lib/scoring/strategies.ts</files>
  <behavior>
    - SCO-02/SCO-03: Schemas define the exact shape of scoring output. Strategy profiles define per-business-type category weights.
    - All six strategy profiles (cafe, logistics, pharmacy, retail, services, any) must have weights that sum to exactly 1.0.
    - Schemas are TypeScript-first (used by app), exported with inferred types.
  </behavior>
  <action>
    Create `lib/scoring/schemas.ts` with these exports:

    ```typescript
    import { z } from 'zod'

    export const ScoreSignalSchema = z.object({
      category: z.string(),
      label: z.string(),  // Portuguese: 'Alta renda per capita na área'
      impact: z.enum(['positive', 'neutral', 'negative']),
      value: z.union([z.string(), z.number()]).nullable().optional(),
    })

    export const ScoreRiskSchema = z.object({
      category: z.string(),
      label: z.string(),  // Portuguese: 'Alta concorrência direta na área'
      severity: z.enum(['high', 'medium', 'low']),
    })

    export const CategoryBreakdownSchema = z.object({
      category: z.string(),
      label: z.string(),  // Portuguese display name
      score: z.number().int().min(0).max(100),
      weight: z.number().min(0).max(1),
      weighted: z.number().min(0).max(100),
      signals: z.array(ScoreSignalSchema).default([]),
      risks: z.array(ScoreRiskSchema).default([]),
    })

    export const ScoreResultSchema = z.object({
      totalScore: z.number().int().min(0).max(100),
      breakdown: z.array(CategoryBreakdownSchema),
      signals: z.array(ScoreSignalSchema),
      risks: z.array(ScoreRiskSchema),
      fitLabel: z.enum(['forte', 'moderado', 'fraco']),
      strategySlug: z.string(),
      computedAt: z.string(),
    })

    export const StrategyProfileSchema = z.object({
      slug: z.string(),
      label: z.string(),
      weights: z.object({
        demographics: z.number(),
        locationQuality: z.number(),
        nearbyBusinesses: z.number(),
        competition: z.number(),
        risk: z.number(),
        investorFit: z.number(),
      }),
      riskTolerance: z.enum(['low', 'medium', 'high']),
      nearbyAffinities: z.array(z.string()),
      nearbyConflicts: z.array(z.string()),
    })

    export const ScoringActionStateSchema = z.object({
      message: z.string().optional(),
      score: ScoreResultSchema.nullable().optional(),
      errors: z.object({
        general: z.array(z.string()).optional(),
      }).optional(),
    })

    export type ScoreSignal = z.infer<typeof ScoreSignalSchema>
    export type ScoreRisk = z.infer<typeof ScoreRiskSchema>
    export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>
    export type ScoreResult = z.infer<typeof ScoreResultSchema>
    export type StrategyProfile = z.infer<typeof StrategyProfileSchema>
    export type ScoringActionState = z.infer<typeof ScoringActionStateSchema>
    ```

    Create `lib/scoring/strategies.ts` with `STRATEGIES` record and `getStrategy(slug)` function. Define these profiles (weights must sum to 1.0 for each):

    - **cafe**: demographics 0.20, locationQuality 0.20, nearbyBusinesses 0.30, competition 0.15, risk 0.10, investorFit 0.05. riskTolerance: 'medium'. nearbyAffinities: ['school', 'office', 'mall', 'transit']. nearbyConflicts: ['cafe', 'restaurant', 'bakery'].
    - **logistics**: demographics 0.10, locationQuality 0.40, nearbyBusinesses 0.05, competition 0.10, risk 0.20, investorFit 0.15. riskTolerance: 'low'. nearbyAffinities: ['highway', 'industrial', 'warehouse', 'port']. nearbyConflicts: [].
    - **pharmacy**: demographics 0.25, locationQuality 0.20, nearbyBusinesses 0.15, competition 0.25, risk 0.10, investorFit 0.05. riskTolerance: 'low'. nearbyAffinities: ['hospital', 'clinic', 'school', 'residential']. nearbyConflicts: ['pharmacy', 'drugstore'].
    - **retail**: demographics 0.20, locationQuality 0.20, nearbyBusinesses 0.25, competition 0.20, risk 0.10, investorFit 0.05. riskTolerance: 'medium'. nearbyAffinities: ['mall', 'transit', 'parking', 'office']. nearbyConflicts: ['retail', 'clothing'].
    - **services**: demographics 0.30, locationQuality 0.25, nearbyBusinesses 0.10, competition 0.10, risk 0.15, investorFit 0.10. riskTolerance: 'low'. nearbyAffinities: ['office', 'residential', 'hospital']. nearbyConflicts: [].
    - **any**: all six weights 0.167 (rounds to 1.0). riskTolerance: 'medium'. nearbyAffinities: []. nearbyConflicts: [].

    Export `STRATEGY_SLUGS` as a const array of all valid slugs. `getStrategy(slug)` falls back to `STRATEGIES['any']` for unknown slugs.
  </action>
  <verify>
    <automated>npm run lint</automated>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
    <automated>node -e "const s = require('./lib/scoring/strategies'); console.log(Object.keys(s.STRATEGIES)); const cafe = s.STRATEGIES.cafe; const sum = Object.values(cafe.weights).reduce((a,b)=>a+b,0); console.log('cafe weights sum:', sum.toFixed(3));"</automated>
  </verify>
  <done>Zod schemas cover all scoring output shapes. Six strategy profiles exist with weights summing to 1.0. getStrategy falls back gracefully.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement pure scoring engine and unit tests</name>
  <files>lib/scoring/engine.ts, tests/scoring-engine.test.mjs</files>
  <behavior>
    - SCO-02/SCO-04/SCO-05/SCO-06/SCO-07/SCO-08/SCO-17: Pure scoring engine using existing location_insights fields.
    - Deterministic: same inputs always produce the same output.
    - Strategy-adaptive: cafe and logistics produce meaningfully different scores for the same listing/insight.
    - Explainability: every realistic input produces non-empty signals and risks arrays.
    - fitLabel thresholds: forte ≥70, moderado ≥50, fraco <50.
    - SCO-08: when insight is null or missing required fields, computeScore throws with a Portuguese message.
  </behavior>
  <action>
    Create `lib/scoring/engine.ts`. The engine must use ONLY these fields from `LocationInsightPersisted`:
    - `avgIncome` (NUMERIC) — demographics category
    - `populationDensity` (NUMERIC) — demographics + nearby
    - `confidenceScore` (INTEGER 0-100) — location quality + risk
    - `nearbyBusinesses` (array of NearbyBusiness with `category` and `distanceMeters`) — nearby + competition
    - `latitude` / `longitude` (presence signals geocode quality) — location quality

    From listing row (use `listings` Row type from supabase.ts):
    - `price_amount` — investor fit
    - `lat` / `lng` — location quality backup
    - `tags` — investor fit signals
    - `commercial_type` — investor fit

    Category scoring rules (all return 0–100):

    **scoreDemographics**: Brazil income brackets in BRL/month.
    - avgIncome null → 40 (missing data penalty), add risk flag "Renda média não disponível" (medium)
    - avgIncome < 1500 → 20, signal "Renda per capita baixa na área" (negative)
    - avgIncome 1500–2500 → 45
    - avgIncome 2500–4000 → 65, signal "Renda per capita moderada" (neutral)
    - avgIncome 4000–7000 → 85, signal "Renda per capita alta na área" (positive)
    - avgIncome > 7000 → 95, signal "Renda per capita muito alta" (positive)
    - populationDensity bonus: if > 5000/km² add +5 (cap 100), signal "Alta densidade populacional" (positive); if < 500 add −10, signal "Baixa densidade populacional" (negative)

    **scoreLocationQuality**: Uses geocode confidence as primary input.
    - confidenceScore null → 30, risk "Dados de localização incompletos" (high)
    - confidenceScore < 40 → 25, risk "Confiança de geocodificação baixa" (high)
    - confidenceScore 40–59 → 50
    - confidenceScore 60–79 → 70, signal "Localização geocodificada com boa precisão" (positive)
    - confidenceScore 80–100 → 88, signal "Localização verificada com alta confiança" (positive)
    - lat/lng present bonus (from listing row): +7 if coordinates exist, cap 100
    - lat/lng missing penalty: −10

    **scoreNearbyBusinesses**: Foot traffic proxy from POI count.
    - Count `nearbyBusinesses` entries with `distanceMeters <= 500`
    - Count entries matching profile `nearbyAffinities` (any partial match on category)
    - trafficGenerators (transit, school, mall, hospital, supermarket) within 500m: each adds +8, max +32
    - Affinity matches: each adds +10, max +30
    - Base score: 30
    - Cap at 100. If `nearbyBusinesses` is empty → 20, risk "Sem dados de negócios próximos" (medium)
    - If affinityCount >= 2: signal "Negócios complementares próximos" (positive)

    **scoreCompetition**: Competitor density.
    - Count `nearbyBusinesses` entries matching profile `nearbyConflicts` within 500m (competitorCount500)
    - Count matches within 1000m (competitorCount1000)
    - If `nearbyConflicts` is empty (logistics, services): return 75, signal "Perfil com baixa pressão competitiva" (positive)
    - competitorCount500 = 0: 90, signal "Sem concorrentes diretos em 500m" (positive)
    - competitorCount500 = 1–2: 70, signal "Concorrência baixa a moderada" (neutral)
    - competitorCount500 = 3–5: 45, risk "Concorrência moderada na área" (medium)
    - competitorCount500 > 5: 20, risk "Alta concorrência direta na área" (high)
    - competitorCount1000 > 8: add risk "Mercado saturado na região" (medium)

    **scoreRisk**: Aggregate risk from data quality signals.
    - Start at 70 (neutral base)
    - confidenceScore < 50: −20, risk "Baixa confiança nos dados de localização" (high)
    - avgIncome null: −10, risk "Dados demográficos insuficientes" (medium)
    - nearbyBusinesses empty: −10, risk "Dados de negócios próximos ausentes" (medium)
    - All signals present and confidenceScore >= 70: +15, signal "Dados de boa qualidade disponíveis" (positive)
    - Clamp 0–100. Risk score is NORMAL direction: high score = low risk = good.

    **scoreInvestorFit**: Derived from listing price and tags.
    - If listing has no price_amount → 50 (neutral, insufficient data)
    - price_amount present:
      - < 150000 BRL: maps to Opportunistic profile signal (score 60)
      - 150000–500000: Value-Add (score 70), signal "Faixa de preço para value-add" (positive)
      - 500000–2000000: Core-Plus (score 80), signal "Faixa de preço institucional" (positive)
      - > 2000000: Core (score 85), signal "Ativo de alto valor - perfil core" (positive)
    - listing tags containing 'distressed' or 'reforma': −10
    - listing tags containing 'leased' or 'locado': +10
    - Clamp 0–100

    **computeScore**: Combine all six.
    - Apply weights from `StrategyProfile`
    - totalScore = sum of (categoryScore * weight), round to nearest integer, clamp 0–100
    - Collect top signals (all positive-impact signals across categories, sorted by category weight descending, take top 5)
    - Collect top risks (all risk items across categories, sorted by severity: high > medium > low, take top 3)
    - fitLabel: totalScore >= 70 → 'forte'; >= 50 → 'moderado'; else → 'fraco'
    - Return `ScoreResult` shape (validated by `ScoreResultSchema.parse`)

    Also export `ScoringEngine` interface and `RuleBasedScoringEngine` class implementing it (for Phase 17).

    Create `tests/scoring-engine.test.mjs` using `node:test` + `node:assert/strict`. Use `createRequire` to require the `.js` CommonJS build. Cover:
    1. `scoreDemographics` with high income → high score + positive signal
    2. `scoreDemographics` with null income → penalty + risk flag
    3. `scoreLocationQuality` with high confidence → high score
    4. `scoreLocationQuality` with null confidence → risk flag
    5. `scoreCompetition` with 0 competitors → 90
    6. `scoreCompetition` with 6+ competitors → low score + high risk flag
    7. `scoreNearbyBusinesses` with empty array → 20 + risk
    8. `computeScore` with cafe profile: returns valid ScoreResult shape
    9. `computeScore` with logistics profile on same input: produces different total score than cafe (location-quality dominated)
    10. `fitLabel` thresholds: construct inputs that produce totalScore 72 (forte), 55 (moderado), 35 (fraco)
    11. `computeScore` with null insight throws with a message containing Portuguese text
    12. Signals array is non-empty for a realistic full input
    13. Risks array is non-empty when confidence is low

    The `.ts` engine file imports from `lib/scoring/schemas.ts` and `lib/scoring/strategies.ts`. The test file requires `lib/scoring/engine.js` (CommonJS shim). Create the `.js` shim file using `module.exports = require('./engine.ts')` pattern OR transpile-compatible CJS wrapper matching the existing `lib/location-intelligence/insights.js` shim pattern. Look at how `lib/location-intelligence/insights.js` is structured and replicate that pattern for `lib/scoring/engine.js` and `lib/scoring/strategies.js`.
  </action>
  <verify>
    <automated>npm run lint</automated>
    <automated>node --test tests/scoring-engine.test.mjs</automated>
    <automated>npm run test</automated>
    <automated>rg -n "computeScore|scoreDemographics|scoreLocationQuality|scoreNearbyBusinesses|scoreCompetition|scoreRisk|scoreInvestorFit|ScoringEngine|RuleBasedScoringEngine" lib/scoring/engine.ts</automated>
    <automated>rg -n "forte|moderado|fraco|fitLabel|totalScore" lib/scoring/engine.ts</automated>
  </verify>
  <done>Pure scoring engine is fully tested. Same inputs produce same outputs. cafe and logistics produce different scores. fitLabel thresholds are correct. Explainability payload is non-empty for realistic inputs. SCO-01 through SCO-08 and SCO-17 are satisfied.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| API request → scoring service | Listing IDs and strategy slugs enter the scoring boundary (Phase 17 concern; engine itself is pure). |
| Supabase → opportunity_scores | Authenticated writes scoped by user_id via RLS. |
| location_insights → engine | Engine reads from trusted persisted data; no outbound calls in Phase 16. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-16-01 | Tampering | opportunity_scores table | mitigate | RLS + UNIQUE constraint ensures one score per user/listing/strategy. Score_version tracks recomputes. |
| T-16-02 | Information Disclosure | opportunity_scores | mitigate | RLS FOR ALL USING (auth.uid() = user_id). Cross-user score reads are blocked at DB level. |
| T-16-03 | Spoofing | scoring engine | accept | Engine is a pure function in Phase 16 — no auth boundary yet. Auth is Phase 17's concern. |
| T-16-04 | Repudiation | score computation | accept | computed_at and score_version provide basic audit trail. Full activity log is a future feature. |
</threat_model>

<verification>
Run these checks after all tasks:

```bash
npm run lint
npm run test
node --test tests/scoring-engine.test.mjs
npx tsc --noEmit 2>&1 | head -20
rg -n "CREATE TABLE opportunity_scores|ENABLE ROW LEVEL SECURITY|Users can manage own opportunity scores|UNIQUE.*user_id.*listing_id.*strategy_slug" supabase/migrations/012_opportunity_scores.sql
rg -n "opportunity_scores" types/supabase.ts
rg -n "computeScore|STRATEGIES|getStrategy|ScoreResultSchema" lib/scoring/
```
</verification>

<success_criteria>
- SCO-01: opportunity_scores table exists with RLS, UNIQUE(user_id, listing_id, strategy_slug), total_score as INTEGER column, and B-tree indexes.
- SCO-02: computeScore produces a composite 0-100 score from exactly six weighted categories.
- SCO-03: Six strategy profiles defined with weights summing to 1.0. getStrategy fallback to 'any' works.
- SCO-04: Each category function returns CategoryBreakdown with score, weight, weighted, signals[], risks[].
- SCO-05: computeScore returns signals[] and risks[] in Portuguese with non-empty content for realistic inputs.
- SCO-06: fitLabel assigned correctly at thresholds (forte ≥70, moderado ≥50, fraco <50).
- SCO-07: computeScore is deterministic — same inputs always produce the same ScoreResult.
- SCO-08: computeScore throws a clear Portuguese error when insight is null.
- SCO-17: All unit tests pass (13 cases covering categories, strategies, thresholds, edge cases).
- types/supabase.ts includes opportunity_scores table typing.
- No new npm dependencies added.
- No existing migrations, tables, or workflows modified.
</success_criteria>

<output>
After completion, create `.planning/phases/16-scoring-engine-foundation/16-SUMMARY.md`.
Update `.planning/STATE.md` to reflect Phase 16 complete.
</output>
