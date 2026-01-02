import { NextRequest, NextResponse } from 'next/server'
import { secureJsonResponse } from '@/lib/security'
import { trackServerEvent } from '@/lib/analytics-server'
import { getErrorMessage } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase-client'

export async function POST(request: NextRequest) {
  try {
    // Basic validation - rate limiting handled by middleware

    // Parse request body
    const body = await request.json()
    const { email } = body

    if (!email) {
      return secureJsonResponse({ 
        error: 'Email address is required' 
      }, 400)
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return secureJsonResponse({ 
        error: 'Please provide a valid email address' 
      }, 400)
    }

    // Subscribe to ConvertKit
    const convertKitApiKey = process.env.CONVERTKIT_API_KEY
    const convertKitFormId = process.env.CONVERTKIT_FORM_ID

    if (!convertKitApiKey || !convertKitFormId) {
      console.error('ConvertKit credentials not configured')
      return secureJsonResponse({ 
        error: 'Newsletter signup is not available at the moment' 
      }, 500)
    }

    const convertKitResponse = await fetch(`https://api.convertkit.com/v3/forms/${convertKitFormId}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: convertKitApiKey,
        email: email,
        tags: ['blog_subscriber', 'real_estate_marketing']
      })
    })

    const convertKitData = await convertKitResponse.json()

    if (!convertKitResponse.ok) {
      console.error('ConvertKit API error:', convertKitData)
      
      // Handle duplicate subscription gracefully
      if (convertKitData.message && convertKitData.message.includes('already subscribed')) {
        return secureJsonResponse({
          success: true,
          message: 'You are already subscribed to our newsletter!'
        })
      }

      throw new Error(convertKitData.message || 'Failed to subscribe to newsletter')
    }

    // Store in Supabase for local backup/analytics
    const { error: dbError } = await supabaseAdmin
      .from('email_subscribers')
      .upsert(
        { email, subscribed: true },
        { onConflict: 'email' }
      )

    if (dbError) {
      // Log but don't fail - ConvertKit is the primary source
      console.error('Failed to save subscriber to database:', dbError)
    }

    // Track successful newsletter signup
    trackServerEvent('newsletter_subscribed', {
      email,
      source: 'blog_page',
      timestamp: new Date().toISOString()
    })

    return secureJsonResponse({
      success: true,
      message: 'Successfully subscribed to newsletter! Check your email for confirmation.'
    })

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    
    return secureJsonResponse({
      success: false,
      error: getErrorMessage(error),
      message: 'Failed to subscribe to newsletter'
    }, 500)
  }
}