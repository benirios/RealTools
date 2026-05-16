-- 014_listing_processing_and_matches.sql
-- Durable processing status and persistent investor/listing matches.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS enrichment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS enrichment_last_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS enrichment_error TEXT,
  ADD COLUMN IF NOT EXISTS matching_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS matching_last_processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS matching_error TEXT;

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_enrichment_status_check,
  ADD CONSTRAINT listings_enrichment_status_check CHECK (
    enrichment_status IN ('pending', 'processing', 'completed', 'failed')
  );

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_matching_status_check,
  ADD CONSTRAINT listings_matching_status_check CHECK (
    matching_status IN ('pending', 'processing', 'completed', 'failed')
  );

CREATE TABLE IF NOT EXISTS investor_listing_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_id     UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  match_score     INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_status    TEXT NOT NULL CHECK (match_status IN ('strong', 'medium', 'weak')),
  explanation     TEXT NOT NULL,
  reasons         JSONB NOT NULL DEFAULT '[]',
  breakdown       JSONB NOT NULL DEFAULT '{}',
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT investor_listing_matches_unique UNIQUE (user_id, investor_id, listing_id)
);

ALTER TABLE investor_listing_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own investor listing matches" ON investor_listing_matches;
CREATE POLICY "Users can manage own investor listing matches"
  ON investor_listing_matches FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_listings_enrichment_status
  ON listings(user_id, enrichment_status);

CREATE INDEX IF NOT EXISTS idx_listings_matching_status
  ON listings(user_id, matching_status);

CREATE INDEX IF NOT EXISTS idx_investor_listing_matches_investor
  ON investor_listing_matches(user_id, investor_id, match_score DESC);

CREATE INDEX IF NOT EXISTS idx_investor_listing_matches_listing
  ON investor_listing_matches(user_id, listing_id, match_score DESC);

CREATE OR REPLACE FUNCTION update_investor_listing_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_investor_listing_matches_updated_at ON investor_listing_matches;
CREATE TRIGGER set_investor_listing_matches_updated_at
BEFORE UPDATE ON investor_listing_matches
FOR EACH ROW EXECUTE FUNCTION update_investor_listing_matches_updated_at();
