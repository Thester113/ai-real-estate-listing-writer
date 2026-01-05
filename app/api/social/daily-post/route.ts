import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { SocialPlatform, isPlatformEnabled, PLATFORM_NAMES } from '@/lib/social-media-config'
import { getCredentials } from '@/lib/social-media'
import { postToFacebook } from '@/lib/social-media/meta'
import { postToLinkedIn } from '@/lib/social-media/linkedin'
import { postToTwitter } from '@/lib/social-media/twitter'
import OpenAI from 'openai'

// Daily engagement post topics for realtors
const POST_TOPICS = [
  'tip for writing compelling property descriptions',
  'how AI can save realtors time on listing creation',
  'common mistakes in property listings and how to avoid them',
  'the importance of first impressions in real estate marketing',
  'how professional listing descriptions attract more buyers',
  'time management tips for busy real estate agents',
  'the power of storytelling in property marketing',
  'why quality listing descriptions matter more than ever',
  'standing out in a competitive real estate market',
  'turning property features into buyer benefits',
  'the psychology of home buying and marketing',
  'leveraging technology in modern real estate',
  'creating emotional connections through listing copy',
  'maximizing open house success with great marketing',
  'the ROI of professional property descriptions',
  'quick wins for improving your listing quality',
  'seasonal real estate marketing strategies',
  'building your personal brand as a realtor',
  'why buyers skip listings with poor descriptions',
  'the future of AI in real estate marketing',
]

interface PostResult {
  platform: SocialPlatform
  success: boolean
  postId?: string
  error?: string
}

// Generate engaging content using OpenAI
async function generateEngagementPost(): Promise<{ content: string; topic: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Pick a random topic
  const topic = POST_TOPICS[Math.floor(Math.random() * POST_TOPICS.length)]

  const prompt = `You are a social media manager for AI Property Writer, an AI-powered tool that helps real estate agents create professional property listing descriptions instantly.

Write an engaging Facebook/LinkedIn post about: "${topic}"

Requirements:
- 2-3 short paragraphs, conversational and friendly
- Include a subtle call-to-action mentioning AI Property Writer
- Use 2-3 relevant emojis naturally
- End with a question to encourage engagement
- Keep it under 280 words
- Don't use hashtags (we'll add those separately)
- Sound helpful and knowledgeable, not salesy
- Target audience: busy real estate agents

The website is www.aipropertywriter.com`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 400,
    temperature: 0.8,
  })

  const content = completion.choices[0]?.message?.content || ''

  // Add hashtags
  const hashtags = '\n\n#RealEstate #RealtorTips #PropertyMarketing #RealEstateAgent #AIPropertyWriter'

  return {
    content: content + hashtags,
    topic,
  }
}

// Record standalone social post (no blog_post_id)
async function recordStandalonePost(
  platform: SocialPlatform,
  result: PostResult,
  content: string,
  topic: string
): Promise<void> {
  try {
    await supabaseAdmin.from('social_posts').insert({
      blog_post_id: null, // Standalone post, not tied to a blog
      platform: platform,
      platform_post_id: result.postId || null,
      status: result.success ? 'posted' : 'failed',
      post_content: content,
      error_message: result.error || null,
      posted_at: result.success ? new Date().toISOString() : null,
    })
  } catch (error) {
    console.error(`[Daily Post] Failed to record post result:`, error)
  }
}

// Daily engagement post cron job
// Runs daily at 9 AM MST (4 PM UTC) - configured in vercel.json
export async function GET(request: NextRequest) {
  console.log('[Daily Post] Cron job started')

  try {
    // Security: Require CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow Vercel cron (no auth header but from Vercel)
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'

    if (!isVercelCron && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate engaging content
    console.log('[Daily Post] Generating content...')
    const { content, topic } = await generateEngagementPost()
    console.log(`[Daily Post] Generated post about: "${topic}"`)

    const results: PostResult[] = []
    const platforms: SocialPlatform[] = ['facebook', 'linkedin', 'twitter']

    for (const platform of platforms) {
      // Check if platform is enabled
      if (!isPlatformEnabled(platform)) {
        console.log(`[Daily Post] ${PLATFORM_NAMES[platform]} not configured, skipping`)
        continue
      }

      // Get credentials
      const credentials = await getCredentials(platform)
      if (!credentials) {
        console.log(`[Daily Post] No credentials for ${PLATFORM_NAMES[platform]}, skipping`)
        continue
      }

      console.log(`[Daily Post] Posting to ${PLATFORM_NAMES[platform]}...`)

      try {
        let result: PostResult

        switch (platform) {
          case 'facebook': {
            const pageAccessToken = (credentials.metadata as { page_access_token?: string })?.page_access_token || credentials.access_token
            if (!credentials.account_id) {
              result = { platform, success: false, error: 'No page ID configured' }
            } else {
              const postResult = await postToFacebook(pageAccessToken, credentials.account_id, content)
              result = { platform, ...postResult }
            }
            break
          }

          case 'linkedin': {
            if (!credentials.account_id) {
              result = { platform, success: false, error: 'No organization ID configured' }
            } else {
              const postResult = await postToLinkedIn(credentials.access_token, credentials.account_id, content)
              result = { platform, ...postResult }
            }
            break
          }

          case 'twitter': {
            // Twitter has 280 char limit, generate shorter content
            const shortContent = content.substring(0, 250) + '...\n\nwww.aipropertywriter.com'
            const postResult = await postToTwitter(credentials.access_token, shortContent)
            result = { platform, ...postResult }
            break
          }

          default:
            result = { platform, success: false, error: 'Unknown platform' }
        }

        results.push(result)
        await recordStandalonePost(platform, result, content, topic)

        if (result.success) {
          console.log(`[Daily Post] Successfully posted to ${PLATFORM_NAMES[platform]}: ${result.postId}`)
        } else {
          console.error(`[Daily Post] Failed to post to ${PLATFORM_NAMES[platform]}: ${result.error}`)
        }
      } catch (error) {
        console.error(`[Daily Post] Error posting to ${platform}:`, error)
        const errorResult: PostResult = {
          platform,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        results.push(errorResult)
        await recordStandalonePost(platform, errorResult, content, topic)
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`[Daily Post] Complete: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      data: {
        topic,
        content: content.substring(0, 200) + '...',
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        }
      }
    })
  } catch (error) {
    console.error('[Daily Post] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
