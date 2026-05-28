-- 017_client_opportunities.sql
-- Client-specific workflow state over global commercial opportunities.

CREATE TABLE IF NOT EXISTS client_opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  opportunity_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'suggested',
  match_score     INTEGER CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),
  notes           TEXT,
  last_action_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT client_opportunities_status_check CHECK (
    status IN ('suggested', 'saved', 'sent', 'interested', 'rejected', 'negotiating', 'closed')
  ),
  CONSTRAINT client_opportunities_unique UNIQUE (user_id, client_id, opportunity_id)
);

ALTER TABLE client_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own client opportunities" ON client_opportunities;
CREATE POLICY "Users can manage own client opportunities"
  ON client_opportunities FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_client_opportunities_client
  ON client_opportunities(user_id, client_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_opportunities_opportunity
  ON client_opportunities(user_id, opportunity_id);

CREATE OR REPLACE FUNCTION update_client_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_client_opportunities_updated_at ON client_opportunities;
CREATE TRIGGER set_client_opportunities_updated_at
BEFORE UPDATE ON client_opportunities
FOR EACH ROW EXECUTE FUNCTION update_client_opportunities_updated_at();
