import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { SocialPlatform, PLATFORM_NAMES } from '@/lib/social-media-config'

interface DisconnectRequestBody {
  platform: SocialPlatform
}

// Disconnect a social media platform
export async function POST(request: NextRequest) {
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

    const body = await request.json() as DisconnectRequestBody

    if (!body.platform) {
      return NextResponse.json(
        { success: false, error: 'Missing platform' },
        { status: 400 }
      )
    }

    const validPlatforms: SocialPlatform[] = ['linkedin', 'twitter', 'facebook']
    if (!validPlatforms.includes(body.platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform' },
        { status: 400 }
      )
    }

    console.log(`[Social Disconnect] Disconnecting ${PLATFORM_NAMES[body.platform]}...`)

    // Delete credentials (or mark as inactive)
    const { error } = await supabaseAdmin
      .from('social_credentials')
      .delete()
      .eq('platform', body.platform)

    if (error) {
      console.error('[Social Disconnect] Database error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log(`[Social Disconnect] Successfully disconnected ${PLATFORM_NAMES[body.platform]}`)

    return NextResponse.json({
      success: true,
      message: `${PLATFORM_NAMES[body.platform]} disconnected successfully`,
    })
  } catch (error) {
    console.error('[Social Disconnect] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
