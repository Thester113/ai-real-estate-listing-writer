import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'

export async function GET() {
  console.log('🚀 Test API called successfully!')
  return NextResponse.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    deployment: 'latest-with-database-save'
  })
}

export async function POST(request: NextRequest) {
  console.log('🚀 Test POST API called!')
  
  // Test database connection
  try {
    const { data, error } = await (supabaseAdmin as any).from('generations').select('count(*)').limit(1)
    console.log('📊 Database test result:', { data, error })
    
    const body = await request.json()
    console.log('📦 Request body:', body)
    
    return NextResponse.json({ 
      message: 'POST API is working!', 
      received: body,
      timestamp: new Date().toISOString(),
      database: error ? 'error' : 'connected',
      dbResult: data
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({ 
      message: 'POST API working but DB failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    })
  }
}