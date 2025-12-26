/**
 * Weekly Blog Generation Cron Endpoint
 * Called by Vercel Cron every Monday at 9 AM UTC
 * Schedule: "0 9 * * 1" in vercel.json
 */

import { NextRequest, NextResponse } from 'next/server'
import { selectRandomUnusedTopic, markTopicUsed } from '@/lib/blog-topics'

// Vercel function timeout (30 seconds max for cron)
export const maxDuration = 30

/**
 * GET handler for Vercel Cron
 * Security: Verifies CRON_SECRET to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Security: Verify cron authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[CRON] Unauthorized access attempt')
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  console.log('='.repeat(60))
  console.log('[CRON] Weekly blog generation started')
  console.log('[CRON] Timestamp:', new Date().toISOString())
  console.log('='.repeat(60))

  try {
    // Step 1: Select random unused topic
    console.log('[CRON] Step 1: Selecting random unused topic...')
    const topic = await selectRandomUnusedTopic()

    if (!topic) {
      const errorMsg = 'No topics available for generation'
      console.error(`[CRON] Error: ${errorMsg}`)
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          message: 'Failed to select topic'
        },
        { status: 500 }
      )
    }

    console.log('[CRON] ✓ Topic selected:')
    console.log(`[CRON]   Title: ${topic.title}`)
    console.log(`[CRON]   Category: ${topic.category}`)
    console.log(`[CRON]   Author: ${topic.author}`)
    console.log(`[CRON]   Keywords: ${topic.keywords.join(', ')}`)

    // Step 2: Call existing blog generation API
    console.log('[CRON] Step 2: Calling blog generation API...')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const generationUrl = `${baseUrl}/api/admin/generate-blog`

    console.log(`[CRON]   Endpoint: ${generationUrl}`)

    const response = await fetch(generationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: topic.title,
        keywords: topic.keywords,
        category: topic.category,
        author: topic.author,
        topic_id: topic.id // Include for tracking
      })
    })

    const result = await response.json()

    console.log(`[CRON]   Response status: ${response.status}`)

    if (!response.ok || !result.success) {
      const errorMsg = result.error || result.message || 'Generation failed'
      console.error(`[CRON] Error: Blog generation failed - ${errorMsg}`)

      // DON'T mark topic as used on failure - will retry next week
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          message: 'Failed to generate blog post',
          topic: topic.title
        },
        { status: 500 }
      )
    }

    console.log('[CRON] ✓ Blog post generated successfully:')
    console.log(`[CRON]   ID: ${result.data.id}`)
    console.log(`[CRON]   Title: ${result.data.title}`)
    console.log(`[CRON]   Slug: ${result.data.slug}`)
    console.log(`[CRON]   Read Time: ${result.data.readTime}`)

    // Step 3: Mark topic as used
    console.log('[CRON] Step 3: Marking topic as used...')
    await markTopicUsed(topic.id)
    console.log('[CRON] ✓ Topic marked as used')

    const duration = Date.now() - startTime
    console.log('='.repeat(60))
    console.log(`[CRON] ✓ Weekly blog generation completed in ${duration}ms`)
    console.log('[CRON] Blog post URL:', `${baseUrl}/blog/${result.data.slug}`)
    console.log('='.repeat(60))

    return NextResponse.json({
      success: true,
      data: {
        topic: {
          id: topic.id,
          title: topic.title,
          category: topic.category,
          author: topic.author
        },
        post: {
          id: result.data.id,
          title: result.data.title,
          slug: result.data.slug,
          readTime: result.data.readTime,
          url: `${baseUrl}/blog/${result.data.slug}`
        },
        duration: `${duration}ms`
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    console.error('='.repeat(60))
    console.error(`[CRON] ✗ Blog generation failed after ${duration}ms`)
    console.error('[CRON] Error:', errorMessage)
    if (error instanceof Error && error.stack) {
      console.error('[CRON] Stack:', error.stack)
    }
    console.error('='.repeat(60))

    // Return error response for Vercel Cron monitoring
    // Don't throw - let Vercel track the failure in dashboard
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: 'Blog generation failed',
        duration: `${duration}ms`
      },
      { status: 500 }
    )
  }
}

/**
 * POST handler - for manual testing
 * Allows manual triggering with proper auth
 */
export async function POST(request: NextRequest) {
  // Reuse GET handler logic
  return GET(request)
}
