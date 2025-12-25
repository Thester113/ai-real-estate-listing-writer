import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Hardcoded values - no environment variables
const SUPABASE_URL = 'https://vhobxnavetcsyzgdnedi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2J4bmF2ZXRjc3l6Z2RuZWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTQ3NzIsImV4cCI6MjA4MjE5MDc3Mn0.cVORCtqywiaINUs3aD6gqSKEQn7qgy_1fSxd2SFNQ7E'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2J4bmF2ZXRjc3l6Z2RuZWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYxNDc3MiwiZXhwIjoyMDgyMTkwNzcyfQ.JjJYJpWUSsEqpG5XmJdJYwhIEPpD-HyfgeSXkJBbQWQ'

console.log('🚀 FRESH DEPLOY - Creating Supabase clients with hardcoded values - ' + new Date().toISOString())

// Create client instances directly
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper functions
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  // If profile doesn't exist, create one using admin client
  if (error && error.code === 'PGRST116') {
    console.log('Profile not found, creating new profile for user:', userId)
    
    // Get user info from auth using admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !user) {
      console.error('Failed to get user from admin:', userError)
      throw new Error('User not found in auth system')
    }
    
    // Create profile using admin client to bypass RLS
    const { data: newProfile, error: createError } = await (supabaseAdmin as any)
      .from('profiles')
      .insert({
        id: userId,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        plan: 'starter'
      })
      .select('*')
      .single()
    
    if (createError) {
      console.error('Failed to create profile:', createError)
      throw createError
    }
    
    console.log('Successfully created new profile:', newProfile)
    return newProfile
  }
  
  if (error) throw error
  return data
}

export async function getUserUsage(userId: string) {
  console.log('Getting usage for user:', userId)
  const { data, error } = await (supabaseAdmin as any)
    .rpc('get_or_create_usage', { user_uuid: userId })
  
  console.log('Usage result:', { data, error })
  if (error) {
    console.error('Usage error:', error)
    // Return default values if RPC fails
    return {
      listings_generated: 0,
      words_generated: 0,
      reset_date: new Date()
    }
  }
  return data
}

export async function incrementUsage(userId: string, listings: number = 1, words: number = 0) {
  console.log('Incrementing usage for user:', userId, { listings, words })
  const { data, error } = await (supabaseAdmin as any)
    .rpc('increment_usage', {
      user_uuid: userId,
      listings_delta: listings,
      words_delta: words
    })
  
  if (error) {
    console.error('Increment usage error:', error)
    throw error
  }
  return data
}

console.log('NEW SUPABASE CLIENT FILE - Clients created successfully')