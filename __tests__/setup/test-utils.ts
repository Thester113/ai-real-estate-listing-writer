import { vi } from 'vitest'

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: unknown
  } = {}
): Request {
  const { method = 'GET', headers = {}, body } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  return new Request(url, requestInit)
}

/**
 * Create a mock NextResponse for testing
 */
export function createMockResponse(
  body: unknown,
  options: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers = {} } = options
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

/**
 * Helper to extract JSON from a Response
 */
export async function getResponseJson<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

/**
 * Helper to wait for all promises to settle
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

/**
 * Create a deferred promise for testing async behavior
 */
export function createDeferred<T>() {
  let resolve: (value: T) => void
  let reject: (error: Error) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve: resolve!, reject: reject! }
}

/**
 * Mock console methods for testing console output
 */
export function mockConsole() {
  const originalConsole = { ...console }

  const mocks = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  }

  const restore = () => {
    Object.assign(console, originalConsole)
    Object.values(mocks).forEach((mock) => mock.mockRestore())
  }

  return { mocks, restore }
}

/**
 * Assert that a function throws an error with a specific message
 */
export async function expectAsyncError(
  fn: () => Promise<unknown>,
  expectedMessage?: string
): Promise<Error> {
  try {
    await fn()
    throw new Error('Expected function to throw an error')
  } catch (error) {
    if (error instanceof Error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to include "${expectedMessage}" but got "${error.message}"`
        )
      }
      return error
    }
    throw error
  }
}

/**
 * Create a mock authorization header
 */
export function createAuthHeader(token: string = 'test-token'): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  }
}
