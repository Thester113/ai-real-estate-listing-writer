import { NextRequest, NextResponse } from 'next/server'
import { validateRequest, secureJsonResponse } from '@/lib/security'
import { trackServerEvent } from '@/lib/analytics'
import { getErrorMessage } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Validate request
    await validateRequest(request)

    // Parse request body
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return secureJsonResponse({ 
        error: 'All fields are required: name, email, subject, message' 
      }, 400)
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return secureJsonResponse({ 
        error: 'Please provide a valid email address' 
      }, 400)
    }

    // Rate limiting check could be added here

    // Send to ConvertKit as a lead with contact form tag
    const convertKitApiKey = process.env.CONVERTKIT_API_KEY
    const convertKitFormId = process.env.CONVERTKIT_FORM_ID

    if (convertKitApiKey && convertKitFormId) {
      try {
        await fetch(`https://api.convertkit.com/v3/forms/${convertKitFormId}/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: convertKitApiKey,
            email: email,
            first_name: name,
            tags: ['contact_form', 'lead'],
            fields: {
              subject: subject,
              message: message,
              contact_date: new Date().toISOString()
            }
          })
        })
      } catch (convertKitError) {
        console.error('ConvertKit error:', convertKitError)
        // Don't fail the request if ConvertKit fails
      }
    }

    // Track contact form submission
    trackServerEvent('contact_form_submitted', {
      email,
      subject,
      message_length: message.length,
      timestamp: new Date().toISOString()
    })

    // In a production app, you might also:
    // 1. Send email notification to support team
    // 2. Store the message in a database
    // 3. Send auto-reply to the user

    return secureJsonResponse({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.'
    })

  } catch (error) {
    console.error('Contact form error:', error)
    
    return secureJsonResponse({
      success: false,
      error: getErrorMessage(error),
      message: 'Failed to send message. Please try again.'
    }, 500)
  }
}