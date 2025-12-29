import { vi } from 'vitest'

/**
 * Mock query builder that supports chaining
 */
export function createMockQueryBuilder(defaultData: unknown = null, defaultError: unknown = null) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: defaultData, error: defaultError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: defaultData, error: defaultError }),
    then: vi.fn((resolve) => resolve({ data: defaultData, error: defaultError })),
  }

  return builder
}

/**
 * Create a mock Supabase client with configurable behavior
 */
export function createMockSupabaseClient(overrides: Record<string, unknown> = {}) {
  const defaultQueryBuilder = createMockQueryBuilder()

  const client = {
    from: vi.fn(() => defaultQueryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/file' } }),
      })),
    },
    ...overrides,
  }

  return client
}

// Default mock instances
export const mockSupabaseAdmin = createMockSupabaseClient()
export const mockSupabase = createMockSupabaseClient()

/**
 * Configure mock to return specific user
 */
export function mockAuthenticatedUser(
  client: ReturnType<typeof createMockSupabaseClient>,
  user: {
    id: string
    email: string
    [key: string]: unknown
  }
) {
  client.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  })
}

/**
 * Configure mock to return authentication error
 */
export function mockUnauthenticated(client: ReturnType<typeof createMockSupabaseClient>) {
  client.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  })
}

/**
 * Configure mock query builder to return specific data
 */
export function mockQueryResult(
  client: ReturnType<typeof createMockSupabaseClient>,
  tableName: string,
  data: unknown,
  error: unknown = null
) {
  const builder = createMockQueryBuilder(data, error)
  ;(client.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    if (table === tableName) {
      return builder
    }
    return createMockQueryBuilder()
  })
  return builder
}

/**
 * Configure mock RPC to return specific data
 */
export function mockRpcResult(
  client: ReturnType<typeof createMockSupabaseClient>,
  data: unknown,
  error: unknown = null
) {
  client.rpc.mockResolvedValue({ data, error })
}
