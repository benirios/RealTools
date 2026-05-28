-- 009_listing_import_runs.sql
-- Durable, user-scoped ingestion run status for listing imports.

CREATE TABLE listing_import_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id     UUID REFERENCES listing_import_targets(id) ON DELETE SET NULL,
  source        TEXT NOT NULL CHECK (source IN ('olx', 'facebook_manual')),
  status        TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  failed_count  INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  started_at    TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE listing_import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own listing import runs"
  ON listing_import_runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_listing_import_runs_user_id ON listing_import_runs(user_id);
CREATE INDEX idx_listing_import_runs_target_id ON listing_import_runs(target_id);
CREATE INDEX idx_listing_import_runs_status ON listing_import_runs(user_id, status);
CREATE INDEX idx_listing_import_runs_created_at ON listing_import_runs(user_id, created_at DESC);
