-- migration 019 disabled RLS on all 12 Clerk-era tables (app-layer user_id
-- filtering was meant to replace it). 10 of the 12 have since had RLS
-- re-enabled directly on the remote DB (undocumented dashboard change, no
-- policies attached — service_role bypasses RLS regardless, so the app
-- still works; anon/authenticated get default-deny). These 2 were never
-- re-enabled and are reachable by anon key with zero auth. Bring them in
-- line with the other 10: RLS on, no policy (deny-all for anon/authenticated,
-- service_role unaffected).

ALTER TABLE public.client_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_ai_summaries ENABLE ROW LEVEL SECURITY;
