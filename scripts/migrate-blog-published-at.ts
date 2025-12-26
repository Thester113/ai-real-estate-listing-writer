#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
  console.log('🔧 Adding published_at column to blog_posts table...')

  const { error } = await (supabase as any).rpc('exec_sql', {
    query: `
      ALTER TABLE public.blog_posts
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
    `
  })

  if (error) {
    console.error('❌ Migration failed:', error)
    // Try alternative method - direct SQL
    const { error: error2 } = await (supabase as any)
      .from('blog_posts')
      .select('published_at')
      .limit(1)

    if (error2 && error2.message.includes('column')) {
      console.error('Column does not exist and cannot be added via RPC.')
      console.log('\nℹ️  Please run this SQL manually in Supabase SQL Editor:')
      console.log('ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;')
      process.exit(1)
    }
  } else {
    console.log('✅ Migration successful!')
  }
}

migrate().catch(console.error)
