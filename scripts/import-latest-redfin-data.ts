#!/usr/bin/env tsx
/**
 * Import ONLY the latest data for each US ZIP code from Redfin
 * Much more efficient - only keeps most recent period per ZIP/property type
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as readline from 'readline'
import * as zlib from 'zlib'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as https from 'https'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const REDFIN_ZIP_URL = 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/zip_code_market_tracker.tsv000.gz'
const TEMP_FILE = '/tmp/redfin_zips.tsv.gz'

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (response) => {
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

async function importLatestData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log('📥 Downloading Redfin dataset...')
  await downloadFile(REDFIN_ZIP_URL, TEMP_FILE)
  const fileSize = fs.statSync(TEMP_FILE).size / (1024 * 1024)
  console.log(`✅ Downloaded ${fileSize.toFixed(1)}MB`)

  console.log('📊 Processing data (keeping only latest records)...')

  // Store only the latest record for each ZIP + property type
  const latestRecords = new Map<string, any>()
  let lineCount = 0
  let headers: string[] = []

  const fileStream = fs.createReadStream(TEMP_FILE)
  const gunzip = zlib.createGunzip()
  const rl = readline.createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    lineCount++

    if (lineCount === 1) {
      // Parse headers
      headers = line.split('\t').map(h => h.replace(/"/g, ''))
      continue
    }

    if (lineCount % 50000 === 0) {
      console.log(`  Processed ${lineCount.toLocaleString()} lines, keeping ${latestRecords.size.toLocaleString()} unique records...`)
    }

    const values = line.split('\t').map(v => v.replace(/"/g, ''))
    const record: any = {}

    headers.forEach((header, index) => {
      record[header] = values[index] || null
    })

    // Extract ZIP code
    const zipMatch = record.REGION?.match(/(\d{5})/)
    if (!zipMatch) continue

    const zipCode = zipMatch[1]
    const propertyType = record.PROPERTY_TYPE

    // Skip if no median price
    if (!record.MEDIAN_SALE_PRICE || record.MEDIAN_SALE_PRICE === 'NA') {
      continue
    }

    // Create unique key
    const key = `${zipCode}|${propertyType}`
    const periodEnd = new Date(record.PERIOD_END)

    // Keep only most recent
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
    }
  }

  const finalRecords = Array.from(latestRecords.values())
  const uniqueZips = new Set(finalRecords.map(r => r.zip_code)).size

  console.log(`\n✅ Processed ${lineCount.toLocaleString()} total records`)
  console.log(`📦 Keeping ${finalRecords.length.toLocaleString()} latest records`)
  console.log(`📍 Covering ${uniqueZips.toLocaleString()} unique ZIP codes`)

  // Clean up temp file
  fs.unlinkSync(TEMP_FILE)

  // Import to database in batches
  console.log('\n💾 Importing to database...')
  const BATCH_SIZE = 500
  const totalBatches = Math.ceil(finalRecords.length / BATCH_SIZE)
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < finalRecords.length; i += BATCH_SIZE) {
    const batch = finalRecords.slice(i, i + BATCH_SIZE)
    const batchNum = (i / BATCH_SIZE) + 1

    const { error } = await supabase
      .from('redfin_market_data')
      .upsert(batch, {
        onConflict: 'zip_code,property_type,period_end'
      })

    if (error) {
      console.error(`❌ Batch ${batchNum}/${totalBatches} failed:`, error.message)
      errorCount++
    } else {
      successCount += batch.length
      if (batchNum % 10 === 0 || batchNum === totalBatches) {
        console.log(`✓ Batch ${batchNum}/${totalBatches} (${successCount.toLocaleString()} records imported)`)
      }
    }
  }

  console.log('\n🎉 Import complete!')
  console.log(`✅ Successfully imported: ${successCount.toLocaleString()} records`)
  if (errorCount > 0) {
    console.log(`⚠️  Failed batches: ${errorCount}`)
  }
  console.log(`📍 Total ZIP codes: ${uniqueZips.toLocaleString()}`)
}

importLatestData().catch((error) => {
  console.error('❌ Import failed:', error)
  process.exit(1)
})
