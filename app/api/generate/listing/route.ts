import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ListingFormData {
  propertyType: string
  bedrooms: number
  bathrooms: number
  squareFeet: number | null
  features: string[]
  location: string
  targetAudience: string
  priceRange: {
    min: number
    max: number
  } | null
  additionalDetails: string
  // Pro features
  listingStyle?: string
  tone?: string
  wordCount?: string
  includeKeywords?: boolean
  customKeywords?: string
}

interface ListingResult {
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
}

async function generatePropertyListing(formData: ListingFormData): Promise<ListingResult> {
  const {
    propertyType,
    bedrooms,
    bathrooms,
    squareFeet,
    features,
    location,
    targetAudience,
    priceRange,
    additionalDetails,
    listingStyle = 'standard',
    tone = 'professional',
    wordCount = 'standard',
    includeKeywords = false,
    customKeywords = ''
  } = formData

  const featuresText = features?.length > 0 ? features.join(', ') : 'No specific features mentioned'
  const priceText = priceRange ? `$${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()}` : 'Price upon request'
  const squareFeetText = squareFeet ? `${squareFeet} square feet` : 'Square footage not specified'

  // Build style-specific instructions
  let styleInstructions = ''
  switch (listingStyle) {
    case 'luxury':
      styleInstructions = 'Focus on sophistication, premium amenities, and exclusive lifestyle. Use elegant language and emphasize prestige.'
      break
    case 'investment':
      styleInstructions = 'Emphasize ROI potential, rental income, appreciation prospects, and investment benefits. Include market analysis language.'
      break
    case 'family':
      styleInstructions = 'Focus on family life, safety, community, schools, and creating memories. Use warm, emotional language.'
      break
    case 'modern':
      styleInstructions = 'Highlight contemporary design, smart home features, cutting-edge amenities, and sleek aesthetics.'
      break
    case 'traditional':
      styleInstructions = 'Emphasize classic charm, timeless features, character, and enduring appeal.'
      break
    default:
      styleInstructions = 'Use a balanced, professional approach that appeals to a broad audience.'
  }

  // Build tone instructions
  let toneInstructions = ''
  switch (tone) {
    case 'conversational':
      toneInstructions = 'Write in a friendly, approachable tone as if speaking directly to a friend.'
      break
    case 'upscale':
      toneInstructions = 'Use sophisticated, refined language that conveys luxury and exclusivity.'
      break
    case 'warm':
      toneInstructions = 'Create a welcoming, cozy feeling with emotionally resonant language.'
      break
    case 'energetic':
      toneInstructions = 'Use dynamic, exciting language that creates enthusiasm and momentum.'
      break
    case 'authoritative':
      toneInstructions = 'Write with confidence and expertise, establishing credibility and trust.'
      break
    default:
      toneInstructions = 'Maintain a professional, balanced tone.'
  }

  // Determine word count range
  let wordCountRange = '150-200 words'
  let maxTokens = 1200
  switch (wordCount) {
    case 'detailed':
      wordCountRange = '250-350 words'
      maxTokens = 1800
      break
    case 'extensive':
      wordCountRange = '400-500 words'
      maxTokens = 2500
      break
  }

  // Build keywords instruction
  let keywordsInstruction = ''
  if (includeKeywords && customKeywords) {
    keywordsInstruction = `\n\nSEO Keywords to naturally integrate: ${customKeywords}\nWeave these keywords naturally into the content without making it feel forced or spammy.`
  }

  const prompt = `You are a professional real estate copywriter. Create a compelling property listing for the following property:

Property Details:
- Type: ${propertyType}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Size: ${squareFeetText}
- Location: ${location}
- Price Range: ${priceText}
- Target Audience: ${targetAudience}
- Features: ${featuresText}
- Additional Details: ${additionalDetails || 'None provided'}

STYLE: ${styleInstructions}
TONE: ${toneInstructions}
LENGTH: ${wordCountRange}${keywordsInstruction}

Create a listing with the following structure. Return ONLY valid JSON in this exact format:

{
  "title": "An attention-grabbing title (max 80 characters)",
  "description": "A compelling description that tells a story and highlights the lifestyle this property offers (${wordCountRange})",
  "highlights": ["5-7 key bullet points highlighting the best features", "Each should be concise and benefit-focused", "Use action words and emotional language"],
  "marketingPoints": ["3-5 unique selling propositions", "What makes this property special", "Why someone should choose this over others"],
  "callToAction": "An urgent, compelling call-to-action that encourages immediate contact"
}

Guidelines:
- ${toneInstructions}
- ${styleInstructions}
- Focus on benefits and lifestyle, not just features
- Use vivid, descriptive language that helps buyers visualize living there
- Make it scannable with good flow
- Avoid generic phrases like "don't miss out" 
- Be specific to this property and location
- Target the specified audience
- Create urgency without being pushy`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: maxTokens,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    // Parse the JSON response
    const result = JSON.parse(content) as ListingResult
    
    // Validate required fields
    if (!result.title || !result.description || !result.highlights || !result.marketingPoints || !result.callToAction) {
      throw new Error('Missing required fields in generated content')
    }

    return result
  } catch (error) {
    console.error('OpenAI generation failed:', error)
    
    // Fallback to a professional template if OpenAI fails
    return {
      title: `${bedrooms}BR/${bathrooms}BA ${propertyType} in ${location}`,
      description: `Discover this exceptional ${propertyType.toLowerCase()} offering ${bedrooms} bedrooms and ${bathrooms} bathrooms in the desirable ${location} area. This property combines modern comfort with thoughtful design, creating the perfect space for your lifestyle. ${additionalDetails || 'Schedule your viewing today to experience all this home has to offer.'}`,
      highlights: [
        `${bedrooms} well-appointed bedrooms`,
        `${bathrooms} bathrooms with modern fixtures`,
        `Prime ${location} location`,
        ...(features?.slice(0, 4) || ['Move-in ready condition'])
      ],
      marketingPoints: [
        `Desirable ${location} neighborhood`,
        'Modern amenities and finishes',
        'Perfect for your lifestyle needs'
      ],
      callToAction: 'Contact us today to schedule your private showing!'
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 Generation API called!')
  
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    console.log('🔑 Auth header exists:', !!authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('📦 Parsing request body...')
    const body = await request.json()
    console.log('📦 Body received:', { 
      propertyType: body.propertyType, 
      location: body.location,
      features: body.features?.length 
    })

    // Generate production-ready listing
    const result = await generatePropertyListing(body)
    const wordCount = countWords(result)

    console.log('✅ Listing generation successful')

    // Extract user ID from token for database saving
    const token = authHeader.substring(7)
    let userId = null
    
    try {
      console.log('🔍 Getting user ID from token...')
      const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (userData?.user) {
        userId = userData.user.id
        console.log('👤 User ID found:', userId)
      }
    } catch (error) {
      console.log('⚠️ Could not get user ID, skipping database save:', error)
    }

    // Save to database if we have user ID
    if (userId) {
      try {
        console.log('💾 Saving generation to database for user:', userId)
        console.log('💾 Generation data:', {
          user_id: userId,
          title: result.title,
          word_count: 50
        })

        const { data: insertResult, error: saveError } = await (supabaseAdmin as any)
          .from('generations')
          .insert({
            user_id: userId,
            result: result,
            word_count: wordCount,
            metadata: {
              model: 'gpt-4o',
              tokens_used: Math.ceil(wordCount * 1.3),
              plan: 'starter'
            }
          })
          .select('*')

        if (saveError) {
          console.error('❌ Failed to save generation:', saveError)
          console.error('❌ Error details:', {
            code: saveError.code,
            message: saveError.message,
            details: saveError.details,
            hint: saveError.hint
          })
        } else {
          console.log('✅ Generation saved to database successfully!')
          console.log('✅ Saved data:', insertResult)
          
          // Update usage stats
          try {
            const { incrementUsage } = await import('@/lib/supabase-client')
            await incrementUsage(userId, 1, wordCount)
            console.log('✅ Usage stats updated successfully!')
          } catch (usageError) {
            console.error('⚠️ Failed to update usage stats:', usageError)
          }
        }
      } catch (error) {
        console.error('❌ Database save exception:', error)
      }
    } else {
      console.log('⚠️ No user ID available, cannot save to database')
    }

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        wordCount: wordCount,
        tokensUsed: Math.ceil(wordCount * 1.3),
        remainingGenerations: 19
      }
    })

  } catch (error) {
    console.error('💥 Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to generate listing'
    }, { status: 500 })
  }
}

function countWords(result: ListingResult): number {
  const text = `${result.title} ${result.description} ${result.highlights.join(' ')} ${result.marketingPoints.join(' ')} ${result.callToAction}`
  return text.split(/\s+/).length
}