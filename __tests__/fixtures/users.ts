/**
 * Test user fixtures for consistent test data
 */

export const testUsers = {
  starterUser: {
    id: 'user-starter-123',
    email: 'starter@test.com',
    plan_type: 'starter' as const,
    subscription_status: 'active',
    stripe_customer_id: 'cus_starter_xxx',
    created_at: '2025-01-01T00:00:00Z',
  },
  proUser: {
    id: 'user-pro-456',
    email: 'pro@test.com',
    plan_type: 'pro' as const,
    subscription_status: 'active',
    stripe_customer_id: 'cus_pro_xxx',
    created_at: '2025-01-01T00:00:00Z',
  },
  expiredUser: {
    id: 'user-expired-789',
    email: 'expired@test.com',
    plan_type: 'starter' as const,
    subscription_status: 'canceled',
    stripe_customer_id: 'cus_expired_xxx',
    created_at: '2024-01-01T00:00:00Z',
  },
  newUser: {
    id: 'user-new-101',
    email: 'new@test.com',
    plan_type: null,
    subscription_status: null,
    stripe_customer_id: null,
    created_at: '2025-01-15T00:00:00Z',
  },
}

export const testUsage = {
  none: {
    id: 'usage-none',
    user_id: testUsers.starterUser.id,
    month: '2025-01',
    listings_generated: 0,
    words_generated: 0,
  },
  underLimit: {
    id: 'usage-under',
    user_id: testUsers.starterUser.id,
    month: '2025-01',
    listings_generated: 5,
    words_generated: 2500,
  },
  atDailyLimit: {
    id: 'usage-daily',
    user_id: testUsers.starterUser.id,
    month: '2025-01',
    listings_generated: 5, // Daily limit for starter
    words_generated: 2500,
  },
  atMonthlyLimit: {
    id: 'usage-monthly',
    user_id: testUsers.starterUser.id,
    month: '2025-01',
    listings_generated: 20, // Monthly limit for starter
    words_generated: 10000,
  },
  overLimit: {
    id: 'usage-over',
    user_id: testUsers.starterUser.id,
    month: '2025-01',
    listings_generated: 25,
    words_generated: 12500,
  },
  proUsage: {
    id: 'usage-pro',
    user_id: testUsers.proUser.id,
    month: '2025-01',
    listings_generated: 100,
    words_generated: 50000,
  },
}

export const testProfiles = {
  starterProfile: {
    ...testUsers.starterUser,
    ...testUsage.underLimit,
  },
  proProfile: {
    ...testUsers.proUser,
    ...testUsage.proUsage,
  },
  limitReachedProfile: {
    ...testUsers.starterUser,
    ...testUsage.atMonthlyLimit,
  },
}

/**
 * Create a custom user for specific test cases
 */
export function createTestUser(
  overrides: Partial<(typeof testUsers)['starterUser']> = {}
): (typeof testUsers)['starterUser'] {
  return {
    id: `user-custom-${Date.now()}`,
    email: `custom-${Date.now()}@test.com`,
    plan_type: 'starter',
    subscription_status: 'active',
    stripe_customer_id: `cus_custom_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create custom usage for specific test cases
 */
export function createTestUsage(
  userId: string,
  overrides: Partial<(typeof testUsage)['none']> = {}
): (typeof testUsage)['none'] {
  return {
    id: `usage-custom-${Date.now()}`,
    user_id: userId,
    month: '2025-01',
    listings_generated: 0,
    words_generated: 0,
    ...overrides,
  }
}
