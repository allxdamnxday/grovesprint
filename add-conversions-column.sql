-- Add missing conversions column to daily_metrics table
-- Run this in Supabase SQL editor

-- Add conversions column if it doesn't exist
ALTER TABLE daily_metrics 
ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_metrics' 
AND column_name = 'conversions';