import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-123' }),
    })),
  },
}))

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { POST } from '@/app/api/contact/route'
import nodemailer from 'nodemailer'

function createRequest(body: any): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/contact'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/contact', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.env.GMAIL_USER = 'test@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'test-password'
    process.env.CONVERTKIT_API_KEY = 'test-api-key'
    process.env.CONVERTKIT_FORM_ID = 'test-form-id'
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ subscription: { id: 123 } }),
    })
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validation', () => {
    it('returns 400 when name is missing', async () => {
      const request = createRequest({
        email: 'test@example.com',
        subject: 'Test',
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('All fields are required: name, email, subject, message')
    })

    it('returns 400 when email is missing', async () => {
      const request = createRequest({
        name: 'John',
        subject: 'Test',
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('All fields are required: name, email, subject, message')
    })

    it('returns 400 when subject is missing', async () => {
      const request = createRequest({
        name: 'John',
        email: 'test@example.com',
        message: 'Hello',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when message is missing', async () => {
      const request = createRequest({
        name: 'John',
        email: 'test@example.com',
        subject: 'Test',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('returns 400 when fields are not strings', async () => {
      const request = createRequest({
        name: 123,
        email: 'test@example.com',
        subject: 'Test',
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('All fields must be strings')
    })

    it('returns 400 when name is too long', async () => {
      const request = createRequest({
        name: 'a'.repeat(101),
        email: 'test@example.com',
        subject: 'Test',
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name is too long (max 100 characters)')
    })

    it('returns 400 when email is too long', async () => {
      const request = createRequest({
        name: 'John',
        email: 'a'.repeat(255) + '@example.com',
        subject: 'Test',
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email is too long')
    })

    it('returns 400 when subject is too long', async () => {
      const request = createRequest({
        name: 'John',
        email: 'test@example.com',
        subject: 'a'.repeat(201),
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Subject is too long (max 200 characters)')
    })

    it('returns 400 when message is too long', async () => {
      const request = createRequest({
        name: 'John',
        email: 'test@example.com',
        subject: 'Test',
        message: 'a'.repeat(5001),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Message is too long (max 5000 characters)')
    })

    it('returns 400 for invalid email format', async () => {
      const request = createRequest({
        name: 'John',
        email: 'invalid-email',
        subject: 'Test',
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Please provide a valid email address')
    })
  })

  describe('email sending', () => {
    const validBody = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'Test message',
    }

    it('sends email via nodemailer when credentials configured', async () => {
      const request = createRequest(validBody)
      await POST(request)

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: 'test@gmail.com',
          pass: 'test-password',
        },
      })
    })

    it('handles email sending failure gracefully', async () => {
      vi.mocked(nodemailer.createTransport).mockReturnValueOnce({
        sendMail: vi.fn().mockRejectedValue(new Error('SMTP error')),
      } as any)

      const request = createRequest(validBody)
      const response = await POST(request)
      const data = await response.json()

      // Should still succeed - email failure doesn't break the request
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('skips email when Gmail credentials not configured', async () => {
      delete process.env.GMAIL_USER
      delete process.env.GMAIL_APP_PASSWORD

      const request = createRequest(validBody)
      const response = await POST(request)

      expect(nodemailer.createTransport).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
    })

    it('escapes HTML in email content', async () => {
      const xssBody = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        subject: '<img onerror="alert()">',
        message: '<b>test</b>',
      }

      const request = createRequest(xssBody)
      await POST(request)

      const sendMailMock = vi.mocked(nodemailer.createTransport).mock.results[0].value.sendMail
      const callArgs = sendMailMock.mock.calls[0][0]

      expect(callArgs.html).not.toContain('<script>')
      expect(callArgs.html).toContain('&lt;script&gt;')
    })
  })

  describe('ConvertKit integration', () => {
    const validBody = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Test Subject',
      message: 'Test message',
    }

    it('subscribes to ConvertKit when credentials configured', async () => {
      const request = createRequest(validBody)
      await POST(request)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.convertkit.com/v3/forms/test-form-id/subscribe',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"email":"john@example.com"'),
        })
      )
    })

    it('includes contact form tags', async () => {
      const request = createRequest(validBody)
      await POST(request)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.tags).toEqual(['contact_form', 'lead'])
    })

    it('handles ConvertKit failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('ConvertKit error'))

      const request = createRequest(validBody)
      const response = await POST(request)

      expect(response.status).toBe(200) // Should still succeed
    })

    it('skips ConvertKit when credentials not configured', async () => {
      delete process.env.CONVERTKIT_API_KEY

      const request = createRequest(validBody)
      await POST(request)

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('successful submission', () => {
    it('returns success message', async () => {
      const request = createRequest({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test',
        message: 'Hello',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("Thank you for your message! We'll get back to you soon.")
    })
  })

  describe('error handling', () => {
    it('handles JSON parse errors', async () => {
      const request = new NextRequest(new URL('http://localhost:3000/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('handles Error type exceptions', async () => {
      // Force an error in the outer try block by having JSON parse fail
      const badRequest = new NextRequest(new URL('http://localhost:3000/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      })

      const response = await POST(badRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Failed to send message. Please try again.')
      // This path hits the error instanceof Error branch
    })

    it('handles non-Error exceptions with fallback message', async () => {
      // Create a mock that throws a non-Error value
      // We need to throw from within the try block before any validation
      const mockRequest = {
        json: async () => {
          throw 'string-error' // Non-Error throw
        },
      } as unknown as NextRequest

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An unknown error occurred')
    })
  })
})
