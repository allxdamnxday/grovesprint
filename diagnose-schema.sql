-- Diagnostic Script for Memory Grove Tracker Database
-- Run this in Supabase SQL editor to diagnose schema issues

-- 1. Check if daily_metrics table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_metrics'
) as daily_metrics_table_exists;

-- 2. List all columns in daily_metrics (if it exists)
SELECT 
    '--- CURRENT daily_metrics COLUMNS ---' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'daily_metrics'
ORDER BY ordinal_position;

-- 3. Check which expected columns are MISSING
SELECT 
    '--- MISSING COLUMNS ---' as info;
SELECT column_name 
FROM (
    VALUES 
        ('id'),
        ('date'),
        ('revenue'),
        ('units_sold'),
        ('website_visitors'),
        ('conversions'),
        ('email_signups'),
        ('created_at'),
        ('updated_at')
) AS expected(column_name)
WHERE column_name NOT IN (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_metrics'
);

-- 4. List all tables in your database
SELECT 
    '--- ALL TABLES IN DATABASE ---' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 5. Check RLS status
SELECT 
    '--- ROW LEVEL SECURITY STATUS ---' as info;
SELECT 
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'daily_metrics';

-- 6. Check if UUID extension is enabled
SELECT 
    '--- UUID EXTENSION STATUS ---' as info;
SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
) as uuid_extension_enabled;