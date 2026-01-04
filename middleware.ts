import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSecurityHeaders, getCorsHeaders } from '@/lib/security'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: {
    '/api/generate/listing': 50,   // 50 requests per 15 minutes for AI generation
    '/api/stripe/webhook': 1000,   // High limit for webhooks
    '/api/newsletter/subscribe': 10, // 10 newsletter signups per 15 minutes
    '/api/contact': 5,             // 5 contact form submissions per 15 minutes
    '/api/account/update-email': 5, // 5 email changes per 15 minutes
    '/api/account/update-profile': 10, // 10 profile updates per 15 minutes
    'default': 100                 // Default limit
  }
}

function getRateLimit(pathname: string): number {
  for (const [path, limit] of Object.entries(RATE_LIMIT_CONFIG.maxRequests)) {
    if (pathname.startsWith(path)) {
      return limit
    }
  }
  return RATE_LIMIT_CONFIG.maxRequests.default
}

function cleanupExpiredEntries() {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupExpiredEntries()
  
  const key = `${ip}:${pathname}`
  const limit = getRateLimit(pathname)
  const now = Date.now()
  const windowMs = RATE_LIMIT_CONFIG.windowMs
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    // New window
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: limit - 1, resetTime }
  }
  
  if (current.count >= limit) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }
  
  // Increment count
  current.count++
  rateLimitStore.set(key, current)
  return { allowed: true, remaining: limit - current.count, resetTime: current.resetTime }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method
  
  // Check for maintenance mode (highest priority)
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === '1'

  // Allow access to maintenance page, admin APIs, API health check, and static assets
  if (pathname === '/maintenance' ||
      pathname === '/api/health' ||
      pathname.startsWith('/api/admin/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon')) {
    // Continue with normal processing
  } else if (isMaintenanceMode) {
    // Redirect all other traffic to maintenance page
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }
  
  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        ...getCorsHeaders(),
        ...getSecurityHeaders()
      }
    })
  }
  
  // Get client IP
  const ip = request.ip 
    || request.headers.get('x-forwarded-for')?.split(',')[0]
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    const rateLimit = checkRateLimit(ip, pathname)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            ...getSecurityHeaders(),
            'X-RateLimit-Limit': getRateLimit(pathname).toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimit.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }
  }
  
  // Redirect authentication paths
  if (pathname === '/login' || pathname === '/signup' || pathname === '/register') {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
  
  // Security headers for all responses
  const response = NextResponse.next()
  
  // Add security headers
  const securityHeaders = getSecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders()
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Add rate limit headers
    if (pathname.startsWith('/api/')) {
      const rateLimit = checkRateLimit(ip, pathname)
      response.headers.set('X-RateLimit-Limit', getRateLimit(pathname).toString())
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetTime / 1000).toString())
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
}