-- Suppression flag for OM email sends. Set when an investor unsubscribes via
-- the List-Unsubscribe link/header (RFC 8058 one-click). sendOmAction must
-- skip investors with this set.

ALTER TABLE public.investors ADD COLUMN IF NOT EXISTS om_unsubscribed_at TIMESTAMPTZ;
