import { expect } from 'vitest'

/**
 * Market data fixtures for testing Redfin integration
 */

export const redfinRecords = {
  austin78701: {
    zip_code: '78701',
    city: 'Austin',
    state: 'Texas',
    state_code: 'TX',
    region_type: 'zip',
    property_type: 'All Residential',
    period_begin: '2025-01-01',
    period_end: '2025-01-15',
    median_sale_price: 650000,
    median_sale_price_yoy: 0.05, // 5% increase
    median_list_price: 675000,
    median_ppsf: 450,
    median_dom: 21,
    homes_sold: 45,
    new_listings: 62,
    inventory: 85,
    months_of_supply: 2.5,
    avg_sale_to_list: 1.02,
    sold_above_list: 0.35,
    price_drops: 0.15,
    last_updated: '2025-01-15T00:00:00Z',
  },
  sanFrancisco94102: {
    zip_code: '94102',
    city: 'San Francisco',
    state: 'California',
    state_code: 'CA',
    region_type: 'zip',
    property_type: 'All Residential',
    period_begin: '2025-01-01',
    period_end: '2025-01-15',
    median_sale_price: 1250000,
    median_sale_price_yoy: -0.02, // 2% decrease
    median_list_price: 1350000,
    median_ppsf: 1100,
    median_dom: 45,
    homes_sold: 28,
    new_listings: 40,
    inventory: 120,
    months_of_supply: 4.5,
    avg_sale_to_list: 0.97,
    sold_above_list: 0.18,
    price_drops: 0.32,
    last_updated: '2025-01-15T00:00:00Z',
  },
  slowMarket: {
    zip_code: '12345',
    city: 'Slowtown',
    state: 'Somewhere',
    state_code: 'SW',
    region_type: 'zip',
    property_type: 'All Residential',
    period_begin: '2025-01-01',
    period_end: '2025-01-15',
    median_sale_price: 250000,
    median_sale_price_yoy: -0.08, // 8% decrease
    median_list_price: 280000,
    median_ppsf: 150,
    median_dom: 90,
    homes_sold: 8,
    new_listings: 15,
    inventory: 200,
    months_of_supply: 8.0,
    avg_sale_to_list: 0.89,
    sold_above_list: 0.05,
    price_drops: 0.55,
    last_updated: '2025-01-15T00:00:00Z',
  },
  hotMarket: {
    zip_code: '00001',
    city: 'Hotsville',
    state: 'Trending',
    state_code: 'TR',
    region_type: 'zip',
    property_type: 'All Residential',
    period_begin: '2025-01-01',
    period_end: '2025-01-15',
    median_sale_price: 800000,
    median_sale_price_yoy: 0.15, // 15% increase
    median_list_price: 780000,
    median_ppsf: 550,
    median_dom: 7,
    homes_sold: 120,
    new_listings: 80,
    inventory: 25,
    months_of_supply: 0.8,
    avg_sale_to_list: 1.08,
    sold_above_list: 0.65,
    price_drops: 0.02,
    last_updated: '2025-01-15T00:00:00Z',
  },
  singleFamily: {
    zip_code: '78701',
    city: 'Austin',
    state: 'Texas',
    state_code: 'TX',
    region_type: 'zip',
    property_type: 'Single Family Residential',
    period_begin: '2025-01-01',
    period_end: '2025-01-15',
    median_sale_price: 750000,
    median_sale_price_yoy: 0.08,
    median_list_price: 775000,
    median_ppsf: 480,
    median_dom: 18,
    homes_sold: 30,
    new_listings: 42,
    inventory: 55,
    months_of_supply: 2.2,
    avg_sale_to_list: 1.03,
    sold_above_list: 0.42,
    price_drops: 0.12,
    last_updated: '2025-01-15T00:00:00Z',
  },
}

export const expectedMarketDataResponse = {
  location: expect.any(String),
  medianPrice: expect.any(Number),
  priceChange: expect.any(Number),
  daysOnMarket: expect.any(Number),
  inventory: expect.any(Number),
  demandScore: expect.any(Number),
  recommendations: expect.any(Array),
  keyInsights: expect.any(Array),
  competitiveFactors: expect.any(Array),
  dataFreshness: expect.any(Date),
  dataSource: 'Redfin',
}

/**
 * Calculate expected demand score based on metrics
 */
export function calculateExpectedDemandScore(
  daysOnMarket: number,
  inventory: number,
  priceChange: number,
  monthsOfSupply: number
): number {
  const domScore = Math.max(0, Math.min(100, 100 - (daysOnMarket / 90) * 100))
  const inventoryScore = Math.max(0, Math.min(100, 100 - (inventory / 200) * 100))
  const priceScore = Math.max(0, Math.min(100, 50 + priceChange * 5))
  const supplyScore = Math.max(0, Math.min(100, 100 - (monthsOfSupply / 12) * 100))

  return Math.round(
    domScore * 0.3 + inventoryScore * 0.2 + priceScore * 0.3 + supplyScore * 0.2
  )
}

/**
 * Market data for unknown ZIP code
 */
export const unknownZipCode = '99999'
