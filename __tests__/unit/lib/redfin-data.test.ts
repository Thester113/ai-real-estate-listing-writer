import { describe, it, expect, beforeEach, vi } from 'vitest'
import { redfinRecords, calculateExpectedDemandScore, unknownZipCode } from '@/__tests__/fixtures/market-data'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

describe('lib/redfin-data', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  describe('getRedfinMarketData', () => {
    it('returns market data for valid ZIP code', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result).not.toBeNull()
      expect(result?.location).toContain('78701')
      expect(result?.medianPrice).toBe(650000)
      expect(result?.dataSource).toBe('Redfin')
    })

    it('returns market data with specific property type', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.singleFamily],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701', 'Single Family Residential')

      expect(result).not.toBeNull()
      expect(result?.medianPrice).toBe(750000)
    })

    it('falls back to All Residential when specific type not found', async () => {
      let callCount = 0
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.resolve({ data: [], error: null })
          }
          return Promise.resolve({
            data: [redfinRecords.austin78701],
            error: null,
          })
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701', 'Condo/Co-op')

      expect(result).not.toBeNull()
      expect(result?.medianPrice).toBe(650000)
    })

    it('returns null for unknown ZIP code', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData(unknownZipCode)

      expect(result).toBeNull()
    })

    it('returns null on database error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result).toBeNull()
    })

    it('throws error when Supabase URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      vi.resetModules()

      const { getRedfinMarketData } = await import('@/lib/redfin-data')

      await expect(getRedfinMarketData('78701')).rejects.toThrow('Supabase configuration missing')
    })

    it('throws error when Supabase key is missing', async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      vi.resetModules()

      const { getRedfinMarketData } = await import('@/lib/redfin-data')

      await expect(getRedfinMarketData('78701')).rejects.toThrow('Supabase configuration missing')
    })

    it('correctly transforms price change to percentage', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701], // YoY is 0.05 (5%)
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.priceChange).toBe(5) // Should be 5, not 0.05
    })

    it('handles missing optional fields gracefully', async () => {
      const incompleteRecord = {
        zip_code: '78701',
        state_code: 'TX',
        period_end: '2025-01-15',
        median_sale_price: null,
        median_sale_price_yoy: null,
        median_dom: null,
        inventory: null,
        months_of_supply: null,
        homes_sold: null,
        new_listings: null,
        avg_sale_to_list: null,
        sold_above_list: null,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [incompleteRecord],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result).not.toBeNull()
      expect(result?.medianPrice).toBe(0)
      expect(result?.priceChange).toBe(0)
      expect(result?.daysOnMarket).toBe(0)
    })

    it('handles missing state_code gracefully', async () => {
      const recordWithoutState = {
        zip_code: '78701',
        state_code: null, // or undefined
        period_end: '2025-01-15',
        median_sale_price: 500000,
        median_sale_price_yoy: 0.05,
        median_dom: 25,
        inventory: 500,
        months_of_supply: 2.5,
        homes_sold: 100,
        new_listings: 150,
        avg_sale_to_list: 0.99,
        sold_above_list: 0.3,
      }

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [recordWithoutState],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result).not.toBeNull()
      // Location format is "${zipCode}, ${state_code || ''}".trim()
      // When state_code is null, it becomes "78701, ".trim() = "78701,"
      expect(result?.location).toBe('78701,')
    })
  })

  describe('calculateDemandScore (via getRedfinMarketData)', () => {
    it('calculates high demand score for hot market', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.hotMarket],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('00001')

      expect(result?.demandScore).toBeGreaterThan(75)
    })

    it('calculates low demand score for slow market', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.slowMarket],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('12345')

      expect(result?.demandScore).toBeLessThan(50)
    })

    it('calculates balanced demand score for normal market', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.sanFrancisco94102],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('94102')

      expect(result?.demandScore).toBeGreaterThan(40)
      expect(result?.demandScore).toBeLessThan(70)
    })
  })

  describe('generateInsights (via getRedfinMarketData)', () => {
    it('generates seller-favorable insight for high demand', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.hotMarket],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('00001')

      expect(result?.keyInsights.some((i: string) => i.includes('seller'))).toBe(true)
    })

    it('generates buyer-favorable insight for low demand', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.slowMarket],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('12345')

      expect(result?.keyInsights.some((i: string) => i.includes('buyer'))).toBe(true)
    })

    it('includes inventory insight', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.keyInsights.some((i: string) => i.toLowerCase().includes('inventory'))).toBe(true)
    })

    it('includes price trend insight', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.hotMarket], // 15% increase
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('00001')

      expect(result?.keyInsights.some((i: string) => i.includes('rising') || i.includes('year-over-year'))).toBe(true)
    })

    it('includes declining price insight', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.slowMarket], // -8% decrease
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('12345')

      expect(result?.keyInsights.some((i: string) => i.includes('declining'))).toBe(true)
    })

    it('includes DOM insight for fast-selling market', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.hotMarket], // 7 DOM
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('00001')

      expect(result?.keyInsights.some((i: string) => i.includes('quickly') || i.includes('competitive'))).toBe(true)
    })

    it('includes DOM insight for slow-selling market', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.slowMarket], // 90 DOM
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('12345')

      expect(result?.keyInsights.some((i: string) => i.includes('longer') || i.includes('negotiation'))).toBe(true)
    })
  })

  describe('generateRecommendations (via getRedfinMarketData)', () => {
    it('includes pricing recommendation with median price', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.recommendations.some((r: string) => r.includes('$') && r.includes('competitively'))).toBe(true)
    })

    it('recommends listing soon in hot market', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.hotMarket],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('00001')

      expect(result?.recommendations.some((r: string) => r.includes('List soon'))).toBe(true)
    })

    it('recommends staging in slow market', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.slowMarket],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('12345')

      expect(result?.recommendations.some((r: string) => r.includes('staging') || r.includes('photography'))).toBe(true)
    })

    it('always includes feature recommendation', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.recommendations.some((r: string) => r.includes('unique features'))).toBe(true)
    })

    it('includes location recommendation', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.recommendations.some((r: string) => r.includes('78701') || r.includes('location'))).toBe(true)
    })
  })

  describe('generateCompetitiveFactors (via getRedfinMarketData)', () => {
    it('includes inventory count', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.competitiveFactors.some((f: string) => f.includes('85') && f.includes('active listings'))).toBe(true)
    })

    it('includes homes sold count', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.competitiveFactors.some((f: string) => f.includes('45') && f.includes('sold'))).toBe(true)
    })

    it('includes median DOM', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.competitiveFactors.some((f: string) => f.includes('21') && f.includes('days'))).toBe(true)
    })

    it('includes price direction', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.competitiveFactors.some((f: string) => f.includes('up') && f.includes('year-over-year'))).toBe(true)
    })

    it('includes sold above list percentage', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [redfinRecords.austin78701],
          error: null,
        }),
      })

      const { getRedfinMarketData } = await import('@/lib/redfin-data')
      const result = await getRedfinMarketData('78701')

      expect(result?.competitiveFactors.some((f: string) => f.includes('35') && f.includes('above list'))).toBe(true)
    })
  })

  describe('importRedfinData', () => {
    it('throws not implemented error', async () => {
      const { importRedfinData } = await import('@/lib/redfin-data')

      await expect(importRedfinData()).rejects.toThrow('Import function not yet implemented')
    })
  })
})

// Test the expected demand score calculation utility
describe('calculateExpectedDemandScore fixture helper', () => {
  it('calculates correct score for hot market', () => {
    const score = calculateExpectedDemandScore(7, 25, 15, 0.8)
    expect(score).toBeGreaterThan(75)
  })

  it('calculates correct score for slow market', () => {
    const score = calculateExpectedDemandScore(90, 200, -8, 8)
    expect(score).toBeLessThan(50)
  })

  it('handles edge cases at boundaries', () => {
    const scoreZeros = calculateExpectedDemandScore(0, 0, 0, 0)
    expect(scoreZeros).toBeGreaterThan(0)

    const scoreMax = calculateExpectedDemandScore(90, 200, -10, 12)
    expect(scoreMax).toBeGreaterThanOrEqual(0)
    expect(scoreMax).toBeLessThanOrEqual(100)
  })
})
