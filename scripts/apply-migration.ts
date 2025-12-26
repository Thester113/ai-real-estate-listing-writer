#!/usr/bin/env tsx

/**
 * Apply Database Migration Script
 * Runs the blog_topics table migration directly against Supabase
 *
 * Usage: npx tsx scripts/apply-migration.ts
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('='.repeat(60))
  console.log('🔧 Applying Database Migration')
  console.log('='.repeat(60))
  console.log()

  console.log('📝 Creating blog_topics table...')
  console.log()

  // We'll execute SQL directly via Supabase's PostgREST API
  // Since we can't execute arbitrary SQL via the JS client, we'll use fetch
  const postgrestUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`

  console.log('⚠️  Note: This script requires manual SQL execution in Supabase dashboard')
  console.log()
  console.log('Please run the following SQL in your Supabase SQL Editor:')
  console.log('(Dashboard → SQL Editor → New Query)')
  console.log()
  console.log('='.repeat(60))
  console.log(`
-- Migration: Add blog_topics table for automatic weekly blog generation
CREATE TABLE IF NOT EXISTS public.blog_topics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient random selection of unused topics
CREATE INDEX IF NOT EXISTS idx_blog_topics_unused
  ON public.blog_topics(enabled, last_used_at NULLS FIRST);

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_blog_topics_category
  ON public.blog_topics(category);

-- Row Level Security
ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Anyone can view enabled blog topics" ON public.blog_topics;
CREATE POLICY "Anyone can view enabled blog topics" ON public.blog_topics
  FOR SELECT USING (enabled = true);

-- Allow service role full access
DROP POLICY IF EXISTS "Service role can manage blog topics" ON public.blog_topics;
CREATE POLICY "Service role can manage blog topics" ON public.blog_topics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  `)
  console.log('='.repeat(60))
  console.log()
  console.log('After running the SQL:')
  console.log('1. Verify the table was created successfully')
  console.log('2. Run: npx tsx scripts/seed-blog-topics.ts')
  console.log()
}

main().catch((error) => {
  console.error()
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
