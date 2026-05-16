-- 010_investor_matching.sql
-- Practical investor preference and deal/listing matching foundation.

CREATE TABLE investors (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  email                   TEXT,
  phone                   TEXT,
  budget_min              NUMERIC,
  budget_max              NUMERIC,
  preferred_neighborhoods TEXT[] DEFAULT '{}',
  property_types          TEXT[] DEFAULT '{}',
  strategy                TEXT NOT NULL DEFAULT 'any',
  risk_level              TEXT NOT NULL DEFAULT 'any',
  desired_yield           NUMERIC,
  tags                    TEXT[] DEFAULT '{}',
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT investors_strategy_check CHECK (strategy IN ('rental_income', 'flip', 'own_business', 'land_banking', 'any')),
  CONSTRAINT investors_risk_level_check CHECK (risk_level IN ('low', 'medium', 'high', 'any')),
  CONSTRAINT investors_budget_check CHECK (
    budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max
  )
);

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS property_type TEXT;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS property_type TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS commercial_confidence_score INTEGER CHECK (
    commercial_confidence_score IS NULL OR
    (commercial_confidence_score >= 0 AND commercial_confidence_score <= 100)
  );

ALTER TABLE investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own investors"
  ON investors FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_investors_user_id ON investors(user_id);
CREATE INDEX idx_investors_strategy ON investors(user_id, strategy);
CREATE INDEX idx_investors_risk_level ON investors(user_id, risk_level);
CREATE INDEX idx_listings_property_type ON listings(user_id, property_type);
CREATE INDEX idx_deals_property_type ON deals(user_id, property_type);
