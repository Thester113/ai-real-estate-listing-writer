import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-client'
import { getErrorMessage } from '@/lib/utils'
import type { ListingFormData, ListingResult } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-test-key'
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Generation API called')

    // Get user session using the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No authorization header')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log('🔑 Token received:', token.substring(0, 20) + '...')
    
    // Try to get user with the access token
    let user
    try {
      const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
      console.log('👤 Auth result:', { user: userData?.user?.id, error: authError?.message })
      
      if (authError || !userData?.user) {
        console.log('❌ Auth failed:', authError)
        return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
      }
      user = userData.user
    } catch (error) {
      console.error('💥 Auth error:', error)
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get user profile and usage
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('👤 Profile lookup:', { profile: profile?.id, error: profileError?.message })

    let userProfile: any

    if (profileError || !profile) {
      console.log('❌ Profile not found, creating one')
      // Try to create profile if it doesn't exist
      const { data: newProfile, error: createError } = await (supabaseAdmin as any)
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          plan: 'starter'
        })
        .select('*')
        .single()
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError)
        return NextResponse.json({ error: 'User profile setup failed' }, { status: 500 })
      }
      
      console.log('✅ Profile created:', newProfile.id)
      userProfile = newProfile
    } else {
      console.log('✅ Profile found:', profile.id)
      userProfile = profile as any
    }

    // For now, skip usage checks to get basic functionality working
    console.log('✅ Skipping usage checks for testing')

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
      return NextResponse.json({ 
        error: 'Missing required fields: propertyType, bedrooms, bathrooms, features, location, targetAudience' 
      }, { status: 400 })
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

    // Generate listing - use mock data for testing since no OpenAI key
    console.log('🤖 Generating mock listing for testing')
    
    const result: ListingResult = {
      title: `Beautiful ${bedrooms}BR/${bathrooms}BA ${propertyType} in ${location}`,
      description: `Discover this stunning ${propertyType.toLowerCase()} perfect for ${targetAudience.toLowerCase()}. This ${bedrooms}-bedroom, ${bathrooms}-bathroom home features ${features.slice(0, 3).join(', ')} and more. Located in the heart of ${location}, you'll enjoy convenient access to local amenities while living in a peaceful neighborhood setting. ${additionalDetails || 'This property offers the perfect blend of comfort, style, and location.'}`,
      highlights: [
        `${bedrooms} spacious bedrooms`,
        `${bathrooms} well-appointed bathrooms`,
        `${squareFeet ? `${squareFeet.toLocaleString()} square feet` : 'Generous living space'}`,
        ...features.slice(0, 2)
      ],
      marketingPoints: [
        `Perfect for ${targetAudience.toLowerCase()}`,
        `Prime ${location} location`,
        `Move-in ready condition`
      ],
      callToAction: `Don't miss this incredible opportunity! Schedule your showing today and make this ${propertyType.toLowerCase()} your new home.`
    }

    // Calculate word count
    const wordCount = countWords(result)

    // Save generation to database
    const { error: saveError } = await (supabaseAdmin as any)
      .from('generations')
      .insert({
        user_id: user.id,
        result: result,
        word_count: wordCount,
        metadata: {
          model: 'mock-gpt-4o-mini',
          tokens_used: 250,
          plan: 'starter'
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

    // Skip analytics for now
    console.log('✅ Generation successful, skipping analytics')

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        wordCount,
        tokensUsed: 250, // Mock value
        remainingGenerations: 19 // Fixed for testing
      }
    })

  } catch (error) {
    console.error('💥 Listing generation error:', error)
    
    return NextResponse.json({
      success: false,
      error: getErrorMessage(error),
      message: 'Failed to generate listing'
    }, { status: 500 })
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

// Simplified for testing - remove this function since we're not using it