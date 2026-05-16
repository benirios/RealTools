-- 005_deals_price_text.sql
-- Change deals.price from NUMERIC to TEXT so brokers can enter formatted strings
-- like "$4,500,000" or "4.5M" without losing display fidelity.
-- This matches the threat model decision: "price stored as text (no numeric injection)".

ALTER TABLE deals ALTER COLUMN price TYPE TEXT USING price::text;
