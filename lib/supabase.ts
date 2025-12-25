import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Hardcoded values to ensure they're always available
const supabaseUrl = 'https://vhobxnavetcsyzgdnedi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2J4bmF2ZXRjc3l6Z2RuZWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MTQ3NzIsImV4cCI6MjA4MjE5MDc3Mn0.cVORCtqywiaINUs3aD6gqSKEQn7qgy_1fSxd2SFNQ7E'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2J4bmF2ZXRjc3l6Z2RuZWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjYxNDc3MiwiZXhwIjoyMDgyMTkwNzcyfQ.vVD2-gxXzjZMfQKPVMXOgzYy8mXl8K3rE-vQ5S2jxN8'

// Global singleton instances to prevent multiple client creation
declare global {
  var __supabase__: any
  var __supabaseAdmin__: any
}

console.log('Supabase lib: Checking for existing clients')

// Singleton client creation
if (!globalThis.__supabase__) {
  console.log('Creating new supabase client...')
  console.log('Client env vars:', Object.keys(process.env))
  console.log('SUPABASE_URL:', supabaseUrl)
  console.log('SUPABASE_KEY:', supabaseAnonKey ? 'present' : 'missing')
  
  try {
    globalThis.__supabase__ = createClient<Database>(supabaseUrl, supabaseAnonKey)
    console.log('Supabase client created successfully!')
  } catch (error) {
    console.error('Error creating supabase client:', error)
    throw error
  }
} else {
  console.log('Using existing supabase client')
}

// Singleton admin client creation
if (!globalThis.__supabaseAdmin__) {
  console.log('Creating new supabaseAdmin client...')
  try {
    globalThis.__supabaseAdmin__ = createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    console.log('supabaseAdmin client created successfully!')
  } catch (error) {
    console.error('Error creating supabaseAdmin client:', error)
    throw error
  }
} else {
  console.log('Using existing supabaseAdmin client')
}

export const supabase = globalThis.__supabase__
export const supabaseAdmin = globalThis.__supabaseAdmin__

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