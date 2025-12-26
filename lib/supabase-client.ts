import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Security: Use environment variables instead of hardcoded credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create public client for client-side use
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

// Create admin client ONLY on server side (service key not exposed to client)
// This will be undefined on the client, which is correct - admin client should only be used server-side
export const supabaseAdmin = SUPABASE_SERVICE_KEY
  ? createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : (supabase as any) // Fallback to regular client on client-side (should never be used)

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
  
  // RPC returns an array, get the first item
  const usage = Array.isArray(data) ? data[0] : data
  console.log('Processed usage data:', usage)
  return usage || {
    listings_generated: 0,
    words_generated: 0,
    reset_date: new Date()
  }
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