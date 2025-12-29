import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type Stripe from 'stripe'

// Mock dependencies before importing
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      const headerMap: Record<string, string> = {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1',
      }
      return headerMap[name.toLowerCase()] || null
    }),
  })),
}))

vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}))

vi.mock('@/lib/stripe-config', () => ({
  stripeConfig: {
    webhookSecret: 'whsec_test_xxx',
  },
  validateStripeConfig: vi.fn(), // Does not throw by default
  getStripeConfig: vi.fn(() => ({
    secretKey: 'sk_test_xxx',
    webhookSecret: 'whsec_test_xxx',
    mode: 'test',
  })),
}))

describe('lib/security', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(process.env as any).NODE_ENV = 'test'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('sanitizeUrl', () => {
    it('accepts valid https URL', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      const result = sanitizeUrl('https://example.com/path')
      expect(result).toBe('https://example.com/path')
    })

    it('accepts valid http URL', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      const result = sanitizeUrl('http://example.com/path')
      expect(result).toBe('http://example.com/path')
    })

    it('rejects ftp protocol', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      // FTP URLs throw "Invalid URL format" since they fail URL validation
      expect(() => sanitizeUrl('ftp://example.com')).toThrow()
    })

    it('rejects javascript protocol', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('javascript:alert(1)')).toThrow()
    })

    it('rejects localhost', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('http://localhost/path')).toThrow()
    })

    it('rejects 127.x.x.x addresses', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('http://127.0.0.1/path')).toThrow()
    })

    it('rejects 192.168.x.x addresses', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('http://192.168.1.1/path')).toThrow()
    })

    it('rejects 10.x.x.x addresses', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('http://10.0.0.1/path')).toThrow()
    })

    it('rejects 172.x.x.x addresses', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('http://172.16.0.1/path')).toThrow()
    })

    it('rejects invalid URL format', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('not-a-url')).toThrow('Invalid URL')
    })

    it('rejects empty string', async () => {
      const { sanitizeUrl } = await import('@/lib/security')
      expect(() => sanitizeUrl('')).toThrow('Invalid URL')
    })
  })

  describe('sanitizeText', () => {
    it('removes HTML tags', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const result = sanitizeText('<script>alert("xss")</script>Hello')
      expect(result).toBe('alert("xss")Hello')
    })

    it('removes multiple HTML tags', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const result = sanitizeText('<div><p>Hello</p></div>')
      expect(result).toBe('Hello')
    })

    it('limits text length to default 5000', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const longText = 'a'.repeat(6000)
      const result = sanitizeText(longText)
      expect(result.length).toBe(5000)
    })

    it('limits text length to custom maxLength', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const result = sanitizeText('hello world', 5)
      expect(result).toBe('hello')
    })

    it('normalizes excessive whitespace', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const result = sanitizeText('hello    world   test')
      expect(result).toBe('hello world test')
    })

    it('trims leading and trailing whitespace', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const result = sanitizeText('   hello world   ')
      expect(result).toBe('hello world')
    })

    it('handles empty string', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const result = sanitizeText('')
      expect(result).toBe('')
    })

    it('handles string with only HTML', async () => {
      const { sanitizeText } = await import('@/lib/security')
      const result = sanitizeText('<div></div>')
      expect(result).toBe('')
    })
  })

  describe('checkRateLimit', () => {
    it('returns true when under daily starter limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('starter', { listings_generated: 3 }, 'daily')
      expect(result).toBe(true)
    })

    it('returns false when at daily starter limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('starter', { listings_generated: 5 }, 'daily')
      expect(result).toBe(false)
    })

    it('returns false when over daily starter limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('starter', { listings_generated: 6 }, 'daily')
      expect(result).toBe(false)
    })

    it('returns true when under monthly starter limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('starter', { listings_generated: 15 }, 'monthly')
      expect(result).toBe(true)
    })

    it('returns false when at monthly starter limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('starter', { listings_generated: 20 }, 'monthly')
      expect(result).toBe(false)
    })

    it('returns true when under daily pro limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('pro', { listings_generated: 45 }, 'daily')
      expect(result).toBe(true)
    })

    it('returns false when at daily pro limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('pro', { listings_generated: 50 }, 'daily')
      expect(result).toBe(false)
    })

    it('returns true when under monthly pro limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('pro', { listings_generated: 450 }, 'monthly')
      expect(result).toBe(true)
    })

    it('returns false when at monthly pro limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('pro', { listings_generated: 500 }, 'monthly')
      expect(result).toBe(false)
    })

    it('defaults to daily limit', async () => {
      const { checkRateLimit } = await import('@/lib/security')
      const result = checkRateLimit('starter', { listings_generated: 5 })
      expect(result).toBe(false)
    })
  })

  describe('getTokenLimit', () => {
    it('returns 2000 for starter plan', async () => {
      const { getTokenLimit } = await import('@/lib/security')
      expect(getTokenLimit('starter')).toBe(2000)
    })

    it('returns 5000 for pro plan', async () => {
      const { getTokenLimit } = await import('@/lib/security')
      expect(getTokenLimit('pro')).toBe(5000)
    })
  })

  describe('getCorsHeaders', () => {
    it('returns correct headers with APP_URL', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
      const { getCorsHeaders } = await import('@/lib/security')
      const headers = getCorsHeaders()

      expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com')
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS')
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization')
      expect(headers['Access-Control-Max-Age']).toBe('86400')
    })

    it('uses localhost fallback when APP_URL not set in non-production', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(process.env as any).NODE_ENV = 'development'
      vi.resetModules()
      const { getCorsHeaders } = await import('@/lib/security')
      const headers = getCorsHeaders()

      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
    })

    it('throws error when APP_URL not set in production', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(process.env as any).NODE_ENV = 'production'
      vi.resetModules()
      const { getCorsHeaders } = await import('@/lib/security')

      expect(() => getCorsHeaders()).toThrow('NEXT_PUBLIC_APP_URL must be set')
    })
  })

  describe('getSecurityHeaders', () => {
    it('returns all required security headers', async () => {
      const { getSecurityHeaders } = await import('@/lib/security')
      const headers = getSecurityHeaders()

      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
    })

    it('includes required CSP directives', async () => {
      const { getSecurityHeaders } = await import('@/lib/security')
      const headers = getSecurityHeaders()
      const csp = headers['Content-Security-Policy']

      expect(csp).toContain('script-src')
      expect(csp).toContain('style-src')
      expect(csp).toContain('img-src')
      expect(csp).toContain('connect-src')
      expect(csp).toContain('frame-src')
      expect(csp).toContain("object-src 'none'")
      expect(csp).toContain("base-uri 'self'")
    })
  })

  describe('generateIdempotencyKey', () => {
    it('generates consistent key for same event', async () => {
      const { generateIdempotencyKey } = await import('@/lib/security')
      const event = {
        id: 'evt_123',
        type: 'test.event',
        created: 1234567890,
      } as unknown as Stripe.Event

      const key1 = generateIdempotencyKey(event)
      const key2 = generateIdempotencyKey(event)

      expect(key1).toBe(key2)
    })

    it('generates different keys for different events', async () => {
      const { generateIdempotencyKey } = await import('@/lib/security')
      const event1 = {
        id: 'evt_123',
        type: 'test.event',
        created: 1234567890,
      } as unknown as Stripe.Event
      const event2 = {
        id: 'evt_456',
        type: 'test.event',
        created: 1234567890,
      } as unknown as Stripe.Event

      const key1 = generateIdempotencyKey(event1)
      const key2 = generateIdempotencyKey(event2)

      expect(key1).not.toBe(key2)
    })

    it('returns a hex string', async () => {
      const { generateIdempotencyKey } = await import('@/lib/security')
      const event = {
        id: 'evt_123',
        type: 'test.event',
        created: 1234567890,
      } as unknown as Stripe.Event

      const key = generateIdempotencyKey(event)

      expect(key).toMatch(/^[0-9a-f]+$/)
      expect(key.length).toBe(64) // SHA-256 produces 64 hex chars
    })
  })

  describe('safeCompare', () => {
    it('returns true for equal strings', async () => {
      const { safeCompare } = await import('@/lib/security')
      expect(safeCompare('secret123', 'secret123')).toBe(true)
    })

    it('returns false for different strings', async () => {
      const { safeCompare } = await import('@/lib/security')
      expect(safeCompare('secret123', 'secret456')).toBe(false)
    })

    it('returns false for different length strings', async () => {
      const { safeCompare } = await import('@/lib/security')
      expect(safeCompare('secret', 'secret123')).toBe(false)
    })

    it('returns true for empty strings', async () => {
      const { safeCompare } = await import('@/lib/security')
      expect(safeCompare('', '')).toBe(true)
    })

    it('returns false when one is empty', async () => {
      const { safeCompare } = await import('@/lib/security')
      expect(safeCompare('secret', '')).toBe(false)
    })
  })

  describe('secureJsonResponse', () => {
    it('returns response with security headers', async () => {
      const { secureJsonResponse } = await import('@/lib/security')
      const response = secureJsonResponse({ success: true })

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
      expect(response.headers.get('Content-Type')).toBe('application/json')
    })

    it('uses custom status code', async () => {
      const { secureJsonResponse } = await import('@/lib/security')
      const response = secureJsonResponse({ error: 'Not found' }, 404)

      expect(response.status).toBe(404)
    })

    it('returns correct JSON body', async () => {
      const { secureJsonResponse } = await import('@/lib/security')
      const data = { foo: 'bar', count: 42 }
      const response = secureJsonResponse(data)
      const body = await response.json()

      expect(body).toEqual(data)
    })
  })

  describe('validateRequest', () => {
    it('returns IP from x-forwarded-for header', async () => {
      const { headers } = await import('next/headers')
      vi.mocked(headers).mockReturnValue({
        get: vi.fn((name: string) => {
          if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
          if (name === 'user-agent') return 'test-agent'
          if (name === 'content-type') return 'application/json'
          return null
        }),
      } as any)

      const { validateRequest } = await import('@/lib/security')
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await validateRequest(request)
      expect(result.ip).toBe('192.168.1.1')
    })

    it('returns IP from x-real-ip when forwarded-for not present', async () => {
      const { headers } = await import('next/headers')
      vi.mocked(headers).mockReturnValue({
        get: vi.fn((name: string) => {
          if (name === 'x-real-ip') return '10.0.0.1'
          if (name === 'user-agent') return 'test-agent'
          if (name === 'content-type') return 'application/json'
          return null
        }),
      } as any)

      const { validateRequest } = await import('@/lib/security')
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await validateRequest(request)
      expect(result.ip).toBe('10.0.0.1')
    })

    it('returns unknown when no IP headers present', async () => {
      const { headers } = await import('next/headers')
      vi.mocked(headers).mockReturnValue({
        get: vi.fn((name: string) => {
          if (name === 'user-agent') return 'test-agent'
          if (name === 'content-type') return 'application/json'
          return null
        }),
      } as any)

      const { validateRequest } = await import('@/lib/security')
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await validateRequest(request)
      expect(result.ip).toBe('unknown')
    })

    it('throws for POST without application/json content-type', async () => {
      const { headers } = await import('next/headers')
      vi.mocked(headers).mockReturnValue({
        get: vi.fn((name: string) => {
          if (name === 'content-type') return 'text/plain'
          if (name === 'user-agent') return 'test-agent'
          return null
        }),
      } as any)

      const { validateRequest } = await import('@/lib/security')
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
      })

      await expect(validateRequest(request)).rejects.toThrow('Invalid content type')
    })

    it('throws when user-agent is missing', async () => {
      const { headers } = await import('next/headers')
      vi.mocked(headers).mockReturnValue({
        get: vi.fn((name: string) => {
          if (name === 'content-type') return 'application/json'
          return null
        }),
      } as any)

      const { validateRequest } = await import('@/lib/security')
      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      await expect(validateRequest(request)).rejects.toThrow('User agent required')
    })

    it('allows GET requests without content-type check', async () => {
      const { headers } = await import('next/headers')
      vi.mocked(headers).mockReturnValue({
        get: vi.fn((name: string) => {
          if (name === 'user-agent') return 'test-agent'
          return null
        }),
      } as any)

      const { validateRequest } = await import('@/lib/security')
      const request = new Request('http://localhost/api/test', {
        method: 'GET',
      })

      const result = await validateRequest(request)
      expect(result.ip).toBeDefined()
    })
  })

  describe('verifyStripeWebhook', () => {
    it('returns event on valid signature', async () => {
      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            id: 'evt_123',
            type: 'test.event',
          }),
        },
      }
      vi.mocked((await import('stripe')).default).mockReturnValue(mockStripe as any)

      vi.resetModules()
      const { verifyStripeWebhook } = await import('@/lib/security')

      const result = await verifyStripeWebhook('body', 'signature')
      expect(result.id).toBe('evt_123')
    })

    it('throws on invalid signature', async () => {
      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockImplementation(() => {
            throw new Error('Invalid signature')
          }),
        },
      }
      vi.mocked((await import('stripe')).default).mockReturnValue(mockStripe as any)

      vi.resetModules()
      const { verifyStripeWebhook } = await import('@/lib/security')

      await expect(verifyStripeWebhook('body', 'bad-sig')).rejects.toThrow('Invalid webhook signature')
    })

    it('throws when webhook secret not configured', async () => {
      vi.doMock('@/lib/stripe-config', () => ({
        stripeConfig: {
          webhookSecret: '',
        },
      }))

      vi.resetModules()
      const { verifyStripeWebhook } = await import('@/lib/security')

      await expect(verifyStripeWebhook('body', 'sig')).rejects.toThrow('Stripe webhook secret not configured')
    })
  })

  describe('validateEnvironment', () => {
    // validateEnvironment reads env vars at runtime, so we can test by modifying them before calling
    // These tests don't use resetModules to preserve the stripe-config mock

    it('passes with all required environment variables', async () => {
      // Restore the stripe-config mock for this describe block
      vi.doMock('@/lib/stripe-config', () => ({
        stripeConfig: { webhookSecret: 'whsec_test_xxx' },
        validateStripeConfig: vi.fn(),
        getStripeConfig: vi.fn(() => ({ secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test_xxx', mode: 'test' })),
      }))
      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).not.toThrow()
    })

    it('throws when OPENAI_API_KEY is missing', async () => {
      vi.doMock('@/lib/stripe-config', () => ({
        stripeConfig: { webhookSecret: 'whsec_test_xxx' },
        validateStripeConfig: vi.fn(),
        getStripeConfig: vi.fn(() => ({ secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test_xxx', mode: 'test' })),
      }))
      delete process.env.OPENAI_API_KEY
      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).toThrow('Missing required environment variables: OPENAI_API_KEY')
    })

    it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      vi.doMock('@/lib/stripe-config', () => ({
        stripeConfig: { webhookSecret: 'whsec_test_xxx' },
        validateStripeConfig: vi.fn(),
        getStripeConfig: vi.fn(() => ({ secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test_xxx', mode: 'test' })),
      }))
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).toThrow('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL')
    })

    it('throws when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      vi.doMock('@/lib/stripe-config', () => ({
        stripeConfig: { webhookSecret: 'whsec_test_xxx' },
        validateStripeConfig: vi.fn(),
        getStripeConfig: vi.fn(() => ({ secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test_xxx', mode: 'test' })),
      }))
      delete process.env.SUPABASE_SERVICE_ROLE_KEY
      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).toThrow('Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY')
    })

    it('throws when STRIPE_SECRET_KEY is missing', async () => {
      vi.doMock('@/lib/stripe-config', () => ({
        stripeConfig: { webhookSecret: 'whsec_test_xxx' },
        validateStripeConfig: vi.fn(),
        getStripeConfig: vi.fn(() => ({ secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test_xxx', mode: 'test' })),
      }))
      delete process.env.STRIPE_SECRET_KEY
      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).toThrow('Missing required environment variables: STRIPE_SECRET_KEY')
    })

    it('throws when multiple required variables are missing', async () => {
      vi.doMock('@/lib/stripe-config', () => ({
        stripeConfig: { webhookSecret: 'whsec_test_xxx' },
        validateStripeConfig: vi.fn(),
        getStripeConfig: vi.fn(() => ({ secretKey: 'sk_test_xxx', webhookSecret: 'whsec_test_xxx', mode: 'test' })),
      }))
      delete process.env.OPENAI_API_KEY
      delete process.env.STRIPE_SECRET_KEY
      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).toThrow('Missing required environment variables: OPENAI_API_KEY, STRIPE_SECRET_KEY')
    })

    it('throws when Stripe config validation fails', async () => {
      // This test verifies the stripe config validation error path in validateEnvironment
      vi.doMock('@/lib/stripe-config', () => ({
        validateStripeConfig: vi.fn(() => {
          throw new Error('Webhook secret not configured')
        }),
        getStripeConfig: vi.fn(() => ({})),
        stripeConfig: {},
      }))

      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).toThrow('Stripe configuration error')
    })

    it('wraps non-Error exceptions from Stripe config validation', async () => {
      // Test the "Unknown error" fallback path
      vi.doMock('@/lib/stripe-config', () => ({
        validateStripeConfig: vi.fn(() => {
          throw 'string error' // Non-Error throw
        }),
        getStripeConfig: vi.fn(() => ({})),
        stripeConfig: {},
      }))

      vi.resetModules()
      const { validateEnvironment } = await import('@/lib/security')
      expect(() => validateEnvironment()).toThrow('Stripe configuration error: Unknown error')
    })
  })
})
