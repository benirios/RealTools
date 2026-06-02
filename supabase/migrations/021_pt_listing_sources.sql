-- 021_pt_listing_sources.sql
-- Portugal pivot: replace the OLX (Brazil) listing source with the Portuguese
-- commercial real-estate portals Idealista and Imovirtual.
--
-- The CHECK constraints are recreated as NOT VALID so they apply to new/updated
-- rows only — existing legacy 'olx'/'facebook_manual' rows are left untouched and
-- do not block the migration. 'manual' is preserved for hand-added listings.

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_source_check;
ALTER TABLE listings ADD CONSTRAINT listings_source_check
  CHECK (source IN ('idealista', 'imovirtual', 'manual')) NOT VALID;

ALTER TABLE listing_import_targets DROP CONSTRAINT IF EXISTS listing_import_targets_source_check;
ALTER TABLE listing_import_targets ADD CONSTRAINT listing_import_targets_source_check
  CHECK (source IN ('idealista', 'imovirtual')) NOT VALID;

-- listing_import_runs.source was created with an inline CHECK; its constraint name
-- is auto-generated, so drop by lookup before re-adding.
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'listing_import_runs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%source%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE listing_import_runs DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE listing_import_runs ADD CONSTRAINT listing_import_runs_source_check
  CHECK (source IN ('idealista', 'imovirtual')) NOT VALID;
