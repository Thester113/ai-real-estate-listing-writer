import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { refreshLinkedInToken } from '@/lib/social-media/linkedin'
import { refreshTwitterToken } from '@/lib/social-media/twitter'
import { refreshMetaToken } from '@/lib/social-media/meta'
import { SocialPlatform, PLATFORM_NAMES } from '@/lib/social-media-config'

interface RefreshResult {
  platform: SocialPlatform
  success: boolean
  message: string
}

// Cron job to refresh expiring tokens
// Runs daily at midnight (configured in vercel.json)
export async function GET(request: NextRequest) {
  console.log('[Token Refresh] Cron job started')

  try {
    // Security: Require CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const results: RefreshResult[] = []

    // Get all active credentials
    const { data: credentials, error: fetchError } = await supabaseAdmin
      .from('social_credentials')
      .select('*')
      .eq('is_active', true)

    if (fetchError) {
      console.error('[Token Refresh] Failed to fetch credentials:', fetchError)
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      )
    }

    if (!credentials || credentials.length === 0) {
      console.log('[Token Refresh] No active credentials found')
      return NextResponse.json({
        success: true,
        message: 'No active credentials to refresh',
        results: []
      })
    }

    // Check each credential for expiring tokens
    for (const cred of credentials) {
      const platform = cred.platform as SocialPlatform
      const expiresAt = cred.token_expires_at ? new Date(cred.token_expires_at) : null

      // Skip if no expiry or not expiring within 7 days
      if (!expiresAt) {
        results.push({
          platform,
          success: true,
          message: 'No expiry date set, skipping'
        })
        continue
      }

      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      if (expiresAt > sevenDaysFromNow) {
        results.push({
          platform,
          success: true,
          message: `Token valid until ${expiresAt.toISOString()}, no refresh needed`
        })
        continue
      }

      // Token is expiring soon, attempt refresh
      console.log(`[Token Refresh] Refreshing ${PLATFORM_NAMES[platform]} token (expires ${expiresAt.toISOString()})...`)

      try {
        let newAccessToken: string
        let newRefreshToken: string | undefined
        let expiresIn: number

        switch (platform) {
          case 'linkedin': {
            if (!cred.refresh_token) {
              results.push({
                platform,
                success: false,
                message: 'No refresh token available'
              })
              continue
            }
            const result = await refreshLinkedInToken(cred.refresh_token)
            newAccessToken = result.access_token
            newRefreshToken = result.refresh_token
            expiresIn = result.expires_in
            break
          }

          case 'twitter': {
            if (!cred.refresh_token) {
              results.push({
                platform,
                success: false,
                message: 'No refresh token available'
              })
              continue
            }
            const result = await refreshTwitterToken(cred.refresh_token)
            newAccessToken = result.access_token
            newRefreshToken = result.refresh_token
            expiresIn = result.expires_in
            break
          }

          case 'facebook': {
            // Facebook uses the current token to get a new one
            const result = await refreshMetaToken(cred.access_token)
            newAccessToken = result.access_token
            expiresIn = result.expires_in
            break
          }

          default:
            results.push({
              platform,
              success: false,
              message: 'Unknown platform'
            })
            continue
        }

        // Calculate new expiry
        const newExpiresAt = new Date()
        newExpiresAt.setSeconds(newExpiresAt.getSeconds() + expiresIn)

        // Update credentials in database
        const updateData: Record<string, unknown> = {
          access_token: newAccessToken,
          token_expires_at: newExpiresAt.toISOString(),
        }

        if (newRefreshToken) {
          updateData.refresh_token = newRefreshToken
        }

        const { error: updateError } = await supabaseAdmin
          .from('social_credentials')
          .update(updateData)
          .eq('id', cred.id)

        if (updateError) {
          results.push({
            platform,
            success: false,
            message: `Database update failed: ${updateError.message}`
          })
          continue
        }

        results.push({
          platform,
          success: true,
          message: `Token refreshed, new expiry: ${newExpiresAt.toISOString()}`
        })

        console.log(`[Token Refresh] ${PLATFORM_NAMES[platform]} token refreshed successfully`)

      } catch (refreshError) {
        console.error(`[Token Refresh] Failed to refresh ${PLATFORM_NAMES[platform]}:`, refreshError)
        results.push({
          platform,
          success: false,
          message: refreshError instanceof Error ? refreshError.message : 'Unknown error'
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`[Token Refresh] Complete: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed
      },
      results
    })

  } catch (error) {
    console.error('[Token Refresh] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
