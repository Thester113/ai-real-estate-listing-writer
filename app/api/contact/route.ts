import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { name, email, subject, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({
        error: 'All fields are required: name, email, subject, message'
      }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Please provide a valid email address'
      }, { status: 400 })
    }

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

    console.log('Contact form submitted:', { email, subject, name })

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.'
    })

  } catch (error) {
    console.error('Contact form error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      message: 'Failed to send message. Please try again.'
    }, { status: 500 })
  }
}