-- 007_deal_files_user_id.sql
-- Add user_id column to deal_files for direct IDOR protection in Server Actions.
-- The existing RLS policy (via deals join) is retained; this column adds defense-in-depth
-- and matches the security model described in 02-03-PLAN.md threat T-03-02.

ALTER TABLE deal_files
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Back-fill existing rows (if any) by deriving user_id from the parent deal
UPDATE deal_files
  SET user_id = deals.user_id
  FROM deals
  WHERE deal_files.deal_id = deals.id
  AND deal_files.user_id IS NULL;

-- Make the column NOT NULL now that back-fill is complete
ALTER TABLE deal_files
  ALTER COLUMN user_id SET NOT NULL;
