import { expect } from 'vitest'

/**
 * Test listing fixtures for consistent test data
 */

export const validListingPayloads = {
  minimal: {
    address: '123 Test St, Austin, TX 78701',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
  complete: {
    address: '456 Premium Ave, San Francisco, CA 94102',
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 2800,
    propertyType: 'single_family',
    yearBuilt: 2020,
    lotSize: 5000,
    features: [
      'updated kitchen',
      'hardwood floors',
      'smart home technology',
      'solar panels',
      'EV charger',
    ],
    description: 'Beautiful modern home with premium finishes throughout.',
    listingStyle: 'luxury',
  },
  condo: {
    address: '789 Highrise Blvd #1502, New York, NY 10001',
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    propertyType: 'condo',
    yearBuilt: 2018,
    features: ['floor to ceiling windows', 'doorman building', 'gym access'],
    listingStyle: 'modern',
  },
  investment: {
    address: '321 Rental St, Phoenix, AZ 85001',
    bedrooms: 6,
    bathrooms: 4,
    squareFeet: 3200,
    propertyType: 'multi_family',
    yearBuilt: 1985,
    features: ['separate entrances', 'updated electrical', 'new roof'],
    listingStyle: 'investment',
  },
}

export const invalidListingPayloads = {
  missingAddress: {
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
  missingBedrooms: {
    address: '123 Test St, Austin, TX 78701',
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
  missingBathrooms: {
    address: '123 Test St, Austin, TX 78701',
    bedrooms: 3,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
  missingSquareFeet: {
    address: '123 Test St, Austin, TX 78701',
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'single_family',
  },
  missingPropertyType: {
    address: '123 Test St, Austin, TX 78701',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
  },
  negativeBedrooms: {
    address: '123 Test St, Austin, TX 78701',
    bedrooms: -1,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
  invalidPropertyType: {
    address: '123 Test St, Austin, TX 78701',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'invalid_type',
  },
  emptyAddress: {
    address: '',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
  xssInAddress: {
    address: '<script>alert("xss")</script>123 Test St',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
  sqlInjectionInAddress: {
    address: "123 Test St'; DROP TABLE listings; --",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    propertyType: 'single_family',
  },
}

export const expectedListingResponse = {
  variations: [
    {
      style: 'professional',
      content: expect.any(String),
    },
    {
      style: 'storytelling',
      content: expect.any(String),
    },
    {
      style: 'luxury',
      content: expect.any(String),
    },
  ],
  instagram: expect.any(String),
  facebook: expect.any(String),
}

export const generatedListings = {
  professional: {
    id: 'gen-prof-123',
    user_id: 'user-123',
    address: '123 Test St, Austin, TX 78701',
    style: 'professional',
    content: 'Professional listing content...',
    created_at: '2025-01-15T12:00:00Z',
  },
  storytelling: {
    id: 'gen-story-456',
    user_id: 'user-123',
    address: '123 Test St, Austin, TX 78701',
    style: 'storytelling',
    content: 'Storytelling listing content...',
    created_at: '2025-01-15T12:00:00Z',
  },
  luxury: {
    id: 'gen-lux-789',
    user_id: 'user-123',
    address: '123 Test St, Austin, TX 78701',
    style: 'luxury',
    content: 'Luxury listing content...',
    created_at: '2025-01-15T12:00:00Z',
  },
}
