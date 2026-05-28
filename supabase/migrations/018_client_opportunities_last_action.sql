-- 018_client_opportunities_last_action.sql
-- Backfill-safe addition for installations that already applied 017.

ALTER TABLE client_opportunities
  ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMPTZ;

