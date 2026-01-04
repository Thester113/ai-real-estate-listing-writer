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
    const { email } = body

    if (!email || typeof email !== 'string') {
      return secureJsonResponse({ error: 'Email is required' }, 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const sanitizedEmail = email.trim().toLowerCase()

    if (!emailRegex.test(sanitizedEmail)) {
      return secureJsonResponse({ error: 'Invalid email format' }, 400)
    }

    // Check if same as current email
    if (sanitizedEmail === user.email?.toLowerCase()) {
      return secureJsonResponse({ error: 'New email must be different from current email' }, 400)
    }

    // Check if email is already in use by another user
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', sanitizedEmail)
      .neq('id', user.id)
      .single()

    if (existingProfile) {
      return secureJsonResponse({ error: 'Email is already in use' }, 409)
    }

    // Update email via Supabase Admin API
    // This will send a confirmation email to the new address
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email: sanitizedEmail,
        email_confirm: false // Require email confirmation
      }
    )

    if (updateError) {
      console.error('Email update error:', updateError)
      return secureJsonResponse({
        error: updateError.message || 'Failed to update email'
      }, 400)
    }

    return secureJsonResponse({
      message: `Confirmation email sent to ${sanitizedEmail}. Please check your inbox and click the confirmation link.`,
      pendingEmail: sanitizedEmail
    })

  } catch (error) {
    console.error('Update email error:', error)
    return secureJsonResponse({ error: getErrorMessage(error) }, 500)
  }
}
