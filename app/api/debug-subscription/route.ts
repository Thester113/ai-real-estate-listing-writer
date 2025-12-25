import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const customerId = url.searchParams.get('customer_id')
    const email = url.searchParams.get('email')
    
    if (!customerId && !email) {
      return NextResponse.json({
        error: 'Please provide either customer_id or email parameter'
      }, { status: 400 })
    }
    
    console.log('🔍 Debug subscription lookup for:', { customerId, email })
    
    // Find user by customer ID
    let profile = null
    let findError = null
    
    if (customerId) {
      const result = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('customer_id', customerId)
        .single()
      
      profile = result.data
      findError = result.error
    } else if (email) {
      const result = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()
      
      profile = result.data
      findError = result.error
    }
    
    console.log('👤 Profile lookup result:', {
      found: !!profile,
      error: findError?.message,
      profileId: profile?.id,
      plan: profile?.plan,
      subscriptionStatus: profile?.subscription_status,
      customerId: profile?.customer_id
    })
    
    // Also check recent webhook events
    const { data: recentEvents } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('📝 Recent webhook events:', recentEvents?.length || 0)
    
    return NextResponse.json({
      success: true,
      profile: profile || null,
      error: findError?.message || null,
      recentWebhookEvents: recentEvents?.map(event => ({
        type: event.type,
        created_at: event.created_at,
        customer_id: (event.data as any)?.object?.customer
      })) || []
    })
    
  } catch (error) {
    console.error('Debug subscription error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}