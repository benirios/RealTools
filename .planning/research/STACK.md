# Technology Stack — v1.6 Opportunity Scoring Engine

**Project:** RealTools — CRE Opportunity Scoring Engine (milestone v1.6)
**Researched:** 2026-05-10
**Scope:** Additive stack only. Covers only net-new packages and schema additions required for the scoring engine milestone.

---

## Existing Stack (validated — do not re-research)

Next.js 15.5 + React 19 + TypeScript 5, Supabase (@supabase/ssr ^0.5), TailwindCSS 4, shadcn/ui, zod ^3, react-hook-form ^7, Resend, Vercel. Node built-in `node:test` + `.mjs` test files.

---

## Net-New Stack Additions

### 1. Chart / Visualization — `recharts` v3 (via shadcn/ui chart component)

| | |
|---|---|
| **Package** | `recharts` ^3.8 (already included when you run `npx shadcn@latest add chart`) |
| **shadcn command** | `npx shadcn@latest add chart` |
| **Why** | shadcn/ui's chart primitive wraps Recharts v3 and exposes `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, and CSS variable-based color tokens that align with the existing Tailwind/shadcn token system. This is already the canonical choice for this stack. No extra bundle cost beyond what shadcn installs. React 19 compatibility confirmed (recharts 3.x). |
| **Use in scoring UI** | Horizontal bar chart for per-category score breakdown. Radial/donut for total score ring. Radar chart for multi-strategy comparison. All available as copy-paste shadcn components — no custom D3 work needed. |
| **Confidence** | HIGH — shadcn/ui officially migrated to Recharts v3 (PR #8486); recharts 3.8.1 is current on npm as of research date. |

**Do not add:** Tremor (`@tremor/react`). It is built on top of Recharts and adds a dependency layer with its own styling system that conflicts with the existing Tailwind setup. The shadcn chart primitive gives equivalent output with zero extra cost.

---

### 2. Postgres Schema Addition — `property_scores` table (migration 012)

No new Postgres extensions are required. All scoring storage fits in plain Postgres with JSONB.

**Recommended schema:**

```sql
-- 012_property_scores.sql
CREATE TABLE property_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id        UUID REFERENCES listings(id) ON DELETE CASCADE,
  location_insight_id UUID REFERENCES location_insights(id) ON DELETE SET NULL,
  strategy          TEXT NOT NULL,                        -- 'cafe', 'logistics', 'pharmacy', 'generic'
  total_score       INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  category_scores   JSONB NOT NULL DEFAULT '{}',          -- { demographics: 72, location_quality: 65, ... }
  weights_snapshot  JSONB NOT NULL DEFAULT '{}',          -- weights used at compute time
  signals           JSONB NOT NULL DEFAULT '[]',          -- positive/negative signal list
  risk_flags        JSONB NOT NULL DEFAULT '[]',          -- risk flag list
  recommended_fit   TEXT[],                               -- ['cafe', 'pharmacy']
  engine_version    TEXT NOT NULL DEFAULT 'v1',           -- for future ML swap detection
  computed_at       TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT property_scores_strategy_check CHECK (
    strategy IN ('cafe', 'logistics', 'pharmacy', 'retail', 'generic')
  ),
  CONSTRAINT property_scores_user_listing_strategy_unique
    UNIQUE (user_id, listing_id, strategy)
);

ALTER TABLE property_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own property scores"
  ON property_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- B-tree indexes on query-hot columns (NOT GIN on JSONB — category_scores is read, not filtered)
CREATE INDEX idx_property_scores_user_id ON property_scores(user_id);
CREATE INDEX idx_property_scores_listing_id ON property_scores(listing_id);
CREATE INDEX idx_property_scores_user_strategy ON property_scores(user_id, strategy);
CREATE INDEX idx_property_scores_total_score ON property_scores(user_id, total_score DESC);
```

**Why JSONB for `category_scores` / `signals` / `risk_flags`:** The schema of score breakdowns will evolve as categories are added (e.g., adding a "transit" category in v2 without a migration). Store the structured decomposition in JSONB; query only on `total_score`, `strategy`, and `user_id` via B-tree indexes. No GIN index is needed here — the JSONB columns are read (deserialized in application code), not filtered.

**Why `engine_version`:** When the engine upgrades from rule-based to ML, previously computed scores become stale. The `engine_version` column lets the API detect and invalidate them without deleting history.

**Why `weights_snapshot`:** Strategy weights will change as profiles are tuned. Storing the weights used at compute time lets the UI show "computed with v1 weights" and lets future re-score jobs know which records are stale.

**No new Postgres extensions needed.** pgvector is NOT required in this milestone — it is a future concern when embedding-based similarity scoring is added.

---

### 3. Scoring Engine Module — Pure TypeScript, zero new runtime dependencies

The scoring engine itself requires no new npm packages. Pattern it after `lib/investors/matching.js` (already in the codebase):

```
lib/scoring/
  engine.ts          -- core compute function: (listing, insight, strategy) => ScoreResult
  profiles.ts        -- strategy weight definitions: Record<Strategy, CategoryWeights>
  categories/
    demographics.ts  -- score demographics category from location_insight
    location.ts      -- score location quality (density, coordinates, address confidence)
    nearby.ts        -- score nearby business mix
    competition.ts   -- score competitor density
    risk.ts          -- score risk flags (data gaps, confidence floor, etc.)
    investor_fit.ts  -- score investor fit from deal/listing tags
  signals.ts         -- shared signal detection helpers
  explainer.ts       -- build human-readable signal + flag arrays from raw scores
```

All of this is plain TypeScript arithmetic — no statistics or ML library needed for the rule-based v1 engine. Zod (already installed) validates inputs at the API boundary. The engine functions are pure (no side effects) and testable with `node:test` (already in use).

**Do not add:** `ml5`, `brain.js`, `tensorflow/tfjs`, `simple-statistics`, or any statistics/ML library in this milestone. Deterministic weighted arithmetic is sufficient. Adding these creates a dependency that signals to future developers that ML is already in use, obscuring the actual rule-based nature of the engine.

---

### 4. API Layer — Route Handlers (no new packages)

Scoring endpoints use the existing Next.js App Router Route Handler pattern:

```
app/api/scores/
  route.ts                    -- GET (list by user), POST (compute + save)
  [id]/route.ts               -- GET (single score), DELETE
  listing/[listingId]/route.ts -- GET (all strategies for one listing)
```

The POST handler:
1. Validates request body with `zod` (already installed).
2. Reads `location_insights` row from Supabase using service role client (already in `lib/supabase/service.ts`).
3. Calls `lib/scoring/engine.ts` (pure function, no I/O).
4. Upserts result to `property_scores` using the unique constraint on `(user_id, listing_id, strategy)`.
5. Returns the `ScoreResult` JSON.

No new library is needed. `zod` + existing Supabase client + existing server auth pattern covers the full API layer.

---

### 5. UI Components — shadcn/ui additions (copy-paste, not npm installs)

Run these shadcn CLI commands when building the score card UI:

```bash
npx shadcn@latest add chart      # recharts v3 wrapper + ChartContainer
npx shadcn@latest add progress   # for category score bars (visual progress bars in score card)
npx shadcn@latest add badge      # already likely installed; for risk flag chips
npx shadcn@latest add tabs       # strategy selector tab bar
npx shadcn@latest add tooltip    # hover explainer on score categories
```

These are copy-paste shadcn components, not npm packages. They integrate with the existing Tailwind token system.

The `progress` component (shadcn) is recommended over a custom horizontal bar for the per-category breakdown because it uses CSS variables and matches the light dashboard foundation already established. Reserve the `recharts` bar chart for cases where multiple strategies are being compared side-by-side.

---

## What NOT to Add in This Milestone

| Package / Feature | Reason to Defer |
|---|---|
| `pgvector` Postgres extension | Only needed when ML embedding similarity is added. Rule-based scoring does not use vectors. |
| `tensorflow/tfjs`, `brain.js`, `ml5` | No ML in v1. Rule-based arithmetic needs no runtime dependency. |
| `@tremor/react` | Redundant with shadcn chart primitive; conflicts with existing Tailwind setup. |
| `@tanstack/react-query` | Overkill for this milestone. Server Components + Route Handlers + `revalidatePath` cover all data needs. |
| Dedicated job/queue system (BullMQ, pg_boss) | Score computation is fast (< 50ms per property, no external I/O). On-demand computation in the Route Handler is sufficient for v1. |
| Dedicated feature store (Feast, Tecton) | A feature store is the correct architecture for productionizing ML features, but it is infrastructure overkill at this scale. The `location_insights` table + `property_scores` table are already a functional feature store for the rule-based engine. Revisit when the ML upgrade milestone begins. |
| Redis / cache layer | Scores are stored in Postgres with a computed_at timestamp. Stale-while-revalidate via `revalidatePath` + Supabase reads is sufficient. |
| `d3` directly | Recharts v3 (via shadcn chart) covers all visualization needs. Direct D3 usage adds complexity without benefit. |
| Python scoring microservice | TypeScript is sufficient for rule-based arithmetic. Introducing a second language/runtime adds operational cost with no benefit at this milestone. Reserve for when a trained model requires a Python inference runtime. |

---

## ML Upgrade Path (architectural readiness, not implementation)

The scoring module is designed so the ML upgrade is a swap, not a rewrite:

1. `engine.ts` exports a single `computeScore(input: ScoreInput): ScoreResult` function. The Route Handler calls this function and knows nothing about whether it is rule-based or ML-backed.
2. `engine_version` in `property_scores` lets a migration job detect and re-score stale rows when the engine version changes.
3. `weights_snapshot` in `property_scores` documents the exact parameters used — equivalent to model versioning for the rule-based engine.
4. The `ScoreInput` type already contains all features the rule-based engine uses (`location_insights` row + listing metadata). When an ML model is added, the same input object becomes the feature vector. No schema migration needed to add the model.
5. When a Python inference service is added, `engine.ts` becomes a thin HTTP client calling that service instead of running arithmetic locally — the Route Handler is unchanged.

---

## Confidence Assessment

| Area | Confidence | Basis |
|---|---|---|
| recharts v3 via shadcn chart | HIGH | shadcn official PR #8486 confirmed recharts v3 migration; npm shows 3.8.1 current; React 19 compatibility confirmed |
| Postgres schema (JSONB + B-tree) | HIGH | Matches established project pattern; no new extension risk |
| No ML/stats library needed for v1 | HIGH | Existing matching.js shows the weighted arithmetic pattern is sufficient and already proven |
| Route Handler pattern for scoring API | HIGH | Direct continuation of existing API structure (investors, listings, location-insights all use the same pattern) |
| shadcn chart + progress + tabs | HIGH | All available as standard shadcn copy-paste components |
| ML upgrade path (feature store analogy) | MEDIUM | Architecture is sound; actual ML migration depends on model selection not yet decided |

---

## Sources

- [recharts npm page](https://www.npmjs.com/package/recharts) — version 3.8.1 confirmed current
- [shadcn/ui chart documentation](https://ui.shadcn.com/docs/components/chart) — recharts v3, `npx shadcn@latest add chart`
- [shadcn/ui PR #8486](https://github.com/shadcn-ui/ui/pull/8486) — official recharts v3 migration
- [Recharts React 19 compatibility issue](https://github.com/recharts/recharts/issues/4558) — confirmed resolved
- [PostgreSQL JSONB indexing — Crunchy Data](https://www.crunchydata.com/blog/indexing-jsonb-in-postgres) — B-tree vs GIN tradeoffs
- Existing codebase: `lib/investors/matching.js`, `lib/location-intelligence/providers.js`, `supabase/migrations/010_investor_matching.sql`, `supabase/migrations/011_location_insights.sql`
