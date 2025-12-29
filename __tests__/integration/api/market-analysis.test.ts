import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/real-estate-api', () => ({
  extractZipCode: vi.fn((location: string) => {
    const match = location.match(/\b\d{5}\b/)
    return match ? match[0] : null
  }),
  generateFallbackMarketData: vi.fn((location: string, propertyType: string) => ({
    location,
    medianPrice: 500000,
    priceChange: 5,
    daysOnMarket: 30,
    inventory: 100,
    demandScore: 70,
    recommendations: ['Consider pricing competitively'],
    keyInsights: ['Market data unavailable'],
    competitiveFactors: ['Low inventory'],
    dataFreshness: new Date('2025-01-15'),
    isFallback: true,
  })),
}))

vi.mock('@/lib/redfin-data', () => ({
  getRedfinMarketData: vi.fn(),
}))

import { GET } from '@/app/api/market-analysis/route'
import { getRedfinMarketData } from '@/lib/redfin-data'
import { extractZipCode, generateFallbackMarketData } from '@/lib/real-estate-api'

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

describe('GET /api/market-analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parameter validation', () => {
    it('returns 400 when location is missing', async () => {
      const request = createRequest('/api/market-analysis')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Location parameter required')
    })

    it('returns 400 when no ZIP code can be extracted', async () => {
      const request = createRequest('/api/market-analysis?location=Some City')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Unable to determine ZIP code from location')
      expect(data.message).toContain('Please include a ZIP code')
    })
  })

  describe('successful responses', () => {
    it('returns market data for valid ZIP code', async () => {
      const mockMarketData = {
        location: '78701, TX',
        medianPrice: 600000,
        priceChange: 8.5,
        daysOnMarket: 20,
        inventory: 150,
        demandScore: 85,
        recommendations: ['Price competitively', 'List now'],
        keyInsights: ['Strong buyer demand'],
        competitiveFactors: ['Low inventory'],
        dataFreshness: new Date('2025-01-15'),
        dataSource: 'Redfin',
      }

      vi.mocked(getRedfinMarketData).mockResolvedValue(mockMarketData)

      const request = createRequest('/api/market-analysis?location=Austin TX 78701')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.medianPrice).toBe(600000)
      expect(data.cached).toBe(false)
    })

    it('passes property type to Redfin query', async () => {
      vi.mocked(getRedfinMarketData).mockResolvedValue(null)

      const request = createRequest('/api/market-analysis?location=78701&propertyType=Condo')
      await GET(request)

      expect(getRedfinMarketData).toHaveBeenCalledWith('78701', 'Condo')
    })

    it('uses default property type when not specified', async () => {
      vi.mocked(getRedfinMarketData).mockResolvedValue(null)

      const request = createRequest('/api/market-analysis?location=78701')
      await GET(request)

      expect(getRedfinMarketData).toHaveBeenCalledWith('78701', 'All Residential')
    })
  })

  describe('fallback behavior', () => {
    it('returns fallback data when no Redfin data available', async () => {
      vi.mocked(getRedfinMarketData).mockResolvedValue(null)

      const request = createRequest('/api/market-analysis?location=Austin TX 78701')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.fallback).toBe(true)
      expect(data.message).toContain('Market data not available')
      expect(generateFallbackMarketData).toHaveBeenCalledWith('Austin TX 78701', 'All Residential')
    })

    it('returns fallback data on Redfin error', async () => {
      vi.mocked(getRedfinMarketData).mockRejectedValue(new Error('Database connection failed'))

      const request = createRequest('/api/market-analysis?location=Austin TX 78701')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.fallback).toBe(true)
      expect(data.error).toBe('Database connection failed')
    })
  })

  describe('error handling', () => {
    it('returns 500 on unexpected error', async () => {
      // Mock extractZipCode to throw
      vi.mocked(extractZipCode).mockImplementationOnce(() => {
        throw new Error('Unexpected parsing error')
      })

      const request = createRequest('/api/market-analysis?location=78701')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch market analysis')
      expect(data.message).toBe('Unexpected parsing error')
    })

    it('handles non-Error exceptions', async () => {
      vi.mocked(extractZipCode).mockImplementationOnce(() => {
        throw 'string error'
      })

      const request = createRequest('/api/market-analysis?location=78701')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe('Unknown error')
    })
  })
})
