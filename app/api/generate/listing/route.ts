import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'

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
}

interface ListingResult {
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
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

    // Mock successful response for now
    const result: ListingResult = {
      title: `Beautiful ${body.bedrooms}BR/${body.bathrooms}BA ${body.propertyType} in ${body.location}`,
      description: `Mock listing description for testing purposes.`,
      highlights: [
        `${body.bedrooms} spacious bedrooms`,
        `${body.bathrooms} well-appointed bathrooms`,
        'Gorgeous location'
      ],
      marketingPoints: [
        'Perfect for testing',
        'Mock data generation',
        'Development purposes'
      ],
      callToAction: 'This is a test listing generation!'
    }

    console.log('✅ Mock generation successful')

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
            word_count: 50,
            metadata: {
              model: 'mock-api',
              tokens_used: 250,
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
            await incrementUsage(userId, 1, 50)
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
        wordCount: 50,
        tokensUsed: 250,
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