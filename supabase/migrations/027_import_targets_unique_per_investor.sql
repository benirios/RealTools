-- Two different clients independently wanting the same city/search_term combo
-- must get their own saved target row, not silently collide and overwrite
-- each other's investor_id. NULL investor_id (existing global targets) still
-- coexists fine — SQL UNIQUE treats NULLs as distinct from each other.
ALTER TABLE listing_import_targets DROP CONSTRAINT listing_import_targets_unique;
ALTER TABLE listing_import_targets
  ADD CONSTRAINT listing_import_targets_unique
  UNIQUE (user_id, investor_id, source, country, state, city, search_term);
