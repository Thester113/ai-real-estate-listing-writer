import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-client'
import { secureJsonResponse } from '@/lib/security'
import { getErrorMessage } from '@/lib/utils'
import { stripeConfig, validateStripeConfig, isStripeInLiveMode } from '@/lib/stripe-config'

// Move Stripe initialization to request time

export async function POST(request: NextRequest) {
  try {
    // Validate config and create Stripe instance at request time
    const config = validateStripeConfig()
    const stripe = new Stripe(config.secretKey, {
      apiVersion: '2023-10-16',
    })

    // Basic validation - rate limiting handled by middleware

    // Get user session
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Auth header exists:', !!authHeader)

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header')
      return secureJsonResponse({ error: 'Authentication required' }, 401)
    }

    const token = authHeader.substring(7)
    console.log('🔍 Getting user from token...')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      console.log('User found:', !!user)
      return secureJsonResponse({
        error: 'Invalid authentication',
        details: authError?.message
      }, 401)
    }

    console.log('✅ User authenticated:', user.id)

    // Parse request body
    const body = await request.json()
    const { returnUrl } = body

    if (!returnUrl) {
      return secureJsonResponse({ 
        error: 'Missing required field: returnUrl' 
      }, 400)
    }

    // Get user profile with customer ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return secureJsonResponse({ error: 'User profile not found' }, 404)
    }

    // Type assertion for profile
    const userProfile = profile as any

    if (!userProfile.customer_id) {
      return secureJsonResponse({ 
        error: 'No billing account found. Please subscribe first.' 
      }, 400)
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userProfile.customer_id,
      return_url: returnUrl,
    })

    return secureJsonResponse({
      url: session.url
    })

  } catch (error) {
    console.error('Portal creation error:', error)
    
    return secureJsonResponse({
      error: getErrorMessage(error),
      message: 'Failed to create billing portal session'
    }, 500)
  }
}