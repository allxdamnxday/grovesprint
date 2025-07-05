-- Additional tables for Memory Grove Tracker
-- Run this after the initial schema

-- Marketing campaigns table
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

-- Inventory items table
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

-- Enable Row Level Security
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated users" ON marketing_campaigns
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON inventory_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default inventory items
INSERT INTO inventory_items (component, reorder_point) VALUES
  ('Certificates', 25),
  ('Seed Packets', 25),
  ('Gift Boxes', 25),
  ('QR Code Stickers', 100);