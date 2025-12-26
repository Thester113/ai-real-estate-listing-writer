#!/usr/bin/env tsx

/**
 * Blog Topics Seeding Script
 * Populates the blog_topics table with 52 diverse topics
 *
 * Usage: npx tsx scripts/seed-blog-topics.ts
 */

// Polyfill fetch for Node.js environment if needed
import fetch, { Headers, Request, Response } from 'node-fetch'
if (!global.fetch) {
  // @ts-ignore
  global.fetch = fetch
  // @ts-ignore
  global.Headers = Headers
  // @ts-ignore
  global.Request = Request
  // @ts-ignore
  global.Response = Response
}

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { BLOG_TOPICS, TOPIC_COUNT, CATEGORY_DISTRIBUTION } from '../lib/blog-topics-seed'

// Load environment variables from .env.local
config({ path: '.env.local' })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nMake sure .env.local is configured correctly.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('='.repeat(60))
  console.log('🌱 Blog Topics Seeding Script')
  console.log('='.repeat(60))
  console.log()

  // Step 1: Show statistics
  console.log('📊 Topic Statistics:')
  console.log(`   Total topics: ${TOPIC_COUNT}`)
  console.log()
  console.log('   Category breakdown:')
  Object.entries(CATEGORY_DISTRIBUTION).forEach(([category, count]) => {
    console.log(`     - ${category}: ${count} topics`)
  })
  console.log()

  // Step 2: Check for existing topics
  console.log('🔍 Checking for existing topics...')
  const { data: existingTopics, error: checkError } = await (supabase as any)
    .from('blog_topics')
    .select('id, title')

  if (checkError) {
    console.error('❌ Error checking existing topics:', checkError.message)
    process.exit(1)
  }

  if (existingTopics && existingTopics.length > 0) {
    console.log(`⚠️  Found ${existingTopics.length} existing topics in database`)
    console.log()
    console.log('Options:')
    console.log('  1. Skip seeding (existing topics will remain)')
    console.log('  2. Delete existing and reseed (WARNING: This will delete all topics)')
    console.log()
    console.log('Proceeding with option 1 (safe mode)...')
    console.log('If you want to reseed, manually delete topics from database first.')
    console.log()
    console.log('✓ Seeding skipped - topics already exist')
    process.exit(0)
  }

  console.log('✓ No existing topics found')
  console.log()

  // Step 3: Insert topics
  console.log('📝 Inserting 52 blog topics...')
  console.log()

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < BLOG_TOPICS.length; i++) {
    const topic = BLOG_TOPICS[i]
    const topicNum = i + 1

    try {
      const { error } = await (supabase as any)
        .from('blog_topics')
        .insert({
          title: topic.title,
          keywords: topic.keywords,
          category: topic.category,
          author: topic.author,
          enabled: true,
          last_used_at: null,
          usage_count: 0
        })

      if (error) {
        console.error(`   ✗ [${topicNum}/52] Error: ${topic.title}`)
        console.error(`      ${error.message}`)
        errorCount++
      } else {
        console.log(`   ✓ [${topicNum}/52] ${topic.title}`)
        successCount++
      }
    } catch (err) {
      console.error(`   ✗ [${topicNum}/52] Exception: ${topic.title}`)
      console.error(`      ${err}`)
      errorCount++
    }

    // Small delay to avoid rate limiting
    if (i < BLOG_TOPICS.length - 1 && i % 10 === 9) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log('📊 Seeding Summary')
  console.log('='.repeat(60))
  console.log(`✓ Successfully inserted: ${successCount} topics`)
  if (errorCount > 0) {
    console.log(`✗ Failed: ${errorCount} topics`)
  }
  console.log()

  if (errorCount === 0) {
    console.log('🎉 All topics seeded successfully!')
    console.log()
    console.log('Next steps:')
    console.log('  1. Deploy to Vercel')
    console.log('  2. Add CRON_SECRET environment variable')
    console.log('  3. Wait for Monday 9 AM UTC or manually trigger cron')
    console.log()
    process.exit(0)
  } else {
    console.log('⚠️  Some topics failed to insert. Please check the errors above.')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error()
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
