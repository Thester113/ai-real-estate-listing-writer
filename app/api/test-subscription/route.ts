import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { getStripeConfig } from '@/lib/stripe-config'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json()
    
    if (!customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 })
    }
    
    console.log('🔍 Testing subscription lookup for customer:', customerId)
    
    // Test the same lookup logic as the webhook
    let { data: profile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    const lookupResult = {
      found: !!profile,
      error: findError?.message,
      customerId: (profile as any)?.customer_id,
      currentPlan: (profile as any)?.plan,
      subscriptionStatus: (profile as any)?.subscription_status,
      subscriptionId: (profile as any)?.subscription_id
    }
    
    console.log('👤 Initial lookup result:', lookupResult)

    if (findError || !profile) {
      console.log('❌ User not found for customer:', customerId, 'Error:', findError?.message)
      
      // Try to find by email from Stripe customer data as fallback
      try {
        const config = getStripeConfig()
        const stripe = new Stripe(config.secretKey, { apiVersion: '2023-10-16' })
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
          
          return NextResponse.json({
            success: true,
            initialLookup: lookupResult,
            stripeCustomer: {
              email: customerEmail,
              found: !!profileByEmail,
              updated: !!profileByEmail
            },
            finalProfile: profile
          })
        }
        
      } catch (stripeError) {
        console.error('❌ Could not retrieve Stripe customer:', stripeError)
        return NextResponse.json({
          success: false,
          initialLookup: lookupResult,
          stripeError: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      initialLookup: lookupResult,
      profile: profile
    })
    
  } catch (error) {
    console.error('Test subscription error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}