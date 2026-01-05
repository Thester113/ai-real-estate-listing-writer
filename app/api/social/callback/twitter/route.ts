import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { exchangeTwitterCode, getTwitterUser } from '@/lib/social-media/twitter'

// Handle Twitter OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const codeVerifier = searchParams.get('code_verifier')

    // Handle OAuth errors
    if (error) {
      console.error('[Twitter Callback] OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/admin/social?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/social?error=No authorization code received', request.url)
      )
    }

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/admin/social?error=Missing code verifier. Please restart the OAuth flow.', request.url)
      )
    }

    console.log('[Twitter Callback] Exchanging code for tokens...')

    // Exchange code for tokens
    const tokenData = await exchangeTwitterCode(code, codeVerifier)

    // Calculate token expiry (Twitter tokens expire in ~2 hours)
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

    // Get user info
    console.log('[Twitter Callback] Fetching user info...')
    const user = await getTwitterUser(tokenData.access_token)
    console.log(`[Twitter Callback] Connected as: @${user.username}`)

    // Upsert credentials
    const { error: dbError } = await supabaseAdmin
      .from('social_credentials')
      .upsert({
        platform: 'twitter',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt.toISOString(),
        account_id: user.id,
        account_name: `@${user.username}`,
        metadata: {
          name: user.name,
          username: user.username,
          scope: tokenData.scope,
        },
        is_active: true,
      }, {
        onConflict: 'platform',
      })

    if (dbError) {
      console.error('[Twitter Callback] Database error:', dbError)
      return NextResponse.redirect(
        new URL(`/admin/social?error=Failed to save credentials: ${dbError.message}`, request.url)
      )
    }

    console.log('[Twitter Callback] Successfully connected Twitter!')

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/admin/social?success=Twitter/X connected successfully (@${user.username})`, request.url)
    )
  } catch (error) {
    console.error('[Twitter Callback] Error:', error)
    return NextResponse.redirect(
      new URL(`/admin/social?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    )
  }
}
