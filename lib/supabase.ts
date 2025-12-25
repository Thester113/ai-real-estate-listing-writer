import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Debug: Log all environment variables starting with NEXT_PUBLIC
if (typeof window !== 'undefined') {
  console.log('Client env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')))
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  console.error('Available env vars:', Object.keys(process.env))
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  console.error('Available env vars:', Object.keys(process.env))
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to get user session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Helper function to get user profile
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to get user usage
export async function getUserUsage(userId: string) {
  const { data, error } = await (supabase as any)
    .rpc('get_or_create_usage', { user_uuid: userId })
  
  if (error) throw error
  return data
}

// Helper function to increment usage
export async function incrementUsage(userId: string, listings: number = 1, words: number = 0) {
  const { data, error } = await (supabase as any)
    .rpc('increment_usage', {
      user_uuid: userId,
      listings_delta: listings,
      words_delta: words
    })
  
  if (error) throw error
  return data
}