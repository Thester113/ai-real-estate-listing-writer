import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase'
import { validateRequest, secureJsonResponse, checkRateLimit, getTokenLimit } from '@/lib/security'
import { trackServerEvent } from '@/lib/analytics'
import { getErrorMessage } from '@/lib/utils'
import type { ListingFormData, ListingResult } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return secureJsonResponse({ error: 'Invalid authentication' }, 401)
    }

    // Get user profile and usage
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return secureJsonResponse({ error: 'User profile not found' }, 404)
    }

    // Get current usage
    const { data: usage, error: usageError } = await (supabaseAdmin as any)
      .rpc('get_or_create_usage', { user_uuid: user.id })

    if (usageError) {
      console.error('Usage check failed:', usageError)
      return secureJsonResponse({ error: 'Unable to check usage limits' }, 500)
    }

    // Check rate limits
    if (!checkRateLimit(profile.plan, usage, 'daily')) {
      return secureJsonResponse({ 
        error: 'Daily generation limit reached',
        message: `Upgrade to ${profile.plan === 'starter' ? 'Pro' : 'Enterprise'} for more generations`
      }, 429)
    }

    // Parse request body
    const body = await request.json()
    const {
      propertyType,
      bedrooms,
      bathrooms,
      squareFeet,
      features,
      location,
      targetAudience,
      priceRange,
      additionalDetails
    }: ListingFormData = body

    // Validate required fields
    if (!propertyType || !bedrooms || !bathrooms || !features || !location || !targetAudience) {
      return secureJsonResponse({ 
        error: 'Missing required fields: propertyType, bedrooms, bathrooms, features, location, targetAudience' 
      }, 400)
    }

    // Build the prompt for OpenAI
    const prompt = buildListingPrompt({
      propertyType,
      bedrooms,
      bathrooms,
      squareFeet,
      features,
      location,
      targetAudience,
      priceRange,
      additionalDetails
    })

    // Generate listing with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional real estate copywriter specializing in creating compelling property listings that attract buyers and generate leads. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: getTokenLimit(profile.plan),
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    let result: ListingResult
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      throw new Error('Invalid response format from AI')
    }

    // Calculate word count
    const wordCount = countWords(result)

    // Save generation to database
    const { error: saveError } = await supabaseAdmin
      .from('generations')
      .insert({
        user_id: user.id,
        prompt: JSON.stringify(body),
        result: result,
        word_count: wordCount,
        metadata: {
          model: 'gpt-4o-mini',
          tokens_used: completion.usage?.total_tokens || 0,
          plan: profile.plan
        }
      })

    if (saveError) {
      console.error('Failed to save generation:', saveError)
      // Don't fail the request, just log the error
    }

    // Update usage
    const { error: usageUpdateError } = await (supabaseAdmin as any)
      .rpc('increment_usage', {
        user_uuid: user.id,
        listings_delta: 1,
        words_delta: wordCount
      })

    if (usageUpdateError) {
      console.error('Failed to update usage:', usageUpdateError)
      // Don't fail the request, just log the error
    }

    // Track analytics
    trackServerEvent('listing_generated', {
      user_id: user.id,
      plan: profile.plan,
      property_type: propertyType,
      word_count: wordCount,
      features_count: features.length
    })

    return secureJsonResponse({
      success: true,
      data: result,
      meta: {
        wordCount,
        tokensUsed: completion.usage?.total_tokens || 0,
        remainingGenerations: getRemainingGenerations(profile.plan, usage)
      }
    })

  } catch (error) {
    console.error('Listing generation error:', error)
    
    return secureJsonResponse({
      success: false,
      error: getErrorMessage(error),
      message: 'Failed to generate listing'
    }, 500)
  }
}

function buildListingPrompt(data: ListingFormData): string {
  const {
    propertyType,
    bedrooms,
    bathrooms,
    squareFeet,
    features,
    location,
    targetAudience,
    priceRange,
    additionalDetails
  } = data

  return `Create a compelling real estate listing for the following property:

Property Details:
- Type: ${propertyType}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
${squareFeet ? `- Square Feet: ${squareFeet.toLocaleString()}` : ''}
- Location: ${location}
- Key Features: ${features.join(', ')}
${priceRange ? `- Price Range: $${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()}` : ''}
${additionalDetails ? `- Additional Details: ${additionalDetails}` : ''}

Target Audience: ${targetAudience}

Please create a professional real estate listing with the following structure:
{
  "title": "Compelling headline (under 80 characters)",
  "description": "Main description paragraph (150-250 words) that tells a story and creates emotional connection",
  "highlights": ["Key feature 1", "Key feature 2", "Key feature 3", "Key feature 4", "Key feature 5"],
  "marketingPoints": ["Unique selling point 1", "Unique selling point 2", "Unique selling point 3"],
  "callToAction": "Compelling call-to-action that encourages immediate action"
}

Guidelines:
- Write for ${targetAudience} specifically
- Use emotional language that helps buyers envision living there
- Highlight unique features and benefits
- Include lifestyle benefits, not just features
- Make it scannable with good flow
- Avoid generic phrases like "must see" or "won't last long"
- Focus on what makes this property special
- Use active voice and descriptive language`
}

function countWords(result: ListingResult): number {
  const text = `${result.title} ${result.description} ${result.highlights.join(' ')} ${result.marketingPoints.join(' ')} ${result.callToAction}`
  return text.split(/\s+/).length
}

function getRemainingGenerations(plan: 'starter' | 'pro', usage: any): number {
  const limits = {
    starter: 20, // monthly
    pro: 500
  }
  
  return Math.max(0, limits[plan] - (usage?.listings_generated || 0))
}