import { NextRequest, NextResponse } from 'next/server'
import { subscribeToConvertKit, addTagsToSubscriber, getUserTags } from '@/lib/convertkit'

// Map lead magnet tags to Kit form IDs (for incentive email delivery)
// Set these in your .env.local after creating forms in Kit dashboard
const LEAD_MAGNET_FORM_IDS: Record<string, string | undefined> = {
  'Listing Templates': process.env.KIT_FORM_LISTING_TEMPLATES,
  'SEO Checklist': process.env.KIT_FORM_SEO_CHECKLIST,
  'Words That Sell': process.env.KIT_FORM_WORDS_THAT_SELL,
  'AI Listing Guide': process.env.KIT_FORM_AI_LISTING_GUIDE,
}

// Fallback: Direct download URLs (used if Kit form IDs not configured)
const DOWNLOAD_MAP: Record<string, string> = {
  'Listing Templates': '/downloads/listing-templates.pdf',
  'SEO Checklist': '/downloads/seo-checklist.pdf',
  'Words That Sell': '/downloads/words-that-sell.pdf',
  'AI Listing Guide': '/downloads/ai-listing-guide.pdf',
}

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

    const { email, firstName, plan, subscriptionStatus, action, tags: requestTags } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get appropriate tags based on user status
    const userTags = getUserTags(plan || 'starter', subscriptionStatus)

    // Merge with any tags sent from the request (e.g., lead magnet tags)
    const allTags = requestTags ? [...userTags, ...requestTags] : userTags

    // Check if this is a lead magnet request with a specific Kit form
    let leadMagnetFormId: string | undefined
    let leadMagnetTag: string | undefined
    if (requestTags && Array.isArray(requestTags)) {
      for (const tag of requestTags) {
        if (LEAD_MAGNET_FORM_IDS[tag]) {
          leadMagnetFormId = LEAD_MAGNET_FORM_IDS[tag]
          leadMagnetTag = tag
          break
        }
      }
    }

    let result

    if (action === 'tag') {
      // Just add tags to existing subscriber
      result = await addTagsToSubscriber(email, allTags)
    } else {
      // Subscribe new user - use lead magnet form if available (Kit sends incentive email)
      result = await subscribeToConvertKit({
        email,
        firstName,
        tags: allTags,
        formId: leadMagnetFormId, // Uses lead magnet form for incentive delivery
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

    // Determine download delivery method
    let downloadUrl: string | null = null
    let deliveryMethod: 'kit_email' | 'direct_download' | null = null

    if (leadMagnetFormId && leadMagnetTag) {
      // Kit will send the PDF via incentive email
      deliveryMethod = 'kit_email'
    } else if (requestTags && Array.isArray(requestTags)) {
      // Fallback: provide direct download URL
      for (const tag of requestTags) {
        if (DOWNLOAD_MAP[tag]) {
          downloadUrl = DOWNLOAD_MAP[tag]
          deliveryMethod = 'direct_download'
          break
        }
      }
    }

    return NextResponse.json({
      success: true,
      subscriber: result.subscriber,
      downloadUrl,
      deliveryMethod
    })
  } catch (error) {
    console.error('ConvertKit subscribe route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}