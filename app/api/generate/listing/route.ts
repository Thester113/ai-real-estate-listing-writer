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

// Phase 2: Multiple Listing Variations
interface ListingVariation {
  variationType: 'professional' | 'storytelling' | 'luxury'
  variationLabel: string
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
}

interface EnhancedListingResult extends ListingResult {
  variations: ListingVariation[]
}

// Phase 3: Social Media Content
interface SocialMediaContent {
  instagram: {
    caption: string
    hashtags: string[]
    characterCount: number
  }
  facebook: {
    post: string
    characterCount: number
  }
}

interface FullListingResponse extends EnhancedListingResult {
  socialMedia: SocialMediaContent
}

/**
 * Build market intelligence instruction for OpenAI prompt (DRY helper function)
 * @param marketData Market data from Redfin
 * @returns Formatted market intelligence section for prompt
 */
function buildMarketIntelligencePrompt(marketData: any | null): string {
  if (!marketData) {
    return ''
  }

  // Determine market temperature based on demand score
  const marketTemp = marketData.demandScore >= 70 ? 'HOT (seller\'s market)'
                   : marketData.demandScore >= 40 ? 'BALANCED'
                   : 'COOL (buyer\'s market)'

  // Format price change
  const priceChangeText = marketData.priceChange >= 0
    ? `up ${marketData.priceChange.toFixed(1)}%`
    : `down ${Math.abs(marketData.priceChange).toFixed(1)}%`

  // Get top insight
  const topInsight = marketData.keyInsights?.[0] || 'Standard market conditions'

  return `

MARKET INTELLIGENCE (Pro Feature - Real Redfin Data):
This property is located in ZIP code ${marketData.location}. Current market conditions:
- Median sale price in area: $${marketData.medianPrice.toLocaleString()} (${priceChangeText} year-over-year)
- Average time to sell: ${marketData.daysOnMarket} days
- Market temperature: ${marketTemp} (${marketData.demandScore}/100 demand score)
- Key market insight: ${topInsight}

CRITICAL INSTRUCTION: Weave this market data naturally into your listing copy. DO NOT just list statistics. Instead:
1. If market is HOT (fast sales): Create urgency ("Properties in this area typically sell in ${marketData.daysOnMarket} days - act fast!")
2. If market is COOL: Emphasize value and opportunity ("Exceptional value in a balanced market")
3. Position price competitively relative to the $${marketData.medianPrice.toLocaleString()} median
4. Reference trends organically in the narrative (e.g., "In a market where prices are ${priceChangeText}...")
5. Use market conditions to strengthen your call-to-action

Make the data feel like insider knowledge, not a statistics report.`
}

async function generatePropertyListing(
  formData: ListingFormData,
  marketData?: any | null
): Promise<FullListingResponse> {
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

  // Build market intelligence instruction (Pro feature)
  const marketIntelligencePrompt = buildMarketIntelligencePrompt(marketData)

  // Log the calculated settings
  console.log('📐 Generation Settings:', {
    styleInstructions: styleInstructions.substring(0, 50) + '...',
    toneInstructions: toneInstructions.substring(0, 50) + '...',
    wordCountRange,
    maxTokens,
    hasKeywords: !!keywordsInstruction,
    hasMarketData: !!marketData
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
- Additional Details: ${additionalDetails || 'None provided'}${marketIntelligencePrompt}

STYLE: ${styleInstructions}
TONE: ${toneInstructions}
LENGTH: ${wordCountRange}${keywordsInstruction}

Generate THREE DISTINCT VERSIONS of this listing AND social media content. Return ONLY valid JSON in this exact format:

{
  "variations": [
    {
      "variationType": "professional",
      "variationLabel": "Professional & Direct",
      "title": "An attention-grabbing title (max 80 characters)",
      "description": "Direct, fact-focused listing. MANDATORY LENGTH: EXACTLY ${wordCountRange}.",
      "highlights": ["5-7 benefit-focused bullet points"],
      "marketingPoints": ["3-5 unique selling propositions"],
      "callToAction": "Straightforward, action-oriented CTA"
    },
    {
      "variationType": "storytelling",
      "variationLabel": "Warm & Inviting",
      "title": "Emotional, lifestyle-focused title (max 80 characters)",
      "description": "Narrative approach that paints a picture. MANDATORY LENGTH: EXACTLY ${wordCountRange}.",
      "highlights": ["5-7 lifestyle-focused highlights"],
      "marketingPoints": ["3-5 emotional selling points"],
      "callToAction": "Inviting, relationship-focused CTA"
    },
    {
      "variationType": "luxury",
      "variationLabel": "Luxury Appeal",
      "title": "Sophisticated, premium title (max 80 characters)",
      "description": "Elevated vocabulary, exclusivity focus. MANDATORY LENGTH: EXACTLY ${wordCountRange}.",
      "highlights": ["5-7 prestige-focused highlights"],
      "marketingPoints": ["3-5 exclusive selling propositions"],
      "callToAction": "Exclusive, opportunity-focused CTA"
    }
  ],
  "socialMedia": {
    "instagram": {
      "caption": "150-200 character caption with 2-3 emojis",
      "hashtags": ["RealEstate", "DreamHome", "PropertyType", "Location", "ForSale"],
      "characterCount": 0
    },
    "facebook": {
      "post": "100-150 character engaging hook",
      "characterCount": 0
    }
  }
}

Variation Requirements:

Version 1 (Professional & Direct):
- Tone: Authoritative, fact-focused, no-nonsense
- Style: Traditional real estate language, emphasis on features and value
- Lead with key facts (location, size, features)
- Benefits clearly stated, not overly emotional
- CTA: Direct and action-oriented ("Schedule your showing today")
- Target: Serious buyers who want information quickly

Version 2 (Warm & Inviting):
- Tone: Emotional, narrative-driven, lifestyle-focused
- Style: Tell a story about life in this home, use sensory details
- Paint pictures with words ("imagine morning coffee on the deck")
- Create emotional connection through lifestyle benefits
- Warm, welcoming language that feels personal
- CTA: Inviting and relationship-focused ("Let's find your perfect home together")
- Target: Buyers looking for an emotional connection

Version 3 (Luxury Appeal):
- Tone: Sophisticated, premium, exclusive (regardless of actual price point)
- Style: Elevated vocabulary, prestige positioning
- Use words like "exquisite," "bespoke," "curated," "distinguished"
- Emphasize exclusivity and lifestyle elevation
- Position property as aspirational
- CTA: Exclusive opportunity-focused ("Discover an extraordinary opportunity")
- Target: Buyers who respond to luxury positioning

General Guidelines:
- WORD COUNT: Each description MUST be ${wordCountRange}. Non-negotiable.
- Make each version MEANINGFULLY DIFFERENT - not just minor word swaps
- Apply base style (${styleInstructions}) within each variation's approach
- All variations target ${targetAudience} but with different angles
- Be specific to this property and location
- Each variation should be independently excellent

Social Media Requirements:

INSTAGRAM POST:
- Caption: 150-200 characters MAXIMUM (strict limit)
- Start with attention-grabbing hook or question
- Include 2-3 relevant emojis naturally integrated (e.g., 🏡✨🔑)
- Focus on ONE key selling point or lifestyle benefit
- Create visual appeal and curiosity
- DO NOT include hashtags in caption - they go in separate field
- characterCount will be calculated by system

INSTAGRAM HASHTAGS:
- Provide 5-8 strategic hashtags (no # symbol needed)
- Mix broad tags (#RealEstate, #HomeSale) and specific (#${location.replace(/\s/g, '')}Homes, #${propertyType.replace(/\s/g, '')})
- Include location-based tags, property type tags
- Use proper camelCase format (e.g., DreamHome not dream-home)

FACEBOOK POST:
- Length: 100-150 characters
- Create curiosity with a question or bold statement
- More conversational than Instagram
- Should work well above a link preview
- Max 1-2 emojis (less emoji-heavy than Instagram)
- Focus on engagement and click-through
- characterCount will be calculated by system

Examples:
Instagram caption: "Wake up to mountain views every morning in this stunning 3BR retreat. Your dream home awaits in Boulder. ⛰️✨🏡"
Instagram hashtags: ["BoulderRealEstate", "MountainLiving", "DreamHome", "ColoradoHomes", "LuxuryLiving"]
Facebook: "Is this the view you've been dreaming of? This Boulder gem just hit the market. 🏡"`

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

    // Parse the JSON response (expecting variations + social media)
    const parsedResponse = JSON.parse(content) as {
      variations: ListingVariation[]
      socialMedia: SocialMediaContent
    }

    // Validate variations array
    if (!parsedResponse.variations || !Array.isArray(parsedResponse.variations) || parsedResponse.variations.length !== 3) {
      console.error('Invalid variations structure:', parsedResponse)
      throw new Error('Expected 3 listing variations in response')
    }

    // Validate each variation has required fields
    for (const variation of parsedResponse.variations) {
      if (!variation.title || !variation.description || !variation.highlights || !variation.marketingPoints || !variation.callToAction) {
        throw new Error('Missing required fields in variation')
      }
    }

    // Validate social media content
    if (!parsedResponse.socialMedia || !parsedResponse.socialMedia.instagram || !parsedResponse.socialMedia.facebook) {
      console.error('Missing social media content:', parsedResponse)
      throw new Error('Expected social media content in response')
    }

    // Calculate character counts for social media
    parsedResponse.socialMedia.instagram.characterCount = parsedResponse.socialMedia.instagram.caption.length
    parsedResponse.socialMedia.facebook.characterCount = parsedResponse.socialMedia.facebook.post.length

    // For backward compatibility: top-level fields = first variation (Professional)
    const primaryVariation = parsedResponse.variations[0]

    const fullResponse: FullListingResponse = {
      title: primaryVariation.title,
      description: primaryVariation.description,
      highlights: primaryVariation.highlights,
      marketingPoints: primaryVariation.marketingPoints,
      callToAction: primaryVariation.callToAction,
      variations: parsedResponse.variations,
      socialMedia: parsedResponse.socialMedia
    }

    console.log('✅ Generated 3 variations + social media:', {
      variations: parsedResponse.variations.map(v => v.variationType),
      instagram: `${parsedResponse.socialMedia.instagram.characterCount} chars`,
      facebook: `${parsedResponse.socialMedia.facebook.characterCount} chars`
    })

    return fullResponse
  } catch (error) {
    console.error('OpenAI generation failed:', error)

    // Fallback: Create 3 basic variations even on error (production safety)
    const baseTitle = `${bedrooms}BR/${bathrooms}BA ${propertyType} in ${location}`
    const baseDescription = `Discover this exceptional ${propertyType.toLowerCase()} offering ${bedrooms} bedrooms and ${bathrooms} bathrooms in the desirable ${location} area. This property combines modern comfort with thoughtful design, creating the perfect space for your lifestyle. ${additionalDetails || 'Schedule your viewing today to experience all this home has to offer.'}`
    const baseHighlights = [
      `${bedrooms} well-appointed bedrooms`,
      `${bathrooms} bathrooms with modern fixtures`,
      `Prime ${location} location`,
      ...(features?.slice(0, 4) || ['Move-in ready condition'])
    ]
    const baseMarketingPoints = [
      `Desirable ${location} neighborhood`,
      'Modern amenities and finishes',
      'Perfect for your lifestyle needs'
    ]

    const professionalVariation: ListingVariation = {
      variationType: 'professional',
      variationLabel: 'Professional & Direct',
      title: baseTitle,
      description: baseDescription,
      highlights: baseHighlights,
      marketingPoints: baseMarketingPoints,
      callToAction: 'Contact us today to schedule your private showing!'
    }

    const storytellingVariation: ListingVariation = {
      variationType: 'storytelling',
      variationLabel: 'Warm & Inviting',
      title: `Your New Home Awaits: ${bedrooms}BR/${bathrooms}BA ${propertyType}`,
      description: `Imagine coming home to this wonderful ${propertyType.toLowerCase()} in ${location}. With ${bedrooms} comfortable bedrooms and ${bathrooms} bathrooms, this home is ready to welcome you and your loved ones. ${additionalDetails || 'Come see why this could be your perfect home.'}`,
      highlights: baseHighlights,
      marketingPoints: baseMarketingPoints,
      callToAction: 'Let us help you find your perfect home - schedule a visit today!'
    }

    const luxuryVariation: ListingVariation = {
      variationType: 'luxury',
      variationLabel: 'Luxury Appeal',
      title: `Exceptional ${propertyType} - ${bedrooms}BR/${bathrooms}BA`,
      description: `Experience refined living in this distinguished ${propertyType.toLowerCase()} showcasing ${bedrooms} elegant bedrooms and ${bathrooms} bathrooms in the sought-after ${location} area. This residence offers an exceptional opportunity for discerning buyers. ${additionalDetails || 'Discover the possibilities that await.'}`,
      highlights: baseHighlights,
      marketingPoints: baseMarketingPoints,
      callToAction: 'Discover this exceptional opportunity - contact us today!'
    }

    // Fallback social media content
    const fallbackSocial: SocialMediaContent = {
      instagram: {
        caption: `${bedrooms}BR/${bathrooms}BA ${propertyType} in ${location}. Your dream home is waiting! 🏡✨`,
        hashtags: ['RealEstate', 'DreamHome', 'ForSale', location.replace(/\s/g, ''), propertyType.replace(/\s/g, '')].slice(0, 8),
        characterCount: 0
      },
      facebook: {
        post: `New listing alert! ${bedrooms}BR/${bathrooms}BA ${propertyType} in ${location}. See it today! 🏡`,
        characterCount: 0
      }
    }

    // Calculate character counts
    fallbackSocial.instagram.characterCount = fallbackSocial.instagram.caption.length
    fallbackSocial.facebook.characterCount = fallbackSocial.facebook.post.length

    return {
      ...professionalVariation,
      variations: [professionalVariation, storytellingVariation, luxuryVariation],
      socialMedia: fallbackSocial
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

    // Fetch market data for Pro users (Phase 1: Market Data Injection)
    let marketData = null
    let zipCode: string | null = null

    if (userPlan === 'pro') {
      try {
        const { extractZipCode } = await import('@/lib/real-estate-api')
        const { getRedfinMarketData } = await import('@/lib/redfin-data')

        zipCode = extractZipCode(body.location)

        if (zipCode) {
          console.log(`📊 [Market Data] Fetching Redfin data for ZIP ${zipCode} (Pro user)`)
          marketData = await getRedfinMarketData(zipCode, body.propertyType || 'All Residential')

          if (marketData) {
            console.log(`✅ [Market Data] Successfully fetched:`, {
              medianPrice: marketData.medianPrice,
              daysOnMarket: marketData.daysOnMarket,
              demandScore: marketData.demandScore,
              priceChange: marketData.priceChange
            })
          } else {
            console.log(`⚠️ [Market Data] No data available for ZIP ${zipCode}`)
          }
        } else {
          console.log(`⚠️ [Market Data] No ZIP code found in location: "${body.location}"`)
        }
      } catch (error) {
        console.warn('⚠️ [Market Data] Failed to fetch, proceeding without it:', error)
        // Graceful degradation - continue without market data
        marketData = null
      }
    } else {
      console.log(`ℹ️ [Market Data] Skipping for Starter plan user`)
    }

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

    // NOW generate the listing after all validation has passed (with market data if available)
    const result = await generatePropertyListing(body, marketData)
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
                keywords: body.includeKeywords || false,
                marketDataInjected: !!marketData,
                zipCode: zipCode || null
              },
              marketContext: marketData ? {
                zipCode,
                medianPrice: marketData.medianPrice,
                daysOnMarket: marketData.daysOnMarket,
                demandScore: marketData.demandScore,
                priceChange: marketData.priceChange
              } : null
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
        plan: userPlan,
        marketContext: marketData ? {
          zipCode,
          medianPrice: marketData.medianPrice,
          priceChange: marketData.priceChange,
          daysOnMarket: marketData.daysOnMarket,
          marketTemperature: marketData.demandScore >= 70 ? 'hot' : marketData.demandScore >= 40 ? 'balanced' : 'cool',
          demandScore: marketData.demandScore,
          dataInjected: true
        } : {
          dataInjected: false,
          zipCode: zipCode || null
        }
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