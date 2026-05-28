-- 013_opportunity_scores_category_columns.sql
-- Add individual NUMERIC category score columns to opportunity_scores.
-- Required for indexed range queries (WHERE demographics_score > 60) and
-- future ML feature extraction. JSONB breakdown stores explanation text only.

ALTER TABLE opportunity_scores
  ADD COLUMN IF NOT EXISTS demographics_score  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS location_score      NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS foot_traffic_score  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS competition_score   NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS risk_score          NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS investor_fit_score  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS engine_version      TEXT NOT NULL DEFAULT '1.0';

-- Indexes for strategy + category range filtering
CREATE INDEX IF NOT EXISTS idx_opportunity_scores_demo_score
  ON opportunity_scores(user_id, demographics_score DESC);

CREATE INDEX IF NOT EXISTS idx_opportunity_scores_risk_score
  ON opportunity_scores(user_id, risk_score DESC);
