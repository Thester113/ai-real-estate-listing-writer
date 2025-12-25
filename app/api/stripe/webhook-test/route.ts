import { NextRequest, NextResponse } from 'next/server'
import { getStripeConfig } from '@/lib/stripe-config'

export async function POST(request: NextRequest) {
  try {
    const bodyBuffer = await request.arrayBuffer()
    const body = Buffer.from(bodyBuffer).toString('utf8')
    const signature = request.headers.get('stripe-signature')
    const config = getStripeConfig()
    
    console.log('🔍 Webhook Test Debug:')
    console.log('  - Request URL:', request.url)
    console.log('  - Request method:', request.method)
    console.log('  - Headers:')
    
    // Log all headers for debugging
    request.headers.forEach((value, key) => {
      console.log(`    ${key}: ${key.toLowerCase().includes('stripe') ? value : value.substring(0, 20) + '...'}`)
    })
    
    console.log('  - Body length:', body.length)
    console.log('  - Webhook secret configured:', !!config.webhookSecret)
    console.log('  - Webhook secret length:', config.webhookSecret.length)
    console.log('  - Environment mode:', process.env.STRIPE_MODE || 'test')
    
    // Show body structure
    try {
      const parsed = JSON.parse(body)
      console.log('  - Event ID:', parsed.id)
      console.log('  - Event type:', parsed.type)
      console.log('  - Event created:', new Date(parsed.created * 1000).toISOString())
    } catch (e) {
      console.log('  - Body parse error:', e)
    }
    
    return NextResponse.json({
      received: true,
      webhook_url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      bodyLength: body.length,
      webhookSecretLength: config.webhookSecret.length,
      signaturePresent: !!signature
    })
    
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}