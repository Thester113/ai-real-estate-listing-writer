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
    listingStyle,
    tone,
    wordCount,
    includeKeywords,
    customKeywords
  } = formData

  // Apply defaults AFTER destructuring so we can see what was sent
  const finalListingStyle = listingStyle || 'standard'
  const finalTone = tone || 'professional'
  const finalWordCount = wordCount || 'standard'
  const finalIncludeKeywords = includeKeywords || false
  const finalCustomKeywords = customKeywords || ''

  console.log('🔍 Raw values from frontend:', { listingStyle, tone, wordCount })
  console.log('✅ Final values after defaults:', {
    finalListingStyle,
    finalTone,
    finalWordCount
  })

  const featuresText = features?.length > 0 ? features.join(', ') : 'No specific features mentioned'
  const priceText = priceRange ? `$${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()}` : 'Price upon request'
  const squareFeetText = squareFeet ? `${squareFeet} square feet` : 'Square footage not specified'

  // Build style-specific instructions
  let styleInstructions = ''
  switch (finalListingStyle) {
    case 'luxury':
      styleInstructions = 'CRITICAL: This is a luxury listing. Use sophisticated, premium language. Emphasize exclusivity, prestige, high-end amenities, and elite lifestyle. Avoid common words - use elevated vocabulary like "exquisite", "bespoke", "curated", "distinguished".'
      break
    case 'investment':
      styleInstructions = 'CRITICAL: This is an investment-focused listing. Lead with ROI potential, rental income projections, appreciation prospects, market analysis, and cap rate. Use financial terminology. Emphasize numbers and returns.'
      break
    case 'family':
      styleInstructions = 'CRITICAL: This is a family-oriented listing. Focus heavily on safety, community, schools, parks, family gatherings, creating memories. Use warm, emotional language. Paint pictures of family life here.'
      break
    case 'modern':
      styleInstructions = 'CRITICAL: This is a modern contemporary listing. Emphasize cutting-edge design, smart home technology, minimalist aesthetics, clean lines, innovative features. Use terms like "sleek", "contemporary", "state-of-the-art".'
      break
    case 'traditional':
      styleInstructions = 'CRITICAL: This is a traditional/classic listing. Highlight timeless architecture, enduring appeal, craftsmanship, character, classic design elements. Use words like "timeless", "elegant", "graceful", "heritage".'
      break
    default:
      styleInstructions = 'Use a balanced, professional approach that appeals to a broad audience.'
  }

  // Build tone instructions
  let toneInstructions = ''
  switch (finalTone) {
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
  switch (finalWordCount) {
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
  if (finalIncludeKeywords && finalCustomKeywords) {
    keywordsInstruction = `\n\nSEO Keywords to naturally integrate: ${finalCustomKeywords}\nWeave these keywords naturally into the content without making it feel forced or spammy.`
  }

  // Log the calculated settings
  console.log('📐 Generation Settings:', {
    styleInstructions: styleInstructions.substring(0, 50) + '...',
    toneInstructions: toneInstructions.substring(0, 50) + '...',
    wordCountRange,
    maxTokens,
    hasKeywords: !!keywordsInstruction
  })

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
  "description": "A compelling description that tells a story and highlights the lifestyle this property offers. MANDATORY LENGTH: EXACTLY ${wordCountRange}. Count your words carefully - this is critical.",
  "highlights": ["5-7 key bullet points highlighting the best features", "Each should be concise and benefit-focused", "Use action words and emotional language"],
  "marketingPoints": ["3-5 unique selling propositions", "What makes this property special", "Why someone should choose this over others"],
  "callToAction": "An urgent, compelling call-to-action that encourages immediate contact"
}

Guidelines:
- WORD COUNT REQUIREMENT: The description MUST be ${wordCountRange}. This is non-negotiable.
- If you're writing a ${finalWordCount} listing, make it ${wordCountRange} - not shorter, not longer.
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
      temperature: 0.8,  // Increased for more variation between styles/tones
      max_tokens: maxTokens,
      response_format: { type: "json_object" }  // Ensure JSON response without markdown
    })

    console.log('🤖 OpenAI Response:', {
      model: 'gpt-4o',
      tokensUsed: completion.usage?.total_tokens,
      finishReason: completion.choices[0]?.finish_reason
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

    // Input validation
    const requiredFields = ['propertyType', 'bedrooms', 'bathrooms', 'location', 'targetAudience']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 })
      }
    }

    // Type and range validation
    if (typeof body.bedrooms !== 'number' || body.bedrooms < 0 || body.bedrooms > 50) {
      return NextResponse.json({
        success: false,
        error: 'Bedrooms must be a number between 0 and 50'
      }, { status: 400 })
    }

    if (typeof body.bathrooms !== 'number' || body.bathrooms < 0 || body.bathrooms > 50) {
      return NextResponse.json({
        success: false,
        error: 'Bathrooms must be a number between 0 and 50'
      }, { status: 400 })
    }

    if (body.squareFeet && (typeof body.squareFeet !== 'number' || body.squareFeet < 0 || body.squareFeet > 1000000)) {
      return NextResponse.json({
        success: false,
        error: 'Square feet must be a number between 0 and 1,000,000'
      }, { status: 400 })
    }

    // String length validation
    if (typeof body.propertyType !== 'string' || body.propertyType.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Property type must be a string (max 100 characters)'
      }, { status: 400 })
    }

    if (typeof body.location !== 'string' || body.location.length > 200) {
      return NextResponse.json({
        success: false,
        error: 'Location must be a string (max 200 characters)'
      }, { status: 400 })
    }

    if (typeof body.targetAudience !== 'string' || body.targetAudience.length > 200) {
      return NextResponse.json({
        success: false,
        error: 'Target audience must be a string (max 200 characters)'
      }, { status: 400 })
    }

    if (body.additionalDetails && (typeof body.additionalDetails !== 'string' || body.additionalDetails.length > 2000)) {
      return NextResponse.json({
        success: false,
        error: 'Additional details must be a string (max 2000 characters)'
      }, { status: 400 })
    }

    // Features validation
    if (body.features && (!Array.isArray(body.features) || body.features.length > 50)) {
      return NextResponse.json({
        success: false,
        error: 'Features must be an array (max 50 items)'
      }, { status: 400 })
    }

    if (body.customKeywords && (typeof body.customKeywords !== 'string' || body.customKeywords.length > 500)) {
      return NextResponse.json({
        success: false,
        error: 'Custom keywords must be a string (max 500 characters)'
      }, { status: 400 })
    }

    console.log('📦 Body received:', {
      propertyType: body.propertyType,
      location: body.location,
      features: body.features?.length
    })

    console.log('🎨 Pro Features Received:', {
      listingStyle: body.listingStyle,
      tone: body.tone,
      wordCount: body.wordCount,
      includeKeywords: body.includeKeywords,
      customKeywords: body.customKeywords
    })

    // Extract user ID from token FIRST for validation
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
      console.log('⚠️ Could not get user ID, skipping validation:', error)
    }

    // Get user's profile to check plan and usage
    let userPlan: 'starter' | 'pro' = 'starter'
    let currentUsage = 0
    let monthlyLimit = 20

    if (userId) {
      try {
        // Get user's profile for plan type
        const { data: profile, error: profileError } = await (supabaseAdmin as any)
          .from('profiles')
          .select('plan')
          .eq('id', userId)
          .single()

        if (profileError) {
          console.error('❌ Failed to get user profile:', profileError)
        } else if (profile) {
          userPlan = profile.plan || 'starter'
          console.log('📊 User plan:', userPlan)
        }

        // Get current month's usage
        const { getUserUsage } = await import('@/lib/supabase-client')
        const usage = await getUserUsage(userId)
        currentUsage = usage?.listings_generated || 0
        console.log('📊 Current usage:', currentUsage)
      } catch (error) {
        console.error('⚠️ Failed to get profile/usage:', error)
      }
    }

    // Check usage limits
    monthlyLimit = userPlan === 'pro' ? 500 : 20

    if (currentUsage >= monthlyLimit) {
      console.log('⛔ User has exceeded their monthly limit')
      return NextResponse.json({
        success: false,
        error: 'Monthly generation limit reached',
        message: `You've used all ${monthlyLimit} generations for this month. ${
          userPlan === 'starter'
            ? 'Upgrade to Pro for 500 generations per month!'
            : 'Your limit will reset next month.'
        }`,
        limitReached: true,
        currentUsage,
        monthlyLimit
      }, { status: 403 })
    }

    console.log(`✅ Usage check passed: ${currentUsage}/${monthlyLimit}`)

    // Validate Pro-only features
    const proFeatures = {
      listingStyle: body.listingStyle,
      tone: body.tone,
      wordCount: body.wordCount,
      includeKeywords: body.includeKeywords,
      customKeywords: body.customKeywords
    }

    // Check if user is trying to use Pro features without Pro plan
    if (userPlan !== 'pro') {
      const restrictedStyles = ['luxury', 'investment', 'family', 'modern', 'traditional']
      const restrictedTones = ['conversational', 'upscale', 'warm', 'energetic', 'authoritative']
      const restrictedWordCounts = ['detailed', 'extensive']

      if (proFeatures.listingStyle && restrictedStyles.includes(proFeatures.listingStyle)) {
        return NextResponse.json({
          success: false,
          error: 'Pro feature required',
          message: `The "${proFeatures.listingStyle}" listing style is a Pro-only feature. Upgrade to Pro to unlock all listing styles.`,
          featureRequired: 'pro'
        }, { status: 403 })
      }

      if (proFeatures.tone && restrictedTones.includes(proFeatures.tone)) {
        return NextResponse.json({
          success: false,
          error: 'Pro feature required',
          message: `The "${proFeatures.tone}" tone is a Pro-only feature. Upgrade to Pro to unlock all tone options.`,
          featureRequired: 'pro'
        }, { status: 403 })
      }

      if (proFeatures.wordCount && restrictedWordCounts.includes(proFeatures.wordCount)) {
        return NextResponse.json({
          success: false,
          error: 'Pro feature required',
          message: 'Extended word counts are a Pro-only feature. Upgrade to Pro for detailed and extensive listings.',
          featureRequired: 'pro'
        }, { status: 403 })
      }

      if (proFeatures.includeKeywords && proFeatures.customKeywords) {
        return NextResponse.json({
          success: false,
          error: 'Pro feature required',
          message: 'SEO keyword optimization is a Pro-only feature. Upgrade to Pro to include custom keywords.',
          featureRequired: 'pro'
        }, { status: 403 })
      }

      // If any Pro features were sent but user is on Starter, strip them out
      body.listingStyle = 'standard'
      body.tone = 'professional'
      body.wordCount = 'standard'
      body.includeKeywords = false
      body.customKeywords = ''

      console.log('⚠️ Stripped Pro features from Starter user request')
    }

    console.log('✅ Pro features validation passed')

    // NOW generate the listing after all validation has passed
    const result = await generatePropertyListing(body)
    const wordCount = countWords(result)

    console.log('✅ Listing generation successful')

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
              plan: userPlan,
              features_used: {
                listingStyle: body.listingStyle || 'standard',
                tone: body.tone || 'professional',
                wordCount: body.wordCount || 'standard',
                keywords: body.includeKeywords || false
              }
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

    const remainingGenerations = monthlyLimit - (currentUsage + 1) // +1 for current generation

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        wordCount: wordCount,
        tokensUsed: Math.ceil(wordCount * 1.3),
        remainingGenerations: remainingGenerations,
        monthlyLimit: monthlyLimit,
        currentUsage: currentUsage + 1,
        plan: userPlan
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