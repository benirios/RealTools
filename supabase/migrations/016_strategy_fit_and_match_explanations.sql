-- 016_strategy_fit_and_match_explanations.sql
-- Adds deterministic strategy fit scores and richer investor match explanations.

CREATE TABLE IF NOT EXISTS strategy_fit_scores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  strategy          TEXT NOT NULL,
  score             INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  confidence        TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  breakdown         JSONB NOT NULL DEFAULT '{}',
  strengths         JSONB NOT NULL DEFAULT '[]',
  weaknesses        JSONB NOT NULL DEFAULT '[]',
  best_fit_reasons  JSONB NOT NULL DEFAULT '[]',
  missing_data      JSONB NOT NULL DEFAULT '[]',
  input_data_hash   TEXT NOT NULL,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT strategy_fit_scores_strategy_check CHECK (
    strategy IN ('retail', 'warehouse_logistics', 'rental_income', 'food_beverage', 'pharmacy', 'gym_fitness')
  ),
  CONSTRAINT strategy_fit_scores_unique UNIQUE (user_id, listing_id, strategy)
);

ALTER TABLE strategy_fit_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own strategy fit scores" ON strategy_fit_scores;
CREATE POLICY "Users can manage own strategy fit scores"
  ON strategy_fit_scores FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_strategy_fit_scores_listing
  ON strategy_fit_scores(user_id, listing_id, score DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_fit_scores_strategy
  ON strategy_fit_scores(user_id, strategy, score DESC);

CREATE OR REPLACE FUNCTION update_strategy_fit_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_strategy_fit_scores_updated_at ON strategy_fit_scores;
CREATE TRIGGER set_strategy_fit_scores_updated_at
BEFORE UPDATE ON strategy_fit_scores
FOR EACH ROW EXECUTE FUNCTION update_strategy_fit_scores_updated_at();

ALTER TABLE investor_listing_matches
  ADD COLUMN IF NOT EXISTS confidence TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS strengths JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS concerns JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS recommended_action TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS missing_data JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS input_data_hash TEXT,
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE investor_listing_matches
  DROP CONSTRAINT IF EXISTS investor_listing_matches_confidence_check,
  ADD CONSTRAINT investor_listing_matches_confidence_check CHECK (
    confidence IN ('low', 'medium', 'high')
  );

ALTER TABLE opportunity_scores
  DROP CONSTRAINT IF EXISTS opportunity_scores_strategy_check,
  ADD CONSTRAINT opportunity_scores_strategy_check CHECK (
    strategy_slug IN (
      'cafe',
      'logistics',
      'pharmacy',
      'retail',
      'services',
      'any',
      'warehouse_logistics',
      'rental_income',
      'food_beverage',
      'gym_fitness'
    )
  );
