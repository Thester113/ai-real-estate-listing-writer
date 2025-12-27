'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TrendingUp, MapPin, DollarSign, Users, AlertCircle, BarChart3, RefreshCw } from 'lucide-react'

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
  dataFreshness?: Date | string
  dataSource?: string
}

interface MarketAnalysisProps {
  location: string
  propertyType: string
  priceRange?: { min: number; max: number } | null
  onAnalysisComplete?: (data: MarketData) => void
}

// Fetch market analysis from API
const fetchMarketAnalysis = async (
  location: string,
  propertyType: string,
  forceRefresh: boolean = false
): Promise<MarketData> => {
  const params = new URLSearchParams({
    location,
    propertyType,
    ...(forceRefresh && { forceRefresh: 'true' }),
  })

  const response = await fetch(`/api/market-analysis?${params}`)

  const result = await response.json()

  if (!response.ok) {
    // Extract error message from API response
    const errorMessage = result.message || result.error || 'Failed to fetch market analysis'
    throw new Error(errorMessage)
  }

  if (!result.success) {
    throw new Error(result.error || 'Unknown error')
  }

  return result.data
}

export function MarketAnalysis({ location, propertyType, priceRange, onAnalysisComplete }: MarketAnalysisProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async (forceRefresh: boolean = false) => {
    if (!location || !propertyType) {
      setError('Location and property type are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await fetchMarketAnalysis(location, propertyType, forceRefresh)
      setMarketData(data)
      onAnalysisComplete?.(data)
    } catch (err) {
      // Extract error message from API response
      let errorMessage = 'Failed to fetch market analysis'
      if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
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
        <Button onClick={() => runAnalysis()} variant="outline" size="sm" className="mt-3">
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
          <Button onClick={() => runAnalysis()} size="sm">
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
          <div className="flex items-center gap-2">
            {marketData?.dataFreshness && (
              <span className="text-xs text-muted-foreground">
                Data as of {new Date(marketData.dataFreshness).toLocaleDateString()}
              </span>
            )}
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              Pro Feature
            </span>
          </div>
        </div>
        {marketData?.dataSource && (
          <div className="mt-1 text-xs text-muted-foreground">
            Source: {marketData.dataSource}
          </div>
        )}
        {marketData && (
          <div className="mt-2">
            <Button
              onClick={() => runAnalysis(true)}
              variant="outline"
              size="sm"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        )}
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