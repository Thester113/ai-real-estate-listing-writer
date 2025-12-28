#!/usr/bin/env tsx
/**
 * Import sample Redfin data for testing
 * This downloads a small subset of ZIP codes and loads them into the database
 */

import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const execAsync = promisify(exec)

const REDFIN_ZIP_URL = 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/zip_code_market_tracker.tsv000.gz'

async function importSampleData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'set' : 'not set')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🌐 Downloading Redfin ZIP code data...')

  // Download and parse first 1000 lines (header + 999 records)
  const { stdout } = await execAsync(
    `curl -s "${REDFIN_ZIP_URL}" | gunzip | head -1000`
  )

  const lines = stdout.trim().split('\n')
  const headers = lines[0].split('\t').map(h => h.replace(/"/g, ''))

  console.log(`📊 Processing ${lines.length - 1} sample records...`)

  const records = []
  let processedCount = 0
  let skippedCount = 0

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map(v => v.replace(/"/g, ''))
    const record: any = {}

    headers.forEach((header, index) => {
      record[header] = values[index] || null
    })

    // Extract ZIP code from REGION field (e.g., "Zip Code: 53225")
    const zipMatch = record.REGION?.match(/(\d{5})/)
    if (!zipMatch) {
      skippedCount++
      continue
    }

    const zipCode = zipMatch[1]

    // Only process "All Residential" for now
    if (record.PROPERTY_TYPE !== 'All Residential') {
      skippedCount++
      continue
    }

    // Skip if no median price
    if (!record.MEDIAN_SALE_PRICE || record.MEDIAN_SALE_PRICE === 'NA') {
      skippedCount++
      continue
    }

    records.push({
      zip_code: zipCode,
      city: record.CITY || null,
      state: record.STATE || null,
      state_code: record.STATE_CODE || null,
      region_type: record.REGION_TYPE || 'zip code',
      property_type: record.PROPERTY_TYPE,
      period_begin: record.PERIOD_BEGIN,
      period_end: record.PERIOD_END,
      median_sale_price: parseFloat(record.MEDIAN_SALE_PRICE) || null,
      median_sale_price_yoy: parseFloat(record.MEDIAN_SALE_PRICE_YOY) || null,
      median_list_price: parseFloat(record.MEDIAN_LIST_PRICE) || null,
      median_ppsf: parseFloat(record.MEDIAN_PPSF) || null,
      median_dom: parseInt(record.MEDIAN_DOM) || null,
      homes_sold: parseInt(record.HOMES_SOLD) || null,
      new_listings: parseInt(record.NEW_LISTINGS) || null,
      inventory: parseInt(record.INVENTORY) || null,
      months_of_supply: parseFloat(record.MONTHS_OF_SUPPLY) || null,
      avg_sale_to_list: parseFloat(record.AVG_SALE_TO_LIST) || null,
      sold_above_list: parseFloat(record.SOLD_ABOVE_LIST) || null,
      price_drops: parseFloat(record.PRICE_DROPS) || null,
      last_updated: record.LAST_UPDATED || null,
    })

    processedCount++
  }

  console.log(`✅ Processed ${processedCount} valid records (skipped ${skippedCount})`)

  // Insert in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE)

    const { error } = await supabase
      .from('redfin_market_data')
      .upsert(batch, {
        onConflict: 'zip_code,property_type,period_end'
      })

    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error)
    } else {
      console.log(`✓ Inserted batch ${i / BATCH_SIZE + 1} (${batch.length} records)`)
    }
  }

  console.log('🎉 Sample data import complete!')
  console.log(`Total records imported: ${processedCount}`)
}

importSampleData().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
