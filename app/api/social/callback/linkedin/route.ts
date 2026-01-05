import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { exchangeLinkedInCode, getLinkedInOrganizations } from '@/lib/social-media/linkedin'

// Handle LinkedIn OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('[LinkedIn Callback] OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/admin/social?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/social?error=No authorization code received', request.url)
      )
    }

    console.log('[LinkedIn Callback] Exchanging code for tokens...')

    // Exchange code for tokens
    const tokenData = await exchangeLinkedInCode(code)

    // Calculate token expiry
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in)

    // Get organizations the user manages
    console.log('[LinkedIn Callback] Fetching organizations...')
    const organizations = await getLinkedInOrganizations(tokenData.access_token)

    if (organizations.length === 0) {
      return NextResponse.redirect(
        new URL('/admin/social?error=No LinkedIn organization pages found. You need admin access to a company page.', request.url)
      )
    }

    // Use the first organization (could be enhanced to let user select)
    const org = organizations[0]
    console.log(`[LinkedIn Callback] Using organization: ${org.localizedName} (${org.id})`)

    // Upsert credentials
    const { error: dbError } = await supabaseAdmin
      .from('social_credentials')
      .upsert({
        platform: 'linkedin',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt.toISOString(),
        account_id: org.id,
        account_name: org.localizedName,
        metadata: {
          vanity_name: org.vanityName,
          scope: tokenData.scope,
        },
        is_active: true,
      }, {
        onConflict: 'platform',
      })

    if (dbError) {
      console.error('[LinkedIn Callback] Database error:', dbError)
      return NextResponse.redirect(
        new URL(`/admin/social?error=Failed to save credentials: ${dbError.message}`, request.url)
      )
    }

    console.log('[LinkedIn Callback] Successfully connected LinkedIn!')

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/admin/social?success=LinkedIn connected successfully (${org.localizedName})`, request.url)
    )
  } catch (error) {
    console.error('[LinkedIn Callback] Error:', error)
    return NextResponse.redirect(
      new URL(`/admin/social?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`, request.url)
    )
  }
}
