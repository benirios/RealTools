-- 011_location_insights.sql
-- User-scoped location intelligence foundation for commercial real estate context.

CREATE TABLE location_insights (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id         UUID REFERENCES listings(id) ON DELETE SET NULL,
  address            TEXT,
  neighborhood       TEXT,
  city               TEXT NOT NULL,
  state              TEXT NOT NULL,
  country            TEXT NOT NULL DEFAULT 'BR',
  latitude           DOUBLE PRECISION,
  longitude          DOUBLE PRECISION,
  avg_income         NUMERIC,
  population_density NUMERIC,
  consumer_profile   TEXT,
  nearby_businesses   JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_sources       JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_score   INTEGER CHECK (
    confidence_score IS NULL OR
    (confidence_score >= 0 AND confidence_score <= 100)
  ),
  raw_geocode        JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_demographics   JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_places         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT location_insights_user_listing_unique UNIQUE (user_id, listing_id),
  CONSTRAINT location_insights_latitude_check CHECK (
    latitude IS NULL OR (latitude >= -90 AND latitude <= 90)
  ),
  CONSTRAINT location_insights_longitude_check CHECK (
    longitude IS NULL OR (longitude >= -180 AND longitude <= 180)
  )
);

CREATE OR REPLACE FUNCTION update_location_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE location_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own location insights"
  ON location_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_location_insights_user_id ON location_insights(user_id);
CREATE INDEX idx_location_insights_listing_id ON location_insights(listing_id);
CREATE INDEX idx_location_insights_state_city ON location_insights(state, city);
CREATE INDEX idx_location_insights_coordinates ON location_insights(latitude, longitude);

DROP TRIGGER IF EXISTS set_location_insights_updated_at ON location_insights;
CREATE TRIGGER set_location_insights_updated_at
BEFORE UPDATE ON location_insights
FOR EACH ROW EXECUTE FUNCTION update_location_insights_updated_at();
