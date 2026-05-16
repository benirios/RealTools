-- 001_initial_schema.sql
-- All six v1 tables. ON DELETE CASCADE on every user-scoped FK so account deletion is clean.

CREATE TABLE deals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  address     TEXT,
  price       NUMERIC,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE buyers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  tags       TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deal_buyers (
  deal_id         UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  buyer_id        UUID NOT NULL REFERENCES buyers(id) ON DELETE CASCADE,
  tracking_token  UUID NOT NULL DEFAULT gen_random_uuid(),
  om_sent_at      TIMESTAMPTZ,
  om_opened_at    TIMESTAMPTZ,
  PRIMARY KEY (deal_id, buyer_id)
);

CREATE TABLE notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id    UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deal_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
