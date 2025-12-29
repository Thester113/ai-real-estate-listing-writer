import { beforeAll, afterAll, afterEach, vi } from 'vitest'

// Set test environment variables BEFORE any imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(process.env as any).NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.STRIPE_MODE = 'test'
process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_xxx'
process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_xxx'
process.env.STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'
process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
process.env.OPENAI_API_KEY = 'sk-test-xxx'
process.env.STRIPE_SECRET_KEY = 'sk_test_xxx'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.CONVERTKIT_API_KEY = 'test-convertkit-key'
process.env.CONVERTKIT_API_SECRET = 'test-convertkit-secret'
process.env.CONVERTKIT_FORM_ID = 'test-form-id'
process.env.GMAIL_USER = 'test@test.com'
process.env.GMAIL_APP_PASSWORD = 'test-password'

// Store original env for restoration
const originalEnv = { ...process.env }

beforeAll(() => {
  // Use fake timers to make time-dependent tests deterministic
  vi.useFakeTimers()
  // Set a fixed date for all tests
  vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
})

afterEach(() => {
  // Reset all mocks after each test
  vi.clearAllMocks()
  // Restore environment variables to original state
  process.env = { ...originalEnv }
})

afterAll(() => {
  // Restore real timers
  vi.useRealTimers()
  // Restore all mocks
  vi.restoreAllMocks()
})

// Global mock for next/headers since it's commonly used
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      const headerMap: Record<string, string> = {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1',
        'x-real-ip': '127.0.0.1',
      }
      return headerMap[name.toLowerCase()] || null
    }),
  })),
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Global mock for next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
