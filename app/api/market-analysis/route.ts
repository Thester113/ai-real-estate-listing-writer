import { NextRequest, NextResponse } from 'next/server'
import { extractZipCode, generateFallbackMarketData } from '@/lib/real-estate-api'
import { getRedfinMarketData } from '@/lib/redfin-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const propertyType = searchParams.get('propertyType') || 'All Residential'

    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter required' },
        { status: 400 }
      )
    }

    // Extract ZIP code from location
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

    console.log('📊 Fetching Redfin market data for ZIP', zipCode)

    // Fetch from Redfin database
    try {
      const marketData = await getRedfinMarketData(zipCode, propertyType)

      if (!marketData) {
        // No data found - return fallback
        console.log(`⚠️ No Redfin data found for ZIP ${zipCode}`)
        const fallbackData = generateFallbackMarketData(location, propertyType)
        return NextResponse.json({
          success: true,
          data: fallbackData,
          fallback: true,
          message: 'Market data not available for this ZIP code. Showing guidance instead.',
        })
      }

      return NextResponse.json({
        success: true,
        data: marketData,
        cached: false,
        fetchedAt: marketData.dataFreshness,
      })

    } catch (error: any) {
      console.error('Redfin data fetch error:', error.message)

      // Return fallback data
      const fallbackData = generateFallbackMarketData(location, propertyType)
      return NextResponse.json({
        success: true,
        data: fallbackData,
        fallback: true,
        error: error.message,
      })
    }

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
