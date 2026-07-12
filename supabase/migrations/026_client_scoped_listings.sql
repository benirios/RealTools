-- Client-scoped pipelines: a listing is now scraped "for" a specific investor
-- (client) rather than landing in one global broker-wide pool. investor_id is
-- nullable on all three tables since existing rows predate this and the
-- broker may still want an untargeted/no-client scrape later — enforced at
-- the application layer, not the DB, for new rows going forward.
--
-- investor_listing_matches already links (investor_id, listing_id) with a
-- computed score — is_manual_share distinguishes "broker explicitly shared
-- this listing with this investor" from "the algorithm scored a match."
-- Both can be true for the same row; a manual share doesn't need or imply
-- an algorithmic match, and vice versa.

ALTER TABLE listings
  ADD COLUMN investor_id uuid REFERENCES investors(id) ON DELETE SET NULL;
CREATE INDEX listings_investor_id_idx ON listings(investor_id);

ALTER TABLE listing_import_targets
  ADD COLUMN investor_id uuid REFERENCES investors(id) ON DELETE CASCADE;
CREATE INDEX listing_import_targets_investor_id_idx ON listing_import_targets(investor_id);

ALTER TABLE listing_import_runs
  ADD COLUMN investor_id uuid REFERENCES investors(id) ON DELETE SET NULL;
CREATE INDEX listing_import_runs_investor_id_idx ON listing_import_runs(investor_id);

ALTER TABLE investor_listing_matches
  ADD COLUMN is_manual_share boolean NOT NULL DEFAULT false;
