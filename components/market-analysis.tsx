'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TrendingUp, MapPin, DollarSign, Users, AlertCircle, BarChart3 } from 'lucide-react'

interface MarketData {
  location: string
  medianPrice: number
  priceChange: number
  daysOnMarket: number
  inventory: number
  demandScore: number
  recommendations: string[]
  keyInsights: string[]
  competitiveFactors: string[]
}

interface MarketAnalysisProps {
  location: string
  propertyType: string
  priceRange?: { min: number; max: number } | null
  onAnalysisComplete?: (data: MarketData) => void
}

// Mock market analysis function - in production, this would connect to real estate APIs
const generateMarketAnalysis = async (location: string, propertyType: string, priceRange?: { min: number; max: number } | null): Promise<MarketData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Generate realistic mock data based on inputs
  const basePrice = priceRange ? (priceRange.min + priceRange.max) / 2 : getEstimatedPrice(location, propertyType)
  
  return {
    location,
    medianPrice: Math.round(basePrice * (0.9 + Math.random() * 0.2)),
    priceChange: (Math.random() - 0.5) * 20, // -10% to +10%
    daysOnMarket: Math.floor(20 + Math.random() * 40), // 20-60 days
    inventory: Math.floor(50 + Math.random() * 100), // 50-150 properties
    demandScore: Math.floor(65 + Math.random() * 30), // 65-95 score
    recommendations: [
      "Highlight energy efficiency features - buyers in this market prioritize sustainable homes",
      "Emphasize proximity to transit - commuter convenience is highly valued",
      "Feature outdoor spaces prominently - outdoor living is a key selling point",
      "Price competitively within the $" + Math.round(basePrice * 0.95).toLocaleString() + " - $" + Math.round(basePrice * 1.05).toLocaleString() + " range"
    ],
    keyInsights: [
      "Market is currently " + (Math.random() > 0.5 ? "favoring sellers" : "more balanced"),
      "Inventory levels are " + (Math.random() > 0.5 ? "low" : "moderate") + " compared to last year",
      "Properties with modern amenities sell 15% faster",
      "This neighborhood attracts primarily " + getTargetDemographic(location)
    ],
    competitiveFactors: [
      "3 similar properties currently listed within 0.5 miles",
      "Recent sales show strong demand for " + propertyType.toLowerCase() + "s",
      "Average days on market trending " + (Math.random() > 0.5 ? "down" : "up"),
      "Seasonal demand is " + getSeasonalTrend()
    ]
  }
}

const getEstimatedPrice = (location: string, propertyType: string): number => {
  const locationMultipliers: { [key: string]: number } = {
    'seattle': 1.4,
    'san francisco': 2.0,
    'new york': 1.8,
    'austin': 1.2,
    'denver': 1.1,
    'portland': 1.2,
    'miami': 1.3,
    'chicago': 1.0,
    'atlanta': 0.9,
    'phoenix': 0.8
  }
  
  const typeMultipliers: { [key: string]: number } = {
    'single family home': 1.0,
    'condo/apartment': 0.7,
    'townhouse': 0.9,
    'multi-family': 1.2,
    'luxury': 2.5
  }
  
  const basePrice = 350000
  const locationKey = Object.keys(locationMultipliers).find(key => 
    location.toLowerCase().includes(key)
  )
  const locationMult = locationKey ? locationMultipliers[locationKey] : 1.0
  const typeMult = typeMultipliers[propertyType.toLowerCase()] || 1.0
  
  return Math.round(basePrice * locationMult * typeMult)
}

const getTargetDemographic = (location: string): string => {
  const demographics = [
    "young professionals", "families with children", "first-time buyers", 
    "investors", "retirees", "luxury buyers"
  ]
  return demographics[Math.floor(Math.random() * demographics.length)]
}

const getSeasonalTrend = (): string => {
  const trends = ["strong (peak season)", "moderate", "slower (off-season)", "picking up"]
  return trends[Math.floor(Math.random() * trends.length)]
}

export function MarketAnalysis({ location, propertyType, priceRange, onAnalysisComplete }: MarketAnalysisProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    if (!location || !propertyType) {
      setError('Location and property type are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await generateMarketAnalysis(location, propertyType, priceRange)
      setMarketData(data)
      onAnalysisComplete?.(data)
    } catch (err) {
      setError('Failed to generate market analysis')
      console.error('Market analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (location && propertyType) {
      runAnalysis()
    }
  }, [location, propertyType])

  if (loading) {
    return (
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Analyzing local market data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
        <Button onClick={runAnalysis} variant="outline" size="sm" className="mt-3">
          Retry Analysis
        </Button>
      </div>
    )
  }

  if (!marketData) {
    return (
      <div className="bg-card border rounded-lg shadow-sm p-6">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            Get AI-powered market insights for your listing
          </p>
          <Button onClick={runAnalysis} size="sm">
            Run Market Analysis
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Market Analysis</h3>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            Pro Feature
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">Median Price</span>
            </div>
            <div className="font-semibold">${marketData.medianPrice.toLocaleString()}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">Price Change</span>
            </div>
            <div className={`font-semibold ${marketData.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketData.priceChange >= 0 ? '+' : ''}{marketData.priceChange.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">Days on Market</span>
            </div>
            <div className="font-semibold">{marketData.daysOnMarket}</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-3 w-3 text-muted-foreground mr-1" />
              <span className="text-xs text-muted-foreground">Demand Score</span>
            </div>
            <div className="font-semibold">{marketData.demandScore}/100</div>
          </div>
        </div>

        {/* Key Insights */}
        <div>
          <h4 className="font-medium text-sm mb-2">Key Insights</h4>
          <ul className="space-y-1">
            {marketData.keyInsights.map((insight, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start">
                <span className="w-1 h-1 bg-primary rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-medium text-sm mb-2">Listing Recommendations</h4>
          <ul className="space-y-1">
            {marketData.recommendations.map((rec, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start">
                <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Competitive Factors */}
        <div>
          <h4 className="font-medium text-sm mb-2">Competitive Landscape</h4>
          <ul className="space-y-1">
            {marketData.competitiveFactors.map((factor, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start">
                <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}