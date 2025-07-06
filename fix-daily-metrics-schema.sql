-- Fix daily_metrics table schema
-- Run this in Supabase SQL editor to add any missing columns

-- Add all potentially missing columns
ALTER TABLE daily_metrics 
ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS email_signups INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS website_visitors INTEGER DEFAULT 0;

-- Verify all columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_metrics'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid)
-- date (date)
-- revenue (numeric/decimal)
-- units_sold (integer)
-- website_visitors (integer)
-- conversions (integer)
-- email_signups (integer)
-- created_at (timestamp)
-- updated_at (timestamp)