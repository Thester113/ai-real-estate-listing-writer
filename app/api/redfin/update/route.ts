/**
 * Weekly Redfin Data Update Cron Endpoint
 * Called by Vercel Cron every Saturday at 3 AM UTC
 * Schedule: "0 3 * * 6" in vercel.json
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import * as zlib from 'zlib'

// Vercel function timeout (60 seconds for large data import)
export const maxDuration = 60

const REDFIN_ZIP_URL = 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/zip_code_market_tracker.tsv000.gz'

interface RedfinRecord {
  zip_code: string
  city: string | null
  state: string | null
  state_code: string | null
  region_type: string
  property_type: string
  period_begin: string
  period_end: string
  median_sale_price: number | null
  median_sale_price_yoy: number | null
  median_list_price: number | null
  median_ppsf: number | null
  median_dom: number | null
  homes_sold: number | null
  new_listings: number | null
  inventory: number | null
  months_of_supply: number | null
  avg_sale_to_list: number | null
  sold_above_list: number | null
  price_drops: number | null
  last_updated: string | null
}

/**
 * GET handler for Vercel Cron
 * Security: Verifies CRON_SECRET to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Security: Verify cron authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[REDFIN] Unauthorized access attempt')
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('='.repeat(60))
  console.log('[REDFIN] Weekly data update started')
  console.log('[REDFIN] Timestamp:', new Date().toISOString())
  console.log('='.repeat(60))

  try {
    // Step 1: Download the Redfin data
    console.log('[REDFIN] Step 1: Downloading Redfin dataset...')
    const response = await fetch(REDFIN_ZIP_URL)

    if (!response.ok) {
      throw new Error(`Failed to download Redfin data: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const compressedData = Buffer.from(arrayBuffer)
    console.log(`[REDFIN] Downloaded ${(compressedData.length / (1024 * 1024)).toFixed(1)}MB compressed`)

    // Step 2: Decompress the gzip data
    console.log('[REDFIN] Step 2: Decompressing data...')
    const decompressedData = zlib.gunzipSync(compressedData)
    console.log(`[REDFIN] Decompressed to ${(decompressedData.length / (1024 * 1024)).toFixed(1)}MB`)

    // Step 3: Parse TSV and keep only latest records
    console.log('[REDFIN] Step 3: Processing data (keeping only latest records)...')
    const latestRecords = new Map<string, RedfinRecord>()

    // Convert buffer to string and split by lines
    const content = decompressedData.toString('utf-8')
    const lines = content.split('\n')

    let headers: string[] = []

    for (let lineCount = 0; lineCount < lines.length; lineCount++) {
      const line = lines[lineCount]
      if (!line.trim()) continue

      if (lineCount === 0) {
        // Parse headers
        headers = line.split('\t').map((h: string) => h.replace(/"/g, ''))
        continue
      }

      const values = line.split('\t').map((v: string) => v.replace(/"/g, ''))
      const record: Record<string, string | null> = {}

      headers.forEach((header, index) => {
        record[header] = values[index] || null
      })

      // Extract ZIP code
      const zipMatch = record.REGION?.match(/(\d{5})/)
      if (!zipMatch) continue

      const zipCode = zipMatch[1]
      const propertyType = record.PROPERTY_TYPE || 'Unknown'

      // Skip if no median price
      if (!record.MEDIAN_SALE_PRICE || record.MEDIAN_SALE_PRICE === 'NA') {
        continue
      }

      // Create unique key
      const key = `${zipCode}|${propertyType}`
      const periodEnd = new Date(record.PERIOD_END || '')

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
          period_begin: record.PERIOD_BEGIN || '',
          period_end: record.PERIOD_END || '',
          median_sale_price: parseFloat(record.MEDIAN_SALE_PRICE || '') || null,
          median_sale_price_yoy: parseFloat(record.MEDIAN_SALE_PRICE_YOY || '') || null,
          median_list_price: parseFloat(record.MEDIAN_LIST_PRICE || '') || null,
          median_ppsf: parseFloat(record.MEDIAN_PPSF || '') || null,
          median_dom: parseInt(record.MEDIAN_DOM || '') || null,
          homes_sold: parseInt(record.HOMES_SOLD || '') || null,
          new_listings: parseInt(record.NEW_LISTINGS || '') || null,
          inventory: parseInt(record.INVENTORY || '') || null,
          months_of_supply: parseFloat(record.MONTHS_OF_SUPPLY || '') || null,
          avg_sale_to_list: parseFloat(record.AVG_SALE_TO_LIST || '') || null,
          sold_above_list: parseFloat(record.SOLD_ABOVE_LIST || '') || null,
          price_drops: parseFloat(record.PRICE_DROPS || '') || null,
          last_updated: record.LAST_UPDATED || null,
        })
      }
    }

    const lineCount = lines.length

    const finalRecords = Array.from(latestRecords.values())
    const uniqueZips = new Set(finalRecords.map(r => r.zip_code)).size

    console.log(`[REDFIN] Processed ${lineCount.toLocaleString()} total lines`)
    console.log(`[REDFIN] Keeping ${finalRecords.length.toLocaleString()} latest records`)
    console.log(`[REDFIN] Covering ${uniqueZips.toLocaleString()} unique ZIP codes`)

    // Step 4: Upsert to database in batches
    console.log('[REDFIN] Step 4: Importing to database...')
    const BATCH_SIZE = 500
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < finalRecords.length; i += BATCH_SIZE) {
      const batch = finalRecords.slice(i, i + BATCH_SIZE)

      const { error } = await supabaseAdmin
        .from('redfin_market_data')
        .upsert(batch, {
          onConflict: 'zip_code,property_type,period_end'
        })

      if (error) {
        console.error(`[REDFIN] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message)
        errorCount++
      } else {
        successCount += batch.length
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('='.repeat(60))
    console.log('[REDFIN] Update complete!')
    console.log(`[REDFIN] Records imported: ${successCount.toLocaleString()}`)
    console.log(`[REDFIN] ZIP codes: ${uniqueZips.toLocaleString()}`)
    console.log(`[REDFIN] Duration: ${duration}s`)
    if (errorCount > 0) {
      console.log(`[REDFIN] Failed batches: ${errorCount}`)
    }
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      recordCount: successCount,
      zipCount: uniqueZips,
      duration: `${duration}s`,
      failedBatches: errorCount
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[REDFIN] Update failed:', errorMessage)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 500 }
    )
  }
}
