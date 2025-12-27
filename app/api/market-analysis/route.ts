import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { RealEstateAPIClient, extractZipCode, generateFallbackMarketData } from '@/lib/real-estate-api'

const CACHE_DURATION_DAYS = parseInt(process.env.MARKET_CACHE_DAYS || '14', 10)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const propertyType = searchParams.get('propertyType') || 'Single Family Home'
    const forceRefresh = searchParams.get('forceRefresh') === 'true'

    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter required' },
        { status: 400 }
      )
    }

    // Normalize location to ZIP code for API calls
    const zipCode = extractZipCode(location)
    if (!zipCode) {
      return NextResponse.json(
        {
          error: 'Unable to determine ZIP code from location',
          message: 'Please include a ZIP code in the location (e.g., "Austin, TX 78701")'
        },
        { status: 400 }
      )
    }

    const locationKey = zipCode
    const dataType = 'sale'

    // Step 1: Check cache (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedData, error: cacheError } = await (supabaseAdmin as any)
        .from('market_analysis_cache')
        .select('*')
        .eq('location_key', locationKey)
        .eq('data_type', dataType)
        .eq('property_type', propertyType)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (cachedData && !cacheError) {
        console.log('✅ Returning cached market data for', locationKey)
        return NextResponse.json({
          success: true,
          data: cachedData.parsed_data,
          cached: true,
          fetchedAt: cachedData.fetched_at,
        })
      }
    }

    // Step 2: Fetch from API
    console.log('🌐 Fetching fresh market data from API for', zipCode)
    const apiClient = new RealEstateAPIClient()

    let marketData
    let rawApiData = null

    try {
      rawApiData = await apiClient.getMarketStatistics(zipCode, 'Sale')
      if (!rawApiData) {
        throw new Error('No data returned from API')
      }
      marketData = apiClient.transformToMarketData(rawApiData, location, propertyType)
    } catch (error: any) {
      console.error('API fetch failed:', error.message)

      // Check for old cached data as fallback
      const { data: expiredCache } = await (supabaseAdmin as any)
        .from('market_analysis_cache')
        .select('*')
        .eq('location_key', locationKey)
        .eq('data_type', dataType)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()

      if (expiredCache) {
        console.log('⚠️ Using expired cache as fallback')
        return NextResponse.json({
          success: true,
          data: expiredCache.parsed_data,
          cached: true,
          expired: true,
          fetchedAt: expiredCache.fetched_at,
          warning: 'Current data unavailable. Showing last known data.',
        })
      }

      // Last resort: fallback data
      marketData = generateFallbackMarketData(location, propertyType)
      return NextResponse.json({
        success: true,
        data: marketData,
        cached: false,
        fallback: true,
        error: error.message,
      })
    }

    // Step 3: Save to cache
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + CACHE_DURATION_DAYS)

    const { error: saveError } = await (supabaseAdmin as any)
      .from('market_analysis_cache')
      .upsert(
        {
          location_key: locationKey,
          property_type: propertyType,
          data_type: dataType,
          raw_data: rawApiData,
          parsed_data: marketData,
          source: 'rentcast',
          fetched_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: 'location_key,property_type,data_type',
        }
      )

    if (saveError) {
      console.error('Failed to cache market data:', saveError)
      // Continue anyway - don't fail the request
    }

    return NextResponse.json({
      success: true,
      data: marketData,
      cached: false,
      fetchedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Market analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch market analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET route - no auth required, public market data
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
