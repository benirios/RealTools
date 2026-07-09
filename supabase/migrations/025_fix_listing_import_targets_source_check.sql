-- listing_import_targets_source_check drifted on the live database to
-- CHECK (source = ANY ('idealista', 'imovirtual')) — Portugal-market portal
-- names, not what any committed migration here ever defined (008 and 021 both
-- say 'olx'/'facebook_manual'). This project's Supabase instance appears to
-- have been touched by unrelated work outside this migration history; 021's
-- fix is recorded as applied but was silently overwritten afterward.
-- Every createImportTargetAction/seedDefaultImportTargetsAction call has been
-- failing this check 100% of the time as a result — reapplying 021's intent.

ALTER TABLE listing_import_targets
  DROP CONSTRAINT IF EXISTS listing_import_targets_source_check;

ALTER TABLE listing_import_targets
  ADD CONSTRAINT listing_import_targets_source_check
  CHECK (source IN ('olx', 'facebook_manual'));
