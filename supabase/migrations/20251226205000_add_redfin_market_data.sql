-- Create table for Redfin market data
CREATE TABLE IF NOT EXISTS public.redfin_market_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Location identifiers
  zip_code TEXT NOT NULL,
  city TEXT,
  state TEXT,
  state_code TEXT,
  region_type TEXT NOT NULL,

  -- Property type
  property_type TEXT NOT NULL,

  -- Time period
  period_begin DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Price metrics
  median_sale_price NUMERIC,
  median_sale_price_yoy NUMERIC,
  median_list_price NUMERIC,
  median_ppsf NUMERIC,

  -- Market velocity
  median_dom INTEGER,
  homes_sold INTEGER,
  new_listings INTEGER,
  inventory INTEGER,
  months_of_supply NUMERIC,

  -- Market health
  avg_sale_to_list NUMERIC,
  sold_above_list NUMERIC,
  price_drops NUMERIC,

  -- Metadata
  last_updated TIMESTAMP WITH TIME ZONE,
  data_imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for fast lookups
  UNIQUE(zip_code, property_type, period_end)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redfin_zip ON public.redfin_market_data(zip_code);
CREATE INDEX IF NOT EXISTS idx_redfin_zip_property ON public.redfin_market_data(zip_code, property_type);
CREATE INDEX IF NOT EXISTS idx_redfin_period ON public.redfin_market_data(period_end DESC);

-- Enable RLS
ALTER TABLE public.redfin_market_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access (data is public anyway)
CREATE POLICY "Allow public read access to redfin data"
  ON public.redfin_market_data
  FOR SELECT
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Only service role can modify redfin data"
  ON public.redfin_market_data
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to get latest market data for a ZIP code
CREATE OR REPLACE FUNCTION get_latest_market_data(p_zip_code TEXT, p_property_type TEXT DEFAULT 'All Residential')
RETURNS TABLE (
  median_sale_price NUMERIC,
  price_change_yoy NUMERIC,
  days_on_market INTEGER,
  inventory INTEGER,
  months_supply NUMERIC,
  data_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.median_sale_price,
    r.median_sale_price_yoy,
    r.median_dom,
    r.inventory,
    r.months_of_supply,
    r.period_end
  FROM public.redfin_market_data r
  WHERE r.zip_code = p_zip_code
    AND r.property_type = p_property_type
  ORDER BY r.period_end DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
