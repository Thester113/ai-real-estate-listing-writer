import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

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

    // Type validation
    if (typeof name !== 'string' || typeof email !== 'string' ||
        typeof subject !== 'string' || typeof message !== 'string') {
      return NextResponse.json({
        error: 'All fields must be strings'
      }, { status: 400 })
    }

    // Length validation to prevent abuse
    if (name.length > 100) {
      return NextResponse.json({
        error: 'Name is too long (max 100 characters)'
      }, { status: 400 })
    }

    if (email.length > 254) { // RFC 5321
      return NextResponse.json({
        error: 'Email is too long'
      }, { status: 400 })
    }

    if (subject.length > 200) {
      return NextResponse.json({
        error: 'Subject is too long (max 200 characters)'
      }, { status: 400 })
    }

    if (message.length > 5000) {
      return NextResponse.json({
        error: 'Message is too long (max 5000 characters)'
      }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Please provide a valid email address'
      }, { status: 400 })
    }

    // Send email notification to support team via Gmail SMTP
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        })

        await transporter.sendMail({
          from: `"AI PropertyWriter" <${process.env.GMAIL_USER}>`,
          to: 'support@aipropertywriter.com',
          replyTo: email,
          subject: `Contact Form: ${escapeHtml(subject)}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Submitted: ${new Date().toLocaleString()}</small></p>
          `,
        })
        console.log('Email notification sent to support@aipropertywriter.com via Gmail')
      } catch (emailError) {
        console.error('Gmail SMTP error:', emailError)
        // Don't fail the request if email fails, but log it
      }
    } else {
      console.warn('Gmail credentials not configured - email notification skipped')
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