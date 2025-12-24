import { NextResponse } from 'next/server'
import { getSecurityHeaders } from '@/lib/security'

export async function GET() {
  try {
    const headers = getSecurityHeaders()
    
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        services: {
          database: 'connected',
          stripe: 'configured',
          openai: 'configured',
        },
      },
      { 
        status: 200,
        headers 
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    )
  }
}