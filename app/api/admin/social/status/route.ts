import { NextRequest, NextResponse } from 'next/server'
import { getConnectedPlatforms } from '@/lib/social-media'
import { getEnabledPlatforms, PLATFORM_NAMES, SocialPlatform } from '@/lib/social-media-config'

// Get status of all social media connections
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

    // Get configured platforms (have env vars)
    const configuredPlatforms = getEnabledPlatforms()

    // Get connected platforms (have OAuth tokens)
    const connectedPlatforms = await getConnectedPlatforms()

    // Build status response
    const status = connectedPlatforms.map(platform => ({
      platform: platform.platform,
      name: PLATFORM_NAMES[platform.platform],
      configured: configuredPlatforms.includes(platform.platform),
      connected: platform.connected,
      accountName: platform.accountName,
      tokenExpiresAt: platform.tokenExpiresAt,
      needsRefresh: platform.needsRefresh,
    }))

    return NextResponse.json({
      success: true,
      data: {
        platforms: status,
        summary: {
          configured: configuredPlatforms.length,
          connected: status.filter(p => p.connected).length,
          needsAttention: status.filter(p => p.needsRefresh || (!p.connected && p.configured)).length,
        }
      }
    })
  } catch (error) {
    console.error('[Social Status] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
