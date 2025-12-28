#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupTable() {
  console.log('🔍 Checking if redfin_market_data table exists...')

  // Try to query the table
  const { error: checkError } = await supabase
    .from('redfin_market_data')
    .select('id')
    .limit(1)

  if (!checkError) {
    console.log('✅ Table already exists!')
    return true
  }

  console.log('❌ Table does not exist')
  console.log('\n📋 Please run this SQL in your Supabase dashboard (SQL Editor):')
  console.log('=' .repeat(80))
  console.log(`
CREATE TABLE IF NOT EXISTS public.redfin_market_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code TEXT NOT NULL,
  city TEXT,
  state TEXT,
  state_code TEXT,
  region_type TEXT NOT NULL,
  property_type TEXT NOT NULL,
  period_begin DATE NOT NULL,
  period_end DATE NOT NULL,
  median_sale_price NUMERIC,
  median_sale_price_yoy NUMERIC,
  median_list_price NUMERIC,
  median_ppsf NUMERIC,
  median_dom INTEGER,
  homes_sold INTEGER,
  new_listings INTEGER,
  inventory INTEGER,
  months_of_supply NUMERIC,
  avg_sale_to_list NUMERIC,
  sold_above_list NUMERIC,
  price_drops NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE,
  data_imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(zip_code, property_type, period_end)
);

CREATE INDEX idx_redfin_zip ON public.redfin_market_data(zip_code);
CREATE INDEX idx_redfin_zip_property ON public.redfin_market_data(zip_code, property_type);
CREATE INDEX idx_redfin_period ON public.redfin_market_data(period_end DESC);

ALTER TABLE public.redfin_market_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.redfin_market_data
  FOR SELECT USING (true);
`)
  console.log('=' .repeat(80))
  console.log('\n🔗 Go to: https://supabase.com/dashboard/project/vhobxnavetcsyzgdnedi/sql/new')

  return false
}

setupTable().catch(console.error)
