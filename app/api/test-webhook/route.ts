import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    // Test the exact same logic as the webhook
    const customerId = 'cus_TffFNN2cBn5eWy' // From your webhook data
    
    console.log('Testing webhook logic with customer ID:', customerId)
    
    // Find user by customer ID (same logic as webhook)
    const { data: profile, error: findError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (findError || !profile) {
      return NextResponse.json({
        success: false,
        error: 'User not found for customer: ' + customerId,
        findError: findError?.message,
        profile
      })
    }

    // Try to update user profile (same logic as webhook)
    const { error: updateError } = await (supabaseAdmin as any)
      .from('profiles')
      .update({
        subscription_id: 'sub_1SiKBBA7E1wLzQE1PDCapjTG',
        subscription_status: 'active',
        plan: 'pro',
        current_period_end: new Date(1769369193 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile',
        updateError: updateError.message,
        profile
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}