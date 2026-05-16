-- 012_opportunity_scores.sql
-- User-scoped opportunity scoring storage for commercial property strategy evaluation.
-- Scores are computed per listing/strategy combination by the rule-based scoring engine.

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

-- B-tree indexes on query-hot columns (total_score promoted to real column for ORDER BY / WHERE)
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
