'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/utils'

interface NewsletterFormProps {
  className?: string
}

export default function NewsletterForm({ className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      toast({
        title: 'Success!',
        description: data.message || 'Successfully subscribed to newsletter!'
      })

      setEmail('') // Clear the form

    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast({
        title: 'Subscription failed',
        description: getErrorMessage(error),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-4 max-w-md mx-auto ${className}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        disabled={loading}
        className="flex-1 px-4 py-3 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        required
      />
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            Subscribing...
          </div>
        ) : (
          'Subscribe'
        )}
      </Button>
    </form>
  )
}