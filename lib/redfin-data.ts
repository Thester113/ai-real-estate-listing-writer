// Redfin Data Center integration - Free market data
import { createClient } from '@supabase/supabase-js'
import { MarketData } from './real-estate-api'

const REDFIN_ZIP_DATA_URL = 'https://redfin-public-data.s3.us-west-2.amazonaws.com/redfin_market_tracker/zip_code_market_tracker.tsv000.gz'

interface RedfinRecord {
  zip_code: string
  city: string
  state: string
  state_code: string
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
  last_updated: string
}

/**
 * Fetch market data from Redfin database for a given ZIP code
 */
export async function getRedfinMarketData(
  zipCode: string,
  propertyType: string = 'All Residential'
): Promise<MarketData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Try to find exact property type match first
  let { data, error } = await supabase
    .from('redfin_market_data')
    .select('*')
    .eq('zip_code', zipCode)
    .eq('property_type', propertyType)
    .order('period_end', { ascending: false })
    .limit(1)

  // If no exact match, try "All Residential" as fallback
  if (!data || data.length === 0) {
    const fallbackResult = await supabase
      .from('redfin_market_data')
      .select('*')
      .eq('zip_code', zipCode)
      .eq('property_type', 'All Residential')
      .order('period_end', { ascending: false })
      .limit(1)

    data = fallbackResult.data
    error = fallbackResult.error
  }

  if (error || !data || data.length === 0) {
    console.error(`No Redfin data found for ZIP ${zipCode}:`, error)
    return null
  }

  return transformRedfinToMarketData(data[0], zipCode, propertyType)
}

/**
 * Transform Redfin database record to our MarketData interface
 */
function transformRedfinToMarketData(
  redfin: any,
  location: string,
  propertyType: string
): MarketData {
  const medianPrice = redfin.median_sale_price || 0
  const priceChangeYoY = redfin.median_sale_price_yoy || 0
  const daysOnMarket = redfin.median_dom || 0
  const inventory = redfin.inventory || 0

  // Calculate demand score based on real metrics
  const demandScore = calculateDemandScore(
    daysOnMarket,
    inventory,
    priceChangeYoY * 100,
    redfin.months_of_supply || 6
  )

  // Generate insights based on real data
  const keyInsights = generateInsights(redfin, priceChangeYoY * 100, demandScore)
  const recommendations = generateRecommendations(redfin, propertyType, location)
  const competitiveFactors = generateCompetitiveFactors(redfin, priceChangeYoY * 100)

  return {
    location: `${location}, ${redfin.state_code || ''}`.trim(),
    medianPrice,
    priceChange: priceChangeYoY * 100, // Convert to percentage
    daysOnMarket,
    inventory,
    demandScore,
    recommendations,
    keyInsights,
    competitiveFactors,
    dataFreshness: new Date(redfin.period_end),
    dataSource: 'Redfin',
  }
}

/**
 * Calculate demand score (0-100) based on market metrics
 */
function calculateDemandScore(
  daysOnMarket: number,
  inventory: number,
  priceChange: number,
  monthsOfSupply: number
): number {
  // DOM score: lower is better (0-30 days = 100, 90+ days = 0)
  const domScore = Math.max(0, Math.min(100, 100 - (daysOnMarket / 90) * 100))

  // Inventory score: lower is better (normalized)
  const inventoryScore = Math.max(0, Math.min(100, 100 - (inventory / 200) * 100))

  // Price change score: positive is good
  const priceScore = Math.max(0, Math.min(100, 50 + priceChange * 5))

  // Months of supply: <3 is seller's market, >6 is buyer's market
  const supplyScore = Math.max(0, Math.min(100, 100 - (monthsOfSupply / 12) * 100))

  // Weighted average
  return Math.round(
    domScore * 0.3 + inventoryScore * 0.2 + priceScore * 0.3 + supplyScore * 0.2
  )
}

function generateInsights(
  data: any,
  priceChange: number,
  demandScore: number
): string[] {
  const insights: string[] = []

  // Market condition
  if (demandScore >= 75) {
    insights.push('Market strongly favors sellers with high demand')
  } else if (demandScore >= 50) {
    insights.push('Balanced market between buyers and sellers')
  } else {
    insights.push('Market favors buyers with lower competition')
  }

  // Inventory
  const inventory = data.inventory || 0
  if (inventory < 50) {
    insights.push('Very low inventory levels - strong seller advantage')
  } else if (inventory < 100) {
    insights.push('Moderate inventory levels')
  } else {
    insights.push('Higher inventory - more choices for buyers')
  }

  // Price trend
  if (priceChange > 5) {
    insights.push(`Prices rising strongly (+${priceChange.toFixed(1)}% year-over-year)`)
  } else if (priceChange < -5) {
    insights.push(`Prices declining (${priceChange.toFixed(1)}% year-over-year)`)
  } else {
    insights.push('Prices relatively stable year-over-year')
  }

  // Days on market
  const dom = data.median_dom || 0
  if (dom < 30) {
    insights.push('Properties selling quickly - expect competitive offers')
  } else if (dom > 60) {
    insights.push('Properties taking longer to sell - more negotiation leverage')
  }

  // Months of supply
  const supply = data.months_of_supply || 0
  if (supply < 3) {
    insights.push(`Only ${supply.toFixed(1)} months of supply - strong seller's market`)
  } else if (supply > 6) {
    insights.push(`${supply.toFixed(1)} months of supply - buyer's market conditions`)
  }

  return insights
}

function generateRecommendations(
  data: any,
  propertyType: string,
  location: string
): string[] {
  const recs: string[] = []
  const medianPrice = data.median_sale_price || 0

  // Pricing recommendation
  if (medianPrice > 0) {
    const priceMin = Math.round(medianPrice * 0.95)
    const priceMax = Math.round(medianPrice * 1.05)
    recs.push(
      `Price competitively: $${priceMin.toLocaleString()} - $${priceMax.toLocaleString()} based on current median`
    )
  }

  // Market-specific recommendations
  const dom = data.median_dom || 0
  if (dom < 30) {
    recs.push('List soon to capitalize on strong buyer demand')
    recs.push('Consider pricing at or slightly above median given hot market')
  } else if (dom > 60) {
    recs.push('Price competitively to stand out in slower market')
    recs.push('Invest in professional staging and photography')
  }

  // Sale-to-list ratio advice
  const saleToList = data.avg_sale_to_list || 0
  if (saleToList > 1.0) {
    recs.push('Properties selling above asking - consider strategic pricing')
  } else if (saleToList < 0.95) {
    recs.push('Properties selling below asking - price conservatively')
  }

  // Always good advice
  recs.push('Highlight unique features and recent upgrades')
  recs.push(`Emphasize ${location} location benefits and local amenities`)

  return recs
}

function generateCompetitiveFactors(data: any, priceChange: number): string[] {
  const factors: string[] = []

  if (data.inventory) {
    factors.push(`${data.inventory} active listings in this ZIP code`)
  }

  if (data.homes_sold) {
    factors.push(`${data.homes_sold} homes sold in recent period`)
  }

  if (data.new_listings) {
    factors.push(`${data.new_listings} new listings came to market`)
  }

  if (data.median_dom) {
    factors.push(`Median ${data.median_dom} days on market`)
  }

  if (data.sold_above_list) {
    const pct = (data.sold_above_list * 100).toFixed(1)
    factors.push(`${pct}% of homes sold above list price`)
  }

  if (priceChange !== 0) {
    const direction = priceChange > 0 ? 'up' : 'down'
    factors.push(`Prices ${direction} ${Math.abs(priceChange).toFixed(1)}% year-over-year`)
  }

  return factors
}

/**
 * Download and import Redfin data into database
 * This would typically be run as a cron job or manual script
 */
export async function importRedfinData() {
  // This function would download and parse the TSV file
  // For now, this is a placeholder - actual implementation would use
  // Node.js streams to efficiently process the large gzipped TSV file
  throw new Error('Import function not yet implemented - see scripts/import-redfin.ts')
}
