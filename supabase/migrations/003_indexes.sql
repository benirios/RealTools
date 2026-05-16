-- 003_indexes.sql
-- Required from day one per ARCHITECTURE.md Scalability Considerations.

CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_buyers_user_id ON buyers(user_id);
CREATE INDEX idx_notes_deal_id ON notes(deal_id);
CREATE INDEX idx_activities_deal_id ON activities(deal_id);
CREATE INDEX idx_deal_buyers_tracking_token ON deal_buyers(tracking_token);
CREATE INDEX idx_deal_files_deal_id ON deal_files(deal_id);
