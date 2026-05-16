-- 015_ai_deal_summaries.sql
-- V1 structured AI deal summaries for commercial listings.

CREATE TABLE IF NOT EXISTS listing_ai_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending',
  summary         JSONB,
  provider        TEXT,
  model           TEXT,
  generated_at    TIMESTAMPTZ,
  input_data_hash TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT listing_ai_summaries_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),
  CONSTRAINT listing_ai_summaries_user_listing_unique UNIQUE (user_id, listing_id)
);

ALTER TABLE listing_ai_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own listing ai summaries" ON listing_ai_summaries;
CREATE POLICY "Users can manage own listing ai summaries"
  ON listing_ai_summaries FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_listing_ai_summaries_listing
  ON listing_ai_summaries(user_id, listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_ai_summaries_status
  ON listing_ai_summaries(user_id, status);

CREATE OR REPLACE FUNCTION update_listing_ai_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_listing_ai_summaries_updated_at ON listing_ai_summaries;
CREATE TRIGGER set_listing_ai_summaries_updated_at
BEFORE UPDATE ON listing_ai_summaries
FOR EACH ROW EXECUTE FUNCTION update_listing_ai_summaries_updated_at();
