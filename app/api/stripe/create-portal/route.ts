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
    const { returnUrl } = body

    if (!returnUrl) {
      return secureJsonResponse({ 
        error: 'Missing required field: returnUrl' 
      }, 400)
    }

    // Get user profile with customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return secureJsonResponse({ error: 'User profile not found' }, 404)
    }

    if (!profile.customer_id) {
      return secureJsonResponse({ 
        error: 'No billing account found. Please subscribe first.' 
      }, 400)
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.customer_id,
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