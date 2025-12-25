import { NextRequest, NextResponse } from 'next/server'
import { subscribeToConvertKit, addTagsToSubscriber, getUserTags } from '@/lib/convertkit'

export async function POST(request: NextRequest) {
  try {
    // Debug environment variables
    console.log('🔧 Debug ConvertKit env vars:', {
      hasApiKey: !!process.env.CONVERTKIT_API_KEY,
      hasApiSecret: !!process.env.CONVERTKIT_API_SECRET,
      hasFormId: !!process.env.CONVERTKIT_FORM_ID,
      apiKeyFirst4: process.env.CONVERTKIT_API_KEY?.substring(0, 4),
      secretFirst4: process.env.CONVERTKIT_API_SECRET?.substring(0, 4),
      formId: process.env.CONVERTKIT_FORM_ID
    })

    const { email, firstName, plan, subscriptionStatus, action } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get appropriate tags based on user status
    const tags = getUserTags(plan || 'starter', subscriptionStatus)

    let result
    
    if (action === 'tag') {
      // Just add tags to existing subscriber
      result = await addTagsToSubscriber(email, tags)
    } else {
      // Subscribe new user
      result = await subscribeToConvertKit({
        email,
        firstName,
        tags,
        customFields: {
          plan: plan || 'starter',
          subscription_status: subscriptionStatus || 'none',
          signup_date: new Date().toISOString()
        }
      })
    }

    if (!result.success) {
      console.error('ConvertKit API error:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to process subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscriber: result.subscriber
    })
  } catch (error) {
    console.error('ConvertKit subscribe route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}