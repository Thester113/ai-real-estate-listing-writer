import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/security', () => ({
  secureJsonResponse: vi.fn((data, status = 200) => {
    return Response.json(data, {
      status,
      headers: {
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }),
}))

vi.mock('@/lib/analytics', () => ({
  trackServerEvent: vi.fn(),
}))

vi.mock('@/lib/utils', () => ({
  getErrorMessage: vi.fn((error) => {
    if (error instanceof Error) return error.message
    return 'An unknown error occurred'
  }),
}))

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { POST } from '@/app/api/newsletter/subscribe/route'
import { trackServerEvent } from '@/lib/analytics'

function createRequest(body: any): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/newsletter/subscribe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/newsletter/subscribe', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.CONVERTKIT_API_KEY = 'test-api-key'
    process.env.CONVERTKIT_FORM_ID = 'test-form-id'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validation', () => {
    it('returns 400 when email is missing', async () => {
      const request = createRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email address is required')
    })

    it('returns 400 for invalid email format', async () => {
      const request = createRequest({ email: 'invalid-email' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Please provide a valid email address')
    })

    it('accepts valid email formats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: 123 } }),
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('ConvertKit integration', () => {
    it('returns 500 when ConvertKit API key is missing', async () => {
      delete process.env.CONVERTKIT_API_KEY

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Newsletter signup is not available at the moment')
    })

    it('returns 500 when ConvertKit form ID is missing', async () => {
      delete process.env.CONVERTKIT_FORM_ID

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Newsletter signup is not available at the moment')
    })

    it('calls ConvertKit API with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: 123 } }),
      })

      const request = createRequest({ email: 'test@example.com' })
      await POST(request)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.convertkit.com/v3/forms/test-form-id/subscribe',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: 'test-api-key',
            email: 'test@example.com',
            tags: ['blog_subscriber', 'real_estate_marketing'],
          }),
        })
      )
    })

    it('handles already subscribed gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email is already subscribed' }),
      })

      const request = createRequest({ email: 'existing@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('You are already subscribed to our newsletter!')
    })

    it('handles ConvertKit API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid API key' }),
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid API key')
    })

    it('handles ConvertKit API errors without message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to subscribe to newsletter')
    })
  })

  describe('successful subscription', () => {
    it('returns success message on subscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: 123 } }),
      })

      const request = createRequest({ email: 'new@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Successfully subscribed to newsletter! Check your email for confirmation.')
    })

    it('tracks newsletter subscription event', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: 123 } }),
      })

      const request = createRequest({ email: 'track@example.com' })
      await POST(request)

      expect(trackServerEvent).toHaveBeenCalledWith('newsletter_subscribed', expect.objectContaining({
        email: 'track@example.com',
        source: 'blog_page',
      }))
    })
  })

  describe('error handling', () => {
    it('handles JSON parse errors', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/newsletter/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const request = createRequest({ email: 'test@example.com' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Network error')
    })
  })
})
