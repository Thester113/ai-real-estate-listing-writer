import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getLinkedInAuthUrl } from '@/lib/social-media/linkedin'
import { validatePlatformConfig } from '@/lib/social-media-config'

// Initiate LinkedIn OAuth flow
export async function GET(request: NextRequest) {
  try {
    // Security: Require CRON_SECRET for admin-only access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate platform is configured
    const { valid, missing } = validatePlatformConfig('linkedin')
    if (!valid) {
      return NextResponse.json(
        { success: false, error: `Missing environment variables: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')

    // Store state in a cookie for validation in callback
    const authUrl = getLinkedInAuthUrl(state)

    // Return the auth URL and state (admin will need to visit this URL)
    return NextResponse.json({
      success: true,
      authUrl,
      state,
      message: 'Visit the authUrl to connect your LinkedIn account',
    })
  } catch (error) {
    console.error('[LinkedIn Auth] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
