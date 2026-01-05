import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getTwitterAuthUrl, generatePKCE } from '@/lib/social-media/twitter'
import { validatePlatformConfig } from '@/lib/social-media-config'

// Initiate Twitter OAuth flow with PKCE
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
    const { valid, missing } = validatePlatformConfig('twitter')
    if (!valid) {
      return NextResponse.json(
        { success: false, error: `Missing environment variables: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate PKCE code verifier and challenge
    const { codeVerifier, codeChallenge } = generatePKCE()

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')

    // Generate auth URL
    const authUrl = getTwitterAuthUrl(state, codeChallenge)

    // Return the auth URL, state, and code verifier
    // The code verifier needs to be stored and passed back in the callback
    return NextResponse.json({
      success: true,
      authUrl,
      state,
      codeVerifier, // Admin needs to store this for the callback
      message: 'Visit the authUrl to connect your Twitter/X account. Save the codeVerifier for the callback.',
    })
  } catch (error) {
    console.error('[Twitter Auth] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
