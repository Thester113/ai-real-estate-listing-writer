import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-client'
import { secureJsonResponse } from '@/lib/security'
import { getErrorMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Get user session from auth header
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return secureJsonResponse({ error: 'Authentication required' }, 401)
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return secureJsonResponse({ error: 'Invalid authentication' }, 401)
    }

    // Parse and validate request body
    const body = await request.json()
    const { full_name } = body

    if (full_name !== undefined && typeof full_name !== 'string') {
      return secureJsonResponse({ error: 'Invalid full_name format' }, 400)
    }

    // Sanitize and validate full_name
    const sanitizedName = full_name?.trim().substring(0, 100) || null

    // Update profile
    const { data: profile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: sanitizedName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return secureJsonResponse({ error: 'Failed to update profile' }, 500)
    }

    return secureJsonResponse({
      message: 'Profile updated successfully',
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    return secureJsonResponse({ error: getErrorMessage(error) }, 500)
  }
}
