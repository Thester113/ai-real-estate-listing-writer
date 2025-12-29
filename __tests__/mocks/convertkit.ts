import { vi } from 'vitest'

/**
 * Create a mock ConvertKit client/API response handler
 */
export function createMockConvertKit() {
  return {
    subscribe: vi.fn().mockResolvedValue({
      subscription: {
        id: 12345,
        subscribable_id: 'form_123',
        subscribable_type: 'form',
        created_at: '2025-01-15T12:00:00Z',
        subscriber: {
          id: 67890,
          email_address: 'test@test.com',
        },
      },
    }),
    addTag: vi.fn().mockResolvedValue({
      subscription: {
        id: 12345,
        tag_id: 111,
      },
    }),
    getSubscriber: vi.fn().mockResolvedValue({
      subscriber: {
        id: 67890,
        email_address: 'test@test.com',
        state: 'active',
        created_at: '2025-01-15T12:00:00Z',
        fields: {},
      },
    }),
    unsubscribe: vi.fn().mockResolvedValue({
      subscriber: {
        id: 67890,
        email_address: 'test@test.com',
        state: 'cancelled',
      },
    }),
  }
}

/**
 * Mock fetch responses for ConvertKit API
 */
export function mockConvertKitFetch(mockFetch: ReturnType<typeof vi.fn>) {
  mockFetch.mockImplementation((url: string | URL, options?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : String(url)

    // Subscribe endpoint
    if (urlStr.includes('/forms/') && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            subscription: {
              id: 12345,
              subscriber: { id: 67890, email_address: 'test@test.com' },
            },
          }),
      })
    }

    // Add tag endpoint
    if (urlStr.includes('/tags/') && options?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            subscription: { id: 12345, tag_id: 111 },
          }),
      })
    }

    // Default: return 404
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    })
  })
}

/**
 * Mock ConvertKit API error
 */
export function mockConvertKitError(
  mockFetch: ReturnType<typeof vi.fn>,
  errorMessage: string,
  status: number = 400
) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMessage }),
  })
}

/**
 * Mock ConvertKit network error
 */
export function mockConvertKitNetworkError(mockFetch: ReturnType<typeof vi.fn>) {
  mockFetch.mockRejectedValue(new Error('Network error'))
}
