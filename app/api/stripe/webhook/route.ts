import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-client'
import { verifyStripeWebhook, generateIdempotencyKey, secureJsonResponse } from '@/lib/security'
import { trackServerEvent } from '@/lib/analytics'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return secureJsonResponse({ error: 'Missing Stripe signature' }, 400)
    }

    // Verify webhook signature
    const event = await verifyStripeWebhook(body, signature)
    
    // Check for idempotency
    const idempotencyKey = generateIdempotencyKey(event)
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('id', idempotencyKey)
      .single()

    if (existingEvent) {
      return secureJsonResponse({ message: 'Event already processed' }, 200)
    }

    // Store event for idempotency
    await supabaseAdmin
      .from('webhook_events')
      .insert({
        id: idempotencyKey,
        type: event.type,
        data: event.data
      })

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

    return secureJsonResponse({ received: true }, 200)
  } catch (error) {
    console.error('Webhook error:', error)
    return secureJsonResponse({ error: 'Webhook processing failed' }, 500)
  }
}

async function handleSubscriptionChange(event: Stripe.Event) {
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

    // Determine plan from subscription items
    const plan = determinePlan(subscription)

    // Update user profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_id: subscription.id,
        subscription_status: subscription.status as any,
        plan: plan,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return
    }

    // Track analytics
    trackServerEvent('subscription_updated', {
      user_id: profile.id,
      plan: plan,
      status: subscription.status,
      customer_id: customerId
    })

    console.log(`Subscription updated for user ${profile.id}: ${plan} (${subscription.status})`)
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

    // Update user to starter plan
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        plan: 'starter', // Downgrade to free tier
        current_period_end: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Failed to update profile after cancellation:', updateError)
      return
    }

    // Track analytics
    trackServerEvent('subscription_canceled', {
      user_id: profile.id,
      customer_id: customerId,
      plan: 'starter'
    })

    console.log(`Subscription canceled for user ${profile.id}`)
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
      // Track successful payment
      trackServerEvent('payment_succeeded', {
        user_id: profile.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        customer_id: customerId
      })

      console.log(`Payment succeeded for user ${profile.id}: ${invoice.amount_paid / 100} ${invoice.currency}`)
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
      // Track failed payment
      trackServerEvent('payment_failed', {
        user_id: profile.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        customer_id: customerId,
        failure_reason: invoice.last_finalization_error?.message || 'Unknown'
      })

      console.log(`Payment failed for user ${profile.id}: ${invoice.amount_due / 100} ${invoice.currency}`)
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

function determinePlan(subscription: Stripe.Subscription): 'starter' | 'pro' {
  // Check subscription items for price IDs
  for (const item of subscription.items.data) {
    const priceId = item.price.id
    
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
      return 'pro'
    }
    if (priceId === process.env.STRIPE_PRICE_ID_STARTER) {
      return 'starter'
    }
  }
  
  // Default to starter if no matching price found
  return 'starter'
}