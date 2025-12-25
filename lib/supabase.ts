import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Hardcoded values to ensure they're always available
const supabaseUrl = 'https://vhobxnavetcsyzgdnedi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2J4bmF2ZXRjc3l6Z2RuZWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTQ3NzIsImV4cCI6MjA4MjE5MDc3Mn0.cVORCtqywiaINUs3aD6gqSKEQn7qgy_1fSxd2SFNQ7E'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2J4bmF2ZXRjc3l6Z2RuZWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYxNDc3MiwiZXhwIjoyMDgyMTkwNzcyfQ.vVD2-gxXzjZMfQKPVMXOgzYy8mXl8K3rE-vQ5S2jxN8'

console.log('Supabase initialized with hardcoded values')

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
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