import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getMetaAuthUrl } from '@/lib/social-media/meta'
import { validatePlatformConfig } from '@/lib/social-media-config'

// Initiate Meta (Facebook) OAuth flow
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
    const { valid, missing } = validatePlatformConfig('facebook')
    if (!valid) {
      return NextResponse.json(
        { success: false, error: `Missing environment variables: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')

    // Generate auth URL
    const authUrl = getMetaAuthUrl(state)

    // Return the auth URL and state
    return NextResponse.json({
      success: true,
      authUrl,
      state,
      message: 'Visit the authUrl to connect your Facebook Page',
    })
  } catch (error) {
    console.error('[Meta Auth] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
