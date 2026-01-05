import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { exchangeMetaCode, getLongLivedToken, getMetaPages, getPageLongLivedToken } from '@/lib/social-media/meta'

// Handle Meta (Facebook) OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorReason = searchParams.get('error_reason')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('[Meta Callback] OAuth error:', error, errorReason, errorDescription)
      return NextResponse.redirect(
        new URL(`/admin/social?error=${encodeURIComponent(errorDescription || errorReason || error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/social?error=No authorization code received', request.url)
      )
    }

    console.log('[Meta Callback] Exchanging code for token...')

    // Exchange code for short-lived token
    const tokenData = await exchangeMetaCode(code)

    // Exchange for long-lived token (60 days)
    console.log('[Meta Callback] Getting long-lived token...')
    const longLivedData = await getLongLivedToken(tokenData.access_token)

    // Calculate token expiry
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + longLivedData.expires_in)

    // Get pages the user manages
    console.log('[Meta Callback] Fetching pages...')
    const pages = await getMetaPages(longLivedData.access_token)

    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL('/admin/social?error=No Facebook Pages found. You need to manage at least one Page.', request.url)
      )
    }

    // Find the AI Property Writer page (ID: 61585644513349) or use the first one
    const targetPageId = '61585644513349'
    let selectedPage = pages.find(p => p.id === targetPageId) || pages[0]

    console.log(`[Meta Callback] Using page: ${selectedPage.name} (${selectedPage.id})`)

    // Get a long-lived page access token
    const pageAccessToken = await getPageLongLivedToken(selectedPage.id, longLivedData.access_token)

    // Upsert credentials
    const { error: dbError } = await supabaseAdmin
      .from('social_credentials')
      .upsert({
        platform: 'facebook',
        access_token: longLivedData.access_token, // User token for management
        refresh_token: null, // Meta doesn't use refresh tokens the same way
        token_expires_at: expiresAt.toISOString(),
        account_id: selectedPage.id,
        account_name: selectedPage.name,
        metadata: {
          page_access_token: pageAccessToken, // Page-specific token for posting
          available_pages: pages.map(p => ({ id: p.id, name: p.name })),
        },
        is_active: true,
      }, {
        onConflict: 'platform',
      })

    if (dbError) {
      console.error('[Meta Callback] Database error:', dbError)
      return NextResponse.redirect(
        new URL(`/admin/social?error=Failed to save credentials: ${dbError.message}`, request.url)
      )
    }

    console.log('[Meta Callback] Successfully connected Facebook!')

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/admin/social?success=Facebook connected successfully (${selectedPage.name})`, request.url)
    )
  } catch (error) {
    console.error('[Meta Callback] Error:', error)
    return NextResponse.redirect(
      new URL(`/admin/social?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    )
  }
}
