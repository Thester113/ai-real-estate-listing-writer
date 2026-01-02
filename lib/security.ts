import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createHash, timingSafeEqual } from 'crypto';
import { validateStripeConfig } from './stripe-config';

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
  // Import here to avoid circular dependency
  const { stripeConfig } = await import('./stripe-config');
  const endpointSecret = stripeConfig.webhookSecret;
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
  // Security: Never use wildcard in production
  const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL
  if (!allowedOrigin && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL must be set in production for CORS security')
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'http://localhost:3000',
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.posthog.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.openai.com https://api.stripe.com https://*.supabase.co https://us.posthog.com https://*.sentry.io https://challenges.cloudflare.com",
      "frame-src https://js.stripe.com https://challenges.cloudflare.com",
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
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Stripe configuration (includes webhook secret)
  try {
    validateStripeConfig();
  } catch (error) {
    throw new Error(`Stripe configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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