import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  console.log('🚀 Test API called successfully!')
  return NextResponse.json({ message: 'API is working!', timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  console.log('🚀 Test POST API called!')
  const body = await request.json()
  console.log('📦 Request body:', body)
  return NextResponse.json({ 
    message: 'POST API is working!', 
    received: body,
    timestamp: new Date().toISOString() 
  })
}