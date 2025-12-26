import { NextRequest, NextResponse } from 'next/server'
import { getStripeConfig } from '@/lib/stripe-config'

export async function GET(request: NextRequest) {
  // Security: Only allow in development or with proper authentication
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization')
    const debugSecret = process.env.DEBUG_SECRET

    if (!debugSecret || authHeader !== `Bearer ${debugSecret}`) {
      return NextResponse.json({
        error: 'Unauthorized - debug endpoint disabled in production'
      }, { status: 401 })
    }
  }

  try {
    const config = getStripeConfig()

    return NextResponse.json({
      success: true,
      webhookSecretConfigured: !!config.webhookSecret,
      webhookSecretPrefix: config.webhookSecret ? config.webhookSecret.substring(0, 7) + '...' : 'MISSING',
      priceIdPro: config.priceIdPro || 'MISSING',
      environment: {
        STRIPE_MODE: process.env.STRIPE_MODE || 'test',
        STRIPE_TEST_WEBHOOK_SECRET: process.env.STRIPE_TEST_WEBHOOK_SECRET ? 'SET' : 'MISSING',
        STRIPE_LIVE_WEBHOOK_SECRET: process.env.STRIPE_LIVE_WEBHOOK_SECRET ? 'SET' : 'MISSING',
        STRIPE_TEST_PRICE_ID_PRO: process.env.STRIPE_TEST_PRICE_ID_PRO ? 'SET' : 'MISSING',
        STRIPE_LIVE_PRICE_ID_PRO: process.env.STRIPE_LIVE_PRICE_ID_PRO ? 'SET' : 'MISSING'
      },
      // Security: Never expose full secrets
      cleanedValues: {
        webhookSecretPrefix: config.webhookSecret.substring(0, 12) + '...',
        priceIdPro: config.priceIdPro,
        secretKeyPrefix: config.secretKey.substring(0, 7) + '...'
      },
      webhookSecretLength: config.webhookSecret.length,
      priceIdLength: config.priceIdPro.length
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Test webhook endpoint - accepts any payload and logs it
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    const config = getStripeConfig()
    
    console.log('🔍 Webhook Debug Info:')
    console.log('  - Body length:', body.length)
    console.log('  - Signature present:', !!signature)
    console.log('  - Webhook secret configured:', !!config.webhookSecret)
    console.log('  - Webhook secret prefix:', config.webhookSecret?.substring(0, 7) + '...' || 'MISSING')
    console.log('  - Stripe mode:', process.env.STRIPE_MODE || 'test')
    
    if (signature) {
      console.log('  - Signature prefix:', signature.substring(0, 20) + '...')
    }
    
    // Try to parse as JSON to see event type
    try {
      const parsed = JSON.parse(body)
      console.log('  - Event type:', parsed.type || 'unknown')
      console.log('  - Event id:', parsed.id || 'unknown')
    } catch (e) {
      console.log('  - Body is not valid JSON')
    }
    
    return NextResponse.json({
      received: true,
      signature: signature ? 'present' : 'missing',
      webhookSecret: config.webhookSecret ? 'configured' : 'missing',
      bodyLength: body.length
    })
    
  } catch (error) {
    console.error('Webhook debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}