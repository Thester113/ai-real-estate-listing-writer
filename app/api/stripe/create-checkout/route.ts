import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { validateRequest, secureJsonResponse } from '@/lib/security'
import { getErrorMessage } from '@/lib/utils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Validate request
    await validateRequest(request)

    // Get user session
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return secureJsonResponse({ error: 'Authentication required' }, 401)
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return secureJsonResponse({ error: 'Invalid authentication' }, 401)
    }

    // Parse request body
    const body = await request.json()
    const { planId, successUrl, cancelUrl } = body

    if (!planId || !successUrl || !cancelUrl) {
      return secureJsonResponse({ 
        error: 'Missing required fields: planId, successUrl, cancelUrl' 
      }, 400)
    }

    // Get or create Stripe customer
    let customerId: string

    // Check if user already has a customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('customer_id, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return secureJsonResponse({ error: 'User profile not found' }, 404)
    }

    if (profile.customer_id) {
      customerId = profile.customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || profile.email,
        metadata: {
          supabase_user_id: user.id
        }
      })

      customerId = customer.id

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ customer_id: customerId })
        .eq('id', user.id)
    }

    // Get the correct price ID based on plan
    const priceId = planId === 'pro' 
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_STARTER

    if (!priceId) {
      return secureJsonResponse({ 
        error: `Price ID not configured for plan: ${planId}` 
      }, 500)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan: planId
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: planId
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return secureJsonResponse({
      url: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Checkout creation error:', error)
    
    return secureJsonResponse({
      error: getErrorMessage(error),
      message: 'Failed to create checkout session'
    }, 500)
  }
}