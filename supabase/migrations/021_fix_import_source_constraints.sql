-- Fix CHECK constraints on import tables that were created before 'olx' was
-- added to the allowed source list. Drop and recreate with correct values.

ALTER TABLE listing_import_runs
  DROP CONSTRAINT IF EXISTS listing_import_runs_source_check;

ALTER TABLE listing_import_runs
  ADD CONSTRAINT listing_import_runs_source_check
  CHECK (source IN ('olx', 'facebook_manual'));

ALTER TABLE listing_import_targets
  DROP CONSTRAINT IF EXISTS listing_import_targets_source_check;

ALTER TABLE listing_import_targets
  ADD CONSTRAINT listing_import_targets_source_check
  CHECK (source IN ('olx', 'facebook_manual'));

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_source_check;

ALTER TABLE listings
  ADD CONSTRAINT listings_source_check
  CHECK (source IN ('olx', 'facebook_manual'));
