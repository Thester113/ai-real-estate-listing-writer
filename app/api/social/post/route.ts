import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { postToAllPlatforms, BlogPost } from '@/lib/social-media'
import { SocialPlatform } from '@/lib/social-media-config'

interface PostRequestBody {
  blogPostId: string
  platforms?: SocialPlatform[]
}

// Trigger social media posting for a blog post
export async function POST(request: NextRequest) {
  console.log('[Social Post] API called')

  try {
    // Security: Require CRON_SECRET for admin-only access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Social Post] Unauthorized access attempt')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as PostRequestBody

    if (!body.blogPostId) {
      return NextResponse.json(
        { success: false, error: 'Missing blogPostId' },
        { status: 400 }
      )
    }

    // Fetch the blog post
    const { data: blogPost, error: fetchError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, slug, excerpt, tags')
      .eq('id', body.blogPostId)
      .single()

    if (fetchError || !blogPost) {
      console.error('[Social Post] Blog post not found:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      )
    }

    console.log(`[Social Post] Posting blog: "${blogPost.title}"`)

    // Post to all platforms
    const results = await postToAllPlatforms(blogPost as BlogPost, body.platforms)

    // Count successes and failures
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`[Social Post] Complete: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      data: {
        blogPostId: body.blogPostId,
        results,
        summary: {
          total: results.length,
          successful,
          failed,
        }
      }
    })
  } catch (error) {
    console.error('[Social Post] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check posting history for a blog post
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

    const searchParams = request.nextUrl.searchParams
    const blogPostId = searchParams.get('blogPostId')

    if (!blogPostId) {
      // Return recent posts across all blog posts
      const { data, error } = await supabaseAdmin
        .from('social_posts')
        .select('*, blog_posts(title, slug)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data })
    }

    // Return posts for specific blog post
    const { data, error } = await supabaseAdmin
      .from('social_posts')
      .select('*')
      .eq('blog_post_id', blogPostId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Social Post] GET Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
