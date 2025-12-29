import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./__tests__/setup/vitest.setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Only include modules with tests - expand as more tests are added
      include: [
        // Tested lib modules (100% coverage)
        'lib/utils.ts',
        'lib/stripe-config.ts',
        'lib/security.ts',
        'lib/redfin-data.ts',
        // Tested API routes
        'app/api/health/route.ts',
        'app/api/market-analysis/route.ts',
        'app/api/newsletter/subscribe/route.ts',
        'app/api/contact/route.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/node_modules/**',
        '**/.next/**',
      ],
      thresholds: {
        // 100% COVERAGE REQUIRED for tested modules
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    // NO RETRIES - Tests must be deterministic, not flaky
    retry: 0,
    pool: 'forks',
    isolate: true,
    // Fail fast on first error in CI
    bail: process.env.CI ? 1 : 0,
    // Ensure deterministic test ordering
    sequence: {
      shuffle: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/__tests__': path.resolve(__dirname, './__tests__'),
    },
  },
})
