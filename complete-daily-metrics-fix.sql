-- Complete fix for daily_metrics table schema issues
-- Run this entire script in your Supabase SQL editor

-- Step 1: Check if table exists and what columns it has
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_metrics'
ORDER BY ordinal_position;

-- Step 2: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    revenue DECIMAL(10, 2) DEFAULT 0,
    units_sold INTEGER DEFAULT 0,
    website_visitors INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    email_signups INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 3: Add missing columns to existing table (if table exists but columns are missing)
DO $$ 
BEGIN
    -- Add revenue column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_metrics' AND column_name = 'revenue') THEN
        ALTER TABLE daily_metrics ADD COLUMN revenue DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Add units_sold column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_metrics' AND column_name = 'units_sold') THEN
        ALTER TABLE daily_metrics ADD COLUMN units_sold INTEGER DEFAULT 0;
    END IF;
    
    -- Add website_visitors column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_metrics' AND column_name = 'website_visitors') THEN
        ALTER TABLE daily_metrics ADD COLUMN website_visitors INTEGER DEFAULT 0;
    END IF;
    
    -- Add conversions column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_metrics' AND column_name = 'conversions') THEN
        ALTER TABLE daily_metrics ADD COLUMN conversions INTEGER DEFAULT 0;
    END IF;
    
    -- Add email_signups column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_metrics' AND column_name = 'email_signups') THEN
        ALTER TABLE daily_metrics ADD COLUMN email_signups INTEGER DEFAULT 0;
    END IF;
    
    -- Add timestamps if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_metrics' AND column_name = 'created_at') THEN
        ALTER TABLE daily_metrics ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_metrics' AND column_name = 'updated_at') THEN
        ALTER TABLE daily_metrics ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
    END IF;
END $$;

-- Step 4: Enable Row Level Security
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Step 5: Create or replace the RLS policy
DROP POLICY IF EXISTS "Allow all for authenticated users" ON daily_metrics;
CREATE POLICY "Allow all for authenticated users" ON daily_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_daily_metrics_updated_at ON daily_metrics;
CREATE TRIGGER update_daily_metrics_updated_at 
    BEFORE UPDATE ON daily_metrics
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Verify the final schema
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'daily_metrics'
ORDER BY ordinal_position;

-- Expected output should show all these columns:
-- id (uuid)
-- date (date)
-- revenue (numeric)
-- units_sold (integer)
-- website_visitors (integer)
-- conversions (integer)
-- email_signups (integer)
-- created_at (timestamp with time zone)
-- updated_at (timestamp with time zone)