# Complete Database Schema for Memory Grove Tracker

This document contains the complete expected schema for all tables in the Memory Grove Tracker application.

## Core Tables (Initial 5)

### 1. tasks
```sql
CREATE TABLE tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task VARCHAR(255) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    completed BOOLEAN DEFAULT false,
    week INTEGER NOT NULL,
    day VARCHAR(50) NOT NULL,
    due_date DATE,
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 2. budget_items
```sql
CREATE TABLE budget_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    budgeted DECIMAL(10, 2) DEFAULT 0,
    actual DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 3. partnerships
```sql
CREATE TABLE partnerships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'prospecting',
    revenue_share DECIMAL(5, 2),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    next_action TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 4. daily_metrics
```sql
CREATE TABLE daily_metrics (
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
```

### 5. contacts
```sql
CREATE TABLE contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    type VARCHAR(50) DEFAULT 'general',
    last_contact DATE,
    notes TEXT,
    is_san_diego_resource BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

## Additional Tables (from supabase-additional-schema.sql)

### 6. marketing_campaigns
```sql
CREATE TABLE marketing_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    platform VARCHAR(50) NOT NULL,
    content_type VARCHAR(50),
    caption TEXT,
    status VARCHAR(20) DEFAULT 'planned',
    engagement_metrics JSONB,
    campaign_name VARCHAR(100),
    campaign_type VARCHAR(50),
    budget DECIMAL(10, 2) DEFAULT 0,
    spend DECIMAL(10, 2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 7. inventory_items
```sql
CREATE TABLE inventory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    component VARCHAR(100) NOT NULL,
    supplier VARCHAR(100),
    unit_cost DECIMAL(10, 2),
    min_order_quantity INTEGER DEFAULT 1,
    lead_time VARCHAR(50),
    in_stock INTEGER DEFAULT 0,
    on_order INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 25,
    reorder_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

## Row Level Security (RLS) Policies

All tables should have RLS enabled with the following policy:

```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON [table_name]
    FOR ALL USING (auth.role() = 'authenticated');
```

## Helper Functions

### Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';
```

## Verification Query

To verify all tables and columns exist:

```sql
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('tasks', 'budget_items', 'partnerships', 'daily_metrics', 
                   'contacts', 'marketing_campaigns', 'inventory_items')
ORDER BY table_name, ordinal_position;
```