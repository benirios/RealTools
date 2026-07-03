-- AI-organized version of scraped listing descriptions, computed 1:1 from
-- listings.description. Columns added directly to listings (not a separate
-- table) since this is a derived field of a single row, not an aggregation
-- of multiple sources like listing_ai_summaries.

ALTER TABLE listings
  ADD COLUMN description_organized JSONB,
  ADD COLUMN description_organized_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN description_organized_hash TEXT,
  ADD COLUMN description_organized_error TEXT;

ALTER TABLE listings
  ADD CONSTRAINT listings_description_organized_status_check
  CHECK (description_organized_status IN ('pending', 'processing', 'completed', 'failed'));
