#!/usr/bin/env tsx
/**
 * Create Redfin market data table
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function createTable() {
  console.log('Creating redfin_market_data table...')

  // Execute raw SQL via the REST API
  const createTableSQL = `
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
  `

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: createTableSQL })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('✅ Table created successfully')
  } catch (error) {
    console.error('Error:', error)
    console.log('\nℹ️  You may need to run this SQL manually in the Supabase dashboard:')
    console.log(createTableSQL)
  }
}

createTable().catch(console.error)
