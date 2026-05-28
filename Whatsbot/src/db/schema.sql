create extension if not exists pgcrypto;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null unique,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  contact_id uuid primary key references contacts(id) on delete cascade,
  state text not null default 'idle',
  booking_draft jsonb not null default '{}'::jsonb,
  last_intent text,
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  service text not null,
  preferred_date text not null,
  preferred_time text not null,
  status text not null default 'simulated_confirmed',
  upsell_offered boolean not null default false,
  upsell_response text,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id bigserial primary key,
  wa_message_id text unique,
  contact_id uuid not null references contacts(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  text text not null,
  intent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_contact_created_at
  on messages(contact_id, created_at desc);

create index if not exists idx_bookings_contact_created_at
  on bookings(contact_id, created_at desc);

