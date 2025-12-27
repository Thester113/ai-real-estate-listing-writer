// RentCast API client for market data

interface RentCastMarketStats {
  zipCode: string
  saleData?: {
    averagePrice?: number
    medianPrice?: number
    averagePricePerSqFt?: number
    daysOnMarket?: number
    inventory?: number
    soldCount?: number
    percentChange?: number
  }
  rentalData?: {
    averageRent?: number
    medianRent?: number
    daysOnMarket?: number
    inventory?: number
  }
  historical?: Array<{
    month: string
    averagePrice?: number
    medianPrice?: number
  }>
}

export interface MarketData {
  location: string
  medianPrice: number
  priceChange: number
  daysOnMarket: number
  inventory: number
  demandScore: number
  recommendations: string[]
  keyInsights: string[]
  competitiveFactors: string[]
  dataFreshness: Date
  dataSource: string
}

export class RealEstateAPIClient {
  private apiKey: string
  private baseUrl = 'https://api.rentcast.io/v1'

  constructor() {
    this.apiKey = process.env.RENTCAST_API_KEY || ''
    if (!this.apiKey) {
      console.warn('RENTCAST_API_KEY not configured - market analysis will use fallback data')
    }
  }

  /**
   * Fetch market statistics from RentCast API
   * Rate limit: 50 requests/month on free tier
   */
  async getMarketStatistics(
    zipCode: string,
    dataType: 'Sale' | 'Rental' | 'All' = 'Sale'
  ): Promise<RentCastMarketStats | null> {
    if (!this.apiKey) {
      throw new Error('RentCast API key not configured')
    }

    try {
      const url = `${this.baseUrl}/markets?zipCode=${zipCode}&dataType=${dataType}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
          'accept': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMIT_EXCEEDED')
        }
        if (response.status === 404) {
          throw new Error('LOCATION_NOT_FOUND')
        }
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data as RentCastMarketStats
    } catch (error) {
      console.error('RentCast API error:', error)
      throw error
    }
  }

  /**
   * Transform RentCast API response to our MarketData interface
   */
  transformToMarketData(
    apiData: RentCastMarketStats,
    location: string,
    propertyType: string
  ): MarketData {
    const saleData = apiData.saleData || {}

    // Calculate price change from historical data
    let priceChange = saleData.percentChange || 0
    if (apiData.historical && apiData.historical.length >= 2) {
      const recent = apiData.historical[apiData.historical.length - 1]
      const previous = apiData.historical[apiData.historical.length - 2]
      if (recent?.medianPrice && previous?.medianPrice) {
        priceChange = ((recent.medianPrice - previous.medianPrice) / previous.medianPrice) * 100
      }
    }

    // Calculate demand score based on inventory and DOM
    const demandScore = this.calculateDemandScore(
      saleData.daysOnMarket || 45,
      saleData.inventory || 100,
      priceChange
    )

    // Generate insights based on real data
    const insights = this.generateInsights(saleData, priceChange, demandScore)
    const recommendations = this.generateRecommendations(
      saleData,
      propertyType,
      priceChange,
      location
    )
    const competitiveFactors = this.generateCompetitiveFactors(saleData, priceChange)

    return {
      location,
      medianPrice: saleData.medianPrice || 0,
      priceChange,
      daysOnMarket: saleData.daysOnMarket || 0,
      inventory: saleData.inventory || 0,
      demandScore,
      recommendations,
      keyInsights: insights,
      competitiveFactors,
      dataFreshness: new Date(),
      dataSource: 'RentCast',
    }
  }

  /**
   * Calculate demand score (0-100) based on market metrics
   * Low DOM + Low Inventory + Positive Price Change = High Demand
   */
  private calculateDemandScore(
    daysOnMarket: number,
    inventory: number,
    priceChange: number
  ): number {
    // DOM score: lower is better (0-30 days = 100 points, 90+ days = 0 points)
    const domScore = Math.max(0, Math.min(100, 100 - (daysOnMarket / 90) * 100))

    // Inventory score: lower is better (normalized to 0-100)
    const inventoryScore = Math.max(0, Math.min(100, 100 - (inventory / 200) * 100))

    // Price change score: positive is good, negative is bad
    const priceScore = Math.max(0, Math.min(100, 50 + priceChange * 5))

    // Weighted average: DOM 40%, Inventory 30%, Price 30%
    return Math.round(domScore * 0.4 + inventoryScore * 0.3 + priceScore * 0.3)
  }

  private generateInsights(
    saleData: any,
    priceChange: number,
    demandScore: number
  ): string[] {
    const insights: string[] = []

    // Market condition
    if (demandScore >= 75) {
      insights.push("Market is currently strongly favoring sellers with high demand")
    } else if (demandScore >= 50) {
      insights.push("Market is balanced between buyers and sellers")
    } else {
      insights.push("Market is currently favoring buyers with lower competition")
    }

    // Inventory analysis
    if (saleData.inventory < 50) {
      insights.push("Inventory levels are very low compared to demand")
    } else if (saleData.inventory < 100) {
      insights.push("Inventory levels are moderate in this market")
    } else {
      insights.push("Inventory levels are higher than average")
    }

    // Price trend
    if (priceChange > 5) {
      insights.push(`Prices are trending up strongly (+${priceChange.toFixed(1)}% recently)`)
    } else if (priceChange < -5) {
      insights.push(`Prices are declining (${priceChange.toFixed(1)}% recently)`)
    } else {
      insights.push("Prices are relatively stable")
    }

    // Days on market insight
    if (saleData.daysOnMarket < 30) {
      insights.push("Properties are selling quickly - expect fast-moving market")
    } else if (saleData.daysOnMarket > 60) {
      insights.push("Properties are taking longer to sell - more negotiation room")
    }

    return insights
  }

  private generateRecommendations(
    saleData: any,
    propertyType: string,
    priceChange: number,
    location: string
  ): string[] {
    const recs: string[] = []
    const medianPrice = saleData.medianPrice || 0

    // Pricing recommendation
    if (medianPrice > 0) {
      const priceMin = Math.round(medianPrice * 0.95)
      const priceMax = Math.round(medianPrice * 1.05)
      recs.push(
        `Price competitively within $${priceMin.toLocaleString()} - $${priceMax.toLocaleString()} range based on current market median`
      )
    }

    // Market-specific recommendations
    if (saleData.daysOnMarket < 30) {
      recs.push("List immediately to capitalize on strong buyer demand")
      recs.push("Consider pricing at or slightly above market median")
    } else if (saleData.daysOnMarket > 60) {
      recs.push("Price aggressively to attract attention in slower market")
      recs.push("Invest in professional staging and photography")
    }

    // Always good advice
    recs.push("Highlight energy efficiency features - buyers prioritize sustainable homes")
    recs.push(`Emphasize ${location} location benefits and proximity to amenities`)

    return recs
  }

  private generateCompetitiveFactors(saleData: any, priceChange: number): string[] {
    const factors: string[] = []

    if (saleData.inventory) {
      factors.push(`${saleData.inventory} active listings currently in this market`)
    }

    if (saleData.soldCount) {
      factors.push(`${saleData.soldCount} properties sold recently in this area`)
    }

    if (saleData.daysOnMarket) {
      const trend = saleData.daysOnMarket < 45 ? "down" : "up"
      factors.push(`Average days on market: ${saleData.daysOnMarket} (trending ${trend})`)
    }

    if (priceChange !== 0) {
      const direction = priceChange > 0 ? "increasing" : "decreasing"
      factors.push(`Market prices ${direction} by ${Math.abs(priceChange).toFixed(1)}%`)
    }

    return factors
  }
}

// Helper function to extract ZIP code from location string
export function extractZipCode(location: string): string | null {
  // Try to find 5-digit ZIP code in location string
  const zipMatch = location.match(/\b\d{5}\b/)
  return zipMatch ? zipMatch[0] : null
}

// Fallback data generator for when API is unavailable
export function generateFallbackMarketData(
  location: string,
  propertyType: string
): MarketData {
  console.warn('Using fallback market data - API unavailable')

  // Use reasonable placeholder values instead of zeros
  return {
    location,
    medianPrice: -1, // -1 signals "not available" to UI
    priceChange: 0,
    daysOnMarket: -1,
    inventory: -1,
    demandScore: -1,
    recommendations: [
      'Add RentCast API key to .env.local to enable real market data',
      'Contact local real estate agent for current market conditions',
      `Research comparable ${propertyType.toLowerCase()} sales in ${location}`,
      'Consider professional market analysis for accurate pricing'
    ],
    keyInsights: [
      'Market data requires RentCast API key configuration',
      'Sign up for free API key at app.rentcast.io (50 requests/month)',
      'Real-time data will show median prices, days on market, and trends'
    ],
    competitiveFactors: [
      'Enable API integration to view competitive landscape',
      'Real data shows active listings, recent sales, and market velocity'
    ],
    dataFreshness: new Date(0), // Unix epoch to indicate no fresh data
    dataSource: 'Configuration Required',
  }
}
