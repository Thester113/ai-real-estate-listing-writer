import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-client'
import { getStripeConfig } from '@/lib/stripe-config'
import { createHash } from 'crypto'

// Configure Next.js to not parse the body for this webhook route
export const runtime = 'nodejs'

// Create Stripe instance with test/live mode handling
const getStripeInstance = () => {
  const config = getStripeConfig()
  return new Stripe(config.secretKey, {
    apiVersion: '2023-10-16',
  })
}

// Generate idempotency key
function generateIdempotencyKey(event: Stripe.Event): string {
  return createHash('sha256')
    .update(`${event.id}-${event.type}-${event.created}`)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook received')
  
  try {
    // Get the raw body as buffer to preserve exact formatting
    const bodyBuffer = await request.arrayBuffer()
    const body = Buffer.from(bodyBuffer).toString('utf8')
    const signature = request.headers.get('stripe-signature')

    console.log('📝 Webhook details:')
    console.log('  - Signature present:', !!signature)
    console.log('  - Body buffer length:', bodyBuffer.byteLength)
    console.log('  - Body string length:', body.length)
    console.log('  - First 100 chars:', body.substring(0, 100))

    if (!signature) {
      console.error('❌ Missing Stripe signature')
      return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
    }

    // Get webhook secret and verify signature
    const config = getStripeConfig()
    const stripe = getStripeInstance()
    
    console.log('🔑 Webhook Configuration Debug:')
    console.log('  - Request URL:', request.url)
    console.log('  - Webhook secret present:', !!config.webhookSecret)
    console.log('  - Webhook secret prefix:', config.webhookSecret?.substring(0, 12) + '...' || 'MISSING')
    console.log('  - Webhook secret length:', config.webhookSecret?.length || 0)
    console.log('  - Signature present:', !!signature)
    console.log('  - Signature prefix:', signature?.substring(0, 20) + '...' || 'MISSING')
    console.log('  - Body length:', body.length)
    console.log('  - Stripe mode:', process.env.STRIPE_MODE || 'test')
    console.log('  - Environment webhook secret:', process.env.STRIPE_MODE === 'live' ? 
      (process.env.STRIPE_LIVE_WEBHOOK_SECRET ? 'SET' : 'MISSING') : 
      (process.env.STRIPE_TEST_WEBHOOK_SECRET ? 'SET' : 'MISSING'))
    
    // Additional debugging for headers
    console.log('  - All Stripe headers:')
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('stripe')) {
        console.log(`    ${key}: ${value}`)
      }
    })
    
    if (!config.webhookSecret) {
      console.error('❌ Missing webhook secret')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      // Try with string first
      event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret)
      console.log('✅ Webhook signature verified with string body, event type:', event.type)
    } catch (stringErr) {
      console.log('❌ String body verification failed, trying with buffer...')
      try {
        // Try with raw buffer if string fails
        event = stripe.webhooks.constructEvent(Buffer.from(bodyBuffer), signature, config.webhookSecret)
        console.log('✅ Webhook signature verified with buffer body, event type:', event.type)
      } catch (bufferErr) {
        console.error('❌ Both string and buffer verification failed:')
        console.error('  - String error:', stringErr instanceof Error ? stringErr.message : stringErr)
        console.error('  - Buffer error:', bufferErr instanceof Error ? bufferErr.message : bufferErr)
        console.error('  - Webhook secret being used:', config.webhookSecret?.substring(0, 12) + '...')
        console.error('  - Stripe signature header:', signature?.substring(0, 30) + '...')
        return NextResponse.json({ 
          error: 'Invalid webhook signature',
          debug: {
            webhookSecretConfigured: !!config.webhookSecret,
            signaturePresent: !!signature,
            stringError: stringErr instanceof Error ? stringErr.message : 'Unknown error',
            bufferError: bufferErr instanceof Error ? bufferErr.message : 'Unknown error'
          }
        }, { status: 400 })
      }
    }
    
    // Check for idempotency
    const idempotencyKey = generateIdempotencyKey(event)
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('id', idempotencyKey)
      .single()

    if (existingEvent) {
      console.log('⚠️ Event already processed:', event.id)
      return NextResponse.json({ message: 'Event already processed' }, { status: 200 })
    }

    console.log('💾 Storing event for idempotency')
    // Store event for idempotency
    try {
      await (supabaseAdmin as any)
        .from('webhook_events')
        .insert({
          id: idempotencyKey,
          type: event.type,
          data: event.data
        })
    } catch (err) {
      console.warn('⚠️ Could not store idempotency record, continuing anyway:', err)
    }

    // Process the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event)
        break
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Webhook error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      eventType: (event as any)?.type || 'unknown',
      eventId: (event as any)?.id || 'unknown'
    })
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function handleSubscriptionChange(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const customerId = subscription.customer as string

  console.log('🔄 Processing subscription change:', {
    subscriptionId: subscription.id,
    customerId,
    status: subscription.status,
    eventType: event.type
  })

  try {
    // Find user by customer ID
    console.log('🔍 Looking for user with customer_id:', customerId)
    let { data: profile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    console.log('👤 User lookup result:', {
      found: !!profile,
      error: findError?.message,
      customerId: (profile as any)?.customer_id,
      currentPlan: (profile as any)?.plan
    })

    if (findError || !profile) {
      console.error('❌ User not found for customer:', customerId, 'Error:', findError?.message)
      
      // Try to find by email from Stripe customer data as fallback
      try {
        const stripe = getStripeInstance()
        const customer = await stripe.customers.retrieve(customerId)
        const customerEmail = (customer as any).email
        
        if (customerEmail) {
          console.log('🔄 Trying lookup by email:', customerEmail)
          const { data: profileByEmail } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', customerEmail)
            .single()
          
          if (profileByEmail) {
            console.log('✅ Found user by email, updating customer_id...')
            // Update the profile with the customer_id
            await (supabaseAdmin as any)
              .from('profiles')
              .update({ customer_id: customerId })
              .eq('id', (profileByEmail as any).id)
            
            profile = profileByEmail
            console.log('Updated profile with customer_id:', customerId)
          }
        }
      } catch (stripeError) {
        console.error('❌ Could not retrieve Stripe customer:', stripeError)
      }
      
      if (!profile) {
        return
      }
    }

    // Type assertion for profile
    const userProfile = profile as any

    // Determine plan from subscription items
    const plan = determinePlan(subscription)

    // Update user profile
    const { error: updateError } = await (supabaseAdmin as any)
      .from('profiles')
      .update({
        subscription_id: subscription.id,
        subscription_status: subscription.status as any,
        plan: plan,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return
    }

    console.log(`✅ Subscription updated for user ${userProfile.id}: ${plan} (${subscription.status})`)
  } catch (error) {
    console.error('Error handling subscription change:', error)
  }
}

async function handleSubscriptionCancellation(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const customerId = subscription.customer as string

  try {
    // Find user by customer ID
    const { data: profile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (findError || !profile) {
      console.error('User not found for customer:', customerId)
      return
    }

    // Type assertion for profile
    const userProfile = profile as any

    // Update user to starter plan
    const { error: updateError } = await (supabaseAdmin as any)
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        plan: 'starter', // Downgrade to free tier
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id)

    if (updateError) {
      console.error('Failed to update profile after cancellation:', updateError)
      return
    }

    console.log(`✅ Subscription canceled for user ${userProfile.id}`)
  } catch (error) {
    console.error('Error handling subscription cancellation:', error)
  }
}

async function handlePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const customerId = invoice.customer as string

  try {
    // Find user by customer ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (profile) {
      // Type assertion for profile
      const userProfile = profile as any
      
      console.log(`✅ Payment succeeded for user ${userProfile.id}: ${(invoice.amount_paid || 0) / 100} ${invoice.currency}`)
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const customerId = invoice.customer as string

  try {
    // Find user by customer ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (profile) {
      // Type assertion for profile
      const userProfile = profile as any
      
      console.log(`❌ Payment failed for user ${userProfile.id}: ${(invoice.amount_due || 0) / 100} ${invoice.currency}`)
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

function determinePlan(subscription: Stripe.Subscription): 'starter' | 'pro' {
  // Check subscription items for price IDs
  const config = getStripeConfig()
  
  for (const item of subscription.items.data) {
    const priceId = item.price.id
    
    console.log('📦 Checking price ID:', priceId, 'against config pro price:', config.priceIdPro)
    
    if (priceId === config.priceIdPro) {
      return 'pro'
    }
  }
  
  // Default to starter if no matching price found
  console.log('⚠️ No matching price ID found, defaulting to starter')
  return 'starter'
}