-- 028_manual_listings.sql
-- Allow brokers to manually create/edit listings alongside scraped ones.
-- Manual listings have no source page, so source_url must become optional.

ALTER TABLE listings ALTER COLUMN source_url DROP NOT NULL;

ALTER TABLE listings DROP CONSTRAINT listings_source_check;
ALTER TABLE listings ADD CONSTRAINT listings_source_check
  CHECK (source IN ('olx', 'facebook_manual', 'manual'));
