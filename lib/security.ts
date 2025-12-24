import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createHash, timingSafeEqual } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Rate limiting configuration
const RATE_LIMITS = {
  starter: {
    dailyListings: 5,
    monthlyListings: 20,
    maxTokensPerRequest: 2000,
  },
  pro: {
    dailyListings: 50,
    monthlyListings: 500,
    maxTokensPerRequest: 5000,
  },
} as const;

// Input validation utilities
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    // Block local/private IPs
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      throw new Error('Private IP addresses not allowed');
    }
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

export function sanitizeText(text: string, maxLength: number = 5000): string {
  // Remove HTML tags
  const withoutHtml = text.replace(/<[^>]*>/g, '');
  // Limit length
  const truncated = withoutHtml.substring(0, maxLength);
  // Remove excessive whitespace
  return truncated.replace(/\s+/g, ' ').trim();
}

// Stripe webhook verification
export async function verifyStripeWebhook(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  try {
    return stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

// Rate limiting check
export function checkRateLimit(
  plan: 'starter' | 'pro',
  usage: { listings_generated: number },
  requestType: 'daily' | 'monthly' = 'daily'
): boolean {
  const limits = RATE_LIMITS[plan];
  const limit = requestType === 'daily' ? limits.dailyListings : limits.monthlyListings;
  return usage.listings_generated < limit;
}

export function getTokenLimit(plan: 'starter' | 'pro'): number {
  return RATE_LIMITS[plan].maxTokensPerRequest;
}

// CORS headers for API routes
export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Security headers
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.openai.com https://api.stripe.com https://*.supabase.co https://us.posthog.com https://*.sentry.io",
      "frame-src https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; '),
  };
}

// Request validation middleware
export async function validateRequest(request: Request) {
  const headersList = headers();
  
  // Check content type for POST requests
  if (request.method === 'POST') {
    const contentType = headersList.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Invalid content type');
    }
  }
  
  // Check for required headers
  const userAgent = headersList.get('user-agent');
  if (!userAgent) {
    throw new Error('User agent required');
  }
  
  // Rate limiting by IP (basic)
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  
  // Store the IP for logging
  return { ip };
}

// Webhook idempotency
export function generateIdempotencyKey(event: Stripe.Event): string {
  return createHash('sha256')
    .update(`${event.id}-${event.type}-${event.created}`)
    .digest('hex');
}

// Safe comparison for secrets
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  
  return timingSafeEqual(bufferA, bufferB);
}

// Environment validation
export function validateEnvironment() {
  const required = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// API response wrapper with security headers
export function secureJsonResponse(data: any, status: number = 200) {
  return Response.json(data, {
    status,
    headers: {
      ...getSecurityHeaders(),
      'Content-Type': 'application/json',
    },
  });
}