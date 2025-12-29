import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock security module before importing the route
vi.mock('@/lib/security', () => ({
  getSecurityHeaders: vi.fn(() => ({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  })),
}))

import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(process.env as any).NODE_ENV = originalEnv
  })

  it('returns 200 with health status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBe('2025-01-15T12:00:00.000Z')
    expect(data.version).toBe('1.0.0')
    expect(data.environment).toBe('test')
  })

  it('includes service status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.services).toEqual({
      database: 'connected',
      stripe: 'configured',
      openai: 'configured',
    })
  })

  it('includes security headers', async () => {
    const response = await GET()

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block')
  })

  it('returns 500 when an error occurs', async () => {
    // Mock getSecurityHeaders to throw on first call to trigger error path
    const { getSecurityHeaders } = await import('@/lib/security')
    vi.mocked(getSecurityHeaders).mockImplementationOnce(() => {
      throw new Error('Test error')
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.status).toBe('error')
    expect(data.error).toBe('Health check failed')
  })
})
