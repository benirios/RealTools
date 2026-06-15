-- OM distribution for the investor model.
-- One row per send event. A match can be re-sent so this is separate
-- from investor_listing_matches (don't pollute the deterministic match record).
-- RLS stays OFF per migration 019 / Clerk app-layer filtering — filter by user_id in code.

create table investor_om_sends (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  listing_id uuid not null references listings(id) on delete cascade,
  investor_id uuid not null references investors(id) on delete cascade,
  tracking_token text not null unique default gen_random_uuid()::text,
  om_sent_at timestamptz,
  om_opened_at timestamptz,
  created_at timestamptz default now()
);

create index on investor_om_sends (listing_id);
create index on investor_om_sends (investor_id);
create index on investor_om_sends (tracking_token);
create index on investor_om_sends (user_id);
