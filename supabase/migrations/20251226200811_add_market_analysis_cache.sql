-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Market analysis cache table
CREATE TABLE IF NOT EXISTS public.market_analysis_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_key TEXT NOT NULL,
  property_type TEXT,
  data_type TEXT NOT NULL CHECK (data_type IN ('sale', 'rental', 'all')),
  raw_data JSONB NOT NULL,
  parsed_data JSONB NOT NULL,
  source TEXT NOT NULL DEFAULT 'rentcast',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_key, property_type, data_type)
);

-- Indexes for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_market_cache_location ON public.market_analysis_cache(location_key, data_type);
CREATE INDEX IF NOT EXISTS idx_market_cache_expiry ON public.market_analysis_cache(expires_at);

-- Create function for automatic timestamp updates (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_market_cache_updated_at BEFORE UPDATE ON public.market_analysis_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired market analysis cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_market_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.market_analysis_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
