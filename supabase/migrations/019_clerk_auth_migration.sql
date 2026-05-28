-- Migrate from Supabase Auth to Clerk.
-- Drops auth.users FK constraints, converts user_id columns to TEXT,
-- and disables RLS (app-layer filtering via Clerk userId replaces it).

-- Helper: drop all auth.users FK constraints (named pattern: <table>_user_id_fkey)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tc.table_name, tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.table_constraints ccu
      ON rc.unique_constraint_name = ccu.constraint_name
      AND rc.unique_constraint_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.column_name = 'user_id'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, r.constraint_name);
  END LOOP;
END $$;

-- Drop all RLS policies that reference user_id (required before altering column type)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Convert user_id from UUID to TEXT on all affected tables
ALTER TABLE public.deals                ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.buyers               ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.notes                ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.deal_files           ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.listings             ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.listing_import_runs  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.investors            ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.location_insights    ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.opportunity_scores   ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.listing_ai_summaries ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.strategy_fit_scores  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE public.client_opportunities ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Disable RLS — service role client + app-layer user_id filtering replaces it
ALTER TABLE public.deals                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers               DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_files           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_import_runs  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_insights    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_scores   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_ai_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_fit_scores  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_opportunities DISABLE ROW LEVEL SECURITY;
