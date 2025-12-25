import { NextRequest, NextResponse } from 'next/server'
import { getStripeConfig } from '@/lib/stripe-config'

export async function GET(request: NextRequest) {
  try {
    const config = getStripeConfig()
    
    return NextResponse.json({
      success: true,
      config: {
        secretKey: config.secretKey ? `${config.secretKey.substring(0, 7)}...` : 'MISSING',
        publishableKey: config.publishableKey ? `${config.publishableKey.substring(0, 7)}...` : 'MISSING',
        webhookSecret: config.webhookSecret ? `${config.webhookSecret.substring(0, 7)}...` : 'MISSING',
        priceIdPro: config.priceIdPro || 'MISSING',
      },
      env: {
        STRIPE_MODE: process.env.STRIPE_MODE || 'MISSING',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      env: {
        STRIPE_MODE: process.env.STRIPE_MODE || 'MISSING',
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
      }
    }, { status: 500 })
  }
}