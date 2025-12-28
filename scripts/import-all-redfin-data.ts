#!/usr/bin/env tsx
/**
 * Import ALL Redfin ZIP code data for the entire USA
 * This will download and process the full dataset (~100k+ records)
 */

import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const execAsync = promisify(exec)
const REDFIN_ZIP_URL = 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/zip_code_market_tracker.tsv000.gz'

async function importAllUSData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('🌐 Downloading complete Redfin ZIP code dataset for entire USA...')
  console.log('⏱️  This may take a few minutes...')

  // Download the entire dataset
  const { stdout } = await execAsync(
    `curl -s "${REDFIN_ZIP_URL}" | gunzip`
  )

  const lines = stdout.trim().split('\n')
  const headers = lines[0].split('\t').map(h => h.replace(/"/g, ''))

  console.log(`📊 Processing ${(lines.length - 1).toLocaleString()} total records from Redfin...`)

  const records = []
  let processedCount = 0
  let skippedCount = 0
  let totalLines = lines.length - 1

  // Group by ZIP + property type, keep only most recent period
  const latestRecords = new Map<string, any>()

  for (let i = 1; i < lines.length; i++) {
    if (i % 10000 === 0) {
      console.log(`  Progress: ${i.toLocaleString()} / ${totalLines.toLocaleString()} (${((i/totalLines)*100).toFixed(1)}%)`)
    }

    const values = lines[i].split('\t').map(v => v.replace(/"/g, ''))
    const record: any = {}

    headers.forEach((header, index) => {
      record[header] = values[index] || null
    })

    const zipMatch = record.REGION?.match(/(\d{5})/)
    if (!zipMatch) {
      skippedCount++
      continue
    }

    const zipCode = zipMatch[1]
    const propertyType = record.PROPERTY_TYPE

    // Skip if no median price
    if (!record.MEDIAN_SALE_PRICE || record.MEDIAN_SALE_PRICE === 'NA') {
      skippedCount++
      continue
    }

    // Create unique key for ZIP + property type
    const key = `${zipCode}|${propertyType}`
    const periodEnd = new Date(record.PERIOD_END)

    // Keep only the most recent record for each ZIP/property type
    const existing = latestRecords.get(key)
    if (!existing || new Date(existing.period_end) < periodEnd) {
      latestRecords.set(key, {
        zip_code: zipCode,
        city: record.CITY || null,
        state: record.STATE || null,
        state_code: record.STATE_CODE || null,
        region_type: record.REGION_TYPE || 'zip code',
        property_type: propertyType,
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
  }

  const finalRecords = Array.from(latestRecords.values())
  console.log(`\n✅ Processed ${processedCount.toLocaleString()} records (skipped ${skippedCount.toLocaleString()})`)
  console.log(`📦 Importing ${finalRecords.length.toLocaleString()} unique ZIP code/property type combinations...`)

  // Insert in batches
  const BATCH_SIZE = 500
  const totalBatches = Math.ceil(finalRecords.length / BATCH_SIZE)

  for (let i = 0; i < finalRecords.length; i += BATCH_SIZE) {
    const batch = finalRecords.slice(i, i + BATCH_SIZE)
    const batchNum = (i / BATCH_SIZE) + 1

    const { error } = await supabase
      .from('redfin_market_data')
      .upsert(batch, {
        onConflict: 'zip_code,property_type,period_end'
      })

    if (error) {
      console.error(`❌ Error inserting batch ${batchNum}:`, error)
    } else {
      console.log(`✓ Batch ${batchNum}/${totalBatches} (${batch.length} records)`)
    }
  }

  console.log('\n🎉 Complete USA dataset import finished!')
  console.log(`📍 Total unique ZIP codes with data: ${new Set(finalRecords.map(r => r.zip_code)).size.toLocaleString()}`)
  console.log(`📊 Total records in database: ${finalRecords.length.toLocaleString()}`)
}

importAllUSData().catch((error) => {
  console.error('❌ Import failed:', error)
  process.exit(1)
})
