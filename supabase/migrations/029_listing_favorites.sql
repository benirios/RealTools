-- 029_listing_favorites.sql
-- Scraped OLX listings land in a review queue per client; a broker "favorites"
-- one to promote it into that client's Imóveis tab. Manual listings skip the
-- queue entirely (created already favorited) since a human already decided
-- they belong there.

ALTER TABLE listings ADD COLUMN is_favorited boolean NOT NULL DEFAULT false;

-- Backfill: every listing already scoped to a client before this migration
-- was already visible in that client's Imóveis tab — keep it that way.
UPDATE listings SET is_favorited = true WHERE investor_id IS NOT NULL;

CREATE INDEX listings_investor_favorited_idx ON listings(investor_id, is_favorited);
