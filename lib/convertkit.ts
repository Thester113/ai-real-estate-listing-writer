// ConvertKit API integration for email marketing
const CONVERTKIT_API_KEY = process.env.CONVERTKIT_API_KEY
const CONVERTKIT_API_SECRET = process.env.CONVERTKIT_API_SECRET
const CONVERTKIT_FORM_ID = process.env.CONVERTKIT_FORM_ID
const CONVERTKIT_API_URL = 'https://api.convertkit.com/v3'

export interface ConvertKitSubscriber {
  email: string
  firstName?: string
  tags?: string[]
  customFields?: Record<string, string>
}

export interface ConvertKitResponse {
  success: boolean
  subscriber?: {
    id: number
    email: string
    first_name: string
    state: string
    created_at: string
  }
  error?: string
}

/**
 * Subscribe a user to ConvertKit
 */
export async function subscribeToConvertKit({
  email,
  firstName,
  tags = [],
  customFields = {}
}: ConvertKitSubscriber): Promise<ConvertKitResponse> {
  if (!CONVERTKIT_API_KEY || !CONVERTKIT_FORM_ID) {
    console.error('ConvertKit: Missing API key or form ID')
    return { success: false, error: 'ConvertKit not configured' }
  }

  try {
    console.log('📧 ConvertKit: Subscribing email:', email)
    
    const response = await fetch(`${CONVERTKIT_API_URL}/forms/${CONVERTKIT_FORM_ID}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: CONVERTKIT_API_KEY,
        email,
        first_name: firstName,
        tags: tags.join(','),
        fields: customFields
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('ConvertKit: Subscription failed:', data)
      return { 
        success: false, 
        error: data.message || `HTTP ${response.status}` 
      }
    }

    console.log('✅ ConvertKit: Successfully subscribed:', email)
    return {
      success: true,
      subscriber: data.subscription
    }
  } catch (error) {
    console.error('ConvertKit: API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Add tags to an existing subscriber
 */
export async function addTagsToSubscriber(email: string, tags: string[]): Promise<ConvertKitResponse> {
  if (!CONVERTKIT_API_KEY || tags.length === 0) {
    return { success: false, error: 'Missing API key or tags' }
  }

  try {
    console.log('🏷️ ConvertKit: Adding tags to', email, ':', tags)
    
    const response = await fetch(`${CONVERTKIT_API_URL}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: CONVERTKIT_API_KEY,
        email,
        tags: tags.join(',')
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('ConvertKit: Adding tags failed:', data)
      return { success: false, error: data.message || `HTTP ${response.status}` }
    }

    console.log('✅ ConvertKit: Successfully added tags to:', email)
    return { success: true }
  } catch (error) {
    console.error('ConvertKit: Add tags error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Tag user based on their subscription status
 */
export function getUserTags(plan: string, subscriptionStatus?: string): string[] {
  const tags: string[] = []
  
  if (plan === 'pro') {
    tags.push('Pro Customer')
  } else {
    tags.push('Free User')
  }
  
  if (subscriptionStatus === 'active') {
    tags.push('Active Subscriber')
  } else if (subscriptionStatus === 'canceled') {
    tags.push('Canceled Subscriber')
  }
  
  tags.push('PropertyWriter User')
  
  return tags
}