-- 002_rls_policies.sql
-- Per CLAUDE.md and CONTEXT.md: every table gets ENABLE ROW LEVEL SECURITY + at least one policy.
-- Activities is SELECT-only for users — writes are service-role only (Phase 3 tracking endpoint).

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_buyers ENABLE ROW LEVEL SECURITY;

-- DEALS
CREATE POLICY "Users can see own deals"
  ON deals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals"
  ON deals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals"
  ON deals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals"
  ON deals FOR DELETE USING (auth.uid() = user_id);

-- BUYERS
CREATE POLICY "Users can manage own buyers"
  ON buyers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTES (require both note ownership AND deal ownership)
CREATE POLICY "Users can manage notes on own deals"
  ON notes FOR ALL
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM deals WHERE deals.id = notes.deal_id AND deals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM deals WHERE deals.id = notes.deal_id AND deals.user_id = auth.uid()
    )
  );

-- DEAL_BUYERS (ownership via deals join)
CREATE POLICY "Users can manage deal_buyers for own deals"
  ON deal_buyers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals WHERE deals.id = deal_buyers.deal_id AND deals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals WHERE deals.id = deal_buyers.deal_id AND deals.user_id = auth.uid()
    )
  );

-- ACTIVITIES (SELECT only for users; INSERTs from tracking endpoint use service role and bypass RLS)
CREATE POLICY "Users can read activities for own deals"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals WHERE deals.id = activities.deal_id AND deals.user_id = auth.uid()
    )
  );

-- DEAL_FILES (ownership via deals join)
CREATE POLICY "Users can manage deal_files for own deals"
  ON deal_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM deals WHERE deals.id = deal_files.deal_id AND deals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals WHERE deals.id = deal_files.deal_id AND deals.user_id = auth.uid()
    )
  );
