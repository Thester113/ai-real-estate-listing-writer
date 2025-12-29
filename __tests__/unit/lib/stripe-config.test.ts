import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('lib/stripe-config', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('cleanEnvVar (internal)', () => {
    // Test indirectly through getStripeConfig behavior
    it('handles newlines in STRIPE_MODE', async () => {
      process.env.STRIPE_MODE = 'test\n'
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_xxx'
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_xxx'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'

      const { getStripeConfig } = await import('@/lib/stripe-config')
      const config = getStripeConfig()

      expect(config.secretKey).toBe('sk_test_xxx')
    })

    it('handles tabs in environment variables', async () => {
      process.env.STRIPE_MODE = 'test'
      process.env.STRIPE_TEST_SECRET_KEY = '\tsk_test_xxx\t'
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_xxx'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'

      const { getStripeConfig } = await import('@/lib/stripe-config')
      const config = getStripeConfig()

      expect(config.secretKey).toBe('sk_test_xxx')
    })
  })

  describe('getStripeConfig', () => {
    it('returns test keys when STRIPE_MODE is test', async () => {
      process.env.STRIPE_MODE = 'test'
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_xxx'
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_xxx'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'

      const { getStripeConfig } = await import('@/lib/stripe-config')
      const config = getStripeConfig()

      expect(config.secretKey).toBe('sk_test_xxx')
      expect(config.webhookSecret).toBe('whsec_test_xxx')
      expect(config.priceIdPro).toBe('price_test_xxx')
      expect(config.publishableKey).toBe('pk_test_xxx')
    })

    it('returns live keys when STRIPE_MODE is live', async () => {
      process.env.STRIPE_MODE = 'live'
      process.env.STRIPE_LIVE_SECRET_KEY = 'sk_live_xxx'
      process.env.STRIPE_LIVE_WEBHOOK_SECRET = 'whsec_live_xxx'
      process.env.STRIPE_LIVE_PRICE_ID_PRO = 'price_live_xxx'
      process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY = 'pk_live_xxx'

      const { getStripeConfig } = await import('@/lib/stripe-config')
      const config = getStripeConfig()

      expect(config.secretKey).toBe('sk_live_xxx')
      expect(config.webhookSecret).toBe('whsec_live_xxx')
      expect(config.priceIdPro).toBe('price_live_xxx')
      expect(config.publishableKey).toBe('pk_live_xxx')
    })

    it('defaults to test mode when STRIPE_MODE is not set', async () => {
      delete process.env.STRIPE_MODE
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_default'
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_default'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_default'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_default'

      const { getStripeConfig } = await import('@/lib/stripe-config')
      const config = getStripeConfig()

      expect(config.secretKey).toBe('sk_test_default')
    })

    it('defaults to test mode when STRIPE_MODE is empty', async () => {
      process.env.STRIPE_MODE = ''
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_empty'
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_empty'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_empty'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_empty'

      const { getStripeConfig } = await import('@/lib/stripe-config')
      const config = getStripeConfig()

      expect(config.secretKey).toBe('sk_test_empty')
    })

    it('returns empty string for missing keys', async () => {
      process.env.STRIPE_MODE = 'test'
      delete process.env.STRIPE_TEST_SECRET_KEY
      delete process.env.STRIPE_TEST_WEBHOOK_SECRET
      delete process.env.STRIPE_TEST_PRICE_ID_PRO
      delete process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY

      const { getStripeConfig } = await import('@/lib/stripe-config')
      const config = getStripeConfig()

      expect(config.secretKey).toBe('')
      expect(config.webhookSecret).toBe('')
      expect(config.priceIdPro).toBe('')
      expect(config.publishableKey).toBe('')
    })
  })

  describe('isStripeInLiveMode', () => {
    it('returns true when STRIPE_MODE is live', async () => {
      process.env.STRIPE_MODE = 'live'

      const { isStripeInLiveMode } = await import('@/lib/stripe-config')

      expect(isStripeInLiveMode()).toBe(true)
    })

    it('returns false when STRIPE_MODE is test', async () => {
      process.env.STRIPE_MODE = 'test'

      const { isStripeInLiveMode } = await import('@/lib/stripe-config')

      expect(isStripeInLiveMode()).toBe(false)
    })

    it('returns false when STRIPE_MODE is not set', async () => {
      delete process.env.STRIPE_MODE

      const { isStripeInLiveMode } = await import('@/lib/stripe-config')

      expect(isStripeInLiveMode()).toBe(false)
    })
  })

  describe('validateStripeConfig', () => {
    it('returns config when all keys are present', async () => {
      process.env.STRIPE_MODE = 'test'
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_xxx'
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_xxx'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'

      const { validateStripeConfig } = await import('@/lib/stripe-config')
      const config = validateStripeConfig()

      expect(config.secretKey).toBe('sk_test_xxx')
    })

    it('throws error when secretKey is missing', async () => {
      process.env.STRIPE_MODE = 'test'
      delete process.env.STRIPE_TEST_SECRET_KEY
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_xxx'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'

      const { validateStripeConfig } = await import('@/lib/stripe-config')

      expect(() => validateStripeConfig()).toThrow('Missing Stripe test keys: secretKey')
    })

    it('throws error when multiple keys are missing', async () => {
      process.env.STRIPE_MODE = 'test'
      delete process.env.STRIPE_TEST_SECRET_KEY
      delete process.env.STRIPE_TEST_WEBHOOK_SECRET
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'

      const { validateStripeConfig } = await import('@/lib/stripe-config')

      expect(() => validateStripeConfig()).toThrow('Missing Stripe test keys: secretKey, webhookSecret')
    })

    it('throws error with live mode message when in live mode', async () => {
      process.env.STRIPE_MODE = 'live'
      delete process.env.STRIPE_LIVE_SECRET_KEY
      process.env.STRIPE_LIVE_WEBHOOK_SECRET = 'whsec_live_xxx'
      process.env.STRIPE_LIVE_PRICE_ID_PRO = 'price_live_xxx'
      process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY = 'pk_live_xxx'

      const { validateStripeConfig } = await import('@/lib/stripe-config')

      expect(() => validateStripeConfig()).toThrow('Missing Stripe live keys: secretKey')
    })

    it('throws when all keys are missing', async () => {
      process.env.STRIPE_MODE = 'test'
      delete process.env.STRIPE_TEST_SECRET_KEY
      delete process.env.STRIPE_TEST_WEBHOOK_SECRET
      delete process.env.STRIPE_TEST_PRICE_ID_PRO
      delete process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY

      const { validateStripeConfig } = await import('@/lib/stripe-config')

      expect(() => validateStripeConfig()).toThrow(
        'Missing Stripe test keys: secretKey, publishableKey, webhookSecret, priceIdPro'
      )
    })
  })

  describe('stripeConfig export', () => {
    it('exports a config object', async () => {
      process.env.STRIPE_MODE = 'test'
      process.env.STRIPE_TEST_SECRET_KEY = 'sk_test_xxx'
      process.env.STRIPE_TEST_WEBHOOK_SECRET = 'whsec_test_xxx'
      process.env.STRIPE_TEST_PRICE_ID_PRO = 'price_test_xxx'
      process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY = 'pk_test_xxx'

      const { stripeConfig } = await import('@/lib/stripe-config')

      expect(stripeConfig).toBeDefined()
      expect(typeof stripeConfig.secretKey).toBe('string')
      expect(typeof stripeConfig.webhookSecret).toBe('string')
      expect(typeof stripeConfig.priceIdPro).toBe('string')
      expect(typeof stripeConfig.publishableKey).toBe('string')
    })
  })
})
