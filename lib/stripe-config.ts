// Stripe configuration utility to safely switch between test and live modes

const isLiveMode = process.env.STRIPE_MODE?.trim() === 'live'

// Get the appropriate Stripe keys based on mode
export const getStripeConfig = () => {
  if (isLiveMode) {
    return {
      secretKey: process.env.STRIPE_LIVE_SECRET_KEY?.trim()!,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY?.trim()!,
      webhookSecret: process.env.STRIPE_LIVE_WEBHOOK_SECRET?.trim()!,
      priceIdPro: process.env.STRIPE_LIVE_PRICE_ID_PRO?.trim()!,
    }
  } else {
    return {
      secretKey: process.env.STRIPE_TEST_SECRET_KEY?.trim()!,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY?.trim()!,
      webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET?.trim()!,
      priceIdPro: process.env.STRIPE_TEST_PRICE_ID_PRO?.trim()!,
    }
  }
}

// Export individual config values for convenience
export const stripeConfig = getStripeConfig()

// Helper to check current mode
export const isStripeInLiveMode = () => isLiveMode

// Safety check - ensure all required keys are present
export const validateStripeConfig = () => {
  const config = getStripeConfig()
  const missing = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key)
  
  if (missing.length > 0) {
    throw new Error(`Missing Stripe ${isLiveMode ? 'live' : 'test'} keys: ${missing.join(', ')}`)
  }
  
  return config
}