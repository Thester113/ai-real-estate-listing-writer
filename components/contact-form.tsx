'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: 'Missing fields',
        description: 'Please fill out all fields',
        variant: 'destructive',
      })
      return
    }

    if (!formData.email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      setIsSubmitted(true)
      toast({
        title: 'Message sent!',
        description: "We'll get back to you soon at the email you provided.",
      })
    } catch (error) {
      console.error('Contact form error:', error)
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-xl font-semibold text-green-800 mb-2">Message sent successfully!</h3>
        <p className="text-green-700">We'll get back to you at <strong>{formData.email}</strong> as soon as possible.</p>
        <p className="text-sm text-green-600 mt-4">
          Need immediate assistance? Email us directly at{' '}
          <a href="mailto:support@aipropertywriter.com" className="underline font-medium">
            support@aipropertywriter.com
          </a>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Subject
        </label>
        <Input
          id="subject"
          type="text"
          placeholder="How can we help?"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message
        </label>
        <Textarea
          id="message"
          placeholder="Tell us more about your question or issue..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          disabled={isLoading}
          rows={6}
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Sending...' : 'Send Message'}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        You can also email us directly at{' '}
        <a href="mailto:support@aipropertywriter.com" className="underline font-medium">
          support@aipropertywriter.com
        </a>
      </p>
    </form>
  )
}
