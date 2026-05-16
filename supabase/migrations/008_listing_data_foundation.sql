-- 008_listing_data_foundation.sql
-- User-scoped national Brazil listing foundation for opportunity sourcing.

CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source          TEXT NOT NULL,
  source_url      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  price_text      TEXT,
  price_amount    NUMERIC,
  location_text   TEXT,
  address_text    TEXT,
  country         TEXT NOT NULL DEFAULT 'BR',
  state           TEXT,
  city            TEXT,
  neighborhood    TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  images          TEXT[] DEFAULT '{}',
  is_commercial   BOOLEAN,
  commercial_type TEXT,
  confidence      INTEGER CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
  reasoning       TEXT,
  raw_payload     JSONB DEFAULT '{}'::jsonb,
  first_seen_at   TIMESTAMPTZ DEFAULT now(),
  last_seen_at    TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT listings_source_check CHECK (source IN ('olx', 'facebook_manual')),
  CONSTRAINT listings_user_source_url_unique UNIQUE (user_id, source, source_url)
);

CREATE TABLE listing_import_targets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'BR',
  state       TEXT NOT NULL,
  city        TEXT NOT NULL,
  search_term TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT listing_import_targets_source_check CHECK (source IN ('olx', 'facebook_manual')),
  CONSTRAINT listing_import_targets_unique UNIQUE (user_id, source, country, state, city, search_term)
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_import_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own listings"
  ON listings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own listing import targets"
  ON listing_import_targets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_user_source ON listings(user_id, source);
CREATE INDEX idx_listings_source_url ON listings(source_url);
CREATE INDEX idx_listings_state_city ON listings(state, city);
CREATE INDEX idx_listings_commercial ON listings(is_commercial, commercial_type);
CREATE INDEX idx_listing_import_targets_user_id ON listing_import_targets(user_id);
CREATE INDEX idx_listing_import_targets_active ON listing_import_targets(user_id, is_active);
