// Stripe configuration utility to safely switch between test and live modes

// Enhanced cleaning function to handle newline and tab issues
function cleanEnvVar(value: string | undefined): string {
  if (!value) return ''
  // Remove newlines and tabs, then trim any leading/trailing spaces
  return value.replace(/[\r\n\t]/g, '').trim()
}

const isLiveMode = cleanEnvVar(process.env.STRIPE_MODE) === 'live'

// Get the appropriate Stripe keys based on mode
export const getStripeConfig = () => {
  if (isLiveMode) {
    const config = {
      secretKey: cleanEnvVar(process.env.STRIPE_LIVE_SECRET_KEY),
      publishableKey: cleanEnvVar(process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY),
      webhookSecret: cleanEnvVar(process.env.STRIPE_LIVE_WEBHOOK_SECRET),
      priceIdPro: cleanEnvVar(process.env.STRIPE_LIVE_PRICE_ID_PRO),
    }
    
    console.log('🔧 Live mode config loaded:', {
      secretKeyPrefix: config.secretKey.substring(0, 7) + '...',
      webhookSecretPrefix: config.webhookSecret.substring(0, 12) + '...',
      priceIdPro: config.priceIdPro
    })
    
    return config
  } else {
    const config = {
      secretKey: cleanEnvVar(process.env.STRIPE_TEST_SECRET_KEY),
      publishableKey: cleanEnvVar(process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY),
      webhookSecret: cleanEnvVar(process.env.STRIPE_TEST_WEBHOOK_SECRET),
      priceIdPro: cleanEnvVar(process.env.STRIPE_TEST_PRICE_ID_PRO),
    }
    
    console.log('🔧 Test mode config loaded:', {
      secretKeyPrefix: config.secretKey.substring(0, 7) + '...',
      webhookSecretPrefix: config.webhookSecret.substring(0, 12) + '...',
      priceIdPro: config.priceIdPro
    })
    
    return config
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