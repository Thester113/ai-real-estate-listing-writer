import { NextRequest, NextResponse } from 'next/server'

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